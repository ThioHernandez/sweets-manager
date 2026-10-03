import json, sqlite3, secrets, webbrowser, threading, time
from excel_export import workbook
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
DATA.mkdir(exist_ok=True)
DB = DATA / 'sweets.sqlite3'
TOKEN = secrets.token_urlsafe(32)
KEYS = {'sweet-orders','sweet-products','sweet-customers','sweet-expenses','sweet-purchases','sweet-couriers'}

def connect():
    db = sqlite3.connect(DB)
    db.execute('CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
    return db

def state():
    with connect() as db:
        return {key: json.loads(value) for key, value in db.execute('SELECT key,value FROM app_state')}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'web'), **kwargs)
    def do_GET(self):
        if self.headers.get('Host') not in {'127.0.0.1:8765','localhost:8765'}:
            self.send_error(403); return
        path = urlparse(self.path).path
        if path == '/api/state':
            self.respond({'state': state(), 'token': TOKEN}); return
        if path == '/api/excel':
            body = workbook(state())
            self.send_response(200)
            self.send_header('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            self.send_header('Content-Disposition','attachment; filename="sweets-export.xlsx"')
            self.send_header('Content-Length',str(len(body)))
            self.send_header('Cache-Control','no-store')
            self.end_headers(); self.wfile.write(body); return
        if path == '/api/backup':
            self.respond({'format':'sweets-local-v1','state':state()}, download=True); return
        super().do_GET()
    def respond(self, value, download=False):
        body = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        if download: self.send_header('Content-Disposition','attachment; filename="sweets-backup.json"')
        self.send_header('Content-Length',str(len(body)))
        self.end_headers(); self.wfile.write(body)
    def do_POST(self):
        if self.headers.get('Host') not in {'127.0.0.1:8765','localhost:8765'} or self.headers.get('X-Local-Token') != TOKEN:
            self.send_error(403); return
        try:
            size = int(self.headers.get('Content-Length','0'))
            if size > 20_000_000: raise ValueError('File too large')
            payload = json.loads(self.rfile.read(size))
            path = urlparse(self.path).path
            if path == '/api/write':
                key, value = payload['key'], payload['value']
                if key not in KEYS or not isinstance(value,list): raise ValueError('Invalid data')
                with connect() as db:
                    db.execute('INSERT OR REPLACE INTO app_state VALUES (?,?)',(key,json.dumps(value,ensure_ascii=False)))
            elif path == '/api/restore':
                values = payload.get('state',payload)
                if not isinstance(values,dict) or set(values)-KEYS or not all(isinstance(v,list) and all(isinstance(r,dict) for r in v) for v in values.values()): raise ValueError('Invalid backup')
                snapshot = DATA / ('before-restore-' + time.strftime('%Y%m%d-%H%M%S') + '.sqlite3')
                with connect() as db, sqlite3.connect(snapshot) as dest: db.backup(dest)
                with connect() as db:
                    db.execute('DELETE FROM app_state')
                    db.executemany('INSERT INTO app_state VALUES (?,?)',[(k,json.dumps(values.get(k,[]),ensure_ascii=False)) for k in KEYS])
            else: self.send_error(404); return
            self.respond({'ok':True})
        except (ValueError, KeyError, sqlite3.Error) as error:
            self.send_error(400,str(error))

if __name__ == '__main__':
    connect().close()
    try:
        server = HTTPServer(('127.0.0.1',8765),Handler)
    except OSError:
        print('Port 8765 is busy. Close the previous instance and try again.'); raise SystemExit(1)
    print('Local app: http://127.0.0.1:8765 | Database: ' + str(DB))
    threading.Timer(1,lambda:webbrowser.open('http://127.0.0.1:8765')).start()
    try: server.serve_forever()
    except KeyboardInterrupt: server.server_close()

(function () {
  const initial = new XMLHttpRequest();
  initial.open('GET', '/api/state', false);
  initial.send();
  if (initial.status !== 200) throw new Error('Cannot open local database');
  const loaded = JSON.parse(initial.responseText);
  const keys = ['sweet-orders','sweet-products','sweet-customers','sweet-expenses','sweet-purchases','sweet-couriers'];
  const memory = new Map(keys.map(key => [key, JSON.stringify(loaded.state[key] || (key === 'sweet-couriers' ? [{name:'أحمد'},{name:'سالم'},{name:'مريم'}] : []))]));
  const storage = window.localStorage;
  const nativeGet = Storage.prototype.getItem;
  const nativeSet = Storage.prototype.setItem;
  function request(path, value) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', path, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Local-Token', loaded.token);
    xhr.send(JSON.stringify(value));
    if (xhr.status !== 200) { alert('تعذر حفظ البيانات المحلية. تأكد من استمرار تشغيل البرنامج ثم أعد تحميل الصفحة.'); throw new Error('Local save failed'); }
  }
  Storage.prototype.getItem = function(key) { return this === storage && memory.has(key) ? memory.get(key) : nativeGet.call(this,key); };
  Storage.prototype.setItem = function(key,value) {
    if (this === storage && keys.includes(key)) { request('/api/write',{key,value:JSON.parse(value)}); memory.set(key,String(value)); }
    else nativeSet.call(this,key,value);
  };
  window.addEventListener('DOMContentLoaded',function () {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:relative;z-index:22;padding:10px;background:#ecf5ed;color:#305c37;text-align:center;direction:rtl;font-family:Tahoma';
    const title = document.createElement('span'); title.textContent = 'نسخة محلية • البيانات محفوظة في جهازك '; bar.append(title);
    const backup = document.createElement('a'); backup.href='/api/backup'; backup.textContent='تنزيل نسخة احتياطية'; backup.style.margin='0 12px'; bar.append(backup);
    const excel = document.createElement('a'); excel.href='/api/excel'; excel.textContent='تصدير Excel'; excel.style.margin='0 12px'; bar.append(excel);
    const restore = document.createElement('button'); restore.textContent='استعادة / استيراد البيانات'; bar.append(restore);
    const file = document.createElement('input'); file.type='file'; file.accept='.json'; file.hidden=true; bar.append(file);
    restore.onclick=()=>file.click();
    file.onchange=async()=>{
      try {
        const data = JSON.parse(await file.files[0].text());
        if (!confirm('استبدال البيانات الحالية بالنسخة المختارة؟ تُحفظ نسخة أمان قبل الاستعادة.')) return;
        request('/api/restore',data); location.reload();
      } catch (error) { alert('تعذر الاستيراد: تحقق من ملف النسخة الاحتياطية.'); }
      file.value='';
    };
    document.body.prepend(bar);
  });
})();

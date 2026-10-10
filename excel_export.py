"""Dependency-free XLSX export. All user text is written as literal cells."""
import io, zipfile, math
from xml.sax.saxutils import escape

def workbook(state):
    products = {p['id']:p for p in state.get('sweet-products',[])}
    orders=[]; items=[]; deliveries=[]
    for o in state.get('sweet-orders',[]):
        sale=cost=0
        for i in o.get('items',[]):
            p=products.get(i.get('productId'),{})
            price=i.get('salePrice',p.get('salePrice',0)); unit_cost=i.get('cost',p.get('cost',0)); qty=i.get('qty',0)
            sale+=price*qty; cost+=unit_cost*qty
            items.append([o.get('id'),i.get('name',p.get('name','')),qty,price,unit_cost,qty*price,qty*unit_cost])
        total=max(sale-o.get('discount',0),0)+o.get('deliveryFee',0)
        profit=total-cost-o.get('courierPay',0)
        orders.append([o.get(k,'') for k in ['id','customer','phone','address','date','time','status','deliveryType']]+[sale,o.get('discount',0),o.get('deliveryFee',0),total,o.get('paid',0),max(total-o.get('paid',0),0),cost,profit,o.get('paymentMethod',''),o.get('notes','')])
        if o.get('courier') and o.get('courier')!='بدون توصيل':
            deliveries.append([o.get(k,'') for k in ['id','customer','courier','address','date','time','status']]+[o.get('courierPay',0),'مدفوع' if o.get('courierSettled') else 'غير مدفوع'])
    sheets=[
        ('الطلبات',['رقم الطلب','العميل','الهاتف','العنوان','التاريخ','الوقت','الحالة','الاستلام','قيمة الأصناف','الخصم','رسوم التوصيل','الإجمالي','المدفوع','المتبقي','تكلفة الإنتاج','الربح','طريقة الدفع','ملاحظات'],orders),
        ('تفاصيل الأصناف',['رقم الطلب','الصنف','الكمية','سعر الوحدة','تكلفة الوحدة','قيمة البند','تكلفة البند'],items),
        ('العملاء',['الرقم','الاسم','الهاتف','العنوان'],[[r.get(k,'') for k in ['id','name','phone','address']] for r in state.get('sweet-customers',[])]),
        ('الأصناف',['الرقم','الاسم','الوحدة','سعر البيع','التكلفة'],[[r.get(k,'') for k in ['id','name','unit','salePrice','cost']] for r in state.get('sweet-products',[])]),
        ('المشتريات',['الرقم','المادة','الكمية','الوحدة','سعر الوحدة','الإجمالي','المورد','التاريخ','طريقة الشراء','الكراتين','وحدات الكرتون','سعر الكرتون','ملاحظات'],[[r.get('id'),r.get('material'),r.get('quantity'),r.get('unit'),r.get('unitPrice'),r.get('cartons',0)*r.get('cartonPrice',0) if r.get('purchaseMode')=='carton' else r.get('quantity',0)*r.get('unitPrice',0),r.get('supplier',''),r.get('date',''),'بالكرتون' if r.get('purchaseMode')=='carton' else 'بالوحدة',r.get('cartons','') if r.get('purchaseMode')=='carton' else '',r.get('unitsPerCarton','') if r.get('purchaseMode')=='carton' else '',r.get('cartonPrice','') if r.get('purchaseMode')=='carton' else '',r.get('notes','')] for r in state.get('sweet-purchases',[])]),
        ('المصاريف',['الرقم','الوصف','التصنيف','المبلغ','التاريخ'],[[r.get(k,'') for k in ['id','title','category','amount','date']] for r in state.get('sweet-expenses',[])]),
        ('التوصيل',['رقم الطلب','العميل','الموصل','العنوان','التاريخ','الوقت','الحالة','الأجر','تسوية الأجر'],deliveries)]
    return sheets_workbook(sheets)

def sheets_workbook(sheets):
    ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    def clean(v):return ''.join(c for c in str(v) if c in '\t\n\r' or ord(c)>=32)
    def col(n):
        out=''
        while n: n,r=divmod(n-1,26);out=chr(65+r)+out
        return out
    def cell(v,ref,header=False):
        if isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v):return f'<c r="{ref}" s="{2 if isinstance(v,float) else 0}"><v>{v}</v></c>'
        return f'<c r="{ref}" t="inlineStr" s="{1 if header else 0}"><is><t xml:space="preserve">{escape(clean(v if v is not None else ""))}</t></is></c>'
    out=io.BytesIO()
    with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+''.join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(1,len(sheets)+1))+'</Types>')
        z.writestr('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        z.writestr('xl/workbook.xml',f'<workbook xmlns="{ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+''.join(f'<sheet name="{name}" sheetId="{i}" r:id="rId{i}"/>' for i,(name,_,_) in enumerate(sheets,1))+'</sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+''.join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>' for i in range(1,len(sheets)+1))+f'<Relationship Id="rId{len(sheets)+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
        z.writestr('xl/styles.xml',f'<styleSheet xmlns="{ns}"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.000"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf fontId="0"/><xf fontId="1" applyFont="1"/><xf fontId="0" numFmtId="164" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>')
        for i,(name,headers,rows) in enumerate(sheets,1):
            last=f'{col(len(headers))}{len(rows)+1}'
            data=''.join(f'<row r="{n}">'+''.join(cell(v,f'{col(c)}{n}',n==1) for c,v in enumerate(row,1))+'</row>' for n,row in enumerate([headers]+rows,1))
            z.writestr(f'xl/worksheets/sheet{i}.xml',f'<worksheet xmlns="{ns}"><sheetViews><sheetView workbookViewId="0" rightToLeft="1"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="{len(headers)}" width="22" customWidth="1"/></cols><sheetData>{data}</sheetData><autoFilter ref="A1:{last}"/></worksheet>')
    return out.getvalue()

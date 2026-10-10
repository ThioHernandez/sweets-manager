import { TaxFields, taxValues, type TaxData } from './Accounting';
import { useState } from 'react';
import { Basket, Plus, PencilSimple, Trash, X, Wallet } from '@phosphor-icons/react';

type Purchase = TaxData & { id: number; material: string; quantity: number; unit: string; unitPrice: number; supplier: string; date: string; notes: string; purchaseMode?: 'direct' | 'carton'; cartons?: number; unitsPerCarton?: number; cartonPrice?: number };
type Expense = TaxData & { id: number; title: string; category: string; amount: number; date: string };
const money = (value: number) => value.toLocaleString('ar-OM', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' ر.ع';
const dateToday = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const blank = (): Omit<Purchase, 'id'> => ({ material: '', quantity: 1, unit: 'كجم', unitPrice: 0, supplier: '', date: dateToday(), notes: '', purchaseMode: 'direct', cartons: 1, unitsPerCarton: 40, cartonPrice: 0 });
const purchaseTotal = (row: Purchase) => taxValues(row.purchaseMode === 'carton' ? (row.cartons ?? 0) * (row.cartonPrice ?? 0) : row.quantity * row.unitPrice,row).total;

export function PurchasesPage() {
  const [rows, setRows] = useState<Purchase[]>(() => {
    try { const value = JSON.parse(localStorage.getItem('sweet-purchases') || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
  });
  const [editing, setEditing] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(blank);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const save = (next: Purchase[]) => { localStorage.setItem('sweet-purchases', JSON.stringify(next)); setRows(next); };
  const filtered = rows.filter(r => [r.material, r.supplier, r.notes].join(' ').includes(search.trim()) && (!from || r.date >= from) && (!to || r.date <= to));
  const totals = filtered.reduce<Record<string, number>>((out, row) => { out[row.unit] = (out[row.unit] || 0) + row.quantity; return out; }, {});
  const start = (row?: Purchase) => { setEditing(row?.id ?? null); setDraft(row ? { ...blank(), ...row } : blank()); setError(''); setOpen(true); };
  const isCarton = draft.purchaseMode === 'carton';
  const quantity = isCarton ? (draft.cartons ?? 0) * (draft.unitsPerCarton ?? 0) : draft.quantity;
  const unitPrice = isCarton ? (draft.cartonPrice ?? 0) / (draft.unitsPerCarton || 1) : draft.unitPrice;
  const total = isCarton ? (draft.cartons ?? 0) * (draft.cartonPrice ?? 0) : quantity * unitPrice;
  return <section className='page'>
    <div className='page-intro'><div><h2>المشتريات</h2><p>سجل شراء المواد والكميات: طحين، سكر، شوكولاتة، علب وغيرها.</p></div><button className='primary' onClick={() => start()}><Plus size={18} />إضافة مشتريات</button></div>
    <div className='kpis two'><Summary icon={<Basket />} title='قيمة المشتريات في الفترة' value={money(filtered.reduce((s, r) => s + purchaseTotal(r), 0))} /><Summary icon={<Basket />} title='الكميات حسب الوحدة' value={Object.entries(totals).map(([unit, qty]) => qty.toLocaleString('ar-OM') + ' ' + unit).join(' · ') || 'لا توجد مشتريات'} /></div>
    <Filters search={search} setSearch={setSearch} from={from} setFrom={setFrom} to={to} setTo={setTo} placeholder='ابحث بالمادة أو المورد أو الملاحظات' />
    <p className='finance-note'>قيمة المشتريات توضح شراء المواد؛ تكلفة المواد المستخدمة تُحتسب حاليًا ضمن تكلفة إنتاج الصنف، ولا تُخصم المشتريات مرة ثانية من الربح. الكميات هنا مشتراة وليست رصيد مخزون متبقٍ.</p>
    <div className='panel finance-list'>
      {filtered.length === 0 && <div className='empty'>لا توجد مشتريات مطابقة. أضف أول عملية شراء.</div>}
      {filtered.map(row => <article className='finance-row' key={row.id}>
        <div className='expense-icon'><Basket size={22} /></div><div className='grow'><strong>{row.material}</strong><span>{row.quantity.toLocaleString('ar-OM')} {row.unit} × {money(row.unitPrice)} · {row.date}</span>{row.purchaseMode === 'carton' && <span>{row.cartons} كرتون × {row.unitsPerCarton} {row.unit} في الكرتون · سعر الكرتون {money(row.cartonPrice ?? 0)}</span>}<span>{row.supplier || 'المورد غير محدد'}{row.notes ? ' · ' + row.notes : ''}</span></div>
        <span>الضريبة: {money(taxValues(row.purchaseMode==='carton'?(row.cartons??0)*(row.cartonPrice??0):row.quantity*row.unitPrice,row).tax)} ({row.taxMode??'غير محددة'})</span><strong>{money(purchaseTotal(row))}</strong><div className='finance-actions'><button aria-label={'تعديل ' + row.material} onClick={() => start(row)}><PencilSimple size={18} /></button><button aria-label={'حذف ' + row.material} onClick={() => { if (window.confirm('حذف عملية شراء ' + row.material + '؟')) save(rows.filter(r => r.id !== row.id)); }}><Trash size={18} /></button></div>
      </article>)}
    </div>
    {open && <div className='modal-backdrop'><div className='modal' role='dialog' aria-modal='true' aria-label='تسجيل مشتريات'><div className='modal-head'><h3>{editing === null ? 'إضافة مشتريات' : 'تعديل مشتريات'}</h3><button aria-label='إغلاق' onClick={() => setOpen(false)}><X size={20} /></button></div>
      <form className='form' onSubmit={event => {
        event.preventDefault();
        if (isCarton && (!Number.isInteger(draft.cartons) || (draft.cartons ?? 0) <= 0 || !Number.isInteger(draft.unitsPerCarton) || (draft.unitsPerCarton ?? 0) <= 0 || !Number.isFinite(draft.cartonPrice) || (draft.cartonPrice ?? 0) <= 0)) {
          setError('أدخل عدد كراتين وعدد وحدات في الكرتون بأعداد صحيحة أكبر من صفر، وسعر كرتون أكبر من صفر.');
          return;
        }
        if (!draft.material.trim() || !draft.unit.trim() || !draft.date || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0 || !Number.isFinite(total)) {
          setError('أدخل اسم المادة وتاريخًا وكمية وسعرًا أكبر من صفر.');
          return;
        }
        const row = { ...draft, quantity, unitPrice, material: draft.material.trim(), id: editing ?? Math.max(0, ...rows.map(r => r.id)) + 1 };
        try { save(editing === null ? [row, ...rows] : rows.map(r => r.id === editing ? row : r)); setOpen(false); } catch { setError('تعذر حفظ المشتريات. تحقق من مساحة التخزين في المتصفح.'); }
      }}>
        {error && <div className='form-error' role='alert'>{error}</div>}
        <label className='field'><span>اسم المادة</span><input value={draft.material} placeholder='مثال: طحين' onChange={e => setDraft({ ...draft, material: e.target.value })} /></label>
        <label className='field'><span>طريقة الشراء</span><select value={draft.purchaseMode ?? 'direct'} onChange={e => setDraft({ ...draft, purchaseMode: e.target.value as 'direct' | 'carton', unit: e.target.value === 'carton' ? 'علبة' : draft.unit })}><option value='direct'>بالوحدة مباشرة</option><option value='carton'>بالكرتون</option></select></label>
        <div className='field-grid'>
          {isCarton ? <>
            <label className='field'><span>عدد الكراتين</span><input type='number' min='0' step='any' value={draft.cartons ?? 1} onChange={e => setDraft({ ...draft, cartons: Number(e.target.value) })} /></label>
            <label className='field'><span>عدد الوحدات في الكرتون</span><input type='number' min='0' step='any' value={draft.unitsPerCarton ?? 40} onChange={e => setDraft({ ...draft, unitsPerCarton: Number(e.target.value) })} /></label>
            <label className='field'><span>سعر الكرتون (ر.ع)</span><input type='number' min='0' step='0.001' value={draft.cartonPrice ?? 0} onChange={e => setDraft({ ...draft, cartonPrice: Number(e.target.value) })} /></label>
          </> : <label className='field'><span>الكمية</span><input type='number' min='0' step='any' value={draft.quantity} onChange={e => setDraft({ ...draft, quantity: Number(e.target.value) })} /></label>}
          <label className='field'><span>الوحدة</span><select value={draft.unit} onChange={e => setDraft({ ...draft, unit: e.target.value })}>{['كجم', 'جرام', 'لتر', 'مل', 'حبة', 'علبة', 'كيس', 'عبوة'].map(unit => <option key={unit}>{unit}</option>)}</select></label>
          {!isCarton && <label className='field'><span>سعر الوحدة (ر.ع)</span><input type='number' min='0' step='0.001' value={draft.unitPrice} onChange={e => setDraft({ ...draft, unitPrice: Number(e.target.value) })} /></label>}
          <label className='field'><span>تاريخ الشراء</span><input type='date' required value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></label>
          <label className='field'><span>المورد</span><input value={draft.supplier} onChange={e => setDraft({ ...draft, supplier: e.target.value })} /></label>
          <label className='field'><span>ملاحظات</span><input value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></label>
        </div>
        {isCarton && <div className='form-section'>
          <div className='form-summary'><span>إجمالي الوحدات</span><strong>{quantity.toLocaleString('ar-OM')} {draft.unit}</strong></div>
          <div className='form-summary'><span>تكلفة {draft.unit} واحدة</span><strong>{unitPrice.toLocaleString('ar-OM', { maximumFractionDigits: 6 })} ر.ع</strong></div>
          <p className='finance-note'>تكلفة الوحدة = سعر الكرتون ÷ عدد الوحدات فيه. عرض التكلفة تقريبي حتى 6 منازل؛ الإجمالي يُحسب من سعر الكرتون مباشرة.</p>
        </div>}
        <TaxFields amount={total} value={draft} onChange={t=>setDraft({...draft,...t})}/><div className='form-summary'><span>تكلفة الوحدة النهائية</span><strong>{(taxValues(total,draft).total/(quantity||1)).toFixed(6)} ر.ع</strong></div><div className='form-summary'><span>الإجمالي</span><strong>{money(taxValues(total,draft).total)}</strong></div><button className='primary wide' type='submit'>حفظ المشتريات</button>
      </form></div></div>}
  </section>;
}

export function ExpensesPage({ rows, onSave, onAdd }: { rows: Expense[]; onSave: (rows: Expense[]) => void; onAdd: () => void }) {
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<Expense | null>(null);
  const [error, setError] = useState('');
  const filtered = rows.filter(r => [r.title, r.category].join(' ').includes(search.trim()) && (!from || r.date >= from) && (!to || r.date <= to) && (!category || r.category === category));
  return <section className='page'>
    <div className='page-intro'><div><h2>المصاريف</h2><p>تابع الكهرباء والإنترنت والتسويق والصيانة والمصاريف العامة.</p></div><button className='primary' onClick={onAdd}><Plus size={18} />إضافة مصروف</button></div>
    <div className='kpis two'><Summary icon={<Wallet />} title='المصاريف في الفترة' value={money(filtered.reduce((s, r) => s + taxValues(r.amount,r).total, 0))} /><Summary icon={<Wallet />} title='عدد المصاريف' value={String(filtered.length)} /></div>
    <Filters search={search} setSearch={setSearch} from={from} setFrom={setFrom} to={to} setTo={setTo} placeholder='ابحث بوصف المصروف أو التصنيف' />
    <label className='field'><span>تصنيف المصروف</span><select value={category} onChange={e => setCategory(e.target.value)}><option value=''>جميع التصنيفات</option>{Array.from(new Set(rows.map(r => r.category))).map(c => <option key={c}>{c}</option>)}</select></label>
    <p className='finance-note'>سجل شراء الطحين والسكر والمواد في المشتريات. سجل هنا المصاريف العامة التي لم تدخل ضمن تكلفة إنتاج الأصناف، لتجنب تكرار احتساب التكلفة.</p>
    <div className='panel finance-list'>{!filtered.length && <div className='empty'>لا توجد مصاريف مطابقة للفلاتر.</div>}{filtered.map(row => <article className='finance-row' key={row.id}><div className='expense-icon'><Wallet size={22} /></div><div className='grow'><strong>{row.title}</strong><span>{row.category} · {row.date}</span></div><span>الضريبة: {money(taxValues(row.amount,row).tax)} ({row.taxMode??'غير محددة'})</span><strong className='negative'>{money(taxValues(row.amount,row).total)}</strong><div className='finance-actions'><button aria-label={'تعديل ' + row.title} onClick={() => { setEditing({ ...row }); setError(''); }}><PencilSimple size={18} /></button><button aria-label={'حذف ' + row.title} onClick={() => { if (window.confirm('حذف المصروف ' + row.title + '؟')) onSave(rows.filter(r => r.id !== row.id)); }}><Trash size={18} /></button></div></article>)}</div>
    {editing && <div className='modal-backdrop'><div className='modal' role='dialog' aria-modal='true' aria-label='تعديل مصروف'><div className='modal-head'><h3>تعديل مصروف</h3><button aria-label='إغلاق' onClick={() => setEditing(null)}><X size={20} /></button></div><form className='form' onSubmit={e => { e.preventDefault(); if (!editing.title.trim() || !editing.category.trim() || !editing.date || !Number.isFinite(editing.amount) || editing.amount <= 0) { setError('أدخل وصفًا وتصنيفًا وتاريخًا ومبلغًا أكبر من صفر.'); return; } onSave(rows.map(r => r.id === editing.id ? editing : r)); setEditing(null); }}>
      {error && <div className='form-error' role='alert'>{error}</div>}
      <label className='field'><span>وصف المصروف</span><input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></label>
      <label className='field'><span>التصنيف</span><input value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} /></label>
      <label className='field'><span>المبلغ</span><input type='number' min='0' step='0.001' value={editing.amount} onChange={e => setEditing({ ...editing, amount: Number(e.target.value) })} /></label>
      <TaxFields amount={editing.amount} value={editing} onChange={t=>setEditing({...editing,...t})}/><label className='field'><span>التاريخ</span><input type='date' value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} /></label><button className='primary wide' type='submit'>حفظ المصروف</button>
    </form></div></div>}
  </section>;
}

function Summary({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return <div className='metric'><div className='metric-icon'>{icon}</div><div><span>{title}</span><strong>{value}</strong></div></div>;
}
function Filters({ search, setSearch, from, setFrom, to, setTo, placeholder }: { search: string; setSearch: (v: string) => void; from: string; setFrom: (v: string) => void; to: string; setTo: (v: string) => void; placeholder: string }) {
  return <div className='finance-filters'><label className='field'><span>بحث</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder} /></label><label className='field'><span>من تاريخ</span><input type='date' value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} /></label><label className='field'><span>إلى تاريخ</span><input type='date' value={to} min={from || undefined} onChange={e => setTo(e.target.value)} /></label><button className='text-btn' onClick={() => { setSearch(''); setFrom(''); setTo(''); }}>مسح البحث والفترة</button></div>;
}


import { DateInput, displayDate } from './DateInput';
import { useState } from 'react';
import { returnTotals, round, type ReturnRecord } from './Accounting';
import { buildReturnBatch, availableToReturn, type ReturnItem } from './returnBatch';

export function ReturnsEditor({ items, records, onSave, discount, paid, deliveryFee, basis, onBasis }: {
  items: ReturnItem[]; records: ReturnRecord[]; onSave: (r: ReturnRecord[]) => void;
  discount: number; paid: number; deliveryFee: number; basis: string; onBasis: (s: string) => void;
}) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [reason, setReason] = useState('انتهاء الصلاحية');
  const [disposition, setDisposition] = useState<'تالف' | 'صالح للبيع'>('تالف');
  const [date, setDate] = useState(() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const sale = items.reduce((n, i) => n + (i.salePrice ?? 0) * i.qty, 0);
  const totals = returnTotals(records);
  const total = Math.max(sale - discount - totals.credit, 0) + deliveryFee;
  const refundDue = Math.max(paid - totals.refundPaid - total, 0);
  const selected = items.filter((_, index) => (quantities[index] ?? 0) > 0).length;
  const factor = sale ? Math.max(sale - discount, 0) / sale : 0;
  const preview = items.reduce((n, item, index) => n + round((item.salePrice ?? 0) * factor * (quantities[index] ?? 0)), 0);
  const persist = (next: ReturnRecord[], success: string) => {
    try { onSave(next); setError(''); setNotice(success); return true; }
    catch { setNotice(''); setError('تعذر حفظ التغيير. تأكد من استمرار تشغيل البرنامج المحلي ثم حاول مجددًا.'); return false; }
  };
  return <div className="form">
    <label className="field"><span>طريقة التعامل</span><select value={basis} onChange={e => { try { onBasis(e.target.value); setError(''); } catch { setError('تعذر حفظ طريقة التعامل.'); } }}>
      <option value="final">بيع نهائي مع قبول المرتجع</option><option value="consignment">بيع بالأمانة — المبلغ مبدئي حتى تسجيل المرتجعات</option>
    </select></label>
    <p>تبقى تكلفة كل الحبات المنتجة ضمن تكلفة الطلب. الصالح للبيع لا يدخل مخزونًا تلقائيًا؛ النظام لا يدير رصيد المخزون.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p role="status" style={{ color: '#27633b' }}>{notice}</p>}
    <form className="form" onSubmit={e => {
      e.preventDefault(); setNotice('');
      try {
        const next = buildReturnBatch(items, records, quantities, { date, reason, disposition, discount });
        if (persist(next, 'تم حفظ ' + selected + ' صنف وتحديث الطلب بنجاح. يمكنك تسجيل مرتجعات إضافية أو إغلاق النافذة.')) setQuantities({});
      } catch (err) { setError(err instanceof Error ? err.message : 'تحقق من بيانات المرتجع.'); }
    }}>
      <h4>الأصناف المطلوب إرجاعها</h4><p>أدخل كمية لكل صنف تريد إرجاعه، واترك بقية الأصناف على صفر.</p>
      {items.map((item, index) => {
        const available = availableToReturn(item, index, records);
        return <div className="panel" style={{ padding: 12 }} key={index}>
          <strong>{item.name ?? 'صنف'} — مرسل {item.qty}</strong><p>المتاح للإرجاع: {available}</p>
          <label className="field"><span>كمية المرتجع — {item.name ?? 'صنف'}</span><input type="number" min="0" max={available} step="1" disabled={available <= 0} value={quantities[index] ?? 0} onChange={e => { setQuantities(q => ({ ...q, [index]: Number(e.target.value) })); setNotice(''); }} /></label>
        </div>;
      })}
      <p>الأصناف المحددة: {selected} | قيمة المرتجعات: {round(preview).toFixed(3)} ر.ع (بعد توزيع خصم الطلب)</p>
      <label className="field"><span>التاريخ</span><DateInput required value={date} onChange={e => setDate(e.target.value)} /></label>
      <label className="field"><span>السبب</span><input required value={reason} onChange={e => setReason(e.target.value)} /></label>
      <label className="field"><span>مصير المرتجعات المحددة</span><select value={disposition} onChange={e => setDisposition(e.target.value as typeof disposition)}><option>تالف</option><option>صالح للبيع</option></select></label>
      <button type="submit" className="primary" disabled={selected === 0}>حفظ المرتجعات المحددة</button>
    </form>
    <p>قيمة المرتجعات: {totals.credit.toFixed(3)} | تكلفة التالف: {totals.waste.toFixed(3)} | واجب رده للعميل: {refundDue.toFixed(3)} ر.ع</p>
    {refundDue > 0 && <button type="button" onClick={() => { if (confirm('تأكيد رد ' + refundDue.toFixed(3) + ' ر.ع للعميل فعليًا؟')) persist(records.map((r, n) => n === records.length - 1 ? { ...r, refundPaid: round((r.refundPaid || 0) + refundDue) } : r), 'تم تسجيل رد المبلغ للعميل.'); }}>تسجيل رد المبلغ للعميل</button>}
    {records.map(r => <div className="panel" style={{ padding: 12 }} key={r.id}><strong>{r.name} × {r.qty} — {r.disposition}</strong><p>{displayDate(r.date)} · {r.reason} · خصم {r.credit.toFixed(3)} · مبلغ تم رده {(r.refundPaid ?? 0).toFixed(3)}</p><button type="button" disabled={totals.refundPaid > 0} onClick={() => { if (confirm('حذف المرتجع وإعادة قيمته إلى الطلب؟')) persist(records.filter(v => v.id !== r.id), 'تم حذف المرتجع.'); }}>حذف المرتجع</button>{totals.refundPaid > 0 && <small>لا يحذف سجل تم رد مبلغ عنه حفاظًا على التسوية.</small>}</div>)}
  </div>;
}

import { round, type ReturnRecord } from './Accounting';
export type ReturnItem = { productId: number; qty: number; name?: string; salePrice?: number; cost?: number };
export const availableToReturn = (item: ReturnItem, index: number, records: ReturnRecord[]) => Math.max(0, item.qty - records.filter(r => r.itemIndex === index).reduce((n, r) => n + r.qty, 0));
export function buildReturnBatch(items: ReturnItem[], records: ReturnRecord[], quantities: Record<number, number>, details: { date: string; reason: string; disposition: 'تالف' | 'صالح للبيع'; discount: number }): ReturnRecord[] {
  if (!details.date || !details.reason.trim()) throw new Error('أدخل تاريخًا صحيحًا وسبب المرتجع.');
  const selected = items.map((item, index) => ({ item, index, qty: quantities[index] ?? 0 })).filter(r => r.qty !== 0);
  if (!selected.length) throw new Error('حدد كمية لصنف واحد على الأقل.');
  for (const row of selected) if (!Number.isInteger(row.qty) || row.qty <= 0 || row.qty > availableToReturn(row.item, row.index, records)) throw new Error('كمية المرتجع للصنف «' + (row.item.name ?? 'صنف') + '» يجب أن تكون عددًا صحيحًا لا يتجاوز المتاح.');
  const sale = items.reduce((n, item) => n + (item.salePrice ?? 0) * item.qty, 0);
  const factor = sale ? Math.max(sale - details.discount, 0) / sale : 0;
  const firstId = Math.max(Date.now(), ...records.map(r => r.id + 1));
  return [...records, ...selected.map(({ item, index, qty }, n) => ({ id: firstId + n, itemIndex: index, qty, date: details.date, reason: details.reason.trim(), disposition: details.disposition, credit: round((item.salePrice ?? 0) * factor * qty), unitCost: item.cost ?? 0, name: item.name ?? 'صنف', refundPaid: 0 }))];
}

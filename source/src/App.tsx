import { useMemo, useState } from 'react';
import { PurchasesPage, ExpensesPage } from './FinancePages';
import './finance.css';
import { ReportsPage } from './ReportsPage';
import './reports.css';
import {
  Cake as CakeSlice,
  CheckCircle as CheckCircle2,
  CaretDown as ChevronDown,
  Coins as CircleDollarSign,
  Clock as Clock3,
  SquaresFour as LayoutDashboard,
  List as Menu,
  Package as PackageCheck,
  Plus,
  Receipt as ReceiptText,
  MagnifyingGlass as Search,
  ShoppingBagOpen as ShoppingBag,
  Truck,
  UsersThree as UsersRound,
  Wallet as WalletCards,
  X,
  IconContext,
  PencilSimple,
  Trash,
  WhatsappLogo,
} from '@phosphor-icons/react';

type Page = 'dashboard' | 'orders' | 'customers' | 'products' | 'purchases' | 'expenses' | 'delivery' | 'reports';
type OrderStatus = 'جديد' | 'مؤكد' | 'قيد التجهيز' | 'جاهز' | 'خرج للتوصيل' | 'مكتمل' | 'مؤجل' | 'ملغي';
type DeliveryType = 'استلام من المشروع' | 'توصيل';
type PaymentMethod = 'تحويل بنكي' | 'نقدي' | 'بطاقة/رابط' | 'غير محدد';

type Product = {
  id: number;
  name: string;
  unit: string;
  salePrice: number;
  cost: number;
};

type OrderItem = {
  productId: number;
  qty: number;
  name?: string;
  salePrice?: number;
  cost?: number;
};

type Customer = {
  id: number;
  name: string;
  phone: string;
  address: string;
};

type Order = {
  id: number;
  customerId: number;
  customer: string;
  phone: string;
  address: string;
  items: OrderItem[];
  date: string;
  time: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  deliveryFee: number;
  courier: string;
  courierPay: number;
  courierSettled: boolean;
  discount: number;
  paid: number;
  paymentMethod: PaymentMethod;
  notes: string;
};

type Expense = {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
};

type OrderDraft = Omit<Order, 'id' | 'customerId'>;

const statusFlow: OrderStatus[] = ['جديد', 'مؤكد', 'قيد التجهيز', 'جاهز', 'خرج للتوصيل', 'مكتمل'];
const statusOptions: OrderStatus[] = [...statusFlow, 'مؤجل', 'ملغي'];
type CourierRecord = { name: string };

const localToday = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const today = localToday();

const initialProducts: Product[] = [
  { id: 1, name: 'بوكس ميني تشيز كيك', unit: 'بوكس', salePrice: 12, cost: 5.2 },
  { id: 2, name: 'كيكة شوكولاتة عائلية', unit: 'حبة', salePrice: 16, cost: 6.7 },
  { id: 3, name: 'كوكيز فاخر - 12 حبة', unit: 'بوكس', salePrice: 9.5, cost: 3.9 },
  { id: 4, name: 'صينية حلوى المناسبات', unit: 'صينية', salePrice: 22, cost: 9.8 },
];

const initialCustomers: Customer[] = [
  { id: 1, name: 'أمينة', phone: '99112233', address: 'فنجاء' },
  { id: 2, name: 'خالد', phone: '92334455', address: 'بدبد' },
  { id: 3, name: 'مها', phone: '97886655', address: 'مسقط' },
  { id: 4, name: 'سارة', phone: '96001122', address: 'فنجاء' },
];

const initialOrders: Order[] = [
  {
    id: 1047,
    customerId: 1,
    customer: 'أمينة',
    phone: '99112233',
    address: 'فنجاء',
    items: [{ productId: 1, qty: 2 }, { productId: 3, qty: 1 }],
    date: today,
    time: '18:00',
    status: 'قيد التجهيز',
    deliveryType: 'توصيل',
    deliveryFee: 1.5,
    courier: 'أحمد',
    courierPay: 1.2,
    courierSettled: false,
    discount: 0,
    paid: 20,
    paymentMethod: 'تحويل بنكي',
    notes: 'بدون كتابة على العلبة',
  },
  {
    id: 1046,
    customerId: 2,
    customer: 'خالد',
    phone: '92334455',
    address: 'بدبد',
    items: [{ productId: 2, qty: 1 }],
    date: today,
    time: '20:00',
    status: 'جاهز',
    deliveryType: 'توصيل',
    deliveryFee: 2,
    courier: 'سالم',
    courierPay: 1.5,
    courierSettled: false,
    discount: 0,
    paid: 18,
    paymentMethod: 'نقدي',
    notes: '',
  },
  {
    id: 1045,
    customerId: 3,
    customer: 'مها',
    phone: '97886655',
    address: 'مسقط',
    items: [{ productId: 3, qty: 3 }],
    date: today,
    time: '17:30',
    status: 'خرج للتوصيل',
    deliveryType: 'توصيل',
    deliveryFee: 1.5,
    courier: 'مريم',
    courierPay: 1.2,
    courierSettled: true,
    discount: 1,
    paid: 10,
    paymentMethod: 'تحويل بنكي',
    notes: 'التواصل قبل الوصول',
  },
  {
    id: 1044,
    customerId: 4,
    customer: 'سارة',
    phone: '96001122',
    address: 'فنجاء',
    items: [{ productId: 4, qty: 1 }],
    date: today,
    time: '15:00',
    status: 'مكتمل',
    deliveryType: 'استلام من المشروع',
    deliveryFee: 0,
    courier: 'بدون توصيل',
    courierPay: 0,
    courierSettled: true,
    discount: 0,
    paid: 22,
    paymentMethod: 'نقدي',
    notes: '',
  },
];

const initialExpenses: Expense[] = [
  { id: 1, title: 'علب وتغليف', category: 'تغليف', amount: 14.8, date: today },
  { id: 2, title: 'مستلزمات مطبخ', category: 'مواد تشغيلية', amount: 8.5, date: today },
];

const omr = (value: number) =>
  value.toLocaleString('ar-OM', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

function loadState<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

function normalizeOrders(raw: unknown): Order[] {
  if (!Array.isArray(raw)) return initialOrders;
  return raw.map((value, index) => {
    const source = value as Record<string, unknown>;
    if (Array.isArray(source.items)) {
      return {
        ...source,
        customerId: Number(source.customerId ?? index + 1),
        address: String(source.address ?? ''),
        deliveryType: (source.deliveryType === 'استلام من المشروع' ? 'استلام من المشروع' : 'توصيل') as DeliveryType,
        courierSettled: Boolean(source.courierSettled),
        discount: Number(source.discount ?? 0),
        paid: Number(source.paid ?? 0),
        paymentMethod: (source.paymentMethod ?? 'غير محدد') as PaymentMethod,
      } as Order;
    }
    return {
      id: Number(source.id ?? 1000 + index),
      customerId: index + 1,
      customer: String(source.customer ?? ''),
      phone: String(source.phone ?? ''),
      address: '',
      items: [{ productId: Number(source.productId ?? 1), qty: Number(source.qty ?? 1) }],
      date: String(source.date ?? today),
      time: String(source.time ?? '18:00'),
      status: (source.status ?? 'جديد') as OrderStatus,
      deliveryType: Number(source.deliveryFee ?? 0) > 0 ? 'توصيل' : 'استلام من المشروع',
      deliveryFee: Number(source.deliveryFee ?? 0),
      courier: String(source.courier ?? 'بدون توصيل'),
      courierPay: Number(source.courierPay ?? 0),
      courierSettled: false,
      discount: 0,
      paid: 0,
      paymentMethod: 'غير محدد',
      notes: String(source.notes ?? ''),
    };
  });
}

function statusTone(status: OrderStatus) {
  if (status === 'جديد') return 's-new';
  if (status === 'مؤكد') return 's-confirmed';
  if (status === 'قيد التجهيز') return 's-prep';
  if (status === 'جاهز') return 's-ready';
  if (status === 'خرج للتوصيل') return 's-route';
  if (status === 'مكتمل') return 's-done';
  if (status === 'مؤجل') return 's-hold';
  return 's-cancel';
}

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(() => loadState('sweet-products', initialProducts));
  const [orders, setOrders] = useState<Order[]>(() => normalizeOrders(loadState<unknown>('sweet-orders', initialOrders)));
  const [customers, setCustomers] = useState<Customer[]>(() => loadState('sweet-customers', initialCustomers));
  const [courierRecords, setCourierRecords] = useState<CourierRecord[]>(() => loadState('sweet-couriers', [{ name: 'أحمد' }, { name: 'سالم' }, { name: 'مريم' }]));
  const couriers = ['بدون توصيل', ...courierRecords.map(c => c.name)];
  const [courierEditor, setCourierEditor] = useState<{ original: string | null; name: string } | null>(null);
  const [courierError, setCourierError] = useState('');
  const saveCouriers = (value: CourierRecord[]) => { localStorage.setItem('sweet-couriers', JSON.stringify(value)); setCourierRecords(value); };
  const [expenses, setExpenses] = useState<Expense[]>(() => loadState('sweet-expenses', initialExpenses));
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderModal, setOrderModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Order | null>(null);

  const saveProducts = (value: Product[]) => {
    setProducts(value);
    localStorage.setItem('sweet-products', JSON.stringify(value));
  };

  const saveOrders = (value: Order[]) => {
    setOrders(value);
    localStorage.setItem('sweet-orders', JSON.stringify(value));
  };

  const saveCustomers = (value: Customer[]) => {
    setCustomers(value);
    localStorage.setItem('sweet-customers', JSON.stringify(value));
  };

  const saveExpenses = (value: Expense[]) => {
    setExpenses(value);
    localStorage.setItem('sweet-expenses', JSON.stringify(value));
  };

  const orderFinancials = (order: Order) => {
    const sale = order.items.reduce((sum, item) => {
      const product = products.find(productItem => productItem.id === item.productId);
      return sum + (item.salePrice ?? product?.salePrice ?? 0) * item.qty;
    }, 0);
    const productionCost = order.items.reduce((sum, item) => {
      const product = products.find(productItem => productItem.id === item.productId);
      return sum + (item.cost ?? product?.cost ?? 0) * item.qty;
    }, 0);
    const afterDiscount = Math.max(sale - order.discount, 0);
    const customerTotal = afterDiscount + order.deliveryFee;
    const profit = afterDiscount - productionCost + order.deliveryFee - order.courierPay;
    const balance = Math.max(customerTotal - order.paid, 0);
    return { sale, productionCost, afterDiscount, customerTotal, profit, balance };
  };

  const paymentStatus = (order: Order) => {
    const total = orderFinancials(order).customerTotal;
    if (order.paid <= 0) return 'غير مدفوع';
    if (order.paid + 0.0001 >= total) return 'مدفوع بالكامل';
    return 'مدفوع جزئيًا';
  };

  const metrics = useMemo(() => {
    const todays = orders.filter(order => order.date === today && order.status !== 'ملغي');
    const sales = todays.reduce((sum, order) => sum + orderFinancials(order).customerTotal, 0);
    const collected = todays.reduce((sum, order) => sum + Math.min(order.paid, orderFinancials(order).customerTotal), 0);
    const grossProfit = todays.reduce((sum, order) => sum + orderFinancials(order).profit, 0);
    const todayExpenses = expenses
      .filter(expense => expense.date === today)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const outstanding = orders
      .filter(order => order.status !== 'ملغي')
      .reduce((sum, order) => sum + orderFinancials(order).balance, 0);
    return {
      todayOrders: todays.length,
      active: orders.filter(order => !['مكتمل', 'ملغي'].includes(order.status)).length,
      sales,
      collected,
      outstanding,
      netProfit: grossProfit - todayExpenses,
    };
  }, [orders, products, expenses]);

  const filteredOrders = orders.filter(order => {
    const itemNames = order.items
      .map(item => products.find(product => product.id === item.productId)?.name ?? '')
      .join(' ');
    const haystack = [order.id, order.customer, order.phone, itemNames, order.status, paymentStatus(order)].join(' ');
    return haystack.toLowerCase().includes(search.toLowerCase());
  });

  const filteredCustomers = customers.filter(customer => {
    const haystack = [customer.name, customer.phone, customer.address].join(' ');
    return haystack.toLowerCase().includes(customerSearch.toLowerCase());
  });

  const changeStatus = (id: number, status: OrderStatus) => {
    saveOrders(orders.map(order => (order.id === id ? { ...order, status } : order)));
  };

  const toggleCourierSettlement = (id: number) => {
    saveOrders(orders.map(order => (order.id === id ? { ...order, courierSettled: !order.courierSettled } : order)));
  };

  const createOrder = (draft: OrderDraft) => {
    const existing = customers.find(customer => customer.phone.trim() === draft.phone.trim());
    let customerId = existing?.id ?? Math.max(Date.now(), ...customers.map(customer => customer.id)) + 1;
    let nextCustomers = customers;

    if (existing) {
      nextCustomers = customers.map(customer =>
        customer.id === existing.id
          ? { ...customer, name: draft.customer, address: draft.address }
          : customer
      );
    } else {
      nextCustomers = [
        ...customers,
        { id: customerId, name: draft.customer, phone: draft.phone, address: draft.address },
      ];
    }

    const id = editingOrder?.id ?? Math.max(Date.now(), ...orders.map(order => order.id)) + 1;
    saveCustomers(nextCustomers);
    const items = draft.items.map(item => {
      const p = products.find(p => p.id === item.productId);
      return { ...item, name: item.name ?? p?.name, salePrice: item.salePrice ?? p?.salePrice, cost: item.cost ?? p?.cost };
    });
    const updated = { ...draft, items, id, customerId };
    saveOrders(editingOrder ? orders.map(o => o.id === id ? updated : o) : [updated, ...orders]);
    setEditingOrder(null);
    setOrderModal(false);
    setPage('orders');
  };

  const snapshots = () => orders.map(o => ({ ...o, items: o.items.map(i => {
    const p = products.find(p => p.id === i.productId);
    return { ...i, name: i.name ?? p?.name, salePrice: i.salePrice ?? p?.salePrice, cost: i.cost ?? p?.cost };
  }) }));
  const editOrder = (o: Order) => setEditingOrder(snapshots().find(v => v.id === o.id) ?? o);
  const deleteOrder = (o: Order) => { if (window.confirm('حذف الطلب #' + o.id + ' من الطلبات والإحصاءات والتوصيل؟')) saveOrders(orders.filter(v => v.id !== o.id)); };
  const deleteCustomer = (c: Customer) => { if (window.confirm('حذف العميل ' + c.name + '؟ ستبقى طلباته السابقة محفوظة.')) saveCustomers(customers.filter(v => v.id !== c.id)); };
  const deleteProduct = (p: Product) => { if (window.confirm('حذف الصنف ' + p.name + '؟ ستبقى تفاصيله وتكلفته في الطلبات السابقة محفوظة.')) { saveOrders(snapshots()); saveProducts(products.filter(v => v.id !== p.id)); } };
  const removeDelivery = (order: Order) => {
    if (window.confirm('حذف إسناد التوصيل للطلب #' + order.id + '؟ سيبقى الطلب ومبالغه محفوظين، ويمكن إعادة إسناده من تعديل الطلب.')) {
      saveOrders(orders.map(o => o.id === order.id ? { ...o, courier: 'بدون توصيل', status: o.status === 'خرج للتوصيل' ? 'جاهز' : o.status } : o));
    }
  };
  const nav = [
    { key: 'dashboard' as Page, label: 'الرئيسية', icon: LayoutDashboard },
    { key: 'orders' as Page, label: 'الطلبات', icon: ShoppingBag },
    { key: 'customers' as Page, label: 'العملاء', icon: UsersRound },
    { key: 'products' as Page, label: 'الأصناف والتكاليف', icon: CakeSlice },
    { key: 'purchases' as Page, label: 'المشتريات', icon: ShoppingBag },
    { key: 'expenses' as Page, label: 'المصاريف', icon: WalletCards },
    { key: 'reports' as Page, label: 'التقارير', icon: ReceiptText },
    { key: 'delivery' as Page, label: 'التوصيل', icon: Truck },
  ];

  const go = (key: Page) => {
    setPage(key);
    setMobileOpen(false);
  };

  return (
    <IconContext.Provider value={{ weight: 'duotone' }}>
    <div className="shell" dir="rtl">
      <aside className={mobileOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark"><CakeSlice size={22} /></div>
          <div><strong>بيت الحلوى</strong><span>إدارة الطلبات والتكاليف</span></div>
        </div>
        <nav>
          {nav.map(({ key, label, icon: Icon }) => (
            <button key={key} className={page === key ? 'nav-item active' : 'nav-item'} onClick={() => go(key)}>
              <Icon size={19} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <CircleDollarSign size={20} />
          <div><strong>ربحية واضحة لكل طلب</strong><span>البيع − التكلفة − الخصم + رسوم التوصيل − أجر الموصّل</span></div>
        </div>
      </aside>

      {mobileOpen && <button className="overlay" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <div className="top-title">
            <button className="menu-btn" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة"><Menu /></button>
            <div><span className="eyebrow">نظام إدارة مشروع الحلويات</span><h1>{nav.find(item => item.key === page)?.label}</h1></div>
          </div>
          <div className="top-actions">
            <div className="date-chip"><Clock3 size={17} /><span>{new Date().toLocaleDateString('ar-OM', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
            <button className="primary" onClick={() => setOrderModal(true)}><Plus size={18} />طلب جديد</button>
          </div>
        </header>

        {page === 'dashboard' && (
          <section className="page">
            <div className="hero">
              <div>
                <span className="eyebrow">ملخص اليوم</span>
                <h2>من الطلب إلى التحصيل والتوصيل، كل التفاصيل أصبحت مترابطة.</h2>
                <p>الطلب الواحد يدعم عدة أصناف، مع متابعة المدفوع والمتبقي، سجل العميل، وتكلفة التوصيل ومستحقات الموصّل بشكل مستقل.</p>
              </div>
              <button className="hero-btn" onClick={() => setOrderModal(true)}><Plus size={18} />تسجيل طلب</button>
            </div>

            <div className="kpis six">
              <Metric icon={<ShoppingBag />} label="طلبات اليوم" value={String(metrics.todayOrders)} hint="طلب غير ملغٍ اليوم" />
              <Metric icon={<PackageCheck />} label="طلبات نشطة" value={String(metrics.active)} hint="تحتاج متابعة" />
              <Metric icon={<ReceiptText />} label="مبيعات اليوم" value={omr(metrics.sales) + ' ر.ع'} hint="قيمة الطلبات" />
              <Metric icon={<WalletCards />} label="المحصل اليوم" value={omr(metrics.collected) + ' ر.ع'} hint="من طلبات اليوم" />
              <Metric icon={<CircleDollarSign />} label="مبالغ متبقية" value={omr(metrics.outstanding) + ' ر.ع'} hint="على جميع الطلبات" />
              <Metric icon={<CircleDollarSign />} label="صافي اليوم" value={omr(metrics.netProfit) + ' ر.ع'} hint="بعد التكاليف والمصاريف" accent />
            </div>

            <div className="dashboard-grid">
              <div className="panel">
                <div className="panel-head">
                  <div><span className="eyebrow">سير العمل</span><h3>حالة الطلبات</h3></div>
                  <button className="text-btn" onClick={() => go('orders')}>عرض الكل</button>
                </div>
                <div className="stage-list">
                  {statusFlow.map(status => {
                    const count = orders.filter(order => order.status === status).length;
                    const max = Math.max(orders.length, 1);
                    return (
                      <div className="stage" key={status}>
                        <div className="stage-row"><span>{status}</span><strong>{count}</strong></div>
                        <div className="bar"><span style={{ width: Math.max((count / max) * 100, count ? 8 : 0) + '%' }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div><span className="eyebrow">التحصيل</span><h3>طلبات عليها مبالغ</h3></div>
                  <WalletCards size={20} />
                </div>
                <div className="delivery-mini">
                  {orders
                    .filter(order => orderFinancials(order).balance > 0 && order.status !== 'ملغي')
                    .slice(0, 5)
                    .map(order => (
                      <div className="delivery-row" key={order.id}>
                        <div className="avatar">{order.customer.charAt(0)}</div>
                        <div className="grow"><strong>{order.customer}</strong><span>#{order.id} · {paymentStatus(order)}</span></div>
                        <div className="money due">{omr(orderFinancials(order).balance)} ر.ع</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div><span className="eyebrow">آخر التحديثات</span><h3>أحدث الطلبات</h3></div>
                <button className="text-btn" onClick={() => go('orders')}>إدارة الطلبات</button>
              </div>
              <OrderCards orders={orders.slice(0, 4)} products={products} onStatus={changeStatus} financials={orderFinancials} paymentStatus={paymentStatus} onEdit={editOrder} onDelete={deleteOrder} />
            </div>
          </section>
        )}

        {page === 'orders' && (
          <section className="page">
            <PageIntro title="إدارة الطلبات" description="كل طلب يمكن أن يحتوي على عدة أصناف، مع حالة تشغيلية وحالة مالية مستقلة." action="إضافة طلب" onAction={() => setOrderModal(true)} />
            <div className="toolbar">
              <div className="search"><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث بالعميل، الهاتف، الطلب، الصنف أو حالة الدفع..." /></div>
              <span className="result-count">{filteredOrders.length} طلب</span>
            </div>
            <div className="panel flush">
              <OrderCards orders={filteredOrders} products={products} onStatus={changeStatus} financials={orderFinancials} paymentStatus={paymentStatus} onEdit={editOrder} onDelete={deleteOrder} detailed />
            </div>
          </section>
        )}

        {page === 'customers' && (
          <section className="page">
            <PageIntro title="العملاء" description="سجل تلقائي للعملاء المتكررين مع عدد الطلبات وإجمالي المشتريات والمبالغ المتبقية." />
            <div className="toolbar">
              <div className="search"><Search size={18} /><input value={customerSearch} onChange={event => setCustomerSearch(event.target.value)} placeholder="ابحث بالاسم، الهاتف أو المنطقة..." /></div>
              <span className="result-count">{filteredCustomers.length} عميل</span>
            </div>
            <div className="customer-grid">
              {filteredCustomers.map(customer => {
                const customerOrders = orders.filter(order => order.customerId === customer.id || order.phone === customer.phone);
                const total = customerOrders.reduce((sum, order) => sum + orderFinancials(order).customerTotal, 0);
                const balance = customerOrders.reduce((sum, order) => sum + orderFinancials(order).balance, 0);
                return (
                  <article className="customer-card" key={customer.id}>
                    <div className="customer-head"><div className="avatar big">{customer.name.charAt(0)}</div><div><h3>{customer.name}</h3><span>{customer.phone}</span></div></div>
                    <RecordActions label={customer.name} onEdit={() => setEditingCustomer(customer)} onDelete={() => deleteCustomer(customer)} />
                    <div className="customer-address">{customer.address || 'لم يحدد العنوان'}</div>
                    <div className="customer-stats">
                      <div><span>الطلبات</span><strong>{customerOrders.length}</strong></div>
                      <div><span>المشتريات</span><strong>{omr(total)} ر.ع</strong></div>
                      <div><span>المتبقي</span><strong className={balance > 0 ? 'warn-text' : ''}>{omr(balance)} ر.ع</strong></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {page === 'products' && (
          <section className="page">
            <PageIntro title="الأصناف والتكاليف" description="ثبّت سعر البيع والتكلفة المباشرة لكل صنف ليحسب النظام هامش الربح تلقائيًا." action="إضافة صنف" onAction={() => setProductModal(true)} />
            <div className="product-grid">
              {products.map(product => {
                const margin = product.salePrice - product.cost;
                return (
                  <article className="product-card" key={product.id}>
                    <div className="product-icon"><CakeSlice /></div>
                    <div className="product-main">
                      <span className="eyebrow">{product.unit}</span>
                      <h3>{product.name}</h3><RecordActions label={product.name} onEdit={() => setEditingProduct(product)} onDelete={() => deleteProduct(product)} />
                      <div className="price-line"><span>سعر البيع</span><strong>{omr(product.salePrice)} ر.ع</strong></div>
                      <div className="price-line"><span>تكلفة الإنتاج</span><strong>{omr(product.cost)} ر.ع</strong></div>
                      <div className="margin"><span>هامش الصنف</span><strong>{omr(margin)} ر.ع</strong></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {page === 'reports' && <ReportsPage orders={orders} products={products} expenses={expenses} />}
        {page === 'purchases' && <PurchasesPage />}
        {page === 'expenses' && <ExpensesPage rows={expenses} onSave={saveExpenses} onAdd={() => setExpenseModal(true)} />}

        {page === 'delivery' && (
          <section className="page">
            <PageIntro title="التوصيل" description="إدارة الموصّلين ومتابعة الطلبات والمستحقات والتسويات." action="إضافة موصّل" onAction={() => { setCourierError(''); setCourierEditor({ original: null, name: '' }); }} />
            <div className="courier-grid">
              {Array.from(new Set([...couriers.filter(name => name !== 'بدون توصيل'), ...orders.map(o => o.courier).filter(c => c && c !== 'بدون توصيل')])).map(courier => {
                const assigned = orders.filter(order => order.courier === courier && order.status !== 'ملغي');
                const pending = assigned.filter(order => order.status !== 'مكتمل');
                const due = assigned.reduce((sum, order) => sum + order.courierPay, 0);
                const settled = assigned.filter(order => order.courierSettled).reduce((sum, order) => sum + order.courierPay, 0);
                return (
                  <article className="courier-card" key={courier}>
                    <div className="courier-head"><div className="avatar big">{courier.charAt(0)}</div><div><h3>{courier}</h3><span>{pending.length} توصيل نشط</span></div></div>
                    <RecordActions label={'الموصّل ' + courier} onEdit={() => { setCourierError(''); setCourierEditor({ original: courier, name: courier }); }} onDelete={() => {
                      if (orders.some(o => o.courier === courier)) { window.alert('هذا الموصّل مرتبط بطلبات. أعد إسناد طلباته أو أزل إسناد التوصيل أولًا، ثم احذفه للحفاظ على المستحقات.'); return; }
                      if (window.confirm('حذف الموصّل ' + courier + '؟')) saveCouriers(courierRecords.filter(c => c.name !== courier));
                    }} />
                    <div className="courier-due"><span>إجمالي المستحق</span><strong>{omr(due)} ر.ع</strong></div>
                    <div className="courier-due"><span>تمت تسويته</span><strong>{omr(settled)} ر.ع</strong></div>
                    <div className="courier-due outstanding"><span>المتبقي للموصّل</span><strong>{omr(Math.max(due - settled, 0))} ر.ع</strong></div>
                  </article>
                );
              })}
            </div>
            <div className="panel">
              <div className="panel-head"><div><span className="eyebrow">الطلبات</span><h3>جدول التوصيل</h3></div></div>
              <div className="delivery-table">
                {orders.filter(order => order.courier !== 'بدون توصيل' && order.status !== 'ملغي').map(order => (
                  <div className="delivery-item enhanced" key={order.id}>
                    <div><strong>#{order.id} · {order.customer}</strong><span>{order.address || 'العنوان غير محدد'} · {order.time}</span></div>
                    <div><span>الموصّل</span><strong>{order.courier}</strong></div>
                    <div><span>أجر التوصيل</span><strong>{omr(order.courierPay)} ر.ع</strong></div>
                    <span className={'status ' + statusTone(order.status)}>{order.status}</span>
                    <button className={order.courierSettled ? 'settle-btn settled' : 'settle-btn'} onClick={() => toggleCourierSettlement(order.id)}>
                      {order.courierSettled ? 'تم دفع أجر الموصّل' : 'تسجيل دفع أجر الموصّل'}
                    </button>
                    <div style={{ gridColumn: '1 / -1' }}><RecordActions label={'توصيل الطلب ' + order.id} onEdit={() => setEditingDelivery(order)} onDelete={() => removeDelivery(order)} /></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="تنقل الهاتف">
        <button className={page === 'dashboard' ? 'active' : ''} onClick={() => go('dashboard')}><LayoutDashboard size={19} /><span>الرئيسية</span></button>
        <button className={page === 'orders' ? 'active' : ''} onClick={() => go('orders')}><ShoppingBag size={19} /><span>الطلبات</span></button>
        <button className="bottom-add" onClick={() => setOrderModal(true)}><Plus size={24} /><span>طلب</span></button>
        <button className={page === 'delivery' ? 'active' : ''} onClick={() => go('delivery')}><Truck size={19} /><span>التوصيل</span></button>
        <button className={page === 'customers' ? 'active' : ''} onClick={() => go('customers')}><UsersRound size={19} /><span>العملاء</span></button>
      </nav>

      {(orderModal || editingOrder) && (
        <Modal title={editingOrder ? 'تعديل الطلب #' + editingOrder.id : 'تسجيل طلب جديد'} onClose={() => { setOrderModal(false); setEditingOrder(null); }} wide>
          <OrderForm key={editingOrder?.id ?? 'new'} initial={editingOrder ?? undefined} couriers={Array.from(new Set([...couriers, ...orders.map(o => o.courier)]))} products={products} customers={customers} onSubmit={createOrder} />
        </Modal>
      )}

      {(productModal || editingProduct) && (
        <Modal title={editingProduct ? 'تعديل الصنف' : 'إضافة صنف'} onClose={() => { setProductModal(false); setEditingProduct(null); }}>
          <ProductForm key={editingProduct?.id ?? 'new'} initial={editingProduct ?? undefined} onSubmit={product => {
            if (editingProduct) {
              saveOrders(snapshots());
              saveProducts(products.map(p => p.id === editingProduct.id ? { ...product, id: p.id } : p));
            } else saveProducts([...products, { ...product, id: Math.max(Date.now(), ...products.map(item => item.id)) + 1 }]);
            setEditingProduct(null);
            setProductModal(false);
          }} />
        </Modal>
      )}

      {editingCustomer && <Modal title="تعديل العميل" onClose={() => setEditingCustomer(null)}>
        <CustomerForm initial={editingCustomer} customers={customers} onSubmit={c => {
          saveCustomers(customers.map(v => v.id === c.id ? c : v));
          saveOrders(orders.map(o => o.customerId === c.id ? { ...o, customer: c.name, phone: c.phone, address: c.address } : o));
          setEditingCustomer(null);
        }} />
      </Modal>}
      {courierEditor && <Modal title={courierEditor.original ? 'تعديل الموصّل' : 'إضافة موصّل'} onClose={() => setCourierEditor(null)}>
        <form className="form" onSubmit={e => {
          e.preventDefault();
          const name = courierEditor.name.trim();
          const original = courierEditor.original;
          const existing = Array.from(new Set([...courierRecords.map(c => c.name), ...orders.map(o => o.courier)]));
          if (!name || name === 'بدون توصيل') { setCourierError('أدخل اسم الموصّل.'); return; }
          if (existing.some(c => c === name && c !== original)) { setCourierError('اسم الموصّل موجود بالفعل.'); return; }
          const next = courierRecords.filter(c => c.name !== original);
          saveCouriers([...next, { name }]);
          if (original) saveOrders(orders.map(o => o.courier === original ? { ...o, courier: name } : o));
          setCourierEditor(null);
        }}>
          {courierError && <div className="form-error">{courierError}</div>}
          <Field label="اسم الموصّل"><input value={courierEditor.name} onChange={e => setCourierEditor({ ...courierEditor, name: e.target.value })} /></Field>
          <button className="primary wide" type="submit">حفظ الموصّل</button>
        </form>
      </Modal>}
      {editingDelivery && <Modal title={'تعديل توصيل الطلب #' + editingDelivery.id} onClose={() => setEditingDelivery(null)}>
        <DeliveryForm couriers={Array.from(new Set([...couriers, ...orders.map(o => o.courier)]))} initial={editingDelivery} onSubmit={updated => {
          saveOrders(orders.map(o => o.id === updated.id ? updated : o));
          setEditingDelivery(null);
        }} />
      </Modal>}
      {expenseModal && (
        <Modal title="إضافة مصروف" onClose={() => setExpenseModal(false)}>
          <ExpenseForm onSubmit={expense => {
            saveExpenses([{ ...expense, id: Math.max(0, ...expenses.map(item => item.id)) + 1 }, ...expenses]);
            setExpenseModal(false);
          }} />
        </Modal>
      )}
    </div>
    </IconContext.Provider>
  );
}

function Metric({ icon, label, value, hint, accent = false }: { icon: React.ReactNode; label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <div className={accent ? 'metric accent' : 'metric'}>
      <div className="metric-icon">{icon}</div>
      <div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>
    </div>
  );
}

function PageIntro({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return (
    <div className="page-intro">
      <div><h2>{title}</h2><p>{description}</p></div>
      {action && <button className="primary" onClick={onAction}><Plus size={18} />{action}</button>}
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const className = status === 'مدفوع بالكامل' ? 'payment paid' : status === 'مدفوع جزئيًا' ? 'payment partial' : 'payment unpaid';
  return <span className={className}>{status}</span>;
}

function OrderCards({
  orders,
  products,
  onStatus,
  financials,
  paymentStatus,
  detailed = false,
  onEdit,
  onDelete,
}: {
  orders: Order[];
  products: Product[];
  onStatus: (id: number, status: OrderStatus) => void;
  financials: (order: Order) => { customerTotal: number; profit: number; balance: number };
  paymentStatus: (order: Order) => string;
  detailed?: boolean;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}) {
  const [shareId, setShareId] = useState<number | null>(null);
  const sharedOrder = orders.find(o => o.id === shareId);
  if (!orders.length) return <div className="empty">لا توجد طلبات مطابقة.</div>;
  return (
    <div className="order-list">
      {sharedOrder && <Modal title={'مشاركة الطلب #' + sharedOrder.id} onClose={() => setShareId(null)}><WhatsAppShare key={sharedOrder.id} order={sharedOrder} products={products} /></Modal>}
      {orders.map(order => {
        const money = financials(order);
        const itemSummary = order.items
          .map(item => {
            const product = products.find(productItem => productItem.id === item.productId);
            return (item.name ?? product?.name ?? 'صنف') + ' × ' + item.qty;
          })
          .join('، ');
        return (
          <article className={detailed ? 'order-row detailed' : 'order-row'} key={order.id}>
            <div className="order-id"><span>طلب</span><strong>#{order.id}</strong></div>
            <div className="order-customer"><strong>{order.customer}</strong><span>{itemSummary}</span><small>{order.items.length} صنف/بنود · {order.deliveryType}</small></div>
            {detailed && <div className="order-contact"><span>{order.phone}</span><small>{order.date} · {order.time}</small></div>}
            <div className="order-money"><span>الإجمالي</span><strong>{omr(money.customerTotal)} ر.ع</strong><PaymentBadge status={paymentStatus(order)} /></div>
            <div className="order-money profit"><span>الربح</span><strong>{omr(money.profit)} ر.ع</strong>{money.balance > 0 && <small className="balance">متبقٍ {omr(money.balance)}</small>}</div>
            <label className={'status-select ' + statusTone(order.status)}>
              <select value={order.status} onChange={event => onStatus(order.id, event.target.value as OrderStatus)}>
                {statusOptions.map(status => <option key={status}>{status}</option>)}
              </select>
              <ChevronDown size={15} />
            </label>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <RecordActions label={'الطلب ' + order.id} onEdit={() => onEdit(order)} onDelete={() => onDelete(order)} />
              <button className="secondary mini" aria-label={'واتساب الطلب ' + order.id} onClick={() => setShareId(order.id)}><WhatsappLogo size={20} />مشاركة عبر واتساب</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

type ShareKind = 'invoice' | 'receipt' | 'update';
function normalizeWhatsAppPhone(value: string) {
  let number = value.replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[\s()+-]/g, '');
  if (number.startsWith('00')) number = number.slice(2);
  if (/^[79][0-9]{7}$/.test(number)) number = '968' + number;
  return /^[1-9][0-9]{7,14}$/.test(number) ? number : '';
}
function customerMessage(order: Order, products: Product[], kind: ShareKind) {
  const lines = order.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    const price = item.salePrice ?? product?.salePrice ?? 0;
    return { name: item.name ?? product?.name ?? 'صنف', qty: item.qty, price, total: price * item.qty };
  });
  const subtotal = lines.reduce((sum, i) => sum + i.total, 0);
  const total = Math.max(subtotal - order.discount, 0) + order.deliveryFee;
  const balance = Math.max(total - order.paid, 0);
  const heading = kind === 'invoice' ? 'فاتورة الطلب' : kind === 'receipt' ? 'إيصال المدفوعات المسجلة' : 'تحديث حالة الطلب';
  const message = ['بيت الحلوى', heading + ' #' + order.id, 'العميل: ' + order.customer];
  if (kind === 'invoice') {
    message.push(...lines.map(i => i.name + ' × ' + i.qty + ' | سعر الوحدة: ' + omr(i.price) + ' ر.ع | الإجمالي: ' + omr(i.total) + ' ر.ع'));
    message.push('قيمة الأصناف: ' + omr(subtotal) + ' ر.ع', 'الخصم: ' + omr(order.discount) + ' ر.ع', 'رسوم التوصيل: ' + omr(order.deliveryFee) + ' ر.ع');
  }
  if (kind === 'update') message.push('حالة الطلب: ' + order.status);
  message.push('إجمالي الطلب: ' + omr(total) + ' ر.ع', 'المدفوع حتى الآن: ' + omr(order.paid) + ' ر.ع', 'المتبقي: ' + omr(balance) + ' ر.ع');
  if (kind === 'receipt') message.push('طريقة الدفع: ' + order.paymentMethod, 'هذا إيصال بإجمالي المدفوعات المسجلة للطلب، وليس إثبات دفعة جديدة.');
  message.push('موعد التسليم: ' + order.date + ' الساعة ' + order.time, 'طريقة الاستلام: ' + order.deliveryType);
  if (order.deliveryType === 'توصيل' && order.address) message.push('العنوان: ' + order.address);
  message.push('شكرًا لاختياركم بيت الحلوى.');
  return message.join('\n');
}
function WhatsAppShare({ order, products }: { order: Order; products: Product[] }) {
  const [kind, setKind] = useState<ShareKind>('invoice');
  const [phone, setPhone] = useState(order.phone);
  const [message, setMessage] = useState(() => customerMessage(order, products, 'invoice'));
  const [notice, setNotice] = useState('');
  const number = normalizeWhatsAppPhone(phone);
  const receiptBlocked = kind === 'receipt' && order.paid <= 0;
  const enabled = Boolean(number && message.trim() && !receiptBlocked);
  return <div className="form">
    <Field label="نوع الرسالة"><select value={kind} onChange={e => {
      const next = e.target.value as ShareKind;
      setKind(next); setMessage(customerMessage(order, products, next)); setNotice('');
    }}><option value="invoice">فاتورة</option><option value="receipt">إيصال دفع</option><option value="update">تحديث حالة الطلب</option></select></Field>
    <Field label="رقم واتساب العميل"><input inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} /></Field>
    <p className="finance-note">للرقم العُماني أضف 8 أرقام؛ يُضاف رمز 968 تلقائيًا. للأرقام الأخرى استخدم رمز الدولة. تُشارك الفاتورة كرسالة نصية قابلة للمراجعة والتعديل.</p>
    {!number && <div className="form-error">أدخل رقمًا صحيحًا مع رمز الدولة.</div>}
    {receiptBlocked && <div className="form-error">لا يمكن مشاركة إيصال دفع؛ لا توجد مبالغ مدفوعة مسجلة لهذا الطلب.</div>}
    <Field label="معاينة الرسالة"><textarea value={message} onChange={e => setMessage(e.target.value)} rows={12} style={{ width: '100%', padding: 14, border: '1px solid #e1d6d0', borderRadius: 12, font: 'inherit', lineHeight: 1.9, resize: 'vertical' }} /></Field>
    {enabled ? <a className="primary wide" style={{ textDecoration: 'none' }} href={'https://wa.me/' + number + '?text=' + encodeURIComponent(message)} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={20} />فتح واتساب للإرسال</a> : <button className="primary wide" disabled>فتح واتساب للإرسال</button>}
    <button className="secondary wide" style={{ marginTop: 10 }} disabled={!message.trim() || receiptBlocked} onClick={async () => {
      try { await navigator.clipboard.writeText(message); setNotice('تم نسخ الرسالة.'); }
      catch { setNotice('تعذر النسخ التلقائي؛ حدد نص المعاينة وانسخه يدويًا.'); }
    }}>نسخ الرسالة</button>
    {notice && <p role="status">{notice}</p>}
    <p className="finance-note">راجع الرسالة ثم اضغط إرسال داخل واتساب. فتح واتساب لا يغيّر حالة الطلب أو الدفع.</p>
  </div>;
}
function Modal({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="modal-backdrop">
      <div className={wide ? 'modal modal-wide' : 'modal'}>
        <div className="modal-head"><h3>{title}</h3><button onClick={onClose} aria-label="إغلاق"><X /></button></div>
        {children}
      </div>
    </div>
  );
}

function OrderForm({ products, customers, onSubmit, initial, couriers }: { couriers: string[]; products: Product[]; customers: Customer[]; onSubmit: (order: OrderDraft) => void; initial?: Order }) {
  const [customerChoice, setCustomerChoice] = useState('');
  const [customer, setCustomer] = useState(initial?.customer ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [items, setItems] = useState<OrderItem[]>(initial?.items.map(i => ({ ...i })) ?? [{ productId: products[0]?.id ?? 0, qty: 1 }]);
  const [date, setDate] = useState(initial?.date ?? today);
  const [time, setTime] = useState(initial?.time ?? '18:00');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(initial?.deliveryType ?? 'استلام من المشروع');
  const [deliveryFee, setDeliveryFee] = useState(initial?.deliveryFee ?? 0);
  const [courier, setCourier] = useState(initial?.courier ?? 'بدون توصيل');
  const [courierPay, setCourierPay] = useState(initial?.courierPay ?? 0);
  const [discount, setDiscount] = useState(initial?.discount ?? 0);
  const [paid, setPaid] = useState(initial?.paid ?? 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod ?? 'غير محدد');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  const itemsTotal = items.reduce((sum, item) => {
    const product = products.find(productItem => productItem.id === item.productId);
    return sum + (item.salePrice ?? product?.salePrice ?? 0) * item.qty;
  }, 0);
  const total = Math.max(itemsTotal - discount, 0) + (deliveryType === 'توصيل' ? deliveryFee : 0);
  const balance = Math.max(total - paid, 0);

  const chooseCustomer = (value: string) => {
    setCustomerChoice(value);
    const selected = customers.find(item => String(item.id) === value);
    if (!selected) return;
    setCustomer(selected.name);
    setPhone(selected.phone);
    setAddress(selected.address);
  };

  const updateItem = (index: number, patch: Partial<OrderItem>) => {
    setItems(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch, ...(patch.productId !== undefined ? { name: undefined, salePrice: undefined, cost: undefined } : {}) } : item)));
  };

  const addItem = () => setItems([...items, { productId: products[0]?.id ?? 0, qty: 1 }]);
  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!customer.trim() || !phone.trim() || !items.length || items.some(item => !item.productId || !Number.isInteger(item.qty) || item.qty < 1)) {
      setError('يرجى إدخال بيانات العميل وإضافة صنف واحد على الأقل بكمية صحيحة.');
      return;
    }
    if ([paid, discount, deliveryFee, courierPay].some(v => !Number.isFinite(v) || v < 0) || !date || !time) {
      setError('أدخل مبالغ غير سالبة وتاريخًا ووقتًا صحيحين.');
      return;
    }
    if (paid > total + 0.0001) {
      setError('المبلغ المدفوع لا يمكن أن يكون أكبر من إجمالي الطلب.');
      return;
    }
    if (deliveryType === 'توصيل' && courier === 'بدون توصيل') {
      setError('اختر الموصّل للطلب أو غيّر طريقة الاستلام.');
      return;
    }
    onSubmit({
      customer,
      phone,
      address,
      items,
      date,
      time,
      status: initial?.status ?? 'جديد',
      deliveryType,
      deliveryFee: deliveryType === 'توصيل' ? deliveryFee : 0,
      courier: deliveryType === 'توصيل' ? courier : 'بدون توصيل',
      courierPay: deliveryType === 'توصيل' ? courierPay : 0,
      courierSettled: initial && initial.courier === courier && initial.courierPay === courierPay && initial.deliveryType === deliveryType ? initial.courierSettled : false,
      discount,
      paid,
      paymentMethod: paid > 0 ? paymentMethod : 'غير محدد',
      notes,
    });
  };

  return (
    <form className="form" onSubmit={submit}>
      {error && <div className="form-error">{error}</div>}

      <section className="form-section">
        <div className="form-section-head"><div><span>1</span><strong>بيانات العميل</strong></div><small>يمكن اختيار عميل سابق أو إدخال عميل جديد</small></div>
        <div className="field-grid">
          <Field label="عميل سابق (اختياري)">
            <select value={customerChoice} onChange={event => chooseCustomer(event.target.value)}>
              <option value="">عميل جديد</option>
              {customers.map(item => <option value={item.id} key={item.id}>{item.name} — {item.phone}</option>)}
            </select>
          </Field>
          <Field label="اسم العميل"><input value={customer} onChange={event => setCustomer(event.target.value)} placeholder="مثال: فاطمة" /></Field>
          <Field label="رقم الهاتف"><input value={phone} onChange={event => setPhone(event.target.value)} inputMode="tel" placeholder="9xxxxxxx" /></Field>
          <Field label="العنوان / المنطقة"><input value={address} onChange={event => setAddress(event.target.value)} placeholder="اختياري" /></Field>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-head">
          <div><span>2</span><strong>أصناف الطلب</strong></div>
          <button type="button" className="secondary mini" onClick={addItem}><Plus size={16} />إضافة صنف</button>
        </div>
        <div className="item-builder">
          {items.map((item, index) => {
            const product = products.find(productItem => productItem.id === item.productId);
            const lineTotal = (item.salePrice ?? product?.salePrice ?? 0) * item.qty;
            return (
              <div className="item-row" key={index}>
                <div className="item-number">{index + 1}</div>
                <Field label="الصنف">
                  <select value={item.productId} onChange={event => updateItem(index, { productId: Number(event.target.value) })}>
                    {!products.some(p => p.id === item.productId) && <option value={item.productId}>{item.name ?? 'صنف محذوف'}</option>}
                    {products.map(productItem => <option value={productItem.id} key={productItem.id}>{productItem.name}</option>)}
                  </select>
                </Field>
                <Field label="الكمية"><input type="number" min="1" value={item.qty} onChange={event => updateItem(index, { qty: Number(event.target.value) })} /></Field>
                <div className="line-total"><span>القيمة</span><strong>{omr(lineTotal)} ر.ع</strong></div>
                <button type="button" className="remove-item" onClick={() => removeItem(index)} disabled={items.length === 1} aria-label="حذف الصنف"><X size={17} /></button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-head"><div><span>3</span><strong>التسليم والتوصيل</strong></div></div>
        <div className="field-grid">
          <Field label="تاريخ التسليم"><input type="date" value={date} onChange={event => setDate(event.target.value)} /></Field>
          <Field label="وقت التسليم"><input type="time" value={time} onChange={event => setTime(event.target.value)} /></Field>
          <Field label="طريقة الاستلام"><select value={deliveryType} onChange={event => {
            const value = event.target.value as DeliveryType;
            setDeliveryType(value);
            if (value === 'استلام من المشروع') {
              setCourier('بدون توصيل');
              setDeliveryFee(0);
              setCourierPay(0);
            }
          }}><option>استلام من المشروع</option><option>توصيل</option></select></Field>
          {deliveryType === 'توصيل' && <Field label="رسوم التوصيل على العميل"><input type="number" min="0" step="0.1" value={deliveryFee} onChange={event => setDeliveryFee(Number(event.target.value))} /></Field>}
          {deliveryType === 'توصيل' && <Field label="الموصّل"><select value={courier} onChange={event => setCourier(event.target.value)}><option value="بدون توصيل">اختر الموصّل</option>{couriers.filter(name => name !== 'بدون توصيل').map(name => <option key={name}>{name}</option>)}</select></Field>}
          {deliveryType === 'توصيل' && <Field label="أجر الموصّل"><input type="number" min="0" step="0.1" value={courierPay} onChange={event => setCourierPay(Number(event.target.value))} /></Field>}
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-head"><div><span>4</span><strong>الدفع</strong></div><small>حالة الدفع تُحسب تلقائيًا</small></div>
        <div className="field-grid">
          <Field label="خصم"><input type="number" min="0" step="0.1" value={discount} onChange={event => setDiscount(Number(event.target.value))} /></Field>
          <Field label="المبلغ المدفوع"><input type="number" min="0" step="0.1" value={paid} onChange={event => setPaid(Number(event.target.value))} /></Field>
          <Field label="طريقة الدفع"><select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value as PaymentMethod)}><option>غير محدد</option><option>تحويل بنكي</option><option>نقدي</option><option>بطاقة/رابط</option></select></Field>
          <Field label="ملاحظات"><input value={notes} onChange={event => setNotes(event.target.value)} placeholder="كتابة على الطلب، توقيت التواصل..." /></Field>
        </div>
      </section>

      <div className="order-summary">
        <div><span>قيمة الأصناف</span><strong>{omr(itemsTotal)} ر.ع</strong></div>
        <div><span>الخصم</span><strong>− {omr(discount)} ر.ع</strong></div>
        <div><span>التوصيل</span><strong>{omr(deliveryType === 'توصيل' ? deliveryFee : 0)} ر.ع</strong></div>
        <div className="grand"><span>الإجمالي</span><strong>{omr(total)} ر.ع</strong></div>
        <div className={balance > 0 ? 'balance-summary warn' : 'balance-summary'}><span>المتبقي</span><strong>{omr(balance)} ر.ع</strong></div>
      </div>
      <button className="primary wide" type="submit"><CheckCircle2 size={18} />حفظ الطلب</button>
    </form>
  );
}

function ProductForm({ onSubmit, initial }: { onSubmit: (product: Omit<Product, 'id'>) => void; initial?: Product }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [unit, setUnit] = useState(initial?.unit ?? 'حبة');
  const [salePrice, setSalePrice] = useState(initial?.salePrice ?? 0);
  const [cost, setCost] = useState(initial?.cost ?? 0);
  const [error, setError] = useState('');

  return (
    <form className="form" onSubmit={event => {
      event.preventDefault();
      if (!name.trim() || !unit.trim() || !Number.isFinite(salePrice) || salePrice <= 0 || !Number.isFinite(cost) || cost < 0) {
        setError('أدخل اسم الصنف وسعر بيع أكبر من صفر.');
        return;
      }
      onSubmit({ name, unit, salePrice, cost });
    }}>
      {error && <div className="form-error">{error}</div>}
      <Field label="اسم الصنف"><input value={name} onChange={event => setName(event.target.value)} placeholder="مثال: بوكس براونيز" /></Field>
      <div className="field-grid">
        <Field label="الوحدة"><input value={unit} onChange={event => setUnit(event.target.value)} /></Field>
        <Field label="سعر البيع"><input type="number" min="0" step="0.1" value={salePrice} onChange={event => setSalePrice(Number(event.target.value))} /></Field>
        <Field label="تكلفة الإنتاج"><input type="number" min="0" step="0.1" value={cost} onChange={event => setCost(Number(event.target.value))} /></Field>
      </div>
      <div className="form-summary"><span>هامش الصنف</span><strong>{omr(salePrice - cost)} ر.ع</strong></div>
      <button className="primary wide" type="submit">حفظ الصنف</button>
    </form>
  );
}

function ExpenseForm({ onSubmit }: { onSubmit: (expense: Omit<Expense, 'id'>) => void }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('تشغيل');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');

  return (
    <form className="form" onSubmit={event => {
      event.preventDefault();
      if (!title.trim() || amount <= 0) {
        setError('أدخل وصف المصروف ومبلغًا أكبر من صفر.');
        return;
      }
      onSubmit({ title, category, amount, date });
    }}>
      {error && <div className="form-error">{error}</div>}
      <Field label="وصف المصروف"><input value={title} onChange={event => setTitle(event.target.value)} placeholder="مثال: فاتورة الكهرباء" /></Field>
      <div className="field-grid">
        <Field label="التصنيف"><select value={category} onChange={event => setCategory(event.target.value)}><option>تشغيل</option><option>كهرباء</option><option>إنترنت</option><option>صيانة</option><option>إيجار</option><option>تغليف</option><option>تسويق</option><option>نقل</option><option>أخرى</option></select></Field>
        <Field label="المبلغ"><input type="number" min="0" step="0.001" value={amount} onChange={event => setAmount(Number(event.target.value))} /></Field>
        <Field label="التاريخ"><input type="date" value={date} onChange={event => setDate(event.target.value)} /></Field>
      </div>
      <button className="primary wide" type="submit">حفظ المصروف</button>
    </form>
  );
}

function DeliveryForm({ initial, onSubmit, couriers }: { couriers: string[]; initial: Order; onSubmit: (order: Order) => void }) {
  const [draft, setDraft] = useState({ ...initial });
  const [error, setError] = useState('');
  return <form className="form" onSubmit={e => {
    e.preventDefault();
    if (!draft.address.trim() || !draft.date || !draft.time || draft.courier === 'بدون توصيل' || !Number.isFinite(draft.courierPay) || draft.courierPay < 0) {
      setError('أدخل العنوان والتاريخ والوقت والموصّل وأجرًا صحيحًا غير سالب.');
      return;
    }
    onSubmit({ ...draft, courierSettled: draft.courier === initial.courier && draft.courierPay === initial.courierPay ? initial.courierSettled : false });
  }}>
    {error && <div className="form-error">{error}</div>}
    <Field label="العنوان / المنطقة"><input value={draft.address} onChange={e => setDraft({ ...draft, address: e.target.value })} /></Field>
    <div className="field-grid">
      <Field label="تاريخ التسليم"><input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></Field>
      <Field label="وقت التسليم"><input type="time" value={draft.time} onChange={e => setDraft({ ...draft, time: e.target.value })} /></Field>
      <Field label="الموصّل"><select value={draft.courier} onChange={e => setDraft({ ...draft, courier: e.target.value })}>{couriers.filter(c => c !== 'بدون توصيل').map(c => <option key={c}>{c}</option>)}</select></Field>
      <Field label="أجر الموصّل"><input type="number" min="0" step="0.001" value={draft.courierPay} onChange={e => setDraft({ ...draft, courierPay: Number(e.target.value) })} /></Field>
      <Field label="حالة الطلب"><select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as OrderStatus })}>{statusOptions.map(v => <option key={v}>{v}</option>)}</select></Field>
      <Field label="ملاحظات"><input value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></Field>
    </div>
    <button className="primary wide" type="submit">حفظ التوصيل</button>
  </form>;
}
function RecordActions({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return <div className="finance-actions" style={{ marginTop: 10 }}>
    <button aria-label={'تعديل ' + label} title="تعديل" onClick={onEdit}><PencilSimple size={18} /></button>
    <button aria-label={'حذف ' + label} title="حذف" onClick={onDelete}><Trash size={18} /></button>
  </div>;
}
function CustomerForm({ initial, customers, onSubmit }: { initial: Customer; customers: Customer[]; onSubmit: (customer: Customer) => void }) {
  const [draft, setDraft] = useState({ ...initial });
  const [error, setError] = useState('');
  return <form className="form" onSubmit={e => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.phone.trim()) { setError('أدخل اسم العميل ورقم الهاتف.'); return; }
    if (customers.some(c => c.id !== draft.id && c.phone.trim() === draft.phone.trim())) { setError('رقم الهاتف مسجل لعميل آخر.'); return; }
    onSubmit({ ...draft, name: draft.name.trim(), phone: draft.phone.trim() });
  }}>
    {error && <div className="form-error">{error}</div>}
    <Field label="اسم العميل"><input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></Field>
    <Field label="رقم الهاتف"><input inputMode="tel" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></Field>
    <Field label="العنوان / المنطقة"><input value={draft.address} onChange={e => setDraft({ ...draft, address: e.target.value })} /></Field>
    <button className="primary wide" type="submit">حفظ العميل</button>
  </form>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default App;


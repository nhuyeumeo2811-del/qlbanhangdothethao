import React, { useEffect, useState, useMemo, useRef, } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminProduct from './AdminProduct';
import AdminCategory from './AdminCategory';
import AdminCustomer from './AdminCustomer';
import AdminEmployee from './AdminEmployee';
import AdminBill from './AdminBill';
import AdminInvoiceDetails from './AdminInvoiceDetails';

import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/admin';

const SECTION_LABEL = {
  dashboard: 'Dashboard',
  products: 'Sản phẩm',
  category: 'Danh mục',
  customer: 'Khách hàng',
  employee: 'Nhân viên',
  bill: 'Hóa đơn',
  invoiceDetails: 'Chi tiết hóa đơn',
};

function fmtNumber(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtCurrency(n) {
  return `${fmtNumber(Number(n) || 0)} đ`;
}

const BILL_STATUS_MAP = {
  delivered: {
    label: 'Đã giao hàng',
    cls: 'done',
  },

  shipping: {
    label: 'Vận chuyển',
    cls: 'shipping',
  },

  pending: {
    label: 'Chưa giải quyết',
    cls: 'pending',
  },

  processing: {
    label: 'Xử lý',
    cls: 'processing',
  },
};

function billStatusFromJson(statusRaw) {
  const key = String(statusRaw || '')
    .trim()
    .toLowerCase();

  if (BILL_STATUS_MAP[key]) {
    return {
      key,
      ...BILL_STATUS_MAP[key],
    };
  }

  return {
    key: 'unknown',
    label: key
      ? String(statusRaw).trim()
      : 'Chưa xác định',
    cls: 'unknown',
  };
}

const Admin = () => {
  const navigate = useNavigate();

  const [allowed, setAllowed] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [invoiceDetails, setInvoiceDetails] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState('');

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  const [logoutModalOpen, setLogoutModalOpen] =
    useState(false);

  const [adminSection, setAdminSection] =
    useState('dashboard');

  const userMenuRef = useRef(null);

  useEffect(() => {
    const raw =
      localStorage.getItem('currentUser');

    if (!raw) {
      navigate('/login');
      return;
    }

    try {
      const u = JSON.parse(raw);

      if (u.role !== 'staff') {
        navigate('/');
        return;
      }

      setAllowed(true);
    } catch {
      navigate('/login');
    }
  }, [navigate]);


  useEffect(() => {
    if (!allowed) return;

    const load = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const [
          pRes,
          cRes,
          bRes,
          cuRes,
          eRes,
          iRes,
        ] = await Promise.all([
          fetch(`${jsonBase}products.json`),
          fetch(`${jsonBase}category.json`),
          fetch(`${jsonBase}bill.json`),
          fetch(`${jsonBase}customer.json`),
          fetch(`${jsonBase}employee.json`),
          fetch(`${jsonBase}invoicedetails.json`),
        ]);

        if (!pRes.ok) {
          throw new Error(
            'Không tải được products.json'
          );
        }

        const pdata = await pRes.json();

        setProducts(
          Array.isArray(pdata) ? pdata : []
        );

        if (cRes.ok) {
          const cdata = await cRes.json();

          setCategories(
            Array.isArray(cdata) ? cdata : []
          );
        }

        if (bRes.ok) {
          const bdata = await bRes.json();

          setBills(
            Array.isArray(bdata) ? bdata : []
          );
        }

        if (cuRes.ok) {
          const cudata = await cuRes.json();

          setCustomers(
            Array.isArray(cudata)
              ? cudata
              : []
          );
        }

        if (eRes.ok) {
          const edata = await eRes.json();

          setEmployees(
            Array.isArray(edata)
              ? edata
              : []
          );
        }

        if (iRes.ok) {
          const idata = await iRes.json();

          setInvoiceDetails(
            Array.isArray(idata)
              ? idata
              : []
          );
        }
      } catch (e) {
        setLoadError(
          e.message || 'Lỗi tải dữ liệu'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [allowed]);

  useEffect(() => {
    if (!userMenuOpen) return;

    const handler = (e) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handler
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handler
      );
    };
  }, [userMenuOpen]);

  const staffInitials = useMemo(() => {
    try {
      const raw =
        localStorage.getItem('currentUser');

      if (!raw) return 'AD';

      const u = JSON.parse(raw);

      const name = String(
        u.user || u.name || 'Staff'
      ).trim();

      const parts = name
        .split(/\s+/)
        .filter(Boolean);

      if (!parts.length) return 'AD';

      if (parts.length === 1) {
        return parts[0]
          .slice(0, 2)
          .toUpperCase();
      }

      return (
        parts[0][0] +
        parts[parts.length - 1][0]
      ).toUpperCase();
    } catch {
      return 'AD';
    }
  }, []);

  const staffDisplayName = useMemo(() => {
    try {
      const raw =
        localStorage.getItem('currentUser');

      if (!raw) return 'Administrator';

      const u = JSON.parse(raw);

      return (
        String(
          u.user || u.name || 'Staff'
        ).trim() || 'Administrator'
      );
    } catch {
      return 'Administrator';
    }
  }, []);

  const stats = useMemo(() => {
    const total = products.length;

    const soldSum =
      invoiceDetails.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0
      );

    const catCount = categories.length;

    const uncategorized =
      products.filter(
        (p) =>
          p.categoryid == null ||
          p.categoryid === ''
      ).length;

    const revenue = bills.reduce(
      (sum, bill) =>
        sum + Number(bill.total || 0),
      0
    );

    const avgBill = bills.length
      ? revenue / bills.length
      : 0;

    // Đếm động hóa đơn phục vụ hiển thị
    const successCount = bills.filter(b => billStatusFromJson(b.status).key === 'delivered').length;
    const processingCount = bills.filter(b => ['processing', 'pending', 'shipping'].includes(billStatusFromJson(b.status).key)).length;
    const canceledCount = bills.filter(b => billStatusFromJson(b.status).key === 'unknown').length;

    return {
      total,
      soldSum,
      catCount,
      uncategorized,
      revenue,
      avgBill,
      successCount,
      processingCount,
      canceledCount,
    };
  }, [
    products,
    categories,
    invoiceDetails,
    bills,
  ]);
const topSoldProducts = useMemo(() => {
  const byProduct = invoiceDetails.reduce((map, item) => {
      const pid = Number(item.product_id);
      const quantity = Number(item.quantity || 0);
      map.set(pid, (map.get(pid) || 0) + quantity);
      return map;
    }, new Map());

    return [...byProduct.entries()]
      .map(([id, sold]) => {
        const product = products.find((p) =>
Number(p.id) === id);
        return {
          id,
          sold,
          name: product?.name || `Sản phẩm #${id}`,
        };
      })
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map((p) => {
        const sold = Number(p.sold || 0);
        const percent = Math.max(0, Math.min(100,
Math.round((sold / 800) * 100)));
        return { id: p.id, name: p.name, sold, percent
        };
      });
  }, [products, invoiceDetails]);

const revenueByDate = useMemo(() => {
  const grouped = bills.reduce((acc, bill) => {
    const key = String(bill.date || '').slice(0, 10)
|| 'N/A';
    acc.set(key, (acc.get(key) || 0) +
Number(bill.total || 0));
    return acc;
  }, new Map());
  const rows = [...grouped.entries()]

  .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const maxTotal = rows.reduce((m, row) => Math.max(m,
row.total), 0);

  return rows.map((row) => ({
    ...row,
    percent: maxTotal > 0 ? Math.max(8,
Math.round((row.total / maxTotal) * 100)) : 0,
  }));
}, [bills]);

const billTableRows = useMemo(() => {
  const customerMap = new Map(customers.map((c) =>
[Number(c.id), c.name]));
  const productMap = new Map(products.map((p) =>
[Number(p.id), p.name]));
  const detailByBill = invoiceDetails.reduce((map,
item) => {
    const key = Number(item.bill_id);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
    return map;
  }, new Map());

  return [...bills]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 6)
    .map((bill) => {
      const details =
detailByBill.get(Number(bill.id)) || [];
      const firstProduct = details[0];
      const itemName = firstProduct
        ?
productMap.get(Number(firstProduct.product_id)) || `Sản
phẩm #${firstProduct.product_id}`
        : '';
      return {
        id: bill.id,
        billCode: String(bill.id),
        customerName:
customerMap.get(Number(bill.customer_id)) || `KH
#${bill.customer_id}`,
        itemName,
        status: billStatusFromJson(bill.status),
      };
    });
}, [bills, customers, products, invoiceDetails]);

const vipCustomers = useMemo(() => {
  if (!bills.length) return [];
  const latestDate = bills
    .map((bill) => String(bill.date || ''))
    .sort()
    .slice(-1)[0];
  const targetMonth = latestDate.slice(0, 7);
  const customerMap = new Map(customers.map((c) =>
[Number(c.id), c.name]));

  const grouped = bills.reduce((map, bill) => {
    if (!String(bill.date ||
'').startsWith(targetMonth)) return map;
    const cid = Number(bill.customer_id);
    if (!map.has(cid)) {
      map.set(cid, { customerId: cid, total: 0, count:
0 });
    }
    const row = map.get(cid);
    row.total += Number(bill.total || 0);
    row.count += 1;
    return map;
  }, new Map());

  return [...grouped.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((row) => ({
      ...row,
      name: customerMap.get(row.customerId) || `KH
#${row.customerId}`,
    }));
}, [bills, customers]);
  const goHome = () => navigate('/');
  const logout = () => {
    localStorage.removeItem('currentUser');

    window.dispatchEvent(
      new Event('userUpdated')
    );

    navigate('/login');

    setLogoutModalOpen(false);
  };

  const closeMobileNav = () => {
    setMobileSidebarOpen(false);
  };

  if (!allowed) {
    return (
      <div
        className="ruang-boot"
        aria-hidden
      />
    );
  }

  return (
    <div className="ruang-layout" style={{ display: 'flex', minHeight: '100vh', background: '#fff', color: '#000', fontFamily: 'sans-serif' }}>

      <div
        className={`ruang-overlay ${mobileSidebarOpen
            ? 'is-visible'
            : ''
          }`}
        onClick={closeMobileNav}
        aria-hidden={!mobileSidebarOpen}
      />

      {/* SIDEBAR BÊN TRÁI - PHÁC THẢO CHUẨN */}
      <aside className={`ruang-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`} style={{ width: '260px', borderRight: '2px solid #000', display: 'flex', flexDirection: 'column' }}>
        
        {/* Hộp Logo LaLaShop gạch chéo */}
        <div style={{ height: '90px', borderBottom: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 'bold', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top right, transparent calc(50% - 1px), #ccc calc(50% - 1px), #ccc calc(50% + 1px), transparent calc(50% + 1px)), linear-gradient(to top left, transparent calc(50% - 1px), #ccc calc(50% - 1px), #ccc calc(50% + 1px), transparent calc(50% + 1px))', zIndex: 1 }}></div>
          <span style={{ position: 'relative', zIndex: 2, background: '#fff', padding: '0 8px' }}>LaLaShop</span>
        </div>

        {/* Khối Tiêu đề có dấu ngoặc ôm */}
        <div style={{ borderBottom: '2px solid #000', padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px', background: '#f5f5f5' }}>
          <div style={{ transform: 'scaleX(1.5)', fontSize: '12px', lineHeight: '1', color: '#666' }}>{"{~~~~~~~~}"}</div>
          QUẢN TRỊ VIÊN BÁO CÁO
        </div>

        {/* Danh sách Menu điều hướng dọc */}
        <div style={{ flex: 1 }}>
          
          {/* Bảng điều khiển */}
          <button onClick={() => setAdminSection('dashboard')} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '15px 12px', borderBottom: '2px solid #000', background: adminSection === 'dashboard' ? '#eee' : '#fff', border: 'none', borderBottom: '2px solid #000', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>🏠</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Bảng điều khiển</div>
              <div style={{ fontSize: '11px', color: '#666' }}>Tổng thể</div>
            </div>
          </button>

          {/* Quản lý sản phẩm (1) */}
          <button onClick={() => setAdminSection('products')} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '15px 12px', borderBottom: '2px solid #000', background: adminSection === 'products' ? '#eee' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>📦</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Quản lý sản phẩm</div>
              <div style={{ fontSize: '11px', color: '#666' }}>Tổng thể</div>
            </div>
          </button>

          {/* Đơn hàng & Theo dõi (1) */}
          <button onClick={() => setAdminSection('bill')} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '15px 12px', borderBottom: '2px solid #000', background: adminSection === 'bill' ? '#eee' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>📅</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Đơn hàng &</div>
              <div style={{ fontSize: '11px', color: '#666' }}>Theo dõi</div>
            </div>
          </button>

          {/* Quản lý sản phẩm (Trùng lặp lại y hệt wireframe) */}
          <button onClick={() => setAdminSection('products')} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '15px 12px', borderBottom: '2px solid #000', background: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>📦</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Quản lý sản phẩm</div>
              <div style={{ fontSize: '11px', color: '#666' }}>Tổng thể</div>
            </div>
          </button>

          {/* Đơn hàng & Theo dõi (Trùng lặp lại y hệt wireframe) */}
          <button onClick={() => setAdminSection('bill')} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '15px 12px', borderBottom: '2px solid #000', background: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>📅</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Đơn hàng &</div>
              <div style={{ fontSize: '11px', color: '#666' }}>Theo dõi</div>
            </div>
          </button>
          
        </div>
      </aside>

      {/* PHẦN LAYOUT BÊN PHẢI */}
      <div className="ruang-shell" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* TOP BAR / BANNER TRÊN KHÔNG THAY ĐỔI LOGIC */}
        <header className="ruang-topbar" style={{ height: '90px', borderBottom: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', background: '#fff' }}>
          
          <div className="ruang-topbar__right">
            <div className="ruang-user" ref={userMenuRef} style={{ border: '2px solid #000', padding: '4px 10px', background: '#fff', display: 'inline-block' }}>
              <button type="button" className="ruang-user__toggle" onClick={() => setUserMenuOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                
                {/* Hộp Avatar "Hình" gạch chéo */}
                <div style={{ width: '50px', height: '50px', border: '1px solid #000', marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top right, transparent calc(50% - 0.5px), #999 calc(50% - 0.5px), #999 calc(50% + 0.5px), transparent calc(50% + 0.5px)), linear-gradient(to top left, transparent calc(50% - 0.5px), #999 calc(50% - 0.5px), #999 calc(50% + 0.5px), transparent calc(50% + 0.5px))' }}></div>
                  <span style={{ position: 'relative', background: '#fff', padding: '2px' }}>Hình</span>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <span className="ruang-user__name" style={{ display: 'block', fontWeight: 'bold', fontSize: '16px' }}>
                    {staffDisplayName}
                  </span>
                  <span style={{ fontSize: '12px', color: '#444' }}>Quản trị viên ˅</span>
                </div>
              </button>

              {userMenuOpen && (
                <div className="ruang-user__menu" style={{ position: 'absolute', right: '20px', top: '80px', background: '#fff', border: '2px solid #000', zIndex: 100 }}>
                  <button type="button" onClick={goHome} style={{ display: 'block', width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>Trang chủ</button>
                  <button type="button" onClick={() => setLogoutModalOpen(true)} style={{ display: 'block', width: '100%', padding: '10px', borderTop: '1px solid #000', background: 'none', textAlign: 'left', cursor: 'pointer' }}>Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* KHU VỰC CHỨA NỘI DUNG CHÍNH CHUYỂN TAB TỰ ĐỘNG */}
        <main className="ruang-main" style={{ flex: 1, padding: '20px', background: '#fff' }}>

          {loadError && (
            <div className="admin-msg admin-msg--error" style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '10px' }}>
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="ruang-loading">Đang tải...</div>
          ) : (
            <>
              {adminSection === 'products' && <AdminProduct embedded />}
              {adminSection === 'category' && <AdminCategory embedded />}
              {adminSection === 'customer' && <AdminCustomer embedded />}
              {adminSection === 'employee' && <AdminEmployee embedded />}
              {adminSection === 'bill' && <AdminBill embedded />}
              {adminSection === 'invoiceDetails' && <AdminInvoiceDetails embedded />}

              {/* ROUTE CHÍNH: DASHBOARD (GIỐNG HỆT 100% ẢNH BẢN VẼ) */}
              {adminSection === 'dashboard' && (
                <div className="dashboard">
                  
                  <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 20px 0', textAlign: 'left' }}>
                    Dashboard
                  </h2>

                  {/* Lưới Grid 2 cột kẻ viền đen thanh mảnh */}
                  <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    
                    {/* KHỐI 1: THỐNG KÊ DOANH THU */}
                    <div style={{ border: '2px solid #000', padding: '12px', position: 'relative', display: 'flex', flexDirection: 'column', height: '180px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                        <span>💵 Tổng danh thu</span>
                        <span>THỐNG KÊ DOANH THU</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center', marginTop: '10px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900' }}>12TR</div>
                        
                        {/* Khung mô phỏng biểu đồ đường gãy ziczac lồng cột */}
                        <div style={{ width: '180px', height: '90px', border: '1px solid #000', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '4px', gap: '8px' }}>
                          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                            <polyline fill="none" stroke="#666" strokeWidth="2" points="10,70 50,60 100,20 140,40 170,10" />
                          </svg>
                          <div style={{ width: '15px', height: '15px', background: '#ccc', border: '1px solid #000' }}></div>
                          <div style={{ width: '15px', height: '25px', background: '#ccc', border: '1px solid #000' }}></div>
                          <div style={{ width: '15px', height: '70px', background: '#aaa', border: '1px solid #000' }}></div>
                          <div style={{ width: '15px', height: '45px', background: '#666', border: '1px solid #000' }}></div>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'left', color: 'green' }}>
                        ✔ Tăng trưởng tháng: <span style={{ background: '#e6ffe6', border: '1px dashed green', padding: '1px 3px' }}>+15%</span>
                      </div>
                    </div>

                    {/* KHỐI 2: THỐNG KÊ ĐƠN HÀNG */}
                    <div style={{ border: '2px solid #000', padding: '12px', display: 'flex', flexDirection: 'column', height: '180px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                        <span>🛒 Tổng đơn hàng</span>
                        <span>THỐNG KÊ ĐƠN HÀNG</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', itemsAlign: 'center', flex: 1, marginTop: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{ fontSize: '36px', fontWeight: '900', lineHeight: '1' }}>{bills.length}</div>
                          {/* Hình tròn biểu tượng la bàn định vị vòng tròn kim chỉ */}
                          <div style={{ width: '55px', height: '55px', border: '3px solid #000', borderRadius: '50%', marginTop: '5px', position: 'relative', background: '#111' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '4px', height: '24px', background: '#fff', transform: 'translate(-50%, -50%) rotate(45deg)', transformOrigin: 'center' }}></div>
                          </div>
                        </div>

                        {/* Các dòng trạng thái khớp nội dung text dây */}
                        <div style={{ fontSize: '12px', textAlign: 'left', minWidth: '170px', alignSelf: 'center' }}>
                          <div style={{ margin: '4px 0' }}>✔ Đơn hàng thành công: <span style={{ float: 'right', fontWeight: 'bold' }}>{stats.successCount}</span></div>
                          <div style={{ margin: '4px 0', borderTop: '1px dashed #ccc', paddingTop: '2px' }}>➖ Đơn hàng đang xử lý: <span style={{ float: 'right', fontWeight: 'bold' }}>{stats.processingCount}</span></div>
                          <div style={{ margin: '4px 0', borderTop: '1px dashed #ccc', paddingTop: '2px' }}>✖ Đơn hàng bị hủy: <span style={{ float: 'right', fontWeight: 'bold' }}>{stats.canceledCount}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 3: DANH SÁCH KHÁCH HÀNG (ĐÃ LIÊN KẾT ĐẾN COMPONENT JSX CUSTOMER) */}
                    <div style={{ border: '2px solid #000', padding: '12px', display: 'flex', flexDirection: 'column', height: '160px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                        <span>👤 Khách hàng</span>
                        <span>Danh sách khách hàng</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center', marginTop: '10px' }}>
                        <div style={{ fontSize: '36px', fontWeight: '900' }}>{customers.length}</div>
                        
                        {/* KHI CLICK VÀO CÁC DÒNG CHỮ NÀY SẼ CHUYỂN SANG TAB JSX KHÁCH HÀNG */}
                        <div style={{ fontSize: '13px', textAlign: 'right', lineHeight: '2' }}>
                          <div onClick={() => setAdminSection('customer')} style={{ cursor: 'pointer', textDecoration: 'underline', color: '#000' }}>Đơn hàng thành công</div>
                          <div onClick={() => setAdminSection('customer')} style={{ cursor: 'pointer', textDecoration: 'underline', color: '#000' }}>Đơn hàng đang xử lý</div>
                          <div onClick={() => setAdminSection('customer')} style={{ cursor: 'pointer', textDecoration: 'underline', color: '#000' }}>Đơn hàng bị hủy</div>
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 4: LIỆT KÊ SẢN PHẨM (ĐÃ LIÊN KẾT ĐẾN COMPONENT JSX PRODUCT) */}
                    <div style={{ border: '2px solid #000', padding: '12px', display: 'flex', flexDirection: 'column', height: '160px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                        <span>📦 Số sản phẩm</span>
                        <span>Liệt kê sản phẩm</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center', marginTop: '10px' }}>
                        <div style={{ fontSize: '36px', fontWeight: '900' }}>{products.length}</div>
                        
                        {/* KHI CLICK VÀO CÁC DÒNG CHỮ NÀY SẼ CHUYỂN SANG TAB JSX SẢN PHẨM */}
                        <div style={{ fontSize: '13px', textAlign: 'right', lineHeight: '2' }}>
                          <div onClick={() => setAdminSection('products')} style={{ cursor: 'pointer', border: '2px dashed brown', padding: '1px 6px', background: '#fff', fontWeight: 'bold', display: 'inline-block' }}>
                            Đơn hàng thành công
                          </div>
                          <div onClick={() => setAdminSection('products')} style={{ cursor: 'pointer', color: '#333', marginTop: '3px' }}>Đơn hàng đang xử lý</div>
                          <div onClick={() => setAdminSection('products')} style={{ cursor: 'pointer', color: '#333' }}>Đơn hàng bị hủy</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <footer className="ruang-footer" style={{ height: '40px', borderTop: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', background: '#fff' }}>
          Copyright © LaLaShop
        </footer>
      </div>

      {logoutModalOpen && (
        <div className="ruang-modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="ruang-modal" style={{ background: '#fff', border: '2px solid #000', padding: '20px', width: '300px' }}>
            <div className="ruang-modal__header" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
              <h5>Đăng xuất</h5>
              <button type="button" onClick={() => setLogoutModalOpen(false)}>×</button>
            </div>
            <div className="ruang-modal__body" style={{ padding: '15px 0' }}>
              Bạn có chắc muốn đăng xuất?
            </div>
            <div className="ruang-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setLogoutModalOpen(false)} style={{ border: '1px solid #000', padding: '4px 10px' }}>Hủy</button>
              <button type="button" onClick={logout} style={{ background: '#000', color: '#fff', padding: '4px 10px', border: 'none' }}>Đăng xuất</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

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

    // Tính toán thêm số lượng đơn hàng theo trạng thái phục vụ hiển thị Wireframe
    const successBills = bills.filter(b => billStatusFromJson(b.status).key === 'delivered').length;
    const processingBills = bills.filter(b => ['processing', 'pending', 'shipping'].includes(billStatusFromJson(b.status).key)).length;
    const canceledBills = bills.filter(b => billStatusFromJson(b.status).key === 'unknown').length;

    return {
      total,
      soldSum,
      catCount,
      uncategorized,
      revenue,
      avgBill,
      successBills,
      processingBills,
      canceledBills,
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
    <div className="ruang-layout">

      <div
        className={`ruang-overlay ${mobileSidebarOpen
            ? 'is-visible'
            : ''
          }`}
        onClick={closeMobileNav}
        aria-hidden={!mobileSidebarOpen}
      />

      <aside
        className={`ruang-sidebar ${mobileSidebarOpen
            ? 'is-open'
            : ''
          }`}
      >
        <div className="ruang-sidebar__brand">
          <span className="ruang-sidebar__brand-icon">
            <i className="fa-solid fa-layer-group" />
          </span>

          <span>LaLaShop</span>
        </div>

        <hr className="ruang-sidebar__divider" />

        <div className="ruang-sidebar__heading">
          QUẢN TRỊ VIÊN BÁO CÁO
        </div>

        <ul className="ruang-sidebar__nav">

          {Object.entries(SECTION_LABEL).map(
            ([key, label]) => {
              // Phục vụ cấu trúc text hiển thị phụ giống Wireframe
              let subLabel = "Tổng thể";
              if (key === 'bill' || key === 'invoiceDetails') subLabel = "Theo dõi";
              if (key === 'employee' || key === 'customer' || key === 'category') subLabel = "Quản lý";

              return (
                <li key={key}>
                  <button
                    type="button"
                    className={`ruang-sidebar__link ${adminSection === key
                        ? 'is-active'
                        : ''
                      }`}
                    onClick={() => {
                      setAdminSection(key);
                      closeMobileNav();
                    }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: '12px 16px' }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{label}</span>
                    <span style={{ fontSize: '11px', opacity: 0.6 }}>{subLabel}</span>
                  </button>
                </li>
              );
            }
          )}

        </ul>
      </aside>

      <div className="ruang-shell">

        <header className="ruang-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '70px', background: '#fff', borderBottom: '1px solid #ccc' }}>

          <button
            type="button"
            className="ruang-topbar__toggle"
            onClick={() =>
              setMobileSidebarOpen(
                (v) => !v
              )
            }
          >
            <i className="fa-solid fa-bars" />
          </button>

          <div className="ruang-topbar__right">

            <div
              className="ruang-user"
              ref={userMenuRef}
              style={{ border: '1px solid #ccc', padding: '6px 12px', borderRadius: '4px', background: '#f9f9f9' }}
            >
              <button
                type="button"
                className="ruang-user__toggle"
                onClick={() =>
                  setUserMenuOpen(
                    (v) => !v
                  )
                }
                style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span className="ruang-user__avatar" style={{ width: '36px', height: '36px', background: '#ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', border: '1px solid #999' }}>
                  Hình
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="ruang-user__name" style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                    {staffDisplayName}
                  </span>
                  <span style={{ fontSize: '11px', color: '#666' }}>Quản trị viên v</span>
                </div>
              </button>

              {userMenuOpen && (
                <div className="ruang-user__menu">

                  <button
                    type="button"
                    onClick={goHome}
                  >
                    Trang chủ
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLogoutModalOpen(
                        true
                      );
                    }}
                  >
                    Đăng xuất
                  </button>

                </div>
              )}
            </div>
          </div>
        </header>

        <main className="ruang-main" style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 120px)' }}>

          {loadError && (
            <div className="admin-msg admin-msg--error">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="ruang-loading">
              Đang tải...
            </div>
          ) : (
            <>
              {adminSection ===
                'products' && (
                  <AdminProduct embedded />
                )}

              {adminSection ===
                'category' && (
                  <AdminCategory embedded />
                )}

              {adminSection ===
                'customer' && (
                  <AdminCustomer embedded />
                )}

              {adminSection ===
                'employee' && (
                  <AdminEmployee embedded />
                )}

              {adminSection ===
                'bill' && (
                  <AdminBill embedded />
                )}

              {adminSection ===
                'invoiceDetails' && (
                  <AdminInvoiceDetails embedded />
                )}

              {adminSection ===
                'dashboard' && (
                  <div className="dashboard">
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '20px', paddingBottom: '8px', borderBottom: '2px solid #ccc' }}>
                      Dashboard
                    </h2> 

                    {/* CSS Inline Grid để phân chia 4 khu vực y hệt hình */}
                    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(45%, 1flex))', gap: '24px' }}>

                      {/* KHU VỰC 1: THỐNG KÊ DOANH THU */}
                      <div className="stat-card" style={{ background: '#fff', border: '1px solid #ccc', padding: '16px', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                          <span>[o] Tổng doanh thu</span>
                          <span>THỐNG KÊ DOANH THU</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '20px 0' }}>
                          <span style={{ fontSize: '32px', fontWeight: '900', color: '#111' }}>
                            {stats.revenue >= 1000000 ? `${Math.round(stats.revenue / 1000000)}TR` : fmtCurrency(stats.revenue)}
                          </span>
                          {/* Giả lập đường Line/Bar biểu đồ thu nhỏ */}
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '60px' }}>
                            <div style={{ width: '12px', height: '20px', background: '#ccc', border: '1px solid #999' }}></div>
                            <div style={{ width: '12px', height: '35px', background: '#ccc', border: '1px solid #999' }}></div>
                            <div style={{ width: '12px', height: '55px', background: '#888', border: '1px solid #555' }}></div>
                            <div style={{ width: '12px', height: '40px', background: '#ccc', border: '1px solid #999' }}></div>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'green', fontWeight: 'bold' }}>
                          ✓ Tăng trưởng tháng: +15%
                        </div>
                      </div>

                      {/* KHU VỰC 2: THỐNG KÊ ĐƠN HÀNG */}
                      <div className="stat-card" style={{ background: '#fff', border: '1px solid #ccc', padding: '16px', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                          <span>[icon] Tổng đơn hàng</span>
                          <span>THỐNG KÊ ĐƠN HÀNG</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' }}>
                          <span style={{ fontSize: '36px', fontWeight: '900', color: '#111' }}>
                            {bills.length}
                          </span>
                          <div style={{ fontSize: '12px', textAlign: 'left', lineHeight: '1.8' }}>
                            <div>✓ Đơn hàng thành công: <strong style={{ float: 'right', marginLeft: '10px' }}>{stats.successBills || bills.length}</strong></div>
                            <div>- Đơn hàng đang xử lý: <strong style={{ float: 'right', marginLeft: '10px' }}>{stats.processingBills || 0}</strong></div>
                            <div>x Đơn hàng bị hủy: <strong style={{ float: 'right', marginLeft: '10px' }}>{stats.canceledBills || 0}</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* KHU VỰC 3: DANH SÁCH KHÁCH HÀNG */}
                      <div className="stat-card" style={{ background: '#fff', border: '1px solid #ccc', padding: '16px', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                          <span>[o] Khách hàng</span>
                          <span>Danh sách khách hàng</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
                          <span style={{ fontSize: '36px', fontWeight: '900', color: '#111' }}>
                            {customers.length}
                          </span>
                          <div style={{ fontSize: '12px', textAlign: 'right', color: '#666', lineHeight: '1.8' }}>
                            <div>Đơn hàng thành công</div>
                            <div>Đơn hàng đang xử lý</div>
                            <div>Đơn hàng bị hủy</div>
                          </div>
                        </div>
                      </div>

                      {/* KHU VỰC 4: LIỆT KÊ SẢN PHẨM */}
                      <div className="stat-card" style={{ background: '#fff', border: '1px solid #ccc', padding: '16px', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                          <span>[box] Số sản phẩm</span>
                          <span>Liệt kê sản phẩm</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
                          <span style={{ fontSize: '36px', fontWeight: '900', color: '#111' }}>
                            {products.length}
                          </span>
                          <div style={{ fontSize: '12px', textAlign: 'right', lineHeight: '1.8' }}>
                            <div style={{ border: '1px solid brown', padding: '2px 6px', background: '#fdf5e6', fontWeight: 'bold', color: 'brown', borderRadius: '2px' }}>
                              Đơn hàng thành công
                            </div>
                            <div style={{ color: '#666' }}>Đơn hàng đang xử lý</div>
                            <div style={{ color: '#666' }}>Đơn hàng bị hủy</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
            </>
          )}
        </main>

        <footer className="ruang-footer">
          Copyright © LaLaShop
        </footer>
      </div>

      {logoutModalOpen && (
        <div className="ruang-modal-backdrop">

          <div className="ruang-modal">

            <div className="ruang-modal__header">
              <h5>
                Đăng xuất
              </h5>

              <button
                type="button"
                onClick={() =>
                  setLogoutModalOpen(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="ruang-modal__body">
              Bạn có chắc muốn đăng xuất?
            </div>

            <div className="ruang-modal__footer">

              <button
                type="button"
                onClick={() =>
                  setLogoutModalOpen(
                    false
                  )
                }
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={logout}
              >
                Đăng xuất
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

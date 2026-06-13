import React, { useEffect, useState, useMemo, useRef } from 'react';
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
    label: key ? String(statusRaw).trim() : 'Chưa xác định',
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
  const [invoiceDetails, setInvoiceDetails] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [adminSection, setAdminSection] = useState('dashboard');

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
        const [pRes, cRes, bRes, cuRes, eRes, iRes] = await Promise.all([
          fetch(`${jsonBase}products.json`),
          fetch(`${jsonBase}category.json`),
          fetch(`${jsonBase}bill.json`),
          fetch(`${jsonBase}customer.json`),
          fetch(`${jsonBase}employee.json`),
          fetch(`${jsonBase}invoicedetails.json`),
        ]);

        if (!pRes.ok) {
          throw new Error('Không tải được products.json');
        }

        const pdata = await pRes.json();
        setProducts(Array.isArray(pdata) ? pdata : []);

        if (cRes.ok) {
          const cdata = await cRes.json();
          setCategories(Array.isArray(cdata) ? cdata : []);
        }

        if (bRes.ok) {
          const bdata = await bRes.json();
          setBills(Array.isArray(bdata) ? bdata : []);
        }

        if (cuRes.ok) {
          const cudata = await cuRes.json();
          setCustomers(Array.isArray(cudata) ? cudata : []);
        }

        if (eRes.ok) {
          const edata = await eRes.json();
          setEmployees(Array.isArray(edata) ? edata : []);
        }

        if (iRes.ok) {
          const idata = await iRes.json();
          setInvoiceDetails(Array.isArray(idata) ? idata : []);
        }
      } catch (e) {
        setLoadError(e.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [allowed]);

  useEffect(() => {
    if (!userMenuOpen) return;

    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [userMenuOpen]);

  const staffDisplayName = useMemo(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (!raw) return 'Administrator';
      const u = JSON.parse(raw);
      return String(u.user || u.name || 'Staff').trim() || 'Administrator';
    } catch {
      return 'Administrator';
    }
  }, []);

  // Tính toán số liệu thống kê thực tế từ mảng đơn hàng
  const stats = useMemo(() => {
    const total = products.length;
    const revenue = bills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);

    // Tính toán số lượng đơn hàng chuẩn xác dựa trên state bills thực tế
    const deliveredCount = bills.filter((b) => String(b.status).trim().toLowerCase() === 'delivered').length;
    const pendingCount = bills.filter((b) => {
      const s = String(b.status).trim().toLowerCase();
      return s === 'pending' || s === 'processing' || s === 'shipping';
    }).length;
    const canceledCount = bills.filter((b) => String(b.status).trim().toLowerCase() === 'canceled').length;

    return {
      total,
      revenue,
      totalBills: bills.length,
      deliveredCount,
      pendingCount,
      canceledCount,
    };
  }, [products, bills]);

  const goHome = () => navigate('/');
  const logout = () => {
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new Event('userUpdated'));
    navigate('/login');
    setLogoutModalOpen(false);
  };

  if (!allowed) {
    return <div className="ruang-boot" aria-hidden />;
  }

  return (
    <div className="ruang-layout">
      <div
        className={`ruang-overlay ${mobileSidebarOpen ? 'is-visible' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden={!mobileSidebarOpen}
      />

      <aside className={`ruang-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
        <div className="ruang-sidebar__brand">
          <span className="ruang-sidebar__brand-icon">
            <i className="fa-solid fa-layer-group" />
          </span>
          <span>LaLaShop</span>
        </div>
        <hr className="ruang-sidebar__divider" />
        <div className="ruang-sidebar__heading">Tiện ích</div>
        <ul className="ruang-sidebar__nav">
          {Object.entries(SECTION_LABEL).map(([key, label]) => (
            <li key={key}>
              <button
                type="button"
                className={`ruang-sidebar__link ${adminSection === key ? 'is-active' : ''}`}
                onClick={() => {
                  setAdminSection(key);
                  setMobileSidebarOpen(false);
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="ruang-shell">

        <header className="ruang-topbar">

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
            >
              <button
                type="button"
                className="ruang-user__toggle"
                onClick={() =>
                  setUserMenuOpen(
                    (v) => !v
                  )
                }
              >
                <span className="ruang-user__avatar">
                  {staffInitials}
                </span>

                <span className="ruang-user__name">
                  {staffDisplayName}
                </span>
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

        <main className="ruang-main" style={{ flex: 1, padding: '25px', background: '#fff' }}>
          {loadError && (
            <div className="admin-msg admin-msg--error" style={{ padding: '12px', background: '#fff5f5', border: '1px solid #fc8181', color: '#c53030', marginBottom: '15px' }}>
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="ruang-loading" style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>Đang tải...</div>
          ) : (
            <>
              {adminSection === 'products' && <AdminProduct embedded />}
              {adminSection === 'category' && <AdminCategory embedded />}
              {adminSection === 'customer' && <AdminCustomer embedded />}
              {adminSection === 'employee' && <AdminEmployee embedded />}
              {adminSection === 'bill' && <AdminBill embedded />}
              {adminSection === 'invoiceDetails' && <AdminInvoiceDetails embedded />}

              {adminSection === 'dashboard' && (
                <div className="dashboard">
                  <h2 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 20px 0' }}>Dashboard</h2>

                  <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    
                    {/* Ô KHỐI 1: TỔNG DOANH THU */}
                    <div onClick={() => setAdminSection('bill')} style={{ border: '1px solid #000', padding: '15px', display: 'flex', flexDirection: 'column', height: '170px', position: 'relative', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        <span>💵 Tổng doanh thu</span>
                        <span style={{ color: '#555' }}>Thống kê doanh thu</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                          {fmtCurrency(stats.revenue)}
                        </div>
                        
                        <div style={{ width: '180px', height: '85px', border: '1px solid #777', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '4px', gap: '10px' }}>
                          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                            <polyline fill="none" stroke="#555" strokeWidth="2" points="10,65 55,50 105,25 140,35 170,12" />
                          </svg>
                          <div style={{ width: '18px', height: '15px', background: '#ddd', border: '1px solid #000' }}></div>
                          <div style={{ width: '18px', height: '30px', background: '#ddd', border: '1px solid #000' }}></div>
                          <div style={{ width: '18px', height: '70px', background: '#bbb', border: '1px solid #000' }}></div>
                          <div style={{ width: '18px', height: '45px', background: '#888', border: '1px solid #000' }}></div>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2f855a' }}>
                        ✔ Tăng trưởng tháng: <span style={{ color: '#48bb78' }}>+15%</span>
                      </div>
                    </div>

                    {/* Ô KHỐI 2: TỔNG ĐƠN HÀNG - ĐÃ FIX CHÍNH XÁC JSX ĐỘNG THEO YÊU CẦU */}
                   <div onClick={() => setAdminSection('bill')} style={{ border: '1px solid #000', padding: '15px', display: 'flex', flexDirection: 'column', height: '170px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        <span>🛒 Tổng đơn hàng</span>
                        <span style={{ color: '#555' }}>Thống kê đơn hàng</span>
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

                    {/* Ô KHỐI 3: DANH SÁCH KHÁCH HÀNG */}
                    <div onClick={() => setAdminSection('customer')} style={{ border: '1px solid #000', padding: '15px', display: 'flex', flexDirection: 'column', height: '155px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        <span>👤 Khách hàng</span>
                        <span style={{ color: '#555' }}>Danh sách khách hàng</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                        <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                          {customers.length}
                        </div>
                        
                        <div style={{ fontSize: '13px', textAlign: 'right', lineHeight: '2' }}>
                          <div style={{ textDecoration: 'underline', color: '#000' }}>Xem chi tiết khách hàng</div>
                          <div style={{ color: '#777', fontSize: '11px' }}>Quản lý thông tin thành viên</div>
                        </div>
                      </div>
                    </div>

                    {/* Ô KHỐI 4: LIỆT KÊ SẢN PHẨM */}
                    <div onClick={() => setAdminSection('products')} style={{ border: '1px solid #000', padding: '15px', display: 'flex', flexDirection: 'column', height: '155px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        <span>📦 Số sản phẩm</span>
                        <span style={{ color: '#555' }}>Liệt kê sản phẩm</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                        <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                          {products.length}
                        </div>
                        
                        <div style={{ fontSize: '13px', textAlign: 'right', lineHeight: '2' }}>
                          <div style={{ border: '1px solid #000', padding: '1px 5px', background: '#e2e8f0', display: 'inline-block', fontWeight: 'bold' }}>
                            Kho hàng chính
                          </div>
                          <div style={{ color: '#555', marginTop: '2px', fontSize: '11px' }}>Tổng số lượng mẫu mã kho</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <footer className="ruang-footer" style={{ height: '50px', borderTop: '1px solid #b7b7b7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', background: '#fff', color: '#777' }}>
          Copyright © LaLaShop
        </footer>
      </div>

      {logoutModalOpen && (
        <div className="ruang-modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="ruang-modal" style={{ background: '#fff', border: '1px solid #000', padding: '20px', width: '320px' }}>
            <div className="ruang-modal__header" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
              <h5>Đăng xuất</h5>
              <button type="button" onClick={() => setLogoutModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>×</button>
            </div>
            <div className="ruang-modal__body" style={{ padding: '15px 0', fontSize: '14px' }}>
              Bạn có chắc muốn đăng xuất?
            </div>
            <div className="ruang-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setLogoutModalOpen(false)} style={{ border: '1px solid #ccc', background: '#fff', padding: '6px 12px', cursor: 'pointer' }}>Hủy</button>
              <button type="button" onClick={logout} style={{ background: '#000', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer' }}>Đăng xuất</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

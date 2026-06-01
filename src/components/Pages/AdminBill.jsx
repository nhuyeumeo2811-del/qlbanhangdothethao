import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/';

const STATUS_OPTIONS = [
  { value: 'delivered', label: 'Đã giao hàng' },
  { value: 'shipping', label: 'Vận chuyển' },
  { value: 'pending', label: 'Chưa giải quyết' },
  { value: 'processing', label: 'Xử lý' },
];

const emptyForm = () => ({
  id: '',
  customer_id: '',
  employee_id: '',
  date: '',
  total: '',
  status: 'delivered',
});

function rowToForm(b) {
  const d = String(b.date || '').slice(0, 10);
  return {
    id: String(b.id),
    customer_id: b.customer_id !== null ? String(b.customer_id) : '',
    employee_id: b.employee_id !== null ? String(b.employee_id) : '',
    date: d,
    total: b.total !== null ? String(b.total) : '',
    status: String(b.status || 'delivered').toLowerCase(),
  };
}

function formToRow(form, nextId) {
  return {
    id: form.id ? Number(form.id) : nextId,
    customer_id: Number(form.customer_id),
    employee_id: Number(form.employee_id),
    date: form.date.trim(),
    total: Number(form.total),
    status: String(form.status || 'delivered').trim().toLowerCase(),
  };
}

function validateRow(built) {
  if (!Number.isFinite(built.customer_id)) return 'customer_id phải là số';
  if (!Number.isFinite(built.employee_id)) return 'employee_id phải là số';
  if (!Number.isFinite(built.total)) return 'total phải là số';
  if (!built.date) return 'Vui lòng chọn ngày';
  return null;
}

function AdminBill({ embedded = false }) {
  const navigate = useNavigate();

  const [allowed, setAllowed] = useState(embedded);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');
  const [form, setForm] = useState(emptyForm);
  const [isNew, setIsNew] = useState(false);
  const [searchIdInput, setSearchIdInput] = useState('');
  const [appliedSearchId, setAppliedSearchId] = useState('');

  const displayedRows = useMemo(() => {
    const q = appliedSearchId.trim();
    if (!q) return rows;
    return rows.filter((r) => String(r.id) === q);
  }, [rows, appliedSearchId]);

  const persist = useCallback(async (nextList) => {
    setSaving(true);
    setSaveError('');
    try {
      await axios.put('/api/bill', nextList, {
        headers: { 'Content-Type': 'application/json' },
      });
      setRows(nextList);
      setView('list');
      setForm(emptyForm());
      setIsNew(false);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK' || err.response?.status === 404
          ? 'Chỉ lưu được khi chạy npm run dev hoặc npm run preview (API Vite).'
          : null) ||
        'Không lưu được dữ liệu.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (embedded) {
      setAllowed(true);
      return;
    }
    const raw = localStorage.getItem('currentUser');
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
  }, [navigate, embedded]);

  useEffect(() => {
    if (!allowed) return;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = await fetch(`${jsonBase}bill.json`);
        if (!res.ok) throw new Error('Không tải được bill.json');
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setLoadError(e.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [allowed]);

  const goHome = () => navigate('/');
  const logout = () => {
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new Event('userUpdated'));
    navigate('/login');
  };

  const openCreate = () => {
    setIsNew(true);
    setForm(emptyForm());
    setView('form');
    setSaveError('');
  };

  const openEdit = (b) => {
    setIsNew(false);
    setForm(rowToForm(b));
    setView('form');
    setSaveError('');
  };

  const cancelForm = () => {
    setView('list');
    setForm(emptyForm());
    setIsNew(false);
    setSaveError('');
  };

  const handleFormChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    const nextId = rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;
    const built = formToRow(form, nextId);
    const invalid = validateRow(built);
    if (invalid) {
      setSaveError(invalid);
      return;
    }

    let nextList;
    if (isNew) {
      nextList = [...rows, built];
    } else {
      const idx = rows.findIndex((r) => String(r.id) === String(form.id));
      if (idx === -1) {
        setSaveError('Không tìm thấy bản ghi để cập nhật');
        return;
      }
      nextList = rows.map((r) => (String(r.id) === String(form.id) ? built : r));
    }
    persist(nextList);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Xóa hóa đơn này?')) return;
    persist(rows.filter((r) => String(r.id) !== String(id)));
  };

  const applyIdSearch = () => setAppliedSearchId(searchIdInput.trim());
  const clearIdSearch = () => {
    setSearchIdInput('');
    setAppliedSearchId('');
  };

  const statusLabel = (v) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;

  const bodyContent = (
    <>
      {loadError && <div className="admin-msg admin-msg--error">{loadError}</div>}
      {saveError && <div className="admin-msg admin-msg--error">{saveError}</div>}
      <div className="admin-row">
        {loading ? (
          <p>Đang tải...</p>
        ) : view === 'list' ? (
          <>
            <div className="admin-toolbar admin-toolbar--row">
              <button type="button" className="admin-btn" onClick={openCreate} disabled={saving}>
                + Thêm hóa đơn
              </button>
              <div className="admin-toolbar-search">
                <label htmlFor="admin-bill-search-id">Tìm kiếm: </label>
                <input
                  id="admin-bill-search-id"
                  type="text"
                  inputMode="numeric"
                  value={searchIdInput}
                  onChange={(e) => setSearchIdInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyIdSearch();
                    }
                  }}
                />
                <button type="button" className="admin-btn" onClick={applyIdSearch} disabled={saving}>
                  Tìm
                </button>
                {appliedSearchId.trim() !== '' && (
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={clearIdSearch} disabled={saving}>
                    Hiện tất cả
                  </button>
                )}
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>KH</th>
                    <th>NV</th>
                    <th>Ngày</th>
                    <th>Tổng</th>
                    <th>Trạng thái</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="admin-table_empty">
                        {appliedSearchId.trim()
                          ? `Không có hóa đơn với ID "${appliedSearchId.trim()}".`
                          : 'Chưa có hóa đơn.'}
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.customer_id}</td>
                        <td>{r.employee_id}</td>
                        <td>{r.date}</td>
                        <td>{r.total}</td>
                        <td>{statusLabel(String(r.status || '').toLowerCase())}</td>
                        <td>
                          <div className="admin-table_actions">
                            <button
                              type="button"
                              className="admin-table_link"
                              onClick={() => openEdit(r)}
                              disabled={saving}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="admin-table_link"
                              onClick={() => handleDelete(r.id)}
                              disabled={saving}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (

        <form onSubmit={handleSubmitForm}>
            <button type="submit" disabled={saving}>Lưu</button>
            <button type="button" onClick={cancelForm} disabled={saving}>Hủy</button>
          </form>
        )}
      </div>
    </>
  );

  return allowed ? <div className="admin-bill-container">{bodyContent}</div> : null;
}

export default AdminBill;
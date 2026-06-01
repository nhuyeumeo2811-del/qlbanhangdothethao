import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/';

const emptyForm = () => ({
  id: '',
  name: '',
  imageKey: 'sp1',
  sizeS: 'S',
  sizeM: 'M',
  sizeL: 'L',
  currentPrice: '',
  originalPrice: '',
  discount: '',
  rating: '',
  sold: '',
  categoryid: '',
});

function productToForm(p) {
  return {
    id: String(p.id),
    name: p.name ?? '',
    imageKey: p.imageKey ?? '',
    sizeS: p.sizeS ?? 'S',
    sizeM: p.sizeM ?? 'M',
    sizeL: p.sizeL ?? 'L',
    currentPrice: p.currentPrice !== null ? String(p.currentPrice) : '',
    originalPrice: p.originalPrice !== null ? String(p.originalPrice) : '',
    discount: p.discount !== null ? String(p.discount) : '',
    rating: p.rating !== null ? String(p.rating) : '',
    sold: p.sold !== null ? String(p.sold) : '',
    categoryid: p.categoryid !== null ? String(p.categoryid) : '',
  };
}

function formToProduct(form, nextId) {
  const id = form.id ? Number(form.id) : nextId;
  return {
    id,
    name: form.name.trim(),
    imageKey: form.imageKey.trim() || 'sp1',
    sizeS: form.sizeS.trim() || 'S',
    sizeM: form.sizeM.trim() || 'M',
    sizeL: form.sizeL.trim() || 'L',
    currentPrice: Number(form.currentPrice) || 0,
    originalPrice: Number(form.originalPrice) || 0,
    discount: form.discount.trim(),
    rating: Number(form.rating) || 0,
    sold: Number(form.sold) || 0,
    categoryid: Number(form.categoryid) || 0,
  };
}

function validateProduct(built) {
  if (!built.name) return 'Vui lòng nhập tên sản phẩm';
  if (!Number.isFinite(built.currentPrice)) return 'Giá hiện tại phải là số';
  if (!Number.isFinite(built.originalPrice)) return 'Giá gốc phải là số';
  if (!Number.isFinite(built.categoryid)) return 'Mã danh mục phải là số';
  return null;
}

function AdminProduct({ embedded = false }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(embedded);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');
  const [form, setForm] = useState(emptyForm());
  const [isNew, setIsNew] = useState(false);
  const [searchIdInput, setSearchIdInput] = useState('');
  const [appliedSearchId, setAppliedSearchId] = useState('');

  const displayedProducts = useMemo(() => {
    const q = appliedSearchId.trim();
    if (!q) return products;
    return products.filter((p) => String(p.id) === q);
  }, [products, appliedSearchId]);

  const persist = useCallback(async (nextList) => {
    setSaving(true);
    setSaveError('');
    try {
      await axios.put('/api/product', nextList, {
        headers: { 'Content-Type': 'application/json' },
      });
      setProducts(nextList);
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
        const res = await fetch(`${jsonBase}products.json`);
        if (!res.ok) throw new Error('Không tải được products.json');
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
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

  const openEdit = (p) => {
    setIsNew(false);
    setForm(productToForm(p));
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
    const nextId = products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
    const built = formToProduct(form, nextId);
    const invalid = validateProduct(built);
    if (invalid) {
      setSaveError(invalid);
      return;
    }

    let nextList;
    if (isNew) {
      nextList = [...products, built];
    } else {
      const idx = products.findIndex((p) => String(p.id) === String(form.id));
      if (idx === -1) {
        setSaveError('Không tìm thấy sản phẩm để cập nhật');
        return;
      }
      nextList = products.map((p) => (String(p.id) === String(form.id) ? built : p));
    }
    persist(nextList);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    persist(products.filter((p) => String(p.id) !== String(id)));
  };

  const applyIdSearch = () => setAppliedSearchId(searchIdInput.trim());
  const clearIdSearch = () => {
    setSearchIdInput('');
    setAppliedSearchId('');
  };

  const bodyContent = (
    <div className="admin-row">
      {loadError && <div className="admin-msg admin-msg--error">{loadError}</div>}
      {saveError && <div className="admin-msg admin-msg--error">{saveError}</div>}
      {loading ? (
        <p>Đang tải...</p>
      ) : view === 'list' ? (
        <>
          <div className="admin-toolbar admin-toolbar--row">
            <button type="button" className="admin-btn" onClick={openCreate} disabled={saving}>
              + Thêm sản phẩm
            </button>
            <div className="admin-toolbar-search">
              <label htmlFor="admin-product-search-id">Tìm kiếm: </label>
              <input
                id="admin-product-search-id"
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
                  <th>Tên</th>
                  <th>Ảnh (key)</th>
                  <th>Giá gốc</th>
                  <th>Giá hiện tại</th>
                  <th>Danh mục</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {displayedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-table_empty">
                      {appliedSearchId.trim()
                        ? `Không có sản phẩm với ID "${appliedSearchId.trim()}".`
                        : 'Chưa có sản phẩm.'}
                    </td>
                  </tr>
                ) : (
                  displayedProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.imageKey}</td>
                      <td>{p.originalPrice}</td>
                      <td>{p.currentPrice}</td>
                      <td>{p.categoryid}</td>
                      <td>
                        <div className="admin-table_actions">
                          <button
                            type="button"
                            className="admin-table_link"
                            onClick={() => openEdit(p)}
                            disabled={saving}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="admin-table_link admin-table_link--danger"
                            onClick={() => handleDelete(p.id)}
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
        <form className="admin-form-card" onSubmit={handleSubmitForm}>
          <h2>{isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h2>
          <div className="admin-form-grid">
            {!isNew && (
              <label>
                ID
                <input value={form.id} readOnly />
              </label>
            )}
            <label className="admin-form-grid_full">
              Tên sản phẩm
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </label>
            <label>
              Mã ảnh (imageKey)
              <input
                type="text"
                value={form.imageKey}
                onChange={(e) => handleFormChange('imageKey', e.target.value)}
              />
            </label>
            <label>
              Mã danh mục (categoryid)
              <input
                type="number"
                value={form.categoryid}
                onChange={(e) => handleFormChange('categoryid', e.target.value)}
                required
              />
            </label>
            <label>
              Giá gốc
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => handleFormChange('originalPrice', e.target.value)}
                required
              />
            </label>
            <label>
              Giá hiện tại
              <input
                type="number"
                value={form.currentPrice}
                onChange={(e) => handleFormChange('currentPrice', e.target.value)}
                required
              />
            </label>
            <label>
              Giảm giá (Ví dụ: -20%)
              <input
                type="text"
                value={form.discount}
                onChange={(e) => handleFormChange('discount', e.target.value)}
              />
            </label>
            <label>
              Đánh giá (Rating)
              <input
                type="number"
                step="0.1"
                value={form.rating}
                onChange={(e) => handleFormChange('rating', e.target.value)}
              />
            </label>
            <label>
              Đã bán (Sold)
              <input
                type="number"
                value={form.sold}
                onChange={(e) => handleFormChange('sold', e.target.value)}
              />
            </label>
            <label>
              Size S
              <input
                type="text"
                value={form.sizeS}
                onChange={(e) => handleFormChange('sizeS', e.target.value)}
              />
            </label>
            <label>
              Size M
              <input
                type="text"
                value={form.sizeM}
                onChange={(e) => handleFormChange('sizeM', e.target.value)}
              />
            </label>
            <label>
              Size L
              <input
                type="text"
                value={form.sizeL}
                onChange={(e) => handleFormChange('sizeL', e.target.value)}
              />
            </label>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={cancelForm} disabled={saving}>
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );

  return allowed ? <div className="admin-product-container">{bodyContent}</div> : null;
}

export default AdminProduct;
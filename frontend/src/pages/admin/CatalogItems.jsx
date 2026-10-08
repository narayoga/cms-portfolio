import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Modal from '../../components/admin/Modal.jsx';
import ImageUpload from '../../components/admin/ImageUpload.jsx';

const blank = {
  subcategory_id: '', parent_id: '', type: 'product',
  name: '', slug: '', description: '', image_path: '', brand_logo: '',
  sort_order: 0, is_active: 1,
  advantages: [], features: [],
};

export default function CatalogItems() {
  const [rows, setRows] = useState([]);
  const [subs, setSubs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    const [items, subcats] = await Promise.all([
      api.get('/admin/subsubcategories'),
      api.get('/admin/subcategories'),
    ]);
    setRows(items); setSubs(subcats);
  };
  useEffect(() => { reload(); }, []);

  const openNew = () => {
    setForm({ ...blank, subcategory_id: subs[0]?.id || '' });
    setOpen(true);
  };
  const openEdit = async (id) => {
    const full = await api.get(`/admin/subsubcategories/${id}`);
    setForm({
      ...blank,
      ...full,
      parent_id: full.parent_id || '',
      advantages: (full.advantages || []).map(a => a.label),
      features: (full.features || []).map(f => ({
        title: f.title,
        images: Array.isArray(f.images) && f.images.length ? f.images : (f.image_path ? [f.image_path] : []),
        description: f.description || '',
      })),
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        parent_id: form.parent_id || null,
        advantages: form.type === 'product' ? form.advantages : [],
        features: form.type === 'product' ? form.features : [],
      };
      if (form.id) await api.put(`/admin/subsubcategories/${form.id}`, payload);
      else await api.post('/admin/subsubcategories', payload);
      setOpen(false);
      reload();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this item? Its child items, advantages and technical features will also be deleted.')) return;
    await api.del(`/admin/subsubcategories/${id}`);
    reload();
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value }));

  // advantages helpers
  const setAdv = (i, v) => setForm(f => ({ ...f, advantages: f.advantages.map((a, idx) => idx === i ? v : a) }));
  const addAdv = () => setForm(f => ({ ...f, advantages: [...f.advantages, ''] }));
  const rmAdv = (i) => setForm(f => ({ ...f, advantages: f.advantages.filter((_, idx) => idx !== i) }));

  // features helpers
  const setFeat = (i, k, v) => setForm(f => ({ ...f, features: f.features.map((ft, idx) => idx === i ? { ...ft, [k]: v } : ft) }));
  const addFeat = () => setForm(f => ({ ...f, features: [...f.features, { title: '', images: [], description: '' }] }));
  const rmFeat = (i) => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));

  // feature-image helpers (multiple images = carousel on the site)
  const setFeatImg = (i, j, v) => setForm(f => ({ ...f, features: f.features.map((ft, idx) => idx === i ? { ...ft, images: ft.images.map((im, k) => k === j ? v : im) } : ft) }));
  const addFeatImg = (i) => setForm(f => ({ ...f, features: f.features.map((ft, idx) => idx === i ? { ...ft, images: [...(ft.images || []), ''] } : ft) }));
  const rmFeatImg = (i, j) => setForm(f => ({ ...f, features: f.features.map((ft, idx) => idx === i ? { ...ft, images: ft.images.filter((_, k) => k !== j) } : ft) }));
  const moveFeatImg = (i, j, dir) => setForm(f => ({ ...f, features: f.features.map((ft, idx) => {
    if (idx !== i) return ft;
    const arr = [...ft.images]; const k = j + dir;
    if (k < 0 || k >= arr.length) return ft;
    [arr[j], arr[k]] = [arr[k], arr[j]];
    return { ...ft, images: arr };
  }) }));

  // group nodes within the selected subcategory (possible parents)
  const parentOptions = rows.filter(r =>
    String(r.subcategory_id) === String(form.subcategory_id) && r.type === 'group' && r.id !== form.id
  );

  return (
    <>
      <div className="admin-page-header">
        <h2>Catalog Items</h2>
        <button className="btn btn-primary" onClick={openNew}>+ New Item</button>
      </div>
      <p className="text-muted text-small" style={{ marginTop: '-8px' }}>
        A <strong>product</strong> renders the product page (Overview / Technical Features / Download).
        A <strong>group</strong> renders a listing of its child products.
      </p>
      <table className="admin-table">
        <thead><tr><th>Sub-category</th><th>Name</th><th>Type</th><th>Parent</th><th>Order</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.subcategory_name}</td>
              <td>{r.parent_id ? <span style={{ color: 'var(--color-text-muted)' }}>↳ </span> : null}{r.name}</td>
              <td><span className={`badge ${r.type === 'group' ? 'badge-group' : 'badge-product'}`}>{r.type}</span></td>
              <td>{r.parent_name || '—'}</td>
              <td>{r.sort_order}</td>
              <td>{r.is_active ? 'Active' : 'Hidden'}</td>
              <td>
                <div className="row-actions">
                  <button onClick={() => openEdit(r.id)}>Edit</button>
                  <button className="danger" onClick={() => del(r.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={7} className="empty">No catalog items yet.</td></tr>}
        </tbody>
      </table>

      <Modal open={open} title={form.id ? 'Edit Catalog Item' : 'New Catalog Item'} onClose={() => setOpen(false)}>
        <form className="admin-form" onSubmit={save}>
          <div className="form-row">
            <label>
              <span>Sub-category *</span>
              <select required value={form.subcategory_id} onChange={(e) => setForm(f => ({ ...f, subcategory_id: e.target.value, parent_id: '' }))}>
                <option value="">— select —</option>
                {subs.map(s => <option key={s.id} value={s.id}>{s.category_name} › {s.name}</option>)}
              </select>
            </label>
            <label>
              <span>Type *</span>
              <select value={form.type} onChange={set('type')}>
                <option value="product">Product (product page)</option>
                <option value="group">Group (listing of products)</option>
              </select>
            </label>
          </div>

          <label>
            <span>Parent group (optional)</span>
            <select value={form.parent_id} onChange={set('parent_id')}>
              <option value="">— none (top level) —</option>
              {parentOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>

          <div className="form-row">
            <label><span>Name *</span><input required value={form.name} onChange={set('name')} /></label>
            <label><span>Slug (auto if blank)</span><input value={form.slug || ''} onChange={set('slug')} /></label>
          </div>

          <label><span>Description</span><textarea value={form.description || ''} onChange={set('description')} /></label>

          <div className="form-row">
            <ImageUpload value={form.image_path} onChange={(v) => setForm(f => ({ ...f, image_path: v }))} label="Hero / tile image" folder="catalog/items" />
            {form.type === 'product' && (
              <ImageUpload value={form.brand_logo} onChange={(v) => setForm(f => ({ ...f, brand_logo: v }))} label="Brand logo (header)" folder="brands" />
            )}
          </div>

          {form.type === 'product' && (
            <>
              {/* Unique Selling Points */}
              <div className="repeater">
                <div className="repeater-head"><span>Unique Selling Points</span><button type="button" className="btn btn-outline" onClick={addAdv}>+ Add</button></div>
                {form.advantages.map((a, i) => (
                  <div className="repeater-row" key={i}>
                    <input value={a} onChange={(e) => setAdv(i, e.target.value)} placeholder={`Advantage ${i + 1}`} />
                    <button type="button" className="btn btn-outline danger" onClick={() => rmAdv(i)}>✕</button>
                  </div>
                ))}
                {!form.advantages.length && <p className="text-muted text-small">No advantages yet.</p>}
              </div>

              {/* Technical Features */}
              <div className="repeater">
                <div className="repeater-head"><span>Technical Features</span><button type="button" className="btn btn-outline" onClick={addFeat}>+ Add</button></div>
                {form.features.map((ft, i) => (
                  <div className="feature-card" key={i}>
                    <div className="feature-card-head">
                      <strong>Feature {i + 1}</strong>
                      <button type="button" className="btn btn-outline danger" onClick={() => rmFeat(i)}>Remove</button>
                    </div>
                    <label><span>Title</span><input value={ft.title} onChange={(e) => setFeat(i, 'title', e.target.value)} placeholder="e.g. WILKA Lockcase 1490.55 Technical Features" /></label>
                    <div className="feature-imgs">
                      <div className="repeater-head">
                        <span>Images (add 2+ for a carousel)</span>
                        <button type="button" className="btn btn-outline" onClick={() => addFeatImg(i)}>+ Add image</button>
                      </div>
                      {(ft.images || []).map((im, j) => (
                        <div className="feature-img-row" key={j}>
                          <ImageUpload value={im} onChange={(v) => setFeatImg(i, j, v)} label={`Image ${j + 1}`} folder="catalog/features" />
                          <div className="feature-img-actions">
                            <button type="button" className="btn btn-outline" onClick={() => moveFeatImg(i, j, -1)} disabled={j === 0}>↑</button>
                            <button type="button" className="btn btn-outline" onClick={() => moveFeatImg(i, j, 1)} disabled={j === (ft.images.length - 1)}>↓</button>
                            <button type="button" className="btn btn-outline danger" onClick={() => rmFeatImg(i, j)}>✕</button>
                          </div>
                        </div>
                      ))}
                      {!(ft.images || []).length && <p className="text-muted text-small">No images yet.</p>}
                    </div>
                    <label><span>Specs (one bullet per line)</span><textarea rows={5} value={ft.description} onChange={(e) => setFeat(i, 'description', e.target.value)} placeholder={'Material: Stainless Steel SUS 304\nBackset: 55 mm'} /></label>
                  </div>
                ))}
                {!form.features.length && <p className="text-muted text-small">No technical features yet.</p>}
              </div>
            </>
          )}

          <div className="form-row">
            <label><span>Sort order</span><input type="number" value={form.sort_order} onChange={set('sort_order')} /></label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!form.is_active} onChange={set('is_active')} />
              <span>Active</span>
            </label>
          </div>

          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

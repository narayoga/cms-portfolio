import { useEffect, useState } from 'react';
import { api, mediaUrl } from '../../api/client';
import Modal from '../../components/admin/Modal.jsx';
import ImageUpload from '../../components/admin/ImageUpload.jsx';
import RichTextEditor from '../../components/admin/RichTextEditor.jsx';

const blank = {
  subcategory_id: '', name: '', slug: '',
  short_desc: '', content_html: '', cover_image: '',
  sort_order: 0, is_active: 1, images: [],
};

export default function Products() {
  const [rows, setRows] = useState([]);
  const [subs, setSubs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    const [p, s] = await Promise.all([api.get('/admin/products'), api.get('/admin/subcategories')]);
    setRows(p); setSubs(s);
  };
  useEffect(() => { reload(); }, []);

  const openNew = () => { setForm({ ...blank, subcategory_id: subs[0]?.id || '' }); setOpen(true); };
  const openEdit = async (r) => {
    const full = await api.get(`/admin/products/${r.id}`);
    setForm({
      ...full,
      images: (full.images || []).map(i => i.image_path),
    });
    setOpen(true);
  };
  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.id) await api.put(`/admin/products/${form.id}`, form);
      else await api.post('/admin/products', form);
      setOpen(false);
      reload();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };
  const del = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.del(`/admin/products/${id}`);
    reload();
  };
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value }));

  const addGalleryImg = (path) => {
    if (path) setForm(f => ({ ...f, images: [...(f.images || []), path] }));
  };
  const removeGalleryImg = (i) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  return (
    <>
      <div className="admin-page-header">
        <h2>Products</h2>
        <button className="btn btn-primary" onClick={openNew}>+ New Product</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>Name</th><th>Category</th><th>Sub-category</th><th>Order</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.category_name}</td>
              <td>{r.subcategory_name}</td>
              <td>{r.sort_order}</td>
              <td>{r.is_active ? 'Active' : 'Hidden'}</td>
              <td>
                <div className="row-actions">
                  <button onClick={() => openEdit(r)}>Edit</button>
                  <button className="danger" onClick={() => del(r.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={6} className="empty">No products yet.</td></tr>}
        </tbody>
      </table>

      <Modal open={open} title={form.id ? 'Edit Product' : 'New Product'} onClose={() => setOpen(false)}>
        <form className="admin-form" onSubmit={save}>
          <label>
            <span>Sub-category *</span>
            <select required value={form.subcategory_id} onChange={set('subcategory_id')}>
              <option value="">— select —</option>
              {subs.map(s => <option key={s.id} value={s.id}>{s.category_name} → {s.name}</option>)}
            </select>
          </label>
          <div className="form-row">
            <label><span>Name *</span><input required value={form.name} onChange={set('name')} /></label>
            <label><span>Slug (auto if blank)</span><input value={form.slug || ''} onChange={set('slug')} /></label>
          </div>
          <label><span>Short description</span><textarea value={form.short_desc || ''} onChange={set('short_desc')} /></label>
          <ImageUpload value={form.cover_image} onChange={(v) => setForm(f => ({ ...f, cover_image: v }))} label="Cover image" />

          <div>
            <span style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Gallery images</span>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 'var(--sp-2)' }}>
              {(form.images || []).map((img, i) => (
                <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <img src={mediaUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeGalleryImg(i)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,.6)', color: '#fff', borderRadius: 12, width: 20, height: 20, fontSize: 12 }}>×</button>
                </div>
              ))}
            </div>
            <ImageUpload value="" onChange={addGalleryImg} label="" />
          </div>

          <RichTextEditor value={form.content_html} onChange={(v) => setForm(f => ({ ...f, content_html: v }))} label="Description (rich content)" />

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

import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Modal from './Modal.jsx';
import ImageUpload from './ImageUpload.jsx';
import RichTextEditor from './RichTextEditor.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const blank = {
  title: '', category: '', location: '', products: '', owner: '', architect: '', contractor: '',
  slug: '', cover_image: '', content_html: '', published_at: today(), is_active: 1,
};

/**
 * Reusable CRUD page for Project / Publication (same schema).
 * Pass `endpoint` (e.g. '/admin/projects') and `label`.
 * `showCategory` adds a category/tag field; `projectFields` adds the project
 * detail spec fields (location, products, owner, architect, contractor).
 */
export default function ArticleResource({ endpoint, label, showCategory = false, projectFields = false }) {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);

  const reload = () => api.get(endpoint).then(setRows);
  useEffect(() => { reload(); }, [endpoint]);

  const openNew = () => { setForm({ ...blank, published_at: today() }); setOpen(true); };
  const openEdit = (r) => { setForm({ ...r }); setOpen(true); };
  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.id) await api.put(`${endpoint}/${form.id}`, form);
      else await api.post(endpoint, form);
      setOpen(false);
      reload();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };
  const del = async (id) => {
    if (!confirm(`Delete this ${label.toLowerCase()}?`)) return;
    await api.del(`${endpoint}/${id}`);
    reload();
  };
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value }));

  return (
    <>
      <div className="admin-page-header">
        <h2>{label}s</h2>
        <button className="btn btn-primary" onClick={openNew}>+ New {label}</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>Title</th><th>Date</th><th>Slug</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.title}</td>
              <td>{r.published_at}</td>
              <td>{r.slug}</td>
              <td>{r.is_active ? 'Active' : 'Hidden'}</td>
              <td>
                <div className="row-actions">
                  <button onClick={() => openEdit(r)}>Edit</button>
                  <button className="danger" onClick={() => del(r.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={5} className="empty">No {label.toLowerCase()}s yet.</td></tr>}
        </tbody>
      </table>

      <Modal open={open} title={form.id ? `Edit ${label}` : `New ${label}`} onClose={() => setOpen(false)}>
        <form className="admin-form" onSubmit={save}>
          <div className="form-row">
            <label><span>Title *</span><input required value={form.title} onChange={set('title')} /></label>
            <label><span>Slug (auto if blank)</span><input value={form.slug || ''} onChange={set('slug')} /></label>
          </div>
          {showCategory && (
            <label><span>Category / Tag</span><input value={form.category || ''} onChange={set('category')} placeholder="e.g. Governmental Building" /></label>
          )}
          {projectFields && (
            <>
              <div className="form-row">
                <label><span>Location</span><input value={form.location || ''} onChange={set('location')} placeholder="e.g. Nusantara, Indonesia" /></label>
                <label><span>Products</span><input value={form.products || ''} onChange={set('products')} placeholder="e.g. WILKA" /></label>
              </div>
              <label><span>Owner</span><input value={form.owner || ''} onChange={set('owner')} /></label>
              <div className="form-row">
                <label><span>Architect Consultant</span><input value={form.architect || ''} onChange={set('architect')} /></label>
                <label><span>Main Contractor</span><input value={form.contractor || ''} onChange={set('contractor')} /></label>
              </div>
            </>
          )}
          <div className="form-row">
            <label><span>Published date</span><input type="date" value={form.published_at || ''} onChange={set('published_at')} /></label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'end', height: 42 }}>
              <input type="checkbox" checked={!!form.is_active} onChange={set('is_active')} />
              <span>Active</span>
            </label>
          </div>
          <ImageUpload value={form.cover_image} onChange={(v) => setForm(f => ({ ...f, cover_image: v }))} label="Cover image" />
          <RichTextEditor value={form.content_html} onChange={(v) => setForm(f => ({ ...f, content_html: v }))} label="Content" />
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

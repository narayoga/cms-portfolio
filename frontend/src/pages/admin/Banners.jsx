import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Modal from '../../components/admin/Modal.jsx';
import ImageUpload from '../../components/admin/ImageUpload.jsx';

const blank = { image_path: '', title: '', subtitle: '', link: '', sort_order: 0, is_active: 1 };

export default function Banners() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);

  const reload = () => api.get('/admin/banners').then(setRows);
  useEffect(() => { reload(); }, []);

  const openNew = () => { setForm(blank); setOpen(true); };
  const openEdit = (r) => { setForm({ ...r }); setOpen(true); };
  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.id) await api.put(`/admin/banners/${form.id}`, form);
      else await api.post('/admin/banners', form);
      setOpen(false);
      reload();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };
  const del = async (id) => {
    if (!confirm('Delete this banner?')) return;
    await api.del(`/admin/banners/${id}`);
    reload();
  };
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value }));

  return (
    <>
      <div className="admin-page-header">
        <h2>Homepage Banners</h2>
        <button className="btn btn-primary" onClick={openNew}>+ New Banner</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>Title</th><th>Link</th><th>Order</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.title || '(no title)'}</td>
              <td style={{ fontSize: '.85rem', color: 'var(--color-text-muted)' }}>{r.link || '—'}</td>
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
          {!rows.length && <tr><td colSpan={5} className="empty">No banners yet.</td></tr>}
        </tbody>
      </table>

      <Modal open={open} title={form.id ? 'Edit Banner' : 'New Banner'} onClose={() => setOpen(false)}>
        <form className="admin-form" onSubmit={save}>
          <ImageUpload value={form.image_path} onChange={(v) => setForm(f => ({ ...f, image_path: v }))} label="Banner image *" folder="banners" />
          <div className="form-row">
            <label><span>Title</span><input value={form.title || ''} onChange={set('title')} /></label>
            <label><span>Subtitle</span><input value={form.subtitle || ''} onChange={set('subtitle')} /></label>
          </div>
          <label><span>Link (optional)</span><input value={form.link || ''} onChange={set('link')} placeholder="/products/category-slug" /></label>
          <div className="form-row">
            <label><span>Sort order</span><input type="number" value={form.sort_order} onChange={set('sort_order')} /></label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!form.is_active} onChange={set('is_active')} />
              <span>Active</span>
            </label>
          </div>
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={loading || !form.image_path}>{loading ? 'Saving…' : 'Save'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

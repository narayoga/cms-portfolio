import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Modal from '../../components/admin/Modal.jsx';
import ImageUpload from '../../components/admin/ImageUpload.jsx';

const blank = { category_id: '', name: '', slug: '', description: '', image_path: '', sort_order: 0, is_active: 1 };

export default function Subcategories() {
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    const [s, c] = await Promise.all([api.get('/admin/subcategories'), api.get('/admin/categories')]);
    setRows(s); setCats(c);
  };
  useEffect(() => { reload(); }, []);

  const openNew = () => { setForm({ ...blank, category_id: cats[0]?.id || '' }); setOpen(true); };
  const openEdit = (r) => { setForm({ ...r }); setOpen(true); };
  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.id) await api.put(`/admin/subcategories/${form.id}`, form);
      else await api.post('/admin/subcategories', form);
      setOpen(false);
      reload();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };
  const del = async (id) => {
    if (!confirm('Delete this sub-category? All products inside will also be deleted.')) return;
    await api.del(`/admin/subcategories/${id}`);
    reload();
  };
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value }));

  return (
    <>
      <div className="admin-page-header">
        <h2>Sub-categories</h2>
        <button className="btn btn-primary" onClick={openNew}>+ New Sub-category</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>Category</th><th>Name</th><th>Slug</th><th>Order</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.category_name}</td>
              <td>{r.name}</td>
              <td>{r.slug}</td>
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
          {!rows.length && <tr><td colSpan={6} className="empty">No sub-categories yet.</td></tr>}
        </tbody>
      </table>

      <Modal open={open} title={form.id ? 'Edit Sub-category' : 'New Sub-category'} onClose={() => setOpen(false)}>
        <form className="admin-form" onSubmit={save}>
          <label>
            <span>Parent Category *</span>
            <select required value={form.category_id} onChange={set('category_id')}>
              <option value="">— select —</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <div className="form-row">
            <label><span>Name *</span><input required value={form.name} onChange={set('name')} /></label>
            <label><span>Slug (auto if blank)</span><input value={form.slug || ''} onChange={set('slug')} /></label>
          </div>
          <label><span>Description</span><textarea value={form.description || ''} onChange={set('description')} /></label>
          <ImageUpload value={form.image_path} onChange={(v) => setForm(f => ({ ...f, image_path: v }))} folder="catalog/subcategories" />
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

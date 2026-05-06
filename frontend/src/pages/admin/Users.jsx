import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Modal from '../../components/admin/Modal.jsx';

const blank = { name: '', email: '', password: '', role: 'editor' };

export default function Users() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(false);

  const reload = () => api.get('/admin/users').then(setRows);
  useEffect(() => { reload(); }, []);

  const openNew = () => { setForm(blank); setOpen(true); };
  const openEdit = (r) => { setForm({ ...r, password: '' }); setOpen(true); };
  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (form.id && !payload.password) delete payload.password;
      if (form.id) await api.put(`/admin/users/${form.id}`, payload);
      else await api.post('/admin/users', payload);
      setOpen(false);
      reload();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };
  const del = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await api.del(`/admin/users/${id}`); reload(); }
    catch (err) { alert(err.message); }
  };
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="admin-page-header">
        <h2>Users</h2>
        <button className="btn btn-primary" onClick={openNew}>+ New User</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.email}</td>
              <td>{r.role}</td>
              <td style={{ fontSize: '.85rem', color: 'var(--color-text-muted)' }}>{r.created_at}</td>
              <td>
                <div className="row-actions">
                  <button onClick={() => openEdit(r)}>Edit</button>
                  <button className="danger" onClick={() => del(r.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={5} className="empty">No users.</td></tr>}
        </tbody>
      </table>

      <Modal open={open} title={form.id ? 'Edit User' : 'New User'} onClose={() => setOpen(false)}>
        <form className="admin-form" onSubmit={save}>
          <div className="form-row">
            <label><span>Name *</span><input required value={form.name} onChange={set('name')} /></label>
            <label><span>Email *</span><input type="email" required value={form.email} onChange={set('email')} /></label>
          </div>
          <div className="form-row">
            <label>
              <span>{form.id ? 'New password (leave blank to keep)' : 'Password *'}</span>
              <input type="password" required={!form.id} value={form.password} onChange={set('password')} />
            </label>
            <label>
              <span>Role *</span>
              <select value={form.role} onChange={set('role')}>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
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

import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Modal from '../../components/admin/Modal.jsx';

const LOCATIONS = [
  { value: 'header',           label: 'Header Navigation' },
  { value: 'footer_explore',   label: 'Footer — Explore' },
  { value: 'footer_resources', label: 'Footer — Resources' },
];

const blank = { location: 'header', label: '', url: '', sort_order: 0, is_active: 1 };

export default function NavMenus() {
  const [rows, setRows]       = useState([]);
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState(blank);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState('all');

  const reload = () => api.get('/admin/nav-menus').then(setRows);
  useEffect(() => { reload(); }, []);

  const openNew  = () => { setForm(blank); setOpen(true); };
  const openEdit = (r) => { setForm({ ...r }); setOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.id) await api.put(`/admin/nav-menus/${form.id}`, form);
      else         await api.post('/admin/nav-menus', form);
      setOpen(false);
      reload();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    await api.del(`/admin/nav-menus/${id}`);
    reload();
  };

  const set = (k) => (e) => setForm(f => ({
    ...f,
    [k]: e.target.type === 'checkbox'
      ? (e.target.checked ? 1 : 0)
      : e.target.value,
  }));

  const locationLabel = (val) => LOCATIONS.find(l => l.value === val)?.label || val;

  const displayed = filter === 'all' ? rows : rows.filter(r => r.location === filter);

  return (
    <>
      <div className="admin-page-header">
        <h2>Navigation Menus</h2>
        <button className="btn btn-primary" onClick={openNew}>+ New Item</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-dark' : 'btn-outline'}`}
          onClick={() => setFilter('all')}
          style={{ padding: '6px 16px', fontSize: '.85rem' }}
        >
          All ({rows.length})
        </button>
        {LOCATIONS.map(loc => (
          <button
            key={loc.value}
            className={`btn ${filter === loc.value ? 'btn-dark' : 'btn-outline'}`}
            onClick={() => setFilter(loc.value)}
            style={{ padding: '6px 16px', fontSize: '.85rem' }}
          >
            {loc.label} ({rows.filter(r => r.location === loc.value).length})
          </button>
        ))}
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Location</th>
            <th>Label</th>
            <th>URL</th>
            <th>Order</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {displayed.map(r => (
            <tr key={r.id}>
              <td>
                <span style={{
                  background: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  padding: '2px 8px',
                  fontSize: '.8rem',
                }}>
                  {locationLabel(r.location)}
                </span>
              </td>
              <td>{r.label}</td>
              <td style={{ color: 'var(--color-text-muted)', fontSize: '.85rem' }}>{r.url}</td>
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
          {!displayed.length && (
            <tr>
              <td colSpan={6} className="empty">No menu items.</td>
            </tr>
          )}
        </tbody>
      </table>

      <Modal
        open={open}
        title={form.id ? 'Edit Menu Item' : 'New Menu Item'}
        onClose={() => setOpen(false)}
      >
        <form className="admin-form" onSubmit={save}>
          <label>
            <span>Location *</span>
            <select required value={form.location} onChange={set('location')}>
              {LOCATIONS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label>
              <span>Label *</span>
              <input
                required
                value={form.label}
                onChange={set('label')}
                placeholder="e.g. Products"
              />
            </label>
            <label>
              <span>URL *</span>
              <input
                required
                value={form.url}
                onChange={set('url')}
                placeholder="e.g. /products"
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>Sort order</span>
              <input type="number" value={form.sort_order} onChange={set('sort_order')} />
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'end', height: 42 }}>
              <input type="checkbox" checked={!!form.is_active} onChange={set('is_active')} />
              <span>Active</span>
            </label>
          </div>

          <p className="text-muted text-small">
            Tip: untuk link internal gunakan path relatif, e.g. <code>/products</code>.
            Untuk link eksternal gunakan URL penuh, e.g. <code>https://example.com</code>.
          </p>

          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

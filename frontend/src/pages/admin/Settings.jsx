import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const FIELDS = [
  ['site_name', 'Site name'],
  ['contact_email', 'Contact email (where contact-form messages are sent)'],
  ['contact_phone', 'Contact phone'],
  ['contact_address', 'Address'],
  ['ga_id', 'Google Analytics 4 Measurement ID (e.g. G-XXXXXXX)'],
  ['social_facebook', 'Facebook URL'],
  ['social_instagram', 'Instagram URL'],
  ['social_linkedin', 'LinkedIn URL'],
];

export default function Settings() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [savedAt, setSavedAt] = useState('');

  useEffect(() => { api.get('/admin/settings').then(d => setForm(d || {})); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/admin/settings', form);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="admin-page-header">
        <h2>Site Settings</h2>
        {savedAt && <span className="text-muted text-small">Saved at {savedAt}</span>}
      </div>
      <div className="admin-card">
        <form className="admin-form" onSubmit={save}>
          {FIELDS.map(([k, label]) => (
            <label key={k}>
              <span>{label}</span>
              {k === 'contact_address'
                ? <textarea value={form[k] || ''} onChange={set(k)} />
                : <input value={form[k] || ''} onChange={set(k)} />}
            </label>
          ))}
          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save settings'}
            </button>
          </div>
          <p className="text-muted text-small">
            Tip: leave the Google Analytics ID empty to disable tracking.
            The ID takes effect immediately on the public site without rebuilding.
          </p>
        </form>
      </div>
    </>
  );
}

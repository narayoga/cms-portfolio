import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import ImageUpload from '../../components/admin/ImageUpload.jsx';
import RichTextEditor from '../../components/admin/RichTextEditor.jsx';

export default function ServicePage() {
  const [form, setForm] = useState({ content_html: '', hero_image: '' });
  const [loading, setLoading] = useState(false);
  const [savedAt, setSavedAt] = useState('');

  useEffect(() => {
    api.get('/admin/service').then(d => setForm({
      content_html: d?.content_html || '',
      hero_image: d?.hero_image || '',
    }));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/admin/service', form);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="admin-page-header">
        <h2>Service Page</h2>
        {savedAt && <span className="text-muted text-small">Saved at {savedAt}</span>}
      </div>
      <div className="admin-card">
        <form className="admin-form" onSubmit={save} style={{ maxWidth: 'none' }}>
          <ImageUpload
            value={form.hero_image}
            onChange={(v) => setForm(f => ({ ...f, hero_image: v }))}
            label="Hero image (optional)"
          />
          <RichTextEditor
            value={form.content_html}
            onChange={(v) => setForm(f => ({ ...f, content_html: v }))}
            label="Page content"
          />
          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

import { useRef, useState } from 'react';
import { api } from '../../api/client';

export default function FileUpload({ value, onChange, label = 'File' }) {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr('');
    try {
      const r = await api.upload(f, 'file');
      onChange?.(r.path);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className="image-upload">
      <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{label}</span>
      <div style={{ fontSize: '.85rem', color: value ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
        {value || 'No file selected'}
      </div>
      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
        <button type="button" className="btn btn-outline" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? 'Uploading…' : value ? 'Replace File' : 'Upload File'}
        </button>
        {value && <button type="button" className="btn btn-outline" onClick={() => onChange?.('')}>Remove</button>}
      </div>
      <input ref={ref} type="file" onChange={onPick} style={{ display: 'none' }} />
      {err && <div style={{ color: 'var(--color-danger)', fontSize: '.85rem' }}>{err}</div>}
    </div>
  );
}

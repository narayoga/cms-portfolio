import { useRef, useState } from 'react';
import { api, mediaUrl } from '../../api/client';

export default function ImageUpload({ value, onChange, kind = 'image', label = 'Image', folder = 'misc' }) {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr('');
    try {
      const r = await api.upload(f, kind, folder);
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
      <div className="image-upload-preview">
        {value ? <img src={mediaUrl(value)} alt="" /> : <span className="placeholder">No image</span>}
      </div>
      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
        <button type="button" className="btn btn-outline" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
        </button>
        {value && (
          <button type="button" className="btn btn-outline" onClick={() => onChange?.('')}>Remove</button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={kind === 'image' ? 'image/*' : undefined}
        onChange={onPick}
        style={{ display: 'none' }}
      />
      {err && <div style={{ color: 'var(--color-danger)', fontSize: '.85rem' }}>{err}</div>}
    </div>
  );
}

/**
 * Lightweight contentEditable rich-text editor — no third-party dependency.
 * Supports basic formatting: bold, italic, headings, lists, links, inline images.
 * Output is HTML stored as-is; sanitized on render via DOMPurify.
 */
import { useEffect, useRef, useState } from 'react';
import { api, mediaUrl, htmlForDisplay, htmlForStorage } from '../../api/client';

export default function RichTextEditor({ value = '', onChange, label = 'Content', folder = 'content' }) {
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (ref.current && htmlForStorage(ref.current.innerHTML) !== (value || '')) {
      ref.current.innerHTML = htmlForDisplay(value);
    }
  }, [value]);

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    onChange?.(htmlForStorage(ref.current.innerHTML));
    ref.current.focus();
  };

  const handleInput = () => onChange?.(htmlForStorage(ref.current.innerHTML));

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const handleImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setUploading(true);
      try {
        const r = await api.upload(f, 'image', folder);
        exec('insertImage', mediaUrl(r.path));
      } catch (err) {
        alert('Upload failed: ' + err.message);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  return (
    <div>
      <span style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</span>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 6, background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
          <ToolBtn onClick={() => exec('bold')}><b>B</b></ToolBtn>
          <ToolBtn onClick={() => exec('italic')}><i>I</i></ToolBtn>
          <ToolBtn onClick={() => exec('underline')}><u>U</u></ToolBtn>
          <Sep />
          <ToolBtn onClick={() => exec('formatBlock', 'h2')}>H2</ToolBtn>
          <ToolBtn onClick={() => exec('formatBlock', 'h3')}>H3</ToolBtn>
          <ToolBtn onClick={() => exec('formatBlock', 'p')}>P</ToolBtn>
          <Sep />
          <ToolBtn onClick={() => exec('insertUnorderedList')}>• List</ToolBtn>
          <ToolBtn onClick={() => exec('insertOrderedList')}>1. List</ToolBtn>
          <Sep />
          <ToolBtn onClick={handleLink}>Link</ToolBtn>
          <ToolBtn onClick={handleImage} disabled={uploading}>{uploading ? 'Uploading…' : 'Image'}</ToolBtn>
          <Sep />
          <ToolBtn onClick={() => exec('removeFormat')}>Clear</ToolBtn>
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          style={{
            minHeight: 240,
            padding: 'var(--sp-4)',
            outline: 'none',
            background: '#fff',
            lineHeight: 1.6,
          }}
        />
      </div>
    </div>
  );
}

function ToolBtn({ children, ...rest }) {
  return (
    <button
      type="button"
      style={{
        padding: '4px 10px',
        border: '1px solid var(--color-border)',
        background: '#fff',
        borderRadius: 'var(--radius)',
        fontSize: '.85rem',
        cursor: 'pointer',
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
function Sep() { return <span style={{ width: 1, background: 'var(--color-border)', margin: '0 4px' }} />; }

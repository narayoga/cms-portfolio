export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div style={{ padding: 'var(--sp-4) var(--sp-5)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

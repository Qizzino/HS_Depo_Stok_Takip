export default function AlertModal({ title = 'Bilgi', message, onClose }) {
  return (
    <div className="preview-modal-overlay" style={{ zIndex: 9999999 }}>
      <div className="preview-modal-container" style={{ maxWidth: '400px', padding: '1.5rem', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>{title}</h3>
        <p style={{ marginBottom: '1.5rem' }}>{message}</p>
        <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.5rem 2rem', borderRadius: '6px' }}>Tamam</button>
      </div>
    </div>
  )
}

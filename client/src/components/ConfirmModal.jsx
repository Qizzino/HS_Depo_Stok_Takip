export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="preview-modal-overlay" style={{ zIndex: 9999999 }}>
      <div className="preview-modal-container" style={{ maxWidth: '400px', padding: '1.5rem', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>{title}</h3>
        <p style={{ marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={onCancel} className="btn" style={{ padding: '0.5rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px' }}>İptal</button>
          <button onClick={onConfirm} className="btn btn-danger" style={{ padding: '0.5rem 1.5rem', background: '#ef4444', color: 'white', borderRadius: '6px' }}>Evet, Sil</button>
        </div>
      </div>
    </div>
  )
}

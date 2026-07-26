import { useState, useEffect } from 'react'

export default function AdminPanel({ currentUser }) {
  const [kullanicilar, setKullanicilar] = useState([])
  
  // Ekleme / Düzenleme için state
  const [formData, setFormData] = useState({ id: null, username: '', password: '', role: 'user' })
  const [isEditing, setIsEditing] = useState(false)

  const fetchKullanicilar = () => {
    fetch('http://localhost:3001/api/kullanicilar')
      .then(res => res.json())
      .then(setKullanicilar)
  }

  useEffect(() => {
    fetchKullanicilar()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isEditing) {
      // Güncelleme İşlemi (PUT)
      const res = await fetch(`http://localhost:3001/api/kullanicilar/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password, role: formData.role })
      })
      
      if (res.ok) {
        alert('Kullanıcı bilgileri güncellendi!')
        handleCancel()
        fetchKullanicilar()
      } else {
        const data = await res.json()
        alert('Hata: ' + data.error)
      }
      
    } else {
      // Ekleme İşlemi (POST)
      const res = await fetch('http://localhost:3001/api/kullanicilar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password, role: formData.role })
      })
      if (res.ok) {
        alert('Kullanıcı başarıyla eklendi!')
        handleCancel()
        fetchKullanicilar()
      } else {
        const data = await res.json()
        alert('Hata: ' + data.error)
      }
    }
  }

  const handleEditClick = (k) => {
    setIsEditing(true)
    setFormData({ id: k.id, username: k.username, password: '', role: k.role })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({ id: null, username: '', password: '', role: 'user' })
  }

  const handleKullaniciSil = async (id) => {
    if (!window.confirm('Bu kullanıcıyı tamamen silmek istediğinize emin misiniz?')) return
    const res = await fetch(`http://localhost:3001/api/kullanicilar/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchKullanicilar()
    } else {
      alert('Kullanıcı silinirken hata oluştu.')
    }
  }

  if (currentUser?.role !== 'admin') {
    return <div style={{ color: 'var(--danger-color)', padding: '2rem' }}>Bu sayfayı görüntüleme yetkiniz yok.</div>
  }

  return (
    <div style={{ maxWidth: '900px', paddingBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>👑 Sistem Yönetici Paneli</h3>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)' }}>
        <h4 style={{ marginBottom: '1.5rem' }}>{isEditing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}</h4>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label>Kullanıcı Adı</label>
            <input 
              required 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})} 
              style={{ width: '100%' }} 
            />
          </div>
          <div>
            <label>{isEditing ? 'Yeni Şifre' : 'Şifre'}</label>
            <input 
              required={!isEditing} 
              type="password" 
              placeholder={isEditing ? 'Değiştirmek istemiyorsanız boş bırakın...' : ''}
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              style={{ width: '100%' }} 
            />
          </div>
          <div>
            <label>Yetki Seviyesi</label>
            <select 
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value})} 
              style={{ width: '100%' }}
              disabled={isEditing && formData.username === 'admin'}
            >
              <option value="user">Standart Kullanıcı</option>
              <option value="admin">Sistem Yöneticisi (Admin)</option>
            </select>
          </div>
          <button type="submit" className={isEditing ? "btn btn-primary" : "btn btn-success"} style={{ padding: '0.8rem 1.5rem' }}>
            {isEditing ? 'GÜNCELLE' : 'EKLE'}
          </button>
          {isEditing && (
            <button type="button" onClick={handleCancel} className="btn btn-danger" style={{ padding: '0.8rem 1.5rem' }}>
              İPTAL
            </button>
          )}
        </form>
      </div>

      <table style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Kullanıcı Adı</th>
            <th>Yetki Seviyesi</th>
            <th style={{ textAlign: 'right' }}>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {kullanicilar.map(k => (
            <tr key={k.id}>
              <td style={{ color: 'var(--text-secondary)' }}>#{k.id}</td>
              <td style={{ fontWeight: 600, fontSize: '1.1rem' }}>{k.username}</td>
              <td>
                <span className={`badge ${k.role === 'admin' ? 'giris' : 'ters'}`} style={{ padding: '0.4rem 0.8rem' }}>
                  {k.role === 'admin' ? '👑 Admin' : 'Kullanıcı'}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <button onClick={() => handleEditClick(k)} className="btn btn-warning" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginRight: '0.5rem' }}>DÜZENLE</button>
                {k.username !== 'admin' && (
                  <button onClick={() => handleKullaniciSil(k.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>SİL</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

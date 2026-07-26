import { useState, useEffect } from 'react'

export default function Ayarlar({ onSettingsChange, currentUser }) {
  const [activeTab, setActiveTab] = useState('firma') // firma, kullanicilar

  const [ayarlar, setAyarlar] = useState({
    firma_adi: '',
    vergi_dairesi: '',
    vkn: '',
    adres: '',
    telefon: '',
    eposta: '',
    web_sitesi: ''
  })
  
  const [logoUrl, setLogoUrl] = useState('')
  const [file, setFile] = useState(null)

  // Kullanıcılar state (Sadece admin için)
  const [kullanicilar, setKullanicilar] = useState([])
  const [yeniKullanici, setYeniKullanici] = useState({ username: '', password: '', role: 'user' })

  const fetchKullanicilar = () => {
    if (currentUser?.role === 'admin') {
      fetch('http://localhost:3001/api/kullanicilar')
        .then(res => res.json())
        .then(setKullanicilar)
    }
  }

  useEffect(() => {
    fetchKullanicilar()
    fetch('http://localhost:3001/api/ayarlar')
      .then(res => res.json())
      .then(data => {
        setAyarlar({
          firma_adi: data.firma_adi || '',
          vergi_dairesi: data.vergi_dairesi || '',
          vkn: data.vkn || '',
          adres: data.adres || '',
          telefon: data.telefon || '',
          eposta: data.eposta || '',
          web_sitesi: data.web_sitesi || ''
        })
        setLogoUrl(data.logo_url || '')
      })
  }, [])

  const handleChange = (e) => {
    setAyarlar({ ...ayarlar, [e.target.name]: e.target.value })
  }

  const handleFirmaKaydet = async () => {
    const res = await fetch('http://localhost:3001/api/ayarlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ayarlar)
    })
    if (res.ok) {
      alert('Firma bilgileri başarıyla kaydedildi!')
      onSettingsChange() // App.jsx içindeki state'i güncellemek için
    } else {
      alert('Kaydedilirken bir hata oluştu.')
    }
  }

  const handleLogoUpload = async () => {
    if (!file) return alert('Lütfen bir resim dosyası seçin.')

    const formData = new FormData()
    formData.append('logo', file)

    const res = await fetch('http://localhost:3001/api/upload-logo', {
      method: 'POST',
      body: formData
    })
    
    if (res.ok) {
      const data = await res.json()
      setLogoUrl(data.logo_url)
      alert('Logo başarıyla yüklendi!')
      onSettingsChange() // App.jsx içindeki state'i güncellemek için
    } else {
      alert('Logo yüklenirken hata oluştu.')
    }
  }

  const handleKullaniciEkle = async () => {
    const res = await fetch('http://localhost:3001/api/kullanicilar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(yeniKullanici)
    })
    if (res.ok) {
      setYeniKullanici({ username: '', password: '', role: 'user' })
      fetchKullanicilar()
      alert('Kullanıcı başarıyla eklendi!')
    } else {
      const data = await res.json()
      alert('Hata: ' + data.error)
    }
  }

  const handleKullaniciSil = async (id) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return
    const res = await fetch(`http://localhost:3001/api/kullanicilar/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchKullanicilar()
    } else {
      alert('Kullanıcı silinirken hata oluştu.')
    }
  }

  return (
    <div style={{ maxWidth: '800px', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <h3 
          style={{ margin: 0, cursor: 'pointer', color: activeTab === 'firma' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
          onClick={() => setActiveTab('firma')}
        >
          Firma Ayarları
        </h3>
        {currentUser?.role === 'admin' && (
          <h3 
            style={{ margin: 0, cursor: 'pointer', color: activeTab === 'kullanicilar' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('kullanicilar')}
          >
            👥 Kullanıcı Yönetimi
          </h3>
        )}
      </div>

      {activeTab === 'firma' && (
        <>
          {/* Firma Profil Ayarları */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)' }}>
            <h4 style={{ marginBottom: '1.5rem' }}>Firma Profil Bilgileri</h4>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Firma Adı (Uygulama Başlıklarında Görünür)</label>
            <input 
              required 
              name="firma_adi"
              value={ayarlar.firma_adi} 
              onChange={handleChange} 
              style={{ width: '100%' }}
              placeholder="Örn: ÇET-ES MÜHENDİSLİK"
            />
          </div>

          <div>
            <label>Vergi Dairesi (V.D.)</label>
            <input 
              name="vergi_dairesi"
              value={ayarlar.vergi_dairesi} 
              onChange={handleChange} 
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label>Vergi Kimlik No (VKN)</label>
            <input 
              name="vkn"
              value={ayarlar.vkn} 
              onChange={handleChange} 
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label>Telefon / İletişim</label>
            <input 
              name="telefon"
              value={ayarlar.telefon} 
              onChange={handleChange} 
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label>E-Posta</label>
            <input 
              name="eposta"
              value={ayarlar.eposta} 
              onChange={handleChange} 
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label>Web Sitesi</label>
            <input 
              name="web_sitesi"
              value={ayarlar.web_sitesi} 
              onChange={handleChange} 
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label>Açık Adres</label>
            <textarea 
              name="adres"
              value={ayarlar.adres} 
              onChange={handleChange} 
              style={{ width: '100%', minHeight: '60px', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', textAlign: 'right', marginTop: '1rem' }}>
            <button onClick={handleFirmaKaydet} className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>BİLGİLERİ KAYDET</button>
          </div>
        </div>
      </div>

      {/* Logo Yükleme Ayarı */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
        <h4 style={{ marginBottom: '1rem' }}>Firma Logosu</h4>
        
        {logoUrl && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Mevcut Logo:</p>
            <img src={logoUrl} alt="Firma Logo" style={{ maxHeight: '100px', borderRadius: '8px' }} />
          </div>
        )}

        <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label>Yeni Logo Seç (.png, .jpg)</label>
            <input 
              type="file" 
              accept="image/*"
              required 
              onChange={e => setFile(e.target.files[0])} 
              style={{ width: '100%', padding: '0.6rem' }}
            />
          </div>
          <button onClick={handleLogoUpload} className="btn btn-success" style={{ padding: '0.8rem 2rem' }}>YÜKLE</button>
        </div>
      </div>
      </>
      )}

      {activeTab === 'kullanicilar' && currentUser?.role === 'admin' && (
        <div>
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)' }}>
            <h4 style={{ marginBottom: '1.5rem' }}>Yeni Kullanıcı Ekle</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
              <div>
                <label>Kullanıcı Adı</label>
                <input required value={yeniKullanici.username} onChange={e => setYeniKullanici({...yeniKullanici, username: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div>
                <label>Şifre</label>
                <input required type="password" value={yeniKullanici.password} onChange={e => setYeniKullanici({...yeniKullanici, password: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div>
                <label>Yetki</label>
                <select value={yeniKullanici.role} onChange={e => setYeniKullanici({...yeniKullanici, role: e.target.value})} style={{ width: '100%' }}>
                  <option value="user">Standart Kullanıcı</option>
                  <option value="admin">Sistem Yöneticisi (Admin)</option>
                </select>
              </div>
              <button onClick={handleKullaniciEkle} className="btn btn-success" style={{ padding: '0.8rem 1.5rem' }}>EKLE</button>
            </div>
          </div>

          <table style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', width: '100%' }}>
            <thead>
              <tr>
                <th>Kullanıcı Adı</th>
                <th>Yetki Seviyesi</th>
                <th style={{ textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {kullanicilar.map(k => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 600 }}>{k.username}</td>
                  <td>
                    <span className={`badge ${k.role === 'admin' ? 'giris' : 'ters'}`}>
                      {k.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {k.username !== 'admin' && (
                      <button onClick={() => handleKullaniciSil(k.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>SİL</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}

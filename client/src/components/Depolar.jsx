import { useState, useEffect } from 'react'

export default function Depolar() {
  const [depolar, setDepolar] = useState([])
  const [ihaleGruplari, setIhaleGruplari] = useState([])
  
  const [depoAdi, setDepoAdi] = useState('')
  const [depoTipi, setDepoTipi] = useState('Tedarikçi')
  
  const [ihaleAdi, setIhaleAdi] = useState('')

  const fetchVeriler = () => {
    fetch('http://localhost:3001/api/depolar').then(res => res.json()).then(setDepolar)
    fetch('http://localhost:3001/api/ihalegruplari').then(res => res.json()).then(setIhaleGruplari)
  }

  useEffect(() => {
    fetchVeriler()
  }, [])

  const handleDepoEkle = async () => {
    const res = await fetch('http://localhost:3001/api/depolar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adi: depoAdi, tipi: depoTipi })
    })
    if (res.ok) {
      setDepoAdi('')
      setDepoTipi('Tedarikçi')
      fetchVeriler()
    }
  }

  const handleIhaleEkle = async () => {
    const res = await fetch('http://localhost:3001/api/ihalegruplari', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adi: ihaleAdi, depoId: null })
    })
    if (res.ok) {
      setIhaleAdi('')
      fetchVeriler()
    }
  }

  const handleDepoDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/depolar/${id}`, { method: 'DELETE' })
      if (res.ok) fetchVeriler()
    } catch (err) {}
  }

  const handleIhaleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/ihalegruplari/${id}`, { method: 'DELETE' })
      if (res.ok) fetchVeriler()
    } catch (err) {}
  }

  return (
    <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      
      {/* DEPOLAR BÖLÜMÜ */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Yeni Depo Ekle</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group">
            <label>Depo (Firma) Adı</label>
            <input required value={depoAdi} onChange={e => setDepoAdi(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Tipi</label>
            <select value={depoTipi} onChange={e => setDepoTipi(e.target.value)}>
              <option value="Tedarikçi">Tedarikçi</option>
              <option value="Taşeron">Taşeron</option>
              <option value="Ana Depo">Ana Depo (Kendi Depomuz)</option>
            </select>
          </div>
          <div className="form-group" style={{ alignSelf: 'end' }}>
            <button onClick={handleDepoEkle} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>EKLE</button>
          </div>
        </div>

        <table style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <thead><tr><th>Depo Adı</th><th>Tipi</th><th>İşlem</th></tr></thead>
          <tbody>
            {depolar.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.adi}</td>
                <td>{d.tipi}</td>
                <td><button type="button" onClick={() => handleDepoDelete(d.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>SİL</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* İŞ GRUPLARI BÖLÜMÜ */}
      <div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>İş Grubu Ekle</h3>
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group">
              <label>İş Grubu Adı</label>
              <input value={ihaleAdi} onChange={e => setIhaleAdi(e.target.value)} />
            </div>
            <div className="form-group" style={{ alignSelf: 'end' }}>
              <button onClick={handleIhaleEkle} className="btn btn-success" style={{ padding: '0.8rem 1.5rem' }}>GRUP EKLE</button>
            </div>
          </div>
        </div>

        <table style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <thead><tr><th>İş Grubu</th><th>İşlem</th></tr></thead>
          <tbody>
            {ihaleGruplari.map(i => {
              return (
                <tr key={i.id}>
                  <td style={{ fontWeight: 600, color: 'var(--warning-color)' }}>{i.adi}</td>
                  <td><button type="button" onClick={() => handleIhaleDelete(i.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>SİL</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
    </>
  )
}

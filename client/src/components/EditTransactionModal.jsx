import { useState, useEffect, useMemo } from 'react'
import Select from 'react-select'
import AlertModal from './AlertModal'

export default function EditTransactionModal({ row, depolarListesi, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    pozNo: '',
    malzemeAdi: '',
    miktar: '',
    birim: '',
    islemTuru: '',
    depoAdi: '',
    belgeNo: '',
    ihaleGrubu: '',
    projeAdi: '',
    islemYapan: '',
    teslimAlan: '',
    transferDepo: ''
  })
  const [malzemeler, setMalzemeler] = useState([])

  useEffect(() => {
    fetch('http://localhost:3001/api/malzemeler')
      .then(r => r.json())
      .then(setMalzemeler)
  }, [])

  useEffect(() => {
    if (row) {
      setFormData({
        pozNo: row.poz_no || '',
        malzemeAdi: row.malzeme_adi || '',
        miktar: Math.abs(row.miktar) || '',
        birim: row.birim || '',
        islemTuru: row.islem_turu || '',
        depoAdi: row.depo_adi || '',
        belgeNo: row.belge_no || '',
        ihaleGrubu: row.ihale_grubu || '',
        projeAdi: row.proje_adi || '',
        islemYapan: row.islem_yapan || '',
        teslimAlan: row.teslim_alan || '',
        transferDepo: row.transfer_depo || ''
      })
    }
  }, [row])

  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: '' })

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/hareketler/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setAlertState({ isOpen: true, message: 'İşlem başarıyla güncellendi!', type: 'success' })
      } else {
        const error = await res.json()
        setAlertState({ isOpen: true, message: 'Hata: ' + error.error, type: 'error' })
      }
    } catch (err) {
      setAlertState({ isOpen: true, message: 'Sunucuya bağlanılamadı.', type: 'error' })
    }
  }

  const handleAlertClose = () => {
    if (alertState.type === 'success') {
      onSuccess()
    }
    setAlertState({ isOpen: false, message: '', type: '' })
  }

  return (
    <>
    <div className="preview-modal-overlay">
      <div className="preview-modal-container" style={{ maxWidth: '600px', padding: '2rem', background: 'white', borderRadius: '12px' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>İşlemi Düzenle</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>İşlem Türü</label>
            <select value={formData.islemTuru} onChange={e => setFormData({...formData, islemTuru: e.target.value})}>
              <option value="Giriş">Giriş (Tedarikçiden Alım)</option>
              <option value="Çıkış">Çıkış (Sahaya Çıkış)</option>
              <option value="İade Girişi">İade Girişi (Sahadan İade)</option>
              <option value="İade Çıkışı">İade Çıkışı (Tedarikçiye İade)</option>
              <option value="Ters Kayıt">Ters Kayıt (Depolar Arası Aktarma)</option>
            </select>
          </div>
          <div className="form-group" style={{ position: 'relative', zIndex: 60 }}>
            <label>Malzeme Adı</label>
            <Select
              options={useMemo(() => malzemeler.map(m => ({
                value: m.adi,
                label: m.adi,
                poz_no: m.poz_no,
                birim: m.birim
              })), [malzemeler])}
              onChange={(selected) => {
                if (selected) {
                  setFormData({
                    ...formData, 
                    malzemeAdi: selected.value,
                    pozNo: selected.poz_no,
                    birim: selected.birim
                  })
                } else {
                  setFormData({...formData, malzemeAdi: '', pozNo: '', birim: ''})
                }
              }}
              value={{ value: formData.malzemeAdi, label: formData.malzemeAdi }}
              placeholder="Malzeme Seçin..."
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#ccc',
                  borderRadius: '4px',
                  minHeight: '38px'
                }),
                menu: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>
          <div className="form-group">
            <label>Miktar</label>
            <input type="number" value={formData.miktar} onChange={e => setFormData({...formData, miktar: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Ana Depo</label>
            <select value={formData.depoAdi} onChange={e => setFormData({...formData, depoAdi: e.target.value})}>
              <option value="">Seçiniz</option>
              {depolarListesi.map(depo => (
                <option key={depo} value={depo}>{depo}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>İşlem Depo (Kurum/Firma/Taşeron)</label>
            <select value={formData.transferDepo} onChange={e => setFormData({...formData, transferDepo: e.target.value})}>
              <option value="">Seçiniz</option>
              {depolarListesi.map(depo => (
                <option key={`transfer-${depo}`} value={depo}>{depo}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Belge No</label>
            <input type="text" value={formData.belgeNo} onChange={e => setFormData({...formData, belgeNo: e.target.value})} />
          </div>
          <div className="form-group">
            <label>İhale Grubu (İş Yeri)</label>
            <input type="text" value={formData.ihaleGrubu} onChange={e => setFormData({...formData, ihaleGrubu: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Proje Adı</label>
            <input type="text" value={formData.projeAdi} onChange={e => setFormData({...formData, projeAdi: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Teslim Alan</label>
            <input type="text" value={formData.teslimAlan} onChange={e => setFormData({...formData, teslimAlan: e.target.value})} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <button onClick={onClose} className="btn" style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: 'white' }}>İptal</button>
          <button onClick={handleSave} className="btn btn-primary">Kaydet</button>
        </div>
      </div>
      
      {alertState.isOpen && (
        <AlertModal 
          title={alertState.type === 'success' ? 'Başarılı' : 'Hata'}
          message={alertState.message}
          onClose={handleAlertClose}
        />
      )}
    </div>
    </>
  )
}

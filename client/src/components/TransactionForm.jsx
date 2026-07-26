import { useState, useEffect, useMemo } from 'react'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
import AlertModal from './AlertModal'

export default function TransactionForm({ onSuccess, currentUser }) {
  const [formType, setFormType] = useState('Giriş') // Giriş, Çıkış, Ters Kayıt
  
  const [malzemeler, setMalzemeler] = useState([])
  const [depolar, setDepolar] = useState([])
  const [ihaleGruplari, setIhaleGruplari] = useState([])
  const [projeler, setProjeler] = useState([])

  // Üst Bilgiler (Belge / Başlık)
  const [headerData, setHeaderData] = useState({
    islemTuru: 'Giriş',
    depoAdi: '',
    belgeNo: '',
    ihaleGrubu: '',
    transferDepo: '',
    projeAdi: '',
    islemYapan: currentUser ? currentUser.username : '',
    teslimAlan: ''
  })

  // Kalem Bilgileri (Formdaki anlık giriş)
  const [itemData, setItemData] = useState({
    pozNo: '',
    malzemeAdi: '',
    miktar: '',
    birim: '',
    malzemeGrubu: ''
  })
  
  // Sepet Listesi
  const [cartItems, setCartItems] = useState([])

  const [ekBelgeDosyasi, setEkBelgeDosyasi] = useState(null)
  const [yazdirmaSecenegi, setYazdirmaSecenegi] = useState('Yok')

  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'info' })
  const showAlert = (message, type = 'info') => setAlertState({ isOpen: true, message, type })

  useEffect(() => {
    fetch('http://localhost:3001/api/malzemeler').then(r => r.json()).then(setMalzemeler)
    fetch('http://localhost:3001/api/depolar').then(r => r.json()).then(data => {
      setDepolar(data)
      const ana = data.filter(d => d.tipi === 'Ana Depo')
      if (ana.length > 0) {
        setHeaderData(prev => ({ ...prev, depoAdi: ana[0].adi }))
      }
    })
    fetch('http://localhost:3001/api/ihalegruplari').then(r => r.json()).then(setIhaleGruplari)
    fetch('http://localhost:3001/api/projeler').then(r => r.json()).then(setProjeler)
  }, [])

  const malzemeOptions = useMemo(() => {
    return malzemeler.map(m => ({
      value: m.adi,
      label: m.adi,
      poz_no: m.poz_no,
      birim: m.birim,
      malzeme_grubu: m.malzeme_grubu
    }))
  }, [malzemeler])

  const handleSelectChange = (selectedOption) => {
    if (selectedOption) {
      setItemData({
        ...itemData,
        malzemeAdi: selectedOption.value,
        pozNo: selectedOption.poz_no,
        birim: selectedOption.birim,
        malzemeGrubu: selectedOption.malzeme_grubu
      })
    } else {
      setItemData({
        ...itemData,
        malzemeAdi: '',
        pozNo: '',
        birim: '',
        malzemeGrubu: ''
      })
    }
  }

  const handleAddToCart = () => {
    if (!itemData.malzemeAdi || !itemData.miktar) {
      return showAlert("Lütfen malzeme ve miktar seçin.", "error")
    }
    
    // Sepete Ekle
    setCartItems([...cartItems, { ...itemData }])
    // Inputları temizle
    setItemData({
      pozNo: '',
      malzemeAdi: '',
      miktar: '',
      birim: '',
      malzemeGrubu: ''
    })
  }

  const handleRemoveFromCart = (index) => {
    const newCart = [...cartItems]
    newCart.splice(index, 1)
    setCartItems(newCart)
  }

  const saveToDatabase = async (finalData) => {
    try {
      const payload = {
        ...finalData,
        islemNo: 'ISL-' + Date.now()
      }
      const res = await fetch('http://localhost:3001/api/hareketler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        showAlert('İşlem başarıyla kaydedildi!', 'success')
        return { success: true, data: finalData }
      } else {
        const error = await res.json()
        showAlert('Hata: ' + error.error, 'error')
        return { success: false }
      }
    } catch (err) {
      showAlert('Sunucuya bağlanılamadı.', 'error')
      return { success: false }
    }
  }

  const handleSubmit = async () => {
    if (!headerData.depoAdi || !headerData.ihaleGrubu || !headerData.belgeNo || !headerData.transferDepo) {
      return showAlert("Lütfen tüm zorunlu genel (başlık) alanlarını (Depo, Karşı Taraf vb.) doldurun.", "error")
    }
    if (cartItems.length === 0) {
      return showAlert("Lütfen sepete en az 1 malzeme ekleyin.", "error")
    }

    try {
      let ekBelgeUrl = null
      let yeniIrsaliyeNo = null

      if (ekBelgeDosyasi) {
        const formDataBelge = new FormData()
        formDataBelge.append('belge', ekBelgeDosyasi)
        const uploadRes = await fetch('http://localhost:3001/api/upload-belge', { method: 'POST', body: formDataBelge })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          ekBelgeUrl = uploadData.url
        }
      }

      if (yazdirmaSecenegi === 'İrsaliye') {
        const irsaliyeRes = await fetch('http://localhost:3001/api/irsaliye-no')
        if (irsaliyeRes.ok) {
          const irsData = await irsaliyeRes.json()
          yeniIrsaliyeNo = irsData.irsaliye_no
        }
      }

      const finalData = { 
        ...headerData, 
        items: cartItems, 
        ekBelge: ekBelgeUrl, 
        irsaliyeNo: yeniIrsaliyeNo, 
        yazdirmaSecenegi 
      }

      if (yazdirmaSecenegi !== 'Yok') {
        onSuccess({ 
          previewData: finalData, 
          saveAction: () => saveToDatabase(finalData) 
        });
      } else {
        const result = await saveToDatabase(finalData);
        if (result.success) {
          onSuccess({ success: true });
        }
      }
    } catch (err) {
      showAlert('Sunucuya bağlanılamadı.', 'error')
    }
  }

  const anaDepolar = useMemo(() => depolar.filter(d => d.tipi === 'Ana Depo'), [depolar])

  const karsiTarafDepolar = useMemo(() => depolar.filter(d => {
    if (formType === 'Giriş') return d.tipi === 'Tedarikçi'
    if (formType === 'Çıkış') return d.tipi === 'Taşeron'
    if (formType === 'İade Girişi') return d.tipi === 'Taşeron'
    if (formType === 'İade Çıkışı') return d.tipi === 'Tedarikçi'
    if (formType === 'Ters Kayıt') return d.tipi === 'Ana Depo'
    return true
  }), [depolar, formType])

  const handleTypeChange = (type) => {
    setFormType(type)
    setHeaderData({ 
      ...headerData, 
      islemTuru: type, 
      depoAdi: anaDepolar.length > 0 ? anaDepolar[0].adi : '', 
      ihaleGrubu: '', 
      transferDepo: '', 
      islemYapan: currentUser?.username || '', 
      teslimAlan: '' 
    })
    setItemData({ pozNo: '', malzemeAdi: '', miktar: '', birim: '' })
    setCartItems([])
    setEkBelgeDosyasi(null)
    setYazdirmaSecenegi('Yok')
  }

  return (
    <div>
      <div className="type-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: formType.includes('İade') ? '0.5rem' : '2rem' }}>
        <button 
          type="button"
          className={`type-btn giris ${formType === 'Giriş' ? 'active' : ''}`}
          onClick={() => handleTypeChange('Giriş')}
          style={{ flex: 1, minWidth: '200px' }}
        >
          🟢 MALZEME GİRİŞİ<br/><small style={{fontWeight:'normal'}}>(Tedarikçiden Alım)</small>
        </button>
        <button 
          type="button"
          className={`type-btn cikis ${formType === 'Çıkış' ? 'active' : ''}`}
          onClick={() => handleTypeChange('Çıkış')}
          style={{ flex: 1, minWidth: '200px' }}
        >
          🔴 MALZEME ÇIKIŞI<br/><small style={{fontWeight:'normal'}}>(Sahaya/Taşerona Çıkış)</small>
        </button>
        <button 
          type="button"
          className={`type-btn ${formType.includes('İade') ? 'active' : ''}`}
          onClick={() => handleTypeChange('İade Girişi')}
          style={{ flex: 1, minWidth: '200px', backgroundColor: formType.includes('İade') ? 'rgba(59, 130, 246, 0.2)' : 'transparent', borderColor: formType.includes('İade') ? '#3b82f6' : 'var(--panel-border)', color: formType.includes('İade') ? '#3b82f6' : 'var(--text-secondary)' }}
        >
          🔵 İADE İŞLEMLERİ<br/><small style={{fontWeight:'normal'}}>(Sahadan veya Tedarikçiye)</small>
        </button>
      </div>

      {formType.includes('İade') && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <button 
            type="button"
            className={`type-btn giris ${formType === 'İade Girişi' ? 'active' : ''}`}
            onClick={() => handleTypeChange('İade Girişi')}
            style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem' }}
          >
            ⬇️ Sahadan İade (İade Girişi)
          </button>
          <button 
            type="button"
            className={`type-btn cikis ${formType === 'İade Çıkışı' ? 'active' : ''}`}
            onClick={() => handleTypeChange('İade Çıkışı')}
            style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem' }}
          >
            ⬆️ Tedarikçiye İade (İade Çıkışı)
          </button>
        </div>
      )}

      <div style={{ background: 'var(--panel-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--panel-border)', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h4 style={{ margin: '0 0 1.5rem 0', color: 'var(--accent-color)', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>📋 Genel Bilgiler</h4>
        <div className="form-grid" style={{ alignItems: 'end' }}>
          
          {(anaDepolar.length !== 1) && (
            <div className="form-group">
              <label>İşlem Yapılan Ana Depo *</label>
              <select value={headerData.depoAdi} onChange={(e) => setHeaderData({...headerData, depoAdi: e.target.value})}>
                <option value="">Seçiniz...</option>
                {anaDepolar.map(d => <option key={d.id} value={d.adi}>{d.adi}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>
              {formType === 'Giriş' ? 'Malzemenin Geldiği Kurum/Firma (Tedarikçi) *' : 
               formType === 'Çıkış' ? 'Teslim Edilen Taşeron/Personel *' : 
               formType === 'İade Girişi' ? 'İadeyi Yapan Taşeron/Personel *' :
               formType === 'İade Çıkışı' ? 'İade Edilen Kurum/Firma (Tedarikçi) *' : 
               formType === 'Ters Kayıt' ? 'Aktarma Yapılacak Diğer Ana Depo *' : 'İşlem Depo *'}
            </label>
            <select value={headerData.transferDepo} onChange={(e) => setHeaderData({...headerData, transferDepo: e.target.value})}>
              <option value="">Seçiniz...</option>
              {formType === 'Ters Kayıt' 
                ? karsiTarafDepolar.filter(d => d.adi !== headerData.depoAdi).map(d => <option key={d.id} value={d.adi}>{d.adi}</option>)
                : karsiTarafDepolar.map(d => <option key={d.id} value={d.adi}>{d.adi}</option>)
              }
            </select>
          </div>

          <div className="form-group">
            <label>İhale Grubu (Proje/İş Yeri) *</label>
            <select value={headerData.ihaleGrubu} onChange={(e) => setHeaderData({...headerData, ihaleGrubu: e.target.value})}>
              <option value="">Seçiniz...</option>
              {ihaleGruplari.map(i => <option key={i.id} value={i.adi}>{i.adi}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ position: 'relative', zIndex: 55 }}>
            <label>Proje Adı</label>
            <CreatableSelect
              isClearable
              options={useMemo(() => projeler.map(p => ({ value: p, label: p })), [projeler])}
              value={headerData.projeAdi ? { value: headerData.projeAdi, label: headerData.projeAdi } : null}
              onChange={(selected) => setHeaderData({...headerData, projeAdi: selected ? selected.value : ''})}
              placeholder="Seç veya yazıp Enter'a bas..."
              formatCreateLabel={(inputValue) => `Ekle: "${inputValue}"`}
              styles={{
                control: (base) => ({
                  ...base,
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderColor: 'var(--panel-border)',
                  color: 'white',
                  minHeight: '42px',
                  borderRadius: '8px'
                }),
                menu: (base) => ({
                  ...base,
                  background: '#1e293b',
                  color: 'white',
                  zIndex: 9999
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#3b82f6' : 'transparent',
                  color: 'white',
                  cursor: 'pointer'
                }),
                singleValue: (base) => ({ ...base, color: 'white' }),
                input: (base) => ({ ...base, color: 'white' })
              }}
            />
          </div>

          <div className="form-group">
            <label>Belge No *</label>
            <input type="text" value={headerData.belgeNo} onChange={(e) => setHeaderData({...headerData, belgeNo: e.target.value})} />
          </div>

          {formType === 'Giriş' && (
            <div className="form-group">
              <label>Ek Belge (İsteğe Bağlı)</label>
              <input type="file" onChange={(e) => setEkBelgeDosyasi(e.target.files[0])} />
            </div>
          )}

          {(formType === 'Çıkış' || formType === 'İade Çıkışı') && (
            <>
              <div className="form-group">
                <label>Teslim Alan Personel</label>
                <input type="text" value={headerData.teslimAlan} onChange={(e) => setHeaderData({...headerData, teslimAlan: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Belge Yazdırma</label>
                <select value={yazdirmaSecenegi} onChange={e => setYazdirmaSecenegi(e.target.value)}>
                  <option value="Yok">Yazdırma</option>
                  <option value="Tutanak">Malzeme Çıkış Tutanağı (İç Teslimat)</option>
                  <option value="İrsaliye">Resmi İrsaliye (Numaratörlü)</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--panel-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--panel-border)', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h4 style={{ margin: '0 0 1.5rem 0', color: 'var(--accent-color)', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>📦 Malzeme Ekle</h4>
        <div className="form-grid" style={{ alignItems: 'end' }}>
          <div className="form-group" style={{ gridColumn: 'span 2', position: 'relative', zIndex: 50 }}>
            <label>Malzeme Adı *</label>
            <Select
              options={malzemeOptions}
              onChange={handleSelectChange}
              value={malzemeOptions.find(opt => opt.value === itemData.malzemeAdi) || null}
              placeholder="Ara veya seç..."
              isClearable
              noOptionsMessage={() => "Malzeme bulunamadı"}
              styles={{
                control: (base) => ({
                  ...base,
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderColor: 'var(--panel-border)',
                  color: 'white',
                  minHeight: '42px',
                  borderRadius: '8px'
                }),
                menu: (base) => ({
                  ...base,
                  background: '#1e293b',
                  color: 'white',
                  zIndex: 9999
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#3b82f6' : 'transparent',
                  color: 'white',
                  cursor: 'pointer'
                }),
                singleValue: (base) => ({
                  ...base,
                  color: 'white'
                }),
                input: (base) => ({
                  ...base,
                  color: 'white'
                })
              }}
            />
          </div>

          <div className="form-group">
            <label>Malz. Kodu (Poz No)</label>
            <input type="text" readOnly value={itemData.pozNo} placeholder="Otomatik" />
          </div>

          <div className="form-group">
            <label>Birim</label>
            <input type="text" readOnly value={itemData.birim} placeholder="Otomatik" />
          </div>

          <div className="form-group">
            <label>Miktar *</label>
            <input type="number" step="0.01" value={itemData.miktar} onChange={(e) => setItemData({...itemData, miktar: e.target.value})} />
          </div>

          <div className="form-group">
            <button type="button" onClick={handleAddToCart} className="btn btn-primary" style={{ width: '100%', background: '#3b82f6', marginBottom: '4px' }}>
              ➕ LİSTEYE EKLE
            </button>
          </div>
        </div>
      </div>

      {cartItems.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '0.5rem', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>Sıra</th>
                <th style={{ padding: '0.5rem', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>Malzeme Kodu</th>
                <th style={{ padding: '0.5rem', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>Malzeme Adı</th>
                <th style={{ padding: '0.5rem', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>Miktar</th>
                <th style={{ padding: '0.5rem', borderBottom: '2px solid #cbd5e1', textAlign: 'center' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>{index + 1}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{item.pozNo}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>{item.malzemeAdi}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>{item.miktar} {item.birim}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <button onClick={() => handleRemoveFromCart(index)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <button onClick={handleSubmit} className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem', backgroundColor: yazdirmaSecenegi !== 'Yok' ? '#f59e0b' : 'var(--primary-color)' }}>
          {yazdirmaSecenegi !== 'Yok' ? `ÖNİZLEME (${cartItems.length} Kalem)` : `KAYDET (${cartItems.length} Kalem)`}
        </button>
      </div>

      {alertState.isOpen && (
        <AlertModal 
          title={alertState.type === 'error' ? 'Hata' : (alertState.type === 'success' ? 'Başarılı' : 'Bilgi')}
          message={alertState.message}
          onClose={() => {
            setAlertState({ isOpen: false, message: '', type: 'info' })
            if (alertState.type === 'success' && yazdirmaSecenegi === 'Yok') {
              // Option to redirect or clear further if needed
            }
          }}
        />
      )}
    </div>
  )
}

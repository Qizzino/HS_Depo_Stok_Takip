import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import ConfirmModal from './ConfirmModal'
import AlertModal from './AlertModal'

export default function Malzemeler() {
  const [malzemeler, setMalzemeler] = useState([])
  const [duplicateItems, setDuplicateItems] = useState([])
  const [selectedPozNos, setSelectedPozNos] = useState([])
  const [formData, setFormData] = useState({ pozNo: '', adi: '', birim: '', birimFiyat: '', malzemeGrubu: '' })
  const [editingPozNo, setEditingPozNo] = useState(null)
  const [editFormData, setEditFormData] = useState({ adi: '', birim: '', birimFiyat: '', malzemeGrubu: '' })
  const fileInputRef = useRef(null)

  // Excel İçeri Aktar Önizleme State'i
  const [importPreviewData, setImportPreviewData] = useState(null)

  const [confirmState, setConfirmState] = useState({ isOpen: false, type: '', payload: null, message: '' })
  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'info' })

  const showAlert = (message, type = 'info') => setAlertState({ isOpen: true, message, type })

  const fetchMalzemeler = () => {
    fetch('http://localhost:3001/api/malzemeler')
      .then(res => res.json())
      .then(setMalzemeler)
  }

  useEffect(() => {
    fetchMalzemeler()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await fetch('http://localhost:3001/api/malzemeler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    if (res.ok) {
      setFormData({ pozNo: '', adi: '', birim: '', birimFiyat: '', malzemeGrubu: '' })
      fetchMalzemeler()
    } else {
      showAlert('Eklenirken hata oluştu', 'error')
    }
  }

  const handleDelete = async (pozNo) => {
    try {
      const res = await fetch(`http://localhost:3001/api/malzemeler/${encodeURIComponent(pozNo)}`, { method: 'DELETE' })
      if (res.ok) fetchMalzemeler()
    } catch (err) {
      showAlert('Sunucuya bağlanılamadı.', 'error')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPozNos.length === 0) return
    try {
      const res = await fetch('http://localhost:3001/api/malzemeler/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pozNos: selectedPozNos })
      })
      if (res.ok) {
        setSelectedPozNos([])
        fetchMalzemeler()
      } else {
        showAlert('Toplu silme sırasında bir hata oluştu.', 'error')
      }
    } catch (err) {
      showAlert('Sunucuya bağlanılamadı.', 'error')
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPozNos(malzemeler.map(m => m.poz_no))
    } else {
      setSelectedPozNos([])
    }
  }

  const handleSelectRow = (pozNo) => {
    if (selectedPozNos.includes(pozNo)) {
      setSelectedPozNos(selectedPozNos.filter(id => id !== pozNo))
    } else {
      setSelectedPozNos([...selectedPozNos, pozNo])
    }
  }

  const handleEditClick = (m) => {
    setEditingPozNo(m.poz_no)
    setEditFormData({
      adi: m.adi,
      birim: m.birim,
      birimFiyat: m.birim_fiyat || '',
      malzemeGrubu: m.malzeme_grubu || ''
    })
  }

  const handleEditSave = async (pozNo) => {
    const res = await fetch(`http://localhost:3001/api/malzemeler/${encodeURIComponent(pozNo)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editFormData)
    })
    if (res.ok) {
      setEditingPozNo(null)
      fetchMalzemeler()
    } else {
      showAlert('Güncellenirken hata oluştu', 'error')
    }
  }

  const handleEditCancel = () => {
    setEditingPozNo(null)
  }

  // --- EXCEL İÇE AKTAR ---
  const handleImportClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const data = new FormData()
    data.append('excel', file)

    try {
      const res = await fetch('http://localhost:3001/api/malzemeler/import?preview=true', {
        method: 'POST',
        body: data
      })
      const result = await res.json()
      if (res.ok) {
        // Yeni ve mükerrerleri state'e at, modalı aç
        const allItems = [
          ...result.newItems.map(i => ({ ...i, isNew: true, selected: true })),
          ...result.duplicateItems.map(i => ({ ...i, isNew: false, selected: false }))
        ]
        setImportPreviewData({ items: allItems, total: result.total })
      } else {
        showAlert('Hata: ' + result.error, 'error')
      }
    } catch (err) {
      showAlert('Yükleme sırasında hata oluştu.', 'error')
    }
    
    e.target.value = null // reset input
  }

  const handleBulkImportSave = async () => {
    if (!importPreviewData) return

    const selectedItems = importPreviewData.items.filter(i => i.selected)
    if (selectedItems.length === 0) {
      setImportPreviewData(null)
      return
    }

    try {
      const res = await fetch('http://localhost:3001/api/malzemeler/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedItems })
      })
      const result = await res.json()
      if (res.ok) {
        showAlert(`İçe Aktarma Tamamlandı!\nSeçilen ${result.count} malzeme başarıyla kaydedildi.`, 'success')
        setImportPreviewData(null)
        fetchMalzemeler()
      } else {
        showAlert('Hata: ' + result.error, 'error')
      }
    } catch (err) {
      showAlert('Kayıt sırasında hata oluştu.', 'error')
    }
  }

  // --- EXCEL DIŞA AKTAR ---
  const handleExportClick = () => {
    if (malzemeler.length === 0) return showAlert('Dışa aktarılacak malzeme yok.', 'error')

    // İstenen sütun isimleriyle yeni bir dizi oluşturuyoruz
    const exportData = malzemeler.map(m => ({
      'Malzeme Grubu': m.malzeme_grubu || '',
      'Malzeme Kodu': m.poz_no,
      'Malzeme kısa metni': m.adi,
      'Temel ölçü birimi': m.birim,
      'ortalama birim fiyat': m.birim_fiyat || 0
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Malzemeler")
    const fileName = "Malzeme_Listesi.xlsx"
    
    const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
    if (ipcRenderer) {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      ipcRenderer.invoke('save-and-open-excel', { fileName, buffer: wbout });
    } else {
      XLSX.writeFile(wb, fileName)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--text-secondary)' }}>Malzeme Tanımlama</h3>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Gizli Dosya Input'u */}
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          <button onClick={handleImportClick} className="btn btn-warning" style={{ background: '#f59e0b', color: 'white' }}>
            📥 EXCEL İÇE AKTAR
          </button>
          <button onClick={handleExportClick} className="btn btn-success" style={{ background: '#10b981', color: 'white' }}>
            📤 EXCEL DIŞA AKTAR
          </button>
        </div>
      </div>
      
      
      {/* EXCEL ÖNİZLEME MODALI */}
      {importPreviewData && (
        <div className="preview-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="preview-modal-container" style={{ maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
            <div className="preview-modal-header" style={{ background: 'var(--panel-bg)', borderBottom: '1px solid var(--panel-border)' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>📄 Excel Yükleme Önizlemesi</h3>
              <button onClick={() => setImportPreviewData(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div className="preview-modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Excel dosyasından <strong>{importPreviewData.total}</strong> malzeme okundu.
                Lütfen yüklenmesini istediğiniz malzemeleri seçin. Mükerrer malzemelerin seçimi varsayılan olarak kapalıdır.
              </p>
              
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={importPreviewData.items.every(i => i.selected)}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setImportPreviewData(prev => ({
                            ...prev,
                            items: prev.items.map(i => ({ ...i, selected: val }))
                          }))
                        }}
                      />
                    </th>
                    <th>Durum</th>
                    <th>Malzeme Grubu</th>
                    <th>Malzeme Kodu</th>
                    <th>Malzeme Adı</th>
                    <th>Birim</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreviewData.items.map((item, idx) => (
                    <tr key={idx} style={{ background: item.isNew ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.15)', color: 'var(--text-primary)' }}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={item.selected}
                          onChange={(e) => {
                            const newItems = [...importPreviewData.items];
                            newItems[idx].selected = e.target.checked;
                            setImportPreviewData({ ...importPreviewData, items: newItems });
                          }}
                        />
                      </td>
                      <td>
                        {item.isNew 
                          ? <span className="badge giris">YENİ</span> 
                          : <span className="badge ters" title="Sistemde Zaten Var">MÜKERRER</span>}
                      </td>
                      <td>{item.malzemeGrubu || '-'}</td>
                      <td>{item.pozNo}</td>
                      <td>
                        <input 
                          type="text" 
                          value={item.adi} 
                          onChange={(e) => {
                            const newItems = [...importPreviewData.items];
                            newItems[idx].adi = e.target.value;
                            setImportPreviewData({ ...importPreviewData, items: newItems });
                          }}
                          style={{ width: '100%', padding: '0.3rem', background: 'transparent', border: '1px solid var(--panel-border)', color: 'var(--text-primary)' }}
                        />
                      </td>
                      <td>{item.birim}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="preview-modal-footer" style={{ padding: '1rem', borderTop: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setImportPreviewData(null)} className="btn btn-secondary">İPTAL</button>
              <button onClick={handleBulkImportSave} className="btn btn-primary" style={{ background: '#10b981', fontWeight: 'bold' }}>
                ✅ SEÇİLİ OLANLARI ({importPreviewData.items.filter(i=>i.selected).length}) KAYDET
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-grid" style={{ marginBottom: '2rem' }}>
        <div className="form-group">
          <label>Malzeme Grubu</label>
          <input value={formData.malzemeGrubu} onChange={e => setFormData({...formData, malzemeGrubu: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Poz No (Kodu)</label>
          <input required value={formData.pozNo} onChange={e => setFormData({...formData, pozNo: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Malzeme Adı</label>
          <input required value={formData.adi} onChange={e => setFormData({...formData, adi: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Temel Ölçü Birimi (M, ADT, vb.)</label>
          <input required value={formData.birim} onChange={e => setFormData({...formData, birim: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Birim Fiyat (₺)</label>
          <input type="number" step="0.01" value={formData.birimFiyat} onChange={e => setFormData({...formData, birimFiyat: e.target.value})} />
        </div>
        <div className="form-group" style={{ alignSelf: 'end' }}>
          <button type="submit" className="btn btn-primary">EKLE</button>
        </div>
      </form>

      <div className="table-container">
        {selectedPozNos.length > 0 && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{selectedPozNos.length} öğe seçildi.</span>
            <button onClick={handleBulkDelete} className="btn btn-danger" style={{ fontWeight: 'bold' }}>
              🗑️ SEÇİLİ OLANLARI SİL
            </button>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={malzemeler.length > 0 && selectedPozNos.length === malzemeler.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Malzeme Grubu</th>
              <th>Poz No</th>
              <th>Malzeme Adı</th>
              <th>Temel Ölçü Birimi</th>
              <th>Birim Fiyat</th>
              <th style={{ textAlign: 'right' }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {malzemeler.map(m => {
              const isDuplicate = duplicateItems.includes(String(m.poz_no))
              const isEditing = editingPozNo === m.poz_no

              if (isEditing) {
                return (
                  <tr key={m.poz_no} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                    <td></td>
                    <td><input type="text" value={editFormData.malzemeGrubu} onChange={e => setEditFormData({...editFormData, malzemeGrubu: e.target.value})} style={{ width: '100%', padding: '0.4rem' }} /></td>
                    <td>{m.poz_no}</td>
                    <td><input type="text" value={editFormData.adi} onChange={e => setEditFormData({...editFormData, adi: e.target.value})} style={{ width: '100%', padding: '0.4rem' }} /></td>
                    <td><input type="text" value={editFormData.birim} onChange={e => setEditFormData({...editFormData, birim: e.target.value})} style={{ width: '100%', padding: '0.4rem' }} /></td>
                    <td><input type="number" step="0.01" value={editFormData.birimFiyat} onChange={e => setEditFormData({...editFormData, birimFiyat: e.target.value})} style={{ width: '100%', padding: '0.4rem' }} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleEditSave(m.poz_no)} className="btn btn-success" style={{ padding: '0.5rem', marginRight: '0.5rem' }}>KAYDET</button>
                      <button onClick={handleEditCancel} className="btn btn-secondary" style={{ padding: '0.5rem' }}>İPTAL</button>
                    </td>
                  </tr>
                )
              }

              return (
              <tr key={m.poz_no} style={isDuplicate ? { backgroundColor: '#fef3c7' } : {}}>
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox"
                    checked={selectedPozNos.includes(m.poz_no)}
                    onChange={() => handleSelectRow(m.poz_no)}
                  />
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{m.malzeme_grubu || '-'}</td>
                <td>
                  {m.poz_no}
                  {isDuplicate && <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#b45309', fontWeight: 'bold' }}>(Mükerrer)</span>}
                </td>
                <td style={{ fontWeight: 600 }}>{m.adi}</td>
                <td>{m.birim}</td>
                <td style={{ color: 'var(--accent-color)' }}>
                  {m.birim_fiyat ? parseFloat(m.birim_fiyat).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : '-'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => handleEditClick(m)} className="btn btn-warning" style={{ padding: '0.5rem 1rem', marginRight: '0.5rem', background: '#eab308' }}>DÜZENLE</button>
                  <button onClick={() => handleDelete(m.poz_no)} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>SİL</button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {alertState.isOpen && (
        <AlertModal 
          title={alertState.type === 'error' ? 'Hata' : 'Bilgi'}
          message={alertState.message}
          onClose={() => setAlertState({ isOpen: false, message: '', type: 'info' })}
        />
      )}
    </div>
  )
}

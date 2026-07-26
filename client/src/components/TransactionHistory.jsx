import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react'
import * as XLSX from 'xlsx'
import EditTransactionModal from './EditTransactionModal'
import ConfirmModal from './ConfirmModal'
import AlertModal from './AlertModal'

export default function TransactionHistory({ currentUser, onPrint }) {
  const [history, setHistory] = useState([])
  const [selectedDepo, setSelectedDepo] = useState('Tüm Depolar')
  const [depolarListesi, setDepolarListesi] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50
  const fileInputRef = useRef(null)
  
  // Düzenleme Modu State'leri
  const [editingRow, setEditingRow] = useState(null)
  const [showAdminPrompt, setShowAdminPrompt] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [pendingEditRow, setPendingEditRow] = useState(null)
  const [adminActionType, setAdminActionType] = useState('edit') // 'edit' | 'bulkDelete' | 'delete'

  // Toplu Silme & Arama State'leri
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  
  const [viewMode, setViewMode] = useState('detailed') // 'detailed' | 'grouped'

  const [confirmState, setConfirmState] = useState({ isOpen: false, type: '', message: '' })
  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: '' })

  const fetchHistory = () => {
    fetch(`http://localhost:3001/api/hareketler?depo=${selectedDepo}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data)
        
        // Eğer depolar listesi boşsa, ilk fetch'te doldur (benzersiz depo isimleri)
        if (depolarListesi.length === 0) {
          const uniqueDepolar = [...new Set(data.map(d => d.depo_adi).filter(Boolean))]
          setDepolarListesi(uniqueDepolar)
        }
      })
      .catch(console.error)
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchHistory()
  }, [selectedDepo]) // Depo değiştiğinde yeniden çek ve sayfayı 1'e al

  const handleDeleteRequest = (id) => {
    if (currentUser?.role === 'admin') {
      setConfirmState({ isOpen: true, type: 'singleDelete', message: 'Bu stok hareketini tamamen silmek istediğinize emin misiniz?' })
      setPendingEditRow({ id })
    } else {
      setPendingEditRow({ id })
      setAdminActionType('delete')
      setShowAdminPrompt(true)
    }
  }

  const executeDelete = async (id) => {
    const res = await fetch(`http://localhost:3001/api/hareketler/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
      fetchHistory()
    } else {
      setAlertState({ isOpen: true, message: 'İşlem silinirken hata oluştu.', type: 'error' })
    }
  }

  // --- TOPLU SİLME MANTIĞI ---
  const handleBulkDeleteRequest = () => {
    if (selectedIds.length === 0) return setAlertState({ isOpen: true, message: 'Lütfen silinecek satırları seçin.', type: 'error' })
    if (currentUser?.role === 'admin') {
      setConfirmState({ isOpen: true, type: 'bulkDelete', message: `Seçilen ${selectedIds.length} adet kaydı silmek istediğinize emin misiniz?` })
    } else {
      setAdminActionType('bulkDelete')
      setShowAdminPrompt(true)
    }
  }

  const handleConfirmAction = () => {
    if (confirmState.type === 'singleDelete') {
      executeDelete(pendingEditRow.id)
    } else if (confirmState.type === 'bulkDelete') {
      executeBulkDelete()
    }
    setConfirmState({ isOpen: false, type: '', message: '' })
  }

  const executeBulkDelete = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/hareketler/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (res.ok) {
        setSelectedIds([])
        fetchHistory()
      } else {
        setAlertState({ isOpen: true, message: 'Toplu silme sırasında bir hata oluştu.', type: 'error' })
      }
    } catch (err) {
      setAlertState({ isOpen: true, message: 'Bağlantı hatası.', type: 'error' })
    }
  }

  const handleEditRequest = (row) => {
    if (currentUser?.role === 'admin') {
      // Zaten adminse direkt düzenlemeyi aç
      setEditingRow(row)
    } else {
      // Değilse şifre sor
      setPendingEditRow(row)
      setAdminActionType('edit')
      setShowAdminPrompt(true)
    }
  }

  const handleAdminVerify = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      })
      if (res.ok) {
        setShowAdminPrompt(false)
        setAdminPassword('')
        if (adminActionType === 'edit') {
          setEditingRow(pendingEditRow)
        } else if (adminActionType === 'bulkDelete') {
          executeBulkDelete()
        } else if (adminActionType === 'delete') {
          executeDelete(pendingEditRow.id)
        }
      } else {
        setAlertState({ isOpen: true, message: 'Hatalı veya yetkisiz şifre!', type: 'error' })
      }
    } catch (err) {
      setAlertState({ isOpen: true, message: 'Bağlantı hatası.', type: 'error' })
    }
  }

  const handleExport = () => {
    if (history.length === 0) return setAlertState({ isOpen: true, message: 'Dışa aktarılacak işlem hareketi yok.', type: 'info' })

    const exportData = history.map(row => ({
      'İşlem ID': row.id,
      'İşlem Tarihi': new Date(row.islem_tarihi).toLocaleString('tr-TR'),
      'İşlem Türü': row.islem_turu,
      'ANA DEPO': row.depo_adi,
      'Malzeme Grubu': row.malzeme_grubu || '',
      'Poz Numarası': row.poz_no,
      'Malzeme Adı': row.malzeme_adi,
      'Miktar': row.miktar,
      'Birim': row.birim,
      'Birim Fiyat': row.birim_fiyat || 0,
      'İşlem Depo Adı': row.transfer_depo || '',
      'İhale Grubu': row.ihale_grubu || '',
      'Belge No': row.belge_no || '',
      'Proje Adı': row.proje_adi || '',
      'İŞLEM YAPAN DEPO PERSONELİ': row.islem_yapan || '',
      'TESLİM ALAN': row.teslim_alan || '',
      'Ters Kayıt Transfer edilen Depo': row.islem_turu === 'Ters Kayıt' ? (row.transfer_depo || '') : '',
      'Toplam Tutar': (row.miktar * (row.birim_fiyat || 0))
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Stok Hareketleri")
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${yyyy}.${mm}.${dd}`;

    const fileName = selectedDepo === 'Tüm Depolar' 
      ? `${datePrefix}_tum_stok_hareketleri.xlsx` 
      : `${datePrefix}_${selectedDepo}_stok_hareketleri.xlsx`
    
    const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
    if (ipcRenderer) {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      ipcRenderer.invoke('save-and-open-excel', { fileName, buffer: wbout });
    } else {
      XLSX.writeFile(wb, fileName)
    }
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
      const res = await fetch('http://localhost:3001/api/hareketler/import', {
        method: 'POST',
        body: data
      })
      const result = await res.json()
      if (res.ok) {
        setAlertState({ isOpen: true, message: `Geçmiş Stok Hareketleri İçe Aktarıldı!\nToplam Aktarılan Satır: ${result.count}`, type: 'success' })
        fetchHistory()
      } else {
        setAlertState({ isOpen: true, message: 'Hata: ' + result.error, type: 'error' })
      }
    } catch (err) {
      setAlertState({ isOpen: true, message: 'Yükleme sırasında hata oluştu.', type: 'error' })
    }
    
    e.target.value = null // reset input
  }

  const handleExportCikis = () => {
    const cikisHistory = history.filter(h => ['Çıkış', 'İade Girişi'].includes(h.islem_turu))
    if (cikisHistory.length === 0) return setAlertState({ isOpen: true, message: 'Dışa aktarılacak saha çıkış veya sahadan iade işlemi yok.', type: 'info' })

    const exportData = cikisHistory.map(row => ({
      'İşlem ID': row.id,
      'İşlem Tarihi': new Date(row.islem_tarihi).toLocaleString('tr-TR'),
      'İşlem Türü': row.islem_turu,
      'ANA DEPO': row.depo_adi,
      'Malzeme Grubu': row.malzeme_grubu || '',
      'Poz Numarası': row.poz_no,
      'Malzeme Adı': row.malzeme_adi,
      'Miktar': row.miktar,
      'Birim': row.birim,
      'Birim Fiyat': row.birim_fiyat || 0,
      'İşlem Depo Adı': row.transfer_depo || '',
      'İhale Grubu': row.ihale_grubu || '',
      'Belge No': row.belge_no || '',
      'Proje Adı': row.proje_adi || '',
      'İŞLEM YAPAN DEPO PERSONELİ': row.islem_yapan || '',
      'TESLİM ALAN': row.teslim_alan || '',
      'Ters Kayıt Transfer edilen Depo': row.islem_turu === 'Ters Kayıt' ? (row.transfer_depo || '') : '',
      'Toplam Tutar': (row.miktar * (row.birim_fiyat || 0))
    }))

    const ws1 = XLSX.utils.json_to_sheet(exportData)
    
    // 2. Sekme: Özet Tablo (Pivot)
    const summary = {}
    cikisHistory.forEach(row => {
      const islemYonu = row.islem_turu === 'Çıkış' ? 1 : -1;
      const miktar = Math.abs(row.miktar) * islemYonu;
      const taseron = row.transfer_depo || 'Belirtilmemiş'
      const proje = row.proje_adi || 'Belirtilmemiş'
      const malzeme = row.malzeme_adi
      
      const key = `${taseron}_${proje}_${malzeme}`
      if (!summary[key]) {
        summary[key] = {
          'Taşeron (İşlem Depo)': taseron,
          'Proje Adı': proje,
          'Malzeme Kodu': row.poz_no,
          'Malzeme Adı': malzeme,
          'Net Çıkış (Miktar)': 0,
          'Birim': row.birim
        }
      }
      summary[key]['Net Çıkış (Miktar)'] += miktar
    })
    
    const pivotData = Object.values(summary).filter(r => r['Net Çıkış (Miktar)'] !== 0)
    pivotData.sort((a,b) => a['Taşeron (İşlem Depo)'].localeCompare(b['Taşeron (İşlem Depo)']) || a['Proje Adı'].localeCompare(b['Proje Adı']))
    const ws2 = XLSX.utils.json_to_sheet(pivotData)

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws1, "Çıkış Raporu")
    XLSX.utils.book_append_sheet(wb, ws2, "Özet Tablo (Pivot)")
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${yyyy}.${mm}.${dd}`;
    const fileName = `${datePrefix}_Depo_Cikislari.xlsx`;    
    const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
    if (ipcRenderer) {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      ipcRenderer.invoke('save-and-open-excel', { fileName, buffer: wbout });
    } else {
      XLSX.writeFile(wb, fileName)
    }
  }

  // --- TABLO FİLTRELEME VE SAYFALAMA ---
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredHistory = useMemo(() => {
    if (!debouncedSearch) return history;
    const term = debouncedSearch.toLowerCase()
    return history.filter(row => {
      return (
        (row.malzeme_adi || '').toLowerCase().includes(term) ||
        (row.poz_no || '').toLowerCase().includes(term) ||
        (row.proje_adi || '').toLowerCase().includes(term) ||
        (row.transfer_depo || '').toLowerCase().includes(term) ||
        (row.ihale_grubu || '').toLowerCase().includes(term) ||
        (row.belge_no || '').toLowerCase().includes(term) ||
        (row.islem_turu || '').toLowerCase().includes(term)
      )
    })
  }, [history, debouncedSearch]);

  // Gruplama Mantığı (Performans için useMemo kullanıldı)
  const groupedHistory = useMemo(() => {
    if (viewMode !== 'grouped') return [];
    
    return Object.values(filteredHistory.reduce((acc, row) => {
      const key = row.islem_no || `eski-${row.id}`;
      if (!acc[key]) {
        acc[key] = {
          id: key, 
          islem_no: row.islem_no,
          islem_tarihi: row.islem_tarihi,
          islem_turu: row.islem_turu,
          ihale_grubu: row.ihale_grubu,
          proje_adi: row.proje_adi,
          depo_adi: row.depo_adi,
          transfer_depo: row.transfer_depo,
          islem_yapan: row.islem_yapan,
          teslim_alan: row.teslim_alan,
          irsaliye_no: row.irsaliye_no,
          kalem_sayisi: 0,
          items: []
        };
      }
      acc[key].items.push(row);
      acc[key].kalem_sayisi++;
      return acc;
    }, {}));
  }, [filteredHistory, viewMode]);

  const listToPaginate = viewMode === 'grouped' ? groupedHistory : filteredHistory;

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = listToPaginate.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(listToPaginate.length / itemsPerPage)

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      if (viewMode === 'grouped') {
        const ids = listToPaginate.flatMap(row => row.items.map(i => i.id))
        setSelectedIds(ids)
      } else {
        const ids = listToPaginate.map(row => row.id)
        setSelectedIds(ids)
      }
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (row) => {
    if (viewMode === 'grouped') {
      const itemIds = row.items.map(i => i.id);
      const isSelected = itemIds.every(id => selectedIds.includes(id));
      if (isSelected) {
        setSelectedIds(prev => prev.filter(id => !itemIds.includes(id)));
      } else {
        setSelectedIds(prev => [...prev, ...itemIds.filter(id => !prev.includes(id))]);
      }
    } else {
      if (selectedIds.includes(row.id)) {
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== row.id))
      } else {
        setSelectedIds(prev => [...prev, row.id])
      }
    }
  }

  const handleDeleteGroupRequest = (group) => {
    const idsToDelete = group.items.map(i => i.id);
    setSelectedIds(idsToDelete); 
    if (currentUser?.role === 'admin') {
      setConfirmState({ isOpen: true, type: 'bulkDelete', message: `Seçilen gruptaki ${idsToDelete.length} adet kaydı silmek istediğinize emin misiniz?` })
    } else {
      setAdminActionType('bulkDelete');
      setShowAdminPrompt(true);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>📝 Geçmiş Stok Hareketleri</h1>
        <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Toplam <strong>{history.length}</strong> stok hareketi kaydedildi.
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', margin: 0 }}>Stok Hareketleri (Geçmiş)</h3>
          <input 
            type="text" 
            placeholder="Malzeme, Proje, Depo Ara..." 
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', color: 'var(--text-primary)', width: '300px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDeleteRequest} className="btn btn-danger" style={{ background: '#ef4444', color: 'white', padding: '0.8rem 1.5rem', whiteSpace: 'nowrap' }}>
              🗑️ SEÇİLENLERİ SİL ({selectedIds.length})
            </button>
          )}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select 
              value={selectedDepo} 
              onChange={e => setSelectedDepo(e.target.value)}
              style={{ minWidth: '200px' }}
            >
              <option value="Tüm Depolar">Tüm Depolar</option>
              {depolarListesi.map(depo => (
                <option key={depo} value={depo}>{depo}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', background: 'var(--bg-color)', borderRadius: '8px', padding: '0.2rem', border: '1px solid var(--panel-border)' }}>
            <button 
              onClick={() => { setViewMode('detailed'); setCurrentPage(1); }} 
              style={{ background: viewMode === 'detailed' ? 'var(--panel-border)' : 'transparent', color: viewMode === 'detailed' ? 'white' : 'var(--text-secondary)', padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: viewMode === 'detailed' ? 'bold' : 'normal' }}
            >
              Detaylı Görünüm
            </button>
            <button 
              onClick={() => { setViewMode('grouped'); setCurrentPage(1); }} 
              style={{ background: viewMode === 'grouped' ? 'var(--panel-border)' : 'transparent', color: viewMode === 'grouped' ? 'white' : 'var(--text-secondary)', padding: '0.6rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: viewMode === 'grouped' ? 'bold' : 'normal' }}
            >
              İşlem Bazlı Grupla
            </button>
          </div>

          <button onClick={handleExportCikis} className="btn btn-info" style={{ background: '#0ea5e9', color: 'white', padding: '0.8rem 1.5rem', whiteSpace: 'nowrap' }}>
            📊 ÇIKIŞ RAPORU (EXCEL)
          </button>

          {/* Gizli Dosya Input'u */}
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          <button onClick={handleImportClick} className="btn btn-primary" style={{ background: '#3b82f6', color: 'white', padding: '0.8rem 1.5rem', whiteSpace: 'nowrap' }}>
            📥 İÇE AKTAR (EXCEL)
          </button>
          
          <button onClick={handleExport} className="btn btn-warning" style={{ background: '#f59e0b', color: 'white', padding: '0.8rem 1.5rem', whiteSpace: 'nowrap' }}>
            📤 TÜM HAREKETLER (EXCEL)
          </button>
        </div>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            {viewMode === 'detailed' ? (
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === filteredHistory.length}
                    onChange={handleSelectAll}
                    style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                  />
                </th>
                <th>İşlem No</th>
                <th>Tarih</th>
                <th>İşlem Türü</th>
                <th>Malzeme Grubu</th>
                <th>Poz No</th>
                <th>Malzeme Adı</th>
                <th>Miktar</th>
                <th>Birim</th>
                <th>Ana Depo</th>
                <th>İşlem Depo</th>
                <th>İşlem Yeri</th>
                <th>Proje Adı</th>
                <th>Belge No</th>
                <th>İşlemi Yapan</th>
                <th>Teslim Alan</th>
                <th style={{ textAlign: 'right' }}>İşlem</th>
              </tr>
            ) : (
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === groupedHistory.flatMap(g => g.items).length}
                    onChange={handleSelectAll}
                    style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                  />
                </th>
                <th>İşlem No</th>
                <th>Tarih</th>
                <th>İşlem Türü</th>
                <th>İşlem Yeri (İhale / Proje)</th>
                <th>İşlemi Yapan</th>
                <th>Teslim Alan</th>
                <th style={{ textAlign: 'center' }}>Kalem Sayısı</th>
                <th style={{ textAlign: 'right' }}>İşlem</th>
              </tr>
            )}
          </thead>
          <tbody>
            {currentItems.map((row, index) => {
              if (viewMode === 'detailed') {
                const isFirstOfTransaction = !row.islem_no || index === 0 || currentItems[index - 1].islem_no !== row.islem_no;
                return (
                  <tr key={row.id} style={{ backgroundColor: selectedIds.includes(row.id) ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(row.id)}
                        onChange={() => handleSelectRow(row)}
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{row.islem_no || '-'}</td>
                    <td>{new Date(row.islem_tarihi).toLocaleString('tr-TR')}</td>
                    <td>
                      <span className={`badge ${
                        row.islem_turu === 'Giriş' ? 'giris' : 
                        row.islem_turu === 'Çıkış' ? 'cikis' : 
                        row.islem_turu === 'İade Girişi' ? 'giris' : 
                        row.islem_turu === 'İade Çıkışı' ? 'cikis' : 
                        row.islem_turu === 'Ters Kayıt' ? 'ters' : ''
                      }`}>
                        {row.islem_turu}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{row.malzeme_grubu || '-'}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{row.poz_no}</td>
                    <td>{row.malzeme_adi}</td>
                    <td style={{ fontWeight: 600, color: row.miktar < 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                      {row.miktar}
                    </td>
                    <td>{row.birim}</td>
                    <td style={{ fontWeight: 600 }}>{row.depo_adi}</td>
                    <td>{row.transfer_depo || '-'}</td>
                    <td>{row.ihale_grubu}</td>
                    <td>{row.proje_adi}</td>
                    <td>{row.belge_no}</td>
                    <td><span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{row.islem_yapan || '-'}</span></td>
                    <td><span style={{ color: '#d97706', fontWeight: 'bold' }}>{row.teslim_alan || '-'}</span></td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {row.ek_belge && (
                        <a href={row.ek_belge} target="_blank" rel="noreferrer" className="btn btn-warning" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#3b82f6', textDecoration: 'none' }}>
                          📎
                        </a>
                      )}
                      {row.islem_turu !== 'Ters Kayıt' && isFirstOfTransaction && (
                        <button 
                          onClick={() => {
                            let groupItems = [row];
                            if (row.islem_no) {
                               groupItems = history.filter(h => h.islem_no === row.islem_no);
                            }
                            
                            onPrint({
                              yazdirmaSecenegi: row.irsaliye_no ? 'İrsaliye' : 'Tutanak',
                              irsaliyeNo: row.irsaliye_no,
                              depoAdi: row.transfer_depo || row.depo_adi,
                              ihaleGrubu: row.ihale_grubu,
                              projeAdi: row.proje_adi,
                              islemYapan: row.islem_yapan,
                              teslimAlan: row.teslim_alan,
                              items: groupItems.map(g => ({
                                pozNo: g.poz_no,
                                malzemeAdi: g.malzeme_adi,
                                miktar: Math.abs(g.miktar),
                                birim: g.birim
                              }))
                            })
                          }} 
                          className="btn btn-success" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          title="İşlemi Yazdır"
                        >
                          🖨️ YAZDIR
                        </button>
                      )}
                      <button onClick={() => handleEditRequest(row)} className="btn btn-warning" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#eab308' }}>DÜZENLE</button>
                      <button onClick={() => handleDeleteRequest(row.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>SİL</button>
                    </td>
                  </tr>
                )
              } else {
                return (
                  <tr key={row.id} style={{ backgroundColor: selectedIds.includes(row.id) ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={row.items.every(i => selectedIds.includes(i.id))}
                        onChange={() => handleSelectRow(row)}
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{row.islem_no || '-'}</td>
                    <td>{new Date(row.islem_tarihi).toLocaleString('tr-TR')}</td>
                    <td>
                      <span className={`badge ${
                        row.islem_turu === 'Giriş' ? 'giris' : 
                        row.islem_turu === 'Çıkış' ? 'cikis' : 
                        row.islem_turu === 'İade Girişi' ? 'giris' : 
                        row.islem_turu === 'İade Çıkışı' ? 'cikis' : 
                        row.islem_turu === 'Ters Kayıt' ? 'ters' : ''
                      }`}>
                        {row.islem_turu}
                      </span>
                    </td>
                    <td>{row.ihale_grubu || '-'} {row.proje_adi ? ` / ${row.proje_adi}` : ''}</td>
                    <td><span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{row.islem_yapan || '-'}</span></td>
                    <td><span style={{ color: '#d97706', fontWeight: 'bold' }}>{row.teslim_alan || '-'}</span></td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.kalem_sayisi}</td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {row.islem_turu !== 'Ters Kayıt' && (
                        <button 
                          onClick={() => {
                            onPrint({
                              yazdirmaSecenegi: row.irsaliye_no ? 'İrsaliye' : 'Tutanak',
                              irsaliyeNo: row.irsaliye_no,
                              depoAdi: row.transfer_depo || row.depo_adi,
                              ihaleGrubu: row.ihale_grubu,
                              projeAdi: row.proje_adi,
                              islemYapan: row.islem_yapan,
                              teslimAlan: row.teslim_alan,
                              items: row.items.map(g => ({
                                pozNo: g.poz_no,
                                malzemeAdi: g.malzeme_adi,
                                miktar: Math.abs(g.miktar),
                                birim: g.birim
                              }))
                            })
                          }} 
                          className="btn btn-success" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          title="Tüm Kalemleri Yazdır"
                        >
                          🖨️ YAZDIR
                        </button>
                      )}
                      <button onClick={() => handleDeleteGroupRequest(row)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} title="Tüm Kalemleri Sil">SİL</button>
                    </td>
                  </tr>
                )
              }
            })}
            {listToPaginate.length === 0 && (
              <tr>
                <td colSpan="15" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Henüz stok hareketi bulunmamaktadır veya aramaya uygun sonuç yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', color: 'var(--text-secondary)' }}>
        <div>
          Toplam {listToPaginate.length} işlem kaydından {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, listToPaginate.length)} arası gösteriliyor.
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Önceki
          </button>
          <span style={{ padding: '0.5rem 1rem', background: 'var(--panel-bg)', borderRadius: '4px' }}>
            Sayfa {currentPage} / {totalPages || 1}
          </span>
          <button 
            disabled={currentPage === totalPages || totalPages === 0} 
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Sonraki
          </button>
        </div>
      </div>

      {/* Admin Şifre İsteme Modalı */}
      {showAdminPrompt && (
        <div className="preview-modal-overlay">
          <div className="preview-modal-container" style={{ maxWidth: '400px', padding: '2rem', background: 'white', borderRadius: '12px' }}>
            <h3 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>Admin Onayı Gerekli</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Bu işlemi yapmak için yönetici şifresine ihtiyacınız var.</p>
            <input 
              type="password" 
              placeholder="Admin Şifresi" 
              value={adminPassword} 
              onChange={e => setAdminPassword(e.target.value)} 
              style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => { setShowAdminPrompt(false); setAdminPassword(''); setPendingEditRow(null); }}>İptal</button>
              <button className="btn btn-primary" onClick={handleAdminVerify}>Onayla</button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modalı */}
      {editingRow && (
        <EditTransactionModal 
          row={editingRow} 
          depolarListesi={depolarListesi} 
          onClose={() => setEditingRow(null)} 
          onSuccess={() => {
            setEditingRow(null)
            fetchHistory()
          }} 
        />
      )}

      {confirmState.isOpen && (
        <ConfirmModal 
          title="Onay"
          message={confirmState.message}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmState({ isOpen: false, type: '', message: '' })}
        />
      )}

      {alertState.isOpen && (
        <AlertModal 
          title="Bilgi"
          message={alertState.message}
          onClose={() => setAlertState({ isOpen: false, message: '', type: '' })}
        />
      )}

    </div>
  )
}

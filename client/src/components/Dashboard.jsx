import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import Select from 'react-select'

// Excel Filtre Bileşeni (Render döngüsünden çıkması için dışarıda tanımlandı)
const ExcelFilterDropdown = ({ colKey, rawData, currentFilter, onApply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });

  const allValues = Array.from(new Set(rawData.map(row => {
    const val = row[colKey];
    const strVal = String(val || '').trim();
    if (val === 0 || strVal === '-' || strVal === '' || strVal === '0' || val === null || val === undefined) return '(Boş)';
    return strVal;
  }))).sort();

  const isAllSelectedProps = currentFilter === undefined;
  const [localSet, setLocalSet] = useState(new Set(isAllSelectedProps ? allValues : currentFilter));

  const handleOpen = () => {
    setLocalSet(new Set(isAllSelectedProps ? allValues : currentFilter));
    setSearchTerm('');
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      let leftPos = rect.left;
      if (leftPos + 220 > window.innerWidth) leftPos = window.innerWidth - 240;
      setMenuCoords({ top: rect.bottom + 5, left: leftPos });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredValues = allValues.filter(v => v.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const toggleValue = (val) => {
    const newSet = new Set(localSet);
    if (newSet.has(val)) newSet.delete(val);
    else newSet.add(val);
    setLocalSet(newSet);
  };
  
  const toggleAll = () => {
    if (localSet.size === allValues.length) setLocalSet(new Set());
    else setLocalSet(new Set(allValues));
  };
  
  const handleApply = () => {
    if (localSet.size === allValues.length) onApply(undefined);
    else onApply(Array.from(localSet));
    setIsOpen(false);
  };

  return (
    <div style={{ display: 'inline-block', marginLeft: '5px' }}>
      <button ref={buttonRef} onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isAllSelectedProps ? 'var(--text-secondary)' : 'var(--primary-color)', fontSize: '0.8rem', padding: '2px', outline: 'none' }}>
        ▼
      </button>
      
      {isOpen && createPortal(
        <div ref={dropdownRef} style={{
          position: 'fixed', top: menuCoords.top, left: menuCoords.left, zIndex: 999999,
          background: '#1e293b', border: '1px solid var(--panel-border)', borderRadius: '6px',
          padding: '10px', width: '220px', minWidth: '200px', height: '320px', minHeight: '200px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
          display: 'flex', flexDirection: 'column',
          textAlign: 'left', fontWeight: 'normal', color: 'var(--text-primary)',
          resize: 'both', overflow: 'hidden'
        }}>
          <input type="text" placeholder="Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', marginBottom: '10px', padding: '6px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--panel-border)', borderRadius: '4px', outline: 'none' }} />
          
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', borderBottom: '1px solid var(--panel-border)', paddingBottom: '5px', marginBottom: '5px' }}>
              <input type="checkbox" checked={localSet.size === allValues.length} onChange={toggleAll} style={{ transform: 'scale(1.2)' }} />
              (Tümünü Seç)
            </label>
            {filteredValues.map(val => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={localSet.has(val)} onChange={() => toggleValue(val)} style={{ transform: 'scale(1.2)' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', borderTop: '1px solid var(--panel-border)', paddingTop: '10px' }}>
            <button onClick={() => setIsOpen(false)} style={{ padding: '5px 10px', background: 'transparent', color: 'white', border: '1px solid var(--panel-border)', borderRadius: '4px', cursor: 'pointer' }}>İptal</button>
            <button onClick={handleApply} style={{ padding: '5px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Uygula</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState([])
  const [history, setHistory] = useState([])
  const [selectedDepo, setSelectedDepo] = useState('Tüm Depolar')
  const [activeTab, setActiveTab] = useState('stok')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50;

  const [selectedProjeler, setSelectedProjeler] = useState([])
  const [selectedTaseronlar, setSelectedTaseronlar] = useState([])
  const [selectedTedarikciler, setSelectedTedarikciler] = useState([])

  // Sütun Filtreleri State'i (Her sekme için ayrı bir obje)
  const [columnFilters, setColumnFilters] = useState({
    stok: {},
    proje: {},
    taseron: {},
    tedarikci_giris: {}
  })

  // --- AKILLI FİLTRELEME MANTIĞI (DİZİ TABANLI) ---
  const applyColumnFilters = (dataArray, filterObj) => {
    return dataArray.filter(row => {
      return Object.entries(filterObj).every(([key, filterValues]) => {
        if (filterValues === undefined) return true; // Undefined = Tümünü göster
        if (filterValues.length === 0) return false; // Boş dizi = Hiçbirini gösterme
        
        const cellValue = row[key];
        const strCell = String(cellValue || '').trim();
        const isEmpty = cellValue === 0 || strCell === '-' || strCell === '' || strCell === '0' || cellValue === null || cellValue === undefined;
        
        if (isEmpty && filterValues.includes('(Boş)')) return true;
        
        return filterValues.includes(strCell);
      });
    });
  }

  const updateFilter = (tab, col, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [tab]: { ...prev[tab], [col]: value }
    }))
  }

  const clearTabFilters = (tabId) => {
    setColumnFilters(prev => ({ ...prev, [tabId]: {} }))
  }


  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      background: 'rgba(15, 23, 42, 0.6)',
      borderColor: state.isFocused ? 'var(--accent-color)' : 'var(--panel-border)',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
      color: 'var(--text-primary)',
      '&:hover': { borderColor: 'var(--accent-color)' }
    }),
    menu: (base) => ({
      ...base,
      background: '#1e293b',
      border: '1px solid var(--panel-border)',
      zIndex: 100
    }),
    option: (base, state) => ({
      ...base,
      background: state.isFocused ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
      color: 'var(--text-primary)',
      cursor: 'pointer'
    }),
    singleValue: (base) => ({ ...base, color: 'var(--text-primary)' }),
    input: (base) => ({ ...base, color: 'var(--text-primary)' }),
    placeholder: (base) => ({ ...base, color: 'var(--text-secondary)' }),
    multiValue: (base) => ({ ...base, background: 'var(--accent-color)', borderRadius: '4px' }),
    multiValueLabel: (base) => ({ ...base, color: 'white', fontWeight: '500' }),
    multiValueRemove: (base) => ({
      ...base,
      color: 'white',
      ':hover': { background: 'var(--danger-color)', color: 'white' }
    })
  }

  useEffect(() => {
    fetch('http://localhost:3001/api/ozet')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetch(`http://localhost:3001/api/hareketler?depo=${selectedDepo}`)
      .then(res => res.json())
      .then(setHistory)
      .catch(console.error)
  }, [selectedDepo])

  // -- 1. GENEL STOK DURUMU --
  const filteredData = useMemo(() => selectedDepo === 'Tüm Depolar' ? data : data.filter(d => d.depo_adi === selectedDepo), [data, selectedDepo]);
  const malzemeler = useMemo(() => [...new Set(filteredData.map(d => d.malzeme_adi))], [filteredData]);
  const gruplar = useMemo(() => [...new Set(filteredData.map(d => d.ihale_grubu))], [filteredData]);
  const depolarListesi = useMemo(() => [...new Set(data.map(d => d.depo_adi).filter(Boolean))], [data]);

  const genelDepoDegeri = useMemo(() => {
    const malzemeTotals = {};
    filteredData.forEach(d => {
      if (!malzemeTotals[d.malzeme_adi]) {
        malzemeTotals[d.malzeme_adi] = { miktar: 0, fiyat: d.birim_fiyat || 0 };
      }
      malzemeTotals[d.malzeme_adi].miktar += d.net_stok;
    });
    return Object.values(malzemeTotals).reduce((acc, obj) => acc + (obj.miktar * obj.fiyat), 0);
  }, [filteredData]);

  const historyStats = useMemo(() => {
    const stats = {};
    history.forEach(h => {
      if (!stats[h.malzeme_adi]) stats[h.malzeme_adi] = { giren: 0, cikan: 0 };
      if (h.islem_turu === 'Giriş' || h.islem_turu === 'İade Girişi') stats[h.malzeme_adi].giren += Math.abs(h.miktar);
      if (h.islem_turu === 'Çıkış' || h.islem_turu === 'İade Çıkışı') stats[h.malzeme_adi].cikan += Math.abs(h.miktar);
    });
    return stats;
  }, [history]);

  // Genel Stok Tablosu Verisini Hazırlama
  const rawGenelStokData = useMemo(() => {
    const summary = {};
    const localGruplar = new Set();
    
    filteredData.forEach(d => {
      const malzeme = d.malzeme_adi;
      const grup = d.ihale_grubu;
      if (grup) localGruplar.add(grup);
      
      if (!summary[malzeme]) {
        summary[malzeme] = {
          'Malzeme Grubu': d.malzeme_grubu || '-',
          'Malzeme Kodu': d.poz_no,
          'Malzeme Adı': malzeme,
          'Birim': d.birim || '-',
          'Birim Fiyat': d.birim_fiyat || 0,
          'Toplam Giren': historyStats[malzeme]?.giren || 0,
          'Toplam Çıkan': historyStats[malzeme]?.cikan || 0,
          'Kalan Stok (Net)': 0
        };
      }
      
      if (grup) {
        if (!summary[malzeme][grup]) summary[malzeme][grup] = 0;
        summary[malzeme][grup] += d.net_stok;
      }
      summary[malzeme]['Kalan Stok (Net)'] += d.net_stok;
    });

    return Object.values(summary).map(row => {
      row['Değer (₺)'] = row['Kalan Stok (Net)'] * row['Birim Fiyat'];
      localGruplar.forEach(g => {
        if (row[g] === undefined) row[g] = 0;
      });
      return row;
    });
  }, [filteredData, historyStats]);

  const filteredGenelStokData = useMemo(() => applyColumnFilters(rawGenelStokData, columnFilters.stok), [rawGenelStokData, columnFilters.stok]);

  // -- YARDIMCI PİVOT FONKSİYONU --
  const generatePivotData = (groupField) => {
    const summary = {}
    
    history.forEach(row => {
      // Sadece Çıkış/İade ile sınırlamıyoruz. Excel'den geçmiş data "Giriş" olarak aktarılmış olabilir.
      // Eğer bir Giriş işleminin Proje Adı boşsa, o sadece depoya normal bir giriştir, projeyi ilgilendirmez.
      if (groupField === 'proje_adi' && row.islem_turu === 'Giriş' && !row.proje_adi) return;
      if (groupField === 'transfer_depo' && row.islem_turu === 'Giriş' && !row.transfer_depo) return;

      let factor = 1;
      if (row.islem_turu === 'İade Girişi' || row.islem_turu === 'İade Çıkışı') {
        factor = -1; 
      }
      
      const miktar = Math.abs(row.miktar) * factor;
      
      const grupKey = row[groupField] || 'Belirtilmemiş'
      const keyStr = `${grupKey}_${row.malzeme_adi}`
      
      if (!summary[keyStr]) {
        summary[keyStr] = {
          'GrupKey': grupKey,
          'Malzeme Grubu': row.malzeme_grubu || '-',
          'Malzeme Kodu': row.poz_no,
          'Malzeme Adı': row.malzeme_adi,
          'Net Miktar': 0,
          'Birim': row.birim,
          'Birim Fiyat': row.birim_fiyat || 0
        }
      }
      summary[keyStr]['Net Miktar'] += miktar;
    })

    return Object.values(summary).filter(row => row['Net Miktar'] !== 0)
                 .sort((a,b) => a.GrupKey.localeCompare(b.GrupKey))
  }

  // Pivot Veriler
  const pivotProje = useMemo(() => generatePivotData('proje_adi'), [history]);
  const pivotTaseron = useMemo(() => generatePivotData('transfer_depo'), [history]);
  
  // Tüm history'den proje isimlerini çek (miktarı 0 olsa bile dropdown'da görünsün)
  const uniqueProjeGruplari = [...new Set(history.map(d => d.proje_adi).filter(Boolean))].sort()
  const uniqueTaseronGruplari = [...new Set(history.map(d => d.transfer_depo).filter(Boolean))].sort()

  // -- TEDARİKÇİ VERİSİ (BİRLEŞTİRİLMİŞ) --
  const generateTedarikciData = () => {
    const filtered = history.filter(d => ['Giriş', 'İade Çıkışı'].includes(d.islem_turu))
    const summary = {}
    
    filtered.forEach(row => {
      const tedarikci = row.transfer_depo || 'Belirtilmemiş'
      const keyStr = `${tedarikci}_${row.malzeme_adi}`
      
      if (!summary[keyStr]) {
        summary[keyStr] = {
          'Tedarikçi Adı': tedarikci,
          'Malzeme Grubu': row.malzeme_grubu || '-',
          'Malzeme Kodu': row.poz_no,
          'Malzeme Adı': row.malzeme_adi,
          'Gelen Miktar': 0,
          'İade Miktarı': 0,
          'Net Kalan': 0,
          'Birim': row.birim
        }
      }
      
      if (row.islem_turu === 'Giriş') {
        summary[keyStr]['Gelen Miktar'] += Math.abs(row.miktar);
      } else if (row.islem_turu === 'İade Çıkışı') {
        summary[keyStr]['İade Miktarı'] += Math.abs(row.miktar);
      }
      summary[keyStr]['Net Kalan'] = summary[keyStr]['Gelen Miktar'] - summary[keyStr]['İade Miktarı'];
    })

    return Object.values(summary).filter(r => r['Gelen Miktar'] !== 0 || r['İade Miktarı'] !== 0)
                 .sort((a,b) => a['Tedarikçi Adı'].localeCompare(b['Tedarikçi Adı']) || a['Malzeme Adı'].localeCompare(b['Malzeme Adı']))
  }
  const tedarikciData = generateTedarikciData()
  const uniqueTedarikciler = [...new Set(tedarikciData.map(d => d['Tedarikçi Adı']))]

  // Filtrelenmiş Data Değişkenleri
  const getActivePivotData = (pivotData, selectedGroupsState) => {
    const activeGruplar = selectedGroupsState.length > 0 ? selectedGroupsState.map(s => s.value) : [...new Set(pivotData.map(d => d.GrupKey))]
    
    const tableMalzemeler = [...new Set(pivotData.map(d => d['Malzeme Adı']))]
    
    // Satır objelerini oluştur
    const rawRows = tableMalzemeler.map(malzeme => {
      const rowObj = {
        'Malzeme Kodu': pivotData.find(d => d['Malzeme Adı'] === malzeme)?.['Malzeme Kodu'],
        'Malzeme Adı': malzeme,
        'Birim': pivotData.find(d => d['Malzeme Adı'] === malzeme)?.['Birim'] || '-',
        'Genel Toplam': 0
      };
      
      activeGruplar.forEach(grup => {
        const cell = pivotData.find(d => d['Malzeme Adı'] === malzeme && d.GrupKey === grup);
        const miktar = cell ? cell['Net Miktar'] : 0;
        rowObj[grup] = miktar;
        rowObj['Genel Toplam'] += miktar;
      });
      return rowObj;
    });
    
    return rawRows.filter(r => r['Genel Toplam'] !== 0); // Sadece verisi olanlar
  }

  // -- DIŞA AKTARMA FONKSİYONLARI --
  const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

  const downloadExcel = async (data, sheetName, fileName) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    if (ipcRenderer) {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const success = await ipcRenderer.invoke('save-and-open-excel', { fileName, buffer: wbout });
      if (!success) {
        // user cancelled dialog
      }
    } else {
      XLSX.writeFile(wb, fileName)
    }
  }

  const handleExportStok = () => {
    if (filteredGenelStokData.length === 0) return alert('Dışa aktarılacak veri yok.')
    const exportData = filteredGenelStokData.map(row => {
      let birim = '';
      filteredData.filter(d => d.malzeme_adi === row['Malzeme Adı']).forEach(d => {
        birim = d.birim || birim;
      });

      const excelRow = {
        'Malzeme Kodu': row['Malzeme Kodu'],
        'Depo Adı': selectedDepo === 'Tüm Depolar' ? 'GENEL TOPLAM' : selectedDepo,
        'Malzeme kısa metni': row['Malzeme Adı'],
        'Temel ölçü birimi': birim,
        'Toplam Giren': row['Toplam Giren'],
        'Toplam Çıkan': row['Toplam Çıkan'],
        'Kalan (Net) Stok': row['Kalan Stok (Net)'],
        'ortalama birim fiyat': parseFloat(row['Birim Fiyat']) || 0,
        'Toplam değer': row['Değer (₺)'],
        'Para birimi': 'TRY'
      };
      
      // Grupları (Depo vb) ekle
      gruplar.forEach(grup => {
        excelRow[grup] = row[grup] || 0;
      });

      return excelRow;
    })
    downloadExcel(exportData, "Stok Durumu", selectedDepo === 'Tüm Depolar' ? "Tum_Stok_Durumu.xlsx" : `Stok_${selectedDepo}.xlsx`)
  }

  const handleExportPivot = (pivotData, firstColName, sheetName, fileName, activeGroups) => {
    const dataToExport = pivotData.filter(r => activeGroups.includes(r.GrupKey))
    if (dataToExport.length === 0) return alert('Dışa aktarılacak veri yok.')
    const exportData = dataToExport.map(row => ({
      [firstColName]: row.GrupKey,
      'Malzeme Kodu': row['Malzeme Kodu'],
      'Malzeme Adı': row['Malzeme Adı'],
      'Net Miktar': row['Net Miktar'],
      'Birim': row['Birim']
    }))
    downloadExcel(exportData, sheetName, fileName)
  }

  const handleExportTedarikci = (activeGroups) => {
    const dataToExport = tedarikciData.filter(r => activeGroups.includes(r['Tedarikçi Adı']))
    if (dataToExport.length === 0) return alert('Dışa aktarılacak veri yok.')
    downloadExcel(dataToExport, 'Tedarikçi Girişleri', `Tedarikci_Net_Giris_${selectedDepo}.xlsx`)
  }

  // -- RENDER FONKSİYONLARI --
  const renderPivotTable = (pivotData, gruplarListesi, firstColHeader, selectedGroupsState, setSelectedGroupsState, exportLabel, fileName, tabId) => {
    const options = gruplarListesi.map(g => ({ value: g, label: g }))
    const activeGruplar = selectedGroupsState.length > 0 ? selectedGroupsState.map(s => s.value) : gruplarListesi
    
    const rawRows = getActivePivotData(pivotData, selectedGroupsState);
    const filteredRows = applyColumnFilters(rawRows, columnFilters[tabId]);
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
    const currentRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ width: '60%' }}>
            <Select 
              isMulti
              options={options}
              value={selectedGroupsState}
              onChange={setSelectedGroupsState}
              placeholder={`${firstColHeader} çoklu filtrele (Boş bırakırsanız tümünü gösterir)...`}
              styles={customSelectStyles}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {Object.keys(columnFilters[tabId]).length > 0 && (
              <button onClick={() => clearTabFilters(tabId)} className="btn" style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '6px' }}>
                🧹 Filtreyi Temizle
              </button>
            )}
            <button onClick={() => handleExportPivot(pivotData, firstColHeader, exportLabel, fileName, activeGruplar)} className="btn btn-success" style={{ background: '#10b981', color: 'white', padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '6px' }}>
              📥 EXCEL İNDİR (TÜMÜNÜ)
            </button>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Malzeme Grubu <ExcelFilterDropdown colKey="Malzeme Grubu" rawData={rawRows} currentFilter={columnFilters[tabId]["Malzeme Grubu"]} onApply={(val) => updateFilter(tabId, "Malzeme Grubu", val)} /></th>
                <th>Malzeme Kodu <ExcelFilterDropdown colKey="Malzeme Kodu" rawData={rawRows} currentFilter={columnFilters[tabId]["Malzeme Kodu"]} onApply={(val) => updateFilter(tabId, "Malzeme Kodu", val)} /></th>
                <th>Malzeme Adı <ExcelFilterDropdown colKey="Malzeme Adı" rawData={rawRows} currentFilter={columnFilters[tabId]["Malzeme Adı"]} onApply={(val) => updateFilter(tabId, "Malzeme Adı", val)} /></th>
                <th>Birim <ExcelFilterDropdown colKey="Birim" rawData={rawRows} currentFilter={columnFilters[tabId]["Birim"]} onApply={(val) => updateFilter(tabId, "Birim", val)} /></th>
                {activeGruplar.map(g => <th key={g}>{g} <ExcelFilterDropdown colKey={g} rawData={rawRows} currentFilter={columnFilters[tabId][g]} onApply={(val) => updateFilter(tabId, g, val)} /></th>)}
                <th>Genel Toplam <ExcelFilterDropdown colKey="Genel Toplam" rawData={rawRows} currentFilter={columnFilters[tabId]["Genel Toplam"]} onApply={(val) => updateFilter(tabId, "Genel Toplam", val)} /></th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--text-secondary)' }}>{row['Malzeme Grubu']}</td>
                  <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{row['Malzeme Kodu']}</td>
                  <td style={{ fontWeight: 600 }}>{row['Malzeme Adı']}</td>
                  <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{row['Birim']}</td>
                  {activeGruplar.map(g => <td key={g}>{row[g] || '-'}</td>)}
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{row['Genel Toplam']}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && <tr><td colSpan={activeGruplar.length + 3} style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '0.5rem 1rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Önceki</button>
            <span>Sayfa {currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '0.5rem 1rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>Sonraki</button>
          </div>
        )}
      </div>
    )
  }

  const renderTedarikciTable = () => {
    const options = uniqueTedarikciler.map(g => ({ value: g, label: g }))
    const activeGruplar = selectedTedarikciler.length > 0 ? selectedTedarikciler.map(s => s.value) : uniqueTedarikciler
    const activeData = tedarikciData.filter(d => activeGruplar.includes(d['Tedarikçi Adı']))
    const filteredRows = applyColumnFilters(activeData, columnFilters['tedarikci_giris'])
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
    const currentRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ width: '60%' }}>
            <Select 
              isMulti
              options={options}
              value={selectedTedarikciler}
              onChange={setSelectedTedarikciler}
              placeholder="Tedarikçi çoklu filtrele (Boş bırakırsanız tümünü gösterir)..."
              styles={customSelectStyles}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {Object.keys(columnFilters['tedarikci_giris']).length > 0 && (
              <button onClick={() => clearTabFilters('tedarikci_giris')} className="btn" style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '6px' }}>
                🧹 Filtreyi Temizle
              </button>
            )}
            <button onClick={() => handleExportTedarikci(activeGruplar)} className="btn btn-success" style={{ background: '#10b981', color: 'white', padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '6px' }}>
              📥 EXCEL İNDİR
            </button>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Malzeme Grubu <ExcelFilterDropdown colKey="Malzeme Grubu" rawData={activeData} currentFilter={columnFilters["tedarikci_giris"]["Malzeme Grubu"]} onApply={(val) => updateFilter("tedarikci_giris", "Malzeme Grubu", val)} /></th>
                <th>Malzeme Kodu <ExcelFilterDropdown colKey="Malzeme Kodu" rawData={activeData} currentFilter={columnFilters["tedarikci_giris"]["Malzeme Kodu"]} onApply={(val) => updateFilter("tedarikci_giris", "Malzeme Kodu", val)} /></th>
                <th>Malzeme Adı <ExcelFilterDropdown colKey="Malzeme Adı" rawData={activeData} currentFilter={columnFilters["tedarikci_giris"]["Malzeme Adı"]} onApply={(val) => updateFilter("tedarikci_giris", "Malzeme Adı", val)} /></th>
                <th>Birim <ExcelFilterDropdown colKey="Birim" rawData={activeData} currentFilter={columnFilters["tedarikci_giris"]["Birim"]} onApply={(val) => updateFilter("tedarikci_giris", "Birim", val)} /></th>
                <th>Tedarikçi Adı <ExcelFilterDropdown colKey="Tedarikçi Adı" rawData={activeData} currentFilter={columnFilters["tedarikci_giris"]["Tedarikçi Adı"]} onApply={(val) => updateFilter("tedarikci_giris", "Tedarikçi Adı", val)} /></th>
                <th style={{ color: 'var(--success-color)' }}>Gelen Miktar <ExcelFilterDropdown colKey="Gelen Miktar" rawData={activeData} currentFilter={columnFilters["tedarikci_giris"]["Gelen Miktar"]} onApply={(val) => updateFilter("tedarikci_giris", "Gelen Miktar", val)} /></th>
                <th style={{ color: 'var(--danger-color)' }}>İade Edilen Miktar <ExcelFilterDropdown colKey="İade Miktarı" rawData={activeData} currentFilter={columnFilters["tedarikci_giris"]["İade Miktarı"]} onApply={(val) => updateFilter("tedarikci_giris", "İade Miktarı", val)} /></th>
                <th style={{ color: 'var(--primary-color)' }}>Net Kalan <ExcelFilterDropdown colKey="Net Kalan" rawData={activeData} currentFilter={columnFilters["tedarikci_giris"]["Net Kalan"]} onApply={(val) => updateFilter("tedarikci_giris", "Net Kalan", val)} /></th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--text-secondary)' }}>{row['Malzeme Grubu']}</td>
                  <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{row['Malzeme Kodu']}</td>
                  <td style={{ fontWeight: 600 }}>{row['Malzeme Adı']}</td>
                  <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{row['Birim'] || '-'}</td>
                  <td>{row['Tedarikçi Adı']}</td>
                  <td style={{ fontWeight: 'bold' }}>{row['Gelen Miktar'] || '-'}</td>
                  <td style={{ fontWeight: 'bold' }}>{row['İade Miktarı'] || '-'}</td>
                  <td style={{ fontWeight: 'bold', color: row['Net Kalan'] < 0 ? 'var(--danger-color)' : 'var(--primary-color)' }}>
                    {row['Net Kalan'] || '-'}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '0.5rem 1rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Önceki</button>
            <span>Sayfa {currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '0.5rem 1rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>Sonraki</button>
          </div>
        )}
      </div>
    )
  }

  const tabStyle = (id) => ({
    padding: '0.8rem 1.5rem',
    cursor: 'pointer',
    borderBottom: activeTab === id ? '3px solid var(--primary-color)' : '3px solid transparent',
    color: activeTab === id ? 'var(--primary-color)' : 'var(--text-secondary)',
    fontWeight: activeTab === id ? 'bold' : 'normal',
    transition: 'all 0.2s',
    background: 'transparent',
    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
    outline: 'none',
    fontSize: '0.95rem'
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--panel-border)', width: '100%' }}>
          <button style={tabStyle('stok')} onClick={() => { setActiveTab('stok'); setCurrentPage(1); }}>📦 Genel Stok</button>
          <button style={tabStyle('proje')} onClick={() => { setActiveTab('proje'); setCurrentPage(1); }}>🏗️ Proje Bazlı Çıkış</button>
          <button style={tabStyle('taseron')} onClick={() => { setActiveTab('taseron'); setCurrentPage(1); }}>👷 Taşeron Bazlı Çıkış</button>
          <button style={tabStyle('tedarikci_giris')} onClick={() => { setActiveTab('tedarikci_giris'); setCurrentPage(1); }}>🚚 Tedarikçi Bazlı Girişler</button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginLeft: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select 
              value={selectedDepo} 
              onChange={e => setSelectedDepo(e.target.value)}
              style={{ minWidth: '200px' }}
            >
              <option value="Tüm Depolar">Tüm Depolar (Genel)</option>
              {depolarListesi.map(depo => (
                <option key={depo} value={depo}>{depo}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {activeTab === 'stok' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
             <h2 style={{ color: 'var(--success-color)', margin: 0, fontSize: '1.3rem' }}>
                Toplam Değer: {genelDepoDegeri.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {Object.keys(columnFilters['stok']).length > 0 && (
                  <button onClick={() => clearTabFilters('stok')} className="btn" style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '6px' }}>
                    🧹 Filtreyi Temizle
                  </button>
                )}
                <button onClick={handleExportStok} className="btn btn-success" style={{ background: '#10b981', color: 'white', padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '6px' }}>
                  📥 EXCEL İNDİR
                </button>
              </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Malzeme Grubu <ExcelFilterDropdown colKey="Malzeme Grubu" rawData={rawGenelStokData} currentFilter={columnFilters["stok"]["Malzeme Grubu"]} onApply={(val) => updateFilter("stok", "Malzeme Grubu", val)} /></th>
                  <th>Malzeme Kodu <ExcelFilterDropdown colKey="Malzeme Kodu" rawData={rawGenelStokData} currentFilter={columnFilters["stok"]["Malzeme Kodu"]} onApply={(val) => updateFilter("stok", "Malzeme Kodu", val)} /></th>
                  <th>Malzeme Adı <ExcelFilterDropdown colKey="Malzeme Adı" rawData={rawGenelStokData} currentFilter={columnFilters["stok"]["Malzeme Adı"]} onApply={(val) => updateFilter("stok", "Malzeme Adı", val)} /></th>
                  <th>Birim <ExcelFilterDropdown colKey="Birim" rawData={rawGenelStokData} currentFilter={columnFilters["stok"]["Birim"]} onApply={(val) => updateFilter("stok", "Birim", val)} /></th>
                  <th>Birim Fiyat <ExcelFilterDropdown colKey="Birim Fiyat" rawData={rawGenelStokData} currentFilter={columnFilters["stok"]["Birim Fiyat"]} onApply={(val) => updateFilter("stok", "Birim Fiyat", val)} /></th>
                  {gruplar.map(g => <th key={g}>{g} <ExcelFilterDropdown colKey={g} rawData={rawGenelStokData} currentFilter={columnFilters["stok"][g]} onApply={(val) => updateFilter("stok", g, val)} /></th>)}
                  <th style={{ color: 'var(--success-color)' }}>Toplam Giren <ExcelFilterDropdown colKey="Toplam Giren" rawData={rawGenelStokData} currentFilter={columnFilters["stok"]["Toplam Giren"]} onApply={(val) => updateFilter("stok", "Toplam Giren", val)} /></th>
                  <th style={{ color: 'var(--danger-color)' }}>Toplam Çıkan <ExcelFilterDropdown colKey="Toplam Çıkan" rawData={rawGenelStokData} currentFilter={columnFilters["stok"]["Toplam Çıkan"]} onApply={(val) => updateFilter("stok", "Toplam Çıkan", val)} /></th>
                  <th style={{ color: 'var(--primary-color)' }}>Kalan Stok (Net) <ExcelFilterDropdown colKey="Kalan Stok (Net)" rawData={rawGenelStokData} currentFilter={columnFilters["stok"]["Kalan Stok (Net)"]} onApply={(val) => updateFilter("stok", "Kalan Stok (Net)", val)} /></th>
                  <th>Değer (₺) <ExcelFilterDropdown colKey="Değer (₺)" rawData={rawGenelStokData} currentFilter={columnFilters["stok"]["Değer (₺)"]} onApply={(val) => updateFilter("stok", "Değer (₺)", val)} /></th>
                </tr>
              </thead>
              <tbody>
                {filteredGenelStokData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-secondary)' }}>{row['Malzeme Grubu']}</td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{row['Malzeme Kodu']}</td>
                    <td style={{ fontWeight: 600 }}>{row['Malzeme Adı']}</td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{row['Birim']}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {row['Birim Fiyat'].toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </td>
                    {gruplar.map(grup => <td key={grup}>{row[grup] || '-'}</td>)}
                    <td style={{ fontWeight: 'bold' }}>{row['Toplam Giren'] || '-'}</td>
                    <td style={{ fontWeight: 'bold' }}>{row['Toplam Çıkan'] || '-'}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{row['Kalan Stok (Net)'] || '-'}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>
                      {row['Değer (₺)'].toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </td>
                  </tr>
                ))}
                {filteredGenelStokData.length === 0 && <tr><td colSpan={gruplar.length + 7} style={{ textAlign: 'center' }}>Kayıt bulunamadı.</td></tr>}
              </tbody>
            </table>
          </div>
          
          {Math.ceil(filteredGenelStokData.length / itemsPerPage) > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '0.5rem 1rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Önceki</button>
              <span>Sayfa {currentPage} / {Math.ceil(filteredGenelStokData.length / itemsPerPage)}</span>
              <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredGenelStokData.length / itemsPerPage), p + 1))} disabled={currentPage === Math.ceil(filteredGenelStokData.length / itemsPerPage)} style={{ padding: '0.5rem 1rem', cursor: currentPage === Math.ceil(filteredGenelStokData.length / itemsPerPage) ? 'not-allowed' : 'pointer' }}>Sonraki</button>
            </div>
          )}
        </>
      )}

      {activeTab === 'proje' && renderPivotTable(pivotProje, uniqueProjeGruplari, 'Proje Adı', selectedProjeler, setSelectedProjeler, 'Proje Çıkış Raporu', `Proje_Cikis_${selectedDepo}.xlsx`, 'proje')}
      
      {activeTab === 'taseron' && renderPivotTable(pivotTaseron, uniqueTaseronGruplari, 'Taşeron Adı', selectedTaseronlar, setSelectedTaseronlar, 'Taşeron Çıkış Raporu', `Taseron_Cikis_${selectedDepo}.xlsx`, 'taseron')}
      
      {activeTab === 'tedarikci_giris' && renderTedarikciTable()}
    </div>
  )
}

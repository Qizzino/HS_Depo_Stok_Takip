import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import TransactionHistory from './components/TransactionHistory'
import Malzemeler from './components/Malzemeler'
import Depolar from './components/Depolar'
import Ayarlar from './components/Ayarlar'
import Login from './components/Login'
import AdminPanel from './components/AdminPanel'
import PrintLayout from './components/PrintLayout'
import Hakkinda from './components/Hakkinda'

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

function App() {
  const [activeTab, setActiveTab] = useState('form')
  const [ayarlar, setAyarlar] = useState({ firma_adi: 'MSY MÜHENDİSLİK', logo_url: '' })
  const [currentUser, setCurrentUser] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)
  const [printData, setPrintData] = useState(null)
  const [previewSaveAction, setPreviewSaveAction] = useState(null) // Önizlemeden sonra kaydetme fonksiyonunu tutar
  const [updateProgress, setUpdateProgress] = useState(null)

  const fetchAyarlar = () => {
    fetch('http://localhost:3001/api/ayarlar')
      .then(res => res.json())
      .then(data => {
        if (data.firma_adi || data.logo_url) {
          setAyarlar({
            ...data,
            firma_adi: data.firma_adi || 'FİRMA ADI',
            logo_url: data.logo_url || ''
          })
        }
      })
  }

  useEffect(() => {
    fetchAyarlar()
    
    // Override native alert to prevent Electron focus bugs
    window.alert = (msg) => {
      setToastMsg(msg)
      setTimeout(() => setToastMsg(null), 3000)
    }

    if (ipcRenderer) {
      ipcRenderer.on('update-progress', (event, percent) => {
        setUpdateProgress(percent)
      })
    }
  }, [])

  const handleLogout = () => {
    setCurrentUser(null)
    if (ipcRenderer) {
      ipcRenderer.send('shrink-window')
    }
  }

  const handleQuit = () => {
    if (ipcRenderer) {
      ipcRenderer.send('quit-app');
    } else {
      alert('Tarayıcıda çalışıyorsunuz, bu buton sadece masaüstü uygulamasında uygulamayı kapatır.');
    }
  }

  if (!currentUser) {
    return <Login onLogin={(user) => {
      setCurrentUser(user);
      if (ipcRenderer) ipcRenderer.send('resize-window');
    }} ayarlar={ayarlar} />
  }

  return (
    <>
    <div className="app-container">
      <div className="sidebar">
        {/* LOGO VE FİRMA ADI KISMI */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          {ayarlar.logo_url && (
            <img 
              src={ayarlar.logo_url} 
              alt="Firma Logo" 
              style={{ maxWidth: '180px', maxHeight: '100px', objectFit: 'contain', marginBottom: '1rem', borderRadius: '8px' }} 
            />
          )}
          <div className="logo">{ayarlar.firma_adi}</div>
        </div>

        <div className="nav-links">
          <div className="nav-item" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', paddingBottom: '0.5rem', pointerEvents: 'none' }}>İşlemler</div>
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            📊 Stok Durumu (Özet)
          </div>
          <div className={`nav-item ${activeTab === 'form' ? 'active' : ''}`} onClick={() => setActiveTab('form')}>
            ➕ Yeni Stok Hareketi
          </div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            🕒 Stok Hareketleri
          </div>

          <div className="nav-item" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', paddingTop: '1.5rem', paddingBottom: '0.5rem', pointerEvents: 'none' }}>Yönetim</div>
          <div className={`nav-item ${activeTab === 'malzemeler' ? 'active' : ''}`} onClick={() => setActiveTab('malzemeler')}>
            📦 Malzeme Listesi
          </div>
          <div className={`nav-item ${activeTab === 'depolar' ? 'active' : ''}`} onClick={() => setActiveTab('depolar')}>
            🏢 Depo Listesi
          </div>
          <div className={`nav-item ${activeTab === 'ayarlar' ? 'active' : ''}`} onClick={() => setActiveTab('ayarlar')}>
            ⚙️ Firma Ayarları
          </div>

          {currentUser?.role === 'admin' && (
            <div className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')} style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
              👑 Admin Paneli
            </div>
          )}

          <div style={{ flexGrow: 1 }}></div>
          <div className={`nav-item ${activeTab === 'kilavuz' ? 'active' : ''}`} onClick={() => setActiveTab('kilavuz')} style={{ marginTop: 'auto', marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', color: '#b0bec5' }}>
            ℹ️ Hakkında
          </div>
          <div className="nav-item" onClick={handleLogout} style={{ color: 'var(--warning-color)' }}>
            🔓 Oturumu Kapat ({currentUser.username})
          </div>
          <div className="nav-item" onClick={handleQuit} style={{ color: 'var(--danger-color)', marginTop: '0.5rem', fontWeight: 'bold' }}>
            🚪 Uygulamadan Çıkış Yap
          </div>
        </div>
      </div>
      
      <div className="main-content">
        <div className="header">
          <h1>
            {activeTab === 'dashboard' && 'Stok Durumu'}
            {activeTab === 'form' && 'Malzeme Giriş / Çıkış İşlemleri'}
            {activeTab === 'history' && 'Tüm Stok Hareketleri'}
            {activeTab === 'malzemeler' && 'Malzeme Tanımlama'}
            {activeTab === 'depolar' && 'Depo ve İş Grupları Tanımlama'}
            {activeTab === 'ayarlar' && 'Sistem Ayarları'}
            {activeTab === 'admin' && 'Sistem Yöneticisi'}
            {activeTab === 'kilavuz' && 'Uygulama Hakkında'}
          </h1>
          <p>{ayarlar.firma_adi} Depo Takip Sistemi</p>
        </div>

        <div className="glass-panel">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'form' && (
            <TransactionForm 
              currentUser={currentUser} 
              onSuccess={(data) => {
                if (data && data.previewData) {
                  setPrintData(data.previewData)
                  setPreviewSaveAction(() => data.saveAction) // Fonksiyonu state'e kaydet
                } else if (data && data.success) {
                  setActiveTab('history')
                } else if (!data) {
                  setActiveTab('history') // eski yapı uyumluluğu
                }
              }} 
            />
          )}
          {activeTab === 'history' && <TransactionHistory currentUser={currentUser} onPrint={(data) => setPrintData(data)} />}
          {activeTab === 'malzemeler' && <Malzemeler />}
          {activeTab === 'depolar' && <Depolar />}
          {activeTab === 'ayarlar' && <Ayarlar currentUser={currentUser} onSettingsChange={fetchAyarlar} />}
          {activeTab === 'admin' && <AdminPanel currentUser={currentUser} />}
          {activeTab === 'kilavuz' && <Hakkinda />}
        </div>
      </div>

      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--accent-color)',
          color: 'white', padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 9999, animation: 'slideUp 0.3s ease', fontSize: '1.1rem', fontWeight: 'bold'
        }}>
          {toastMsg}
        </div>
      )}

      {updateProgress !== null && (
        <div style={{
          position: 'fixed', top: '0', left: '0', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', zIndex: 9999
        }}>
          <div style={{ width: `${updateProgress}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.3s ease' }}></div>
          <div style={{ position: 'absolute', top: '10px', right: '20px', background: 'var(--bg-secondary)', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-color)' }}>
            Güncelleme İndiriliyor: %{Math.round(updateProgress)}
          </div>
        </div>
      )}

    </div>
      {/* YAZDIRMA EKRANI */}
      <PrintLayout 
        data={printData} 
        ayarlar={ayarlar} 
        saveAction={previewSaveAction}
        onSaveComplete={() => {
          setPreviewSaveAction(null); // Kaydetme tamamlandığında aksiyonu sıfırla (artık butonlar açılır)
        }}
        onPrintComplete={() => {
          setPrintData(null);
          setPreviewSaveAction(null);
          if (!previewSaveAction) {
             setActiveTab('history'); // Ekrana onay verdiyse ve işi bittiyse history'ye at
          }
        }} 
      />
    </>
  )
}

export default App

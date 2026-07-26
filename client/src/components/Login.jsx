import { useState, useEffect } from 'react'

export default function Login({ onLogin, ayarlar }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [showDevInfo, setShowDevInfo] = useState(false)
    const [updateProgress, setUpdateProgress] = useState(null)

    const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

    useEffect(() => {
        if (ipcRenderer) {
            const handleProgress = (event, percent) => {
                setUpdateProgress(percent)
            };
            ipcRenderer.on('update-progress', handleProgress);
            return () => ipcRenderer.removeListener('update-progress', handleProgress);
        }
    }, [])

    const handleContact = () => {
        if (window.require) {
            const { shell } = window.require('electron');
            shell.openExternal('mailto:hrnskr21@gmail.com?subject=Stok Takip Sistemi');
        } else {
            window.open('mailto:hrnskr21@gmail.com?subject=Stok Takip Sistemi', '_blank');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!username || !password) {
            setError('Lütfen kullanıcı adı ve şifrenizi giriniz.');
            return;
        }
        
        setError('')
        try {
            const res = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            const data = await res.json()
            if (res.ok) {
                onLogin(data.user)
            } else {
                setError(data.error || 'Giriş başarısız')
            }
        } catch (err) {
            setError('Sunucuya bağlanılamadı. Lütfen sunucunun çalıştığından emin olun.')
        }
    }

    return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem', textAlign: 'center', position: 'relative' }}>
                {ayarlar?.logo_url && (
                    <img 
                      src={ayarlar.logo_url} 
                      alt="Logo" 
                      style={{ maxWidth: '180px', maxHeight: '100px', objectFit: 'contain', marginBottom: '1rem', borderRadius: '8px' }} 
                    />
                )}
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>{ayarlar?.firma_adi || 'Firma Adı'}</h2>
                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Depo Takip Sistemi Girişi</p>

                {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
                        <label>Kullanıcı Adı</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                        <label>Şifre</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '1.5rem' }}>GİRİŞ YAP</button>
                </form>
                
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {!showDevInfo ? (
                        <div 
                            onClick={() => setShowDevInfo(true)}
                            style={{ cursor: 'pointer', fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)' }}
                            title="Geliştirici Bilgileri"
                        >
                            ℹ️
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                                <span onClick={() => setShowDevInfo(false)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>✕</span>
                            </div>
                            <div style={{ marginBottom: '0.2rem' }}>Geliştirici: Harun Şeker</div>
                            <div style={{ marginBottom: '0.2rem' }}>Elektrik-Elektronik Mühendisi</div>
                            <div 
                                onClick={handleContact}
                                style={{ color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem' }}
                            >
                                ✉️ hrnskr21@gmail.com
                            </div>
                        </div>
                    )}
                    <div style={{ marginTop: '1rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.3)' }}>
                        Sürüm v{__APP_VERSION__}
                    </div>
                </div>

                {updateProgress !== null && (
                    <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                        <div style={{ width: `${updateProgress}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.3s ease' }}></div>
                        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'white' }}>
                            Güncelleme İndiriliyor: %{Math.round(updateProgress)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

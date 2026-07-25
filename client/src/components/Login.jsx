import { useState } from 'react'

export default function Login({ onLogin, ayarlar }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

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
                
                <div style={{ marginTop: '3rem', fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center' }}>
                    Geliştirici: Harun Şeker<br/>
                    Elektrik-Elektronik Mühendisi<br/>
                    hrnskr21@gmail.com
                    <div style={{ marginTop: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.2)' }}>
                        Sürüm v{__APP_VERSION__}
                    </div>
                </div>
            </div>
        </div>
    )
}

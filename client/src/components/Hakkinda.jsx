import React, { useState, useEffect } from 'react'

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function Hakkinda() {
  const [appVersion, setAppVersion] = useState('Yükleniyor...');

  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.invoke('get-app-version').then((version) => {
        setAppVersion(version);
      }).catch(() => {
        setAppVersion('Bilinmiyor');
      });
    } else {
      setAppVersion('Web Sürümü');
    }
  }, []);

  const handleContact = () => {
    if (window.require) {
      const { shell } = window.require('electron');
      shell.openExternal('mailto:hrnskr21@gmail.com?subject=Stok Takip Sistemi Hakkında');
    } else {
      window.open('mailto:hrnskr21@gmail.com?subject=Stok Takip Sistemi Hakkında', '_blank');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h2 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
        ℹ️ Hakkında ve Kullanım Kılavuzu
      </h2>
      
      {/* Kullanım Kılavuzu Kısmı */}
      <div style={{ marginBottom: '3rem' }}>
        <div className="kilavuz-section" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-color)', marginBottom: '0.5rem' }}>1. Yeni Stok Hareketi (Giriş / Çıkış)</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Sisteme malzeme eklemek veya sistemden malzeme düşmek için "Yeni Stok Hareketi" sayfasını kullanın.
            İşlem Tipi "Giriş" (depoya gelen) veya "Çıkış" (depodan giden) olarak seçilebilir. İşlem bitiminde otomatik PDF oluşturulur.
          </p>
        </div>

        <div className="kilavuz-section" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-color)', marginBottom: '0.5rem' }}>2. Stok Durumu (Özet)</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Deponuzdaki güncel malzeme miktarlarını görebilir ve arama kutusu ile istediğiniz malzemeyi anında bulabilirsiniz.
          </p>
        </div>

        <div className="kilavuz-section" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-color)', marginBottom: '0.5rem' }}>3. Stok Hareketleri</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Geçmişte yapılan tüm Giriş ve Çıkış işlemlerinin kayıtlarını görebilir, hatalı işlemleri silip iptal edebilirsiniz.
          </p>
        </div>

        <div className="kilavuz-section" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-color)', marginBottom: '0.5rem' }}>4. Yönetim Menüleri</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Sisteme yeni malzeme cinsleri, depolar (şantiyeler/departmanlar) tanımlamak ve firma ayarlarını değiştirmek için kullanılır (Sadece yetkili).
          </p>
        </div>
      </div>

      {/* Hakkında Bilgileri Kısmı */}
      <div style={{ 
        padding: '2rem', 
        backgroundColor: 'var(--bg-secondary)', 
        borderRadius: '12px', 
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-color)' }}>Uygulama Bilgileri</h3>
        
        <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          <p style={{ margin: '0.5rem 0' }}><strong>Sürüm:</strong> v{appVersion}</p>
          <p style={{ margin: '0.5rem 0' }}><strong>Geliştirici:</strong> Harun Şeker (Elektrik-Elektronik Mühendisi)</p>
          <p style={{ margin: '0.5rem 0' }}><strong>İletişim:</strong> hrnskr21@gmail.com</p>
        </div>

        <button 
          onClick={handleContact}
          className="btn-primary" 
          style={{ 
            padding: '10px 24px', 
            fontSize: '1rem', 
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--accent-color)'
          }}
        >
          ✉️ Geliştiriciyle İletişime Geç
        </button>
      </div>
    </div>
  )
}

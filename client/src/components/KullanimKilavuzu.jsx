import React from 'react'

export default function KullanimKilavuzu() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h2 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
        📖 Depo Takip Sistemi - Kullanım Kılavuzu
      </h2>
      
      <div className="kilavuz-section" style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>1. Yeni Stok Hareketi (Giriş / Çıkış)</h3>
        <p>
          Sisteme malzeme eklemek veya sistemden malzeme düşmek için <strong>"Yeni Stok Hareketi"</strong> sayfasını kullanın.
          <ul>
            <li><strong>İşlem Tipi:</strong> Malzeme depoya geliyorsa "Giriş", depodan şantiyeye/üretime gidiyorsa "Çıkış" seçin.</li>
            <li><strong>Tarih:</strong> İşlemin gerçekleştiği tarihi seçin.</li>
            <li><strong>İrsaliye No:</strong> İlgili evrak numarasını yazın (zorunlu değildir).</li>
            <li>Tablodan "Malzeme Ekle" butonuna basarak işleme malzemeleri dahil edin.</li>
            <li>Kaydet dediğinizde, bilgisayarınıza otomatik bir PDF fişi/irsaliyesi inecektir.</li>
          </ul>
        </p>
      </div>

      <div className="kilavuz-section" style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>2. Stok Durumu (Özet)</h3>
        <p>
          Bu sayfada deponuzdaki güncel malzeme miktarlarını görebilirsiniz.
          <ul>
            <li>Hangi malzemeden elinizde ne kadar kaldığını anlık olarak takip edebilirsiniz.</li>
            <li>Arama kutusunu kullanarak spesifik bir malzemeyi anında bulabilirsiniz.</li>
          </ul>
        </p>
      </div>

      <div className="kilavuz-section" style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>3. Stok Hareketleri</h3>
        <p>
          Geçmişte yapılan tüm Giriş ve Çıkış işlemlerinin kayıtlarını bu ekranda görebilirsiniz.
          <ul>
            <li>Hatalı girilen bir işlem varsa, tablodaki "İptal Et / Sil" butonuna basarak işlemi tamamen sistemden silebilir ve stok miktarlarını geri alabilirsiniz.</li>
            <li>İşlem Bazlı Grupla sekmesinde, aynı irsaliye içindeki tüm malzemeleri tek bir işlem gibi görüp tek tıkla silebilirsiniz.</li>
          </ul>
        </p>
      </div>

      <div className="kilavuz-section" style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>4. Yönetim Menüleri</h3>
        <p>
          Sistemin altyapısını ayarladığınız bölümdür. Sadece yetkili kişiler görebilir.
          <ul>
            <li><strong>Malzeme Listesi:</strong> Sisteme yeni bir malzeme cinsi tanımlamak için kullanılır.</li>
            <li><strong>Depo Listesi:</strong> Malzemelerin çıkış yapacağı şantiyeleri veya departmanları tanımlamak için kullanılır.</li>
            <li><strong>Firma Ayarları:</strong> Programda ve yazdırılan PDF evraklarında görünen Firma adını değiştirdiğiniz yerdir.</li>
          </ul>
        </p>
      </div>

      <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          💡 İpucu: Programı kullanırken takıldığınız bir yer olursa, yöneticinize danışabilirsiniz. Bu sistem işlerinizi hızlandırmak ve hata payını sıfıra indirmek için tasarlanmıştır.
        </p>
      </div>
    </div>
  )
}

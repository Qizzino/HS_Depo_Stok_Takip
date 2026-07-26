# MSY Stok Takip Sistemi - VBA Geliştirme Notları ve Hafıza Dosyası

Bu belge, daha önce React (Electron) ve SQLite tabanlı olarak geliştirilmiş "MSY Stok Takip" programının Excel/VBA ortamına taşınması veya VBA tarafının geliştirilmesi için asistanın geçmiş konuyu hatırlaması adına oluşturulmuştur.

## 1. Veritabanı Mantığı ve Sütunlar
VBA tarafında oluşturulacak Excel sayfaları veya SQLite veritabanı bağlantısı şu mantıkla çalışmalıdır:

**Malzemeler:**
- Poz No (Benzersiz Anahtar)
- Malzeme Adı
- Birim (M, ADT vb.)
- Birim Fiyat (₺)

**Stok Hareketleri:**
- İşlem Tarihi (Saatli)
- İşlem Türü (Giriş, Çıkış, İade Girişi, İade Çıkışı, Ters Kayıt)
- Poz No & Malzeme Adı
- Miktar (Net Rakam)
- Birim
- Ana Depo (Örn: AFYON DEPO)
- İşlem Depo (Tedarikçi veya Taşeron vb.)
- Proje Adı (Örn: YATIRIM IŞIKLAR MH)
- İhale Grubu
- İşlem Yapan & Teslim Alan
- Tutanak / Belge No
- İrsaliye Görüntüsü / Tutanak İçeriği

## 2. Kritik Algoritmalar
- **Net Stok Hesaplaması:** "Giriş" ve "İade Girişi" işlemleri depodaki stoğu artırırken (+), "Çıkış" ve "İade Çıkışı" işlemleri depodaki stoğu azaltır (-). 
- **Proje Çıkışları Mantığı:** Bir projeye ne kadar malzeme gittiğini hesaplarken; "Çıkış" (+1), "İade Girişi" (-1) olarak hesaplanır. Ek olarak eğer tedarikçiden direkt projeye alım yapıldıysa (Yani işlem türü "Giriş" olup, Proje Adı doluysa), bu miktar da doğrudan o projenin stoğuna (+) olarak eklenmelidir.
- **Tedarikçi Net Giriş Mantığı:** "Giriş" işlemleri (+), "İade Çıkışı" işlemleri (-) hesaplanarak tedarikçiden alınan net malzeme bulunur.

## 3. Kullanıcı Deneyimi ve Arayüz (UX/UI) Beklentileri
- Kullanıcı (Admin), uyarı mesajları ve "Emin misiniz?" şeklindeki yavaşlatıcı onay kutularından hoşlanmamaktadır. Silme veya kaydetme gibi işlemler mümkün olan en hızlı şekilde (tektıkla, onaysız) yapılmalıdır.
- Excel formları (UserForm) tasarlanırken veya VBA kodları yazılırken kasma/donma yapmayacak şekilde RAM'i yormayan, Application.ScreenUpdating = False gibi optimizasyon kodlarının mutlaka kullanıldığı hızlı yapılar kurulmalıdır.

---
**Yeni Asistana Not:** Lütfen bu dosyayı okuduktan sonra, kullanıcının VBA tarafındaki Excel taleplerini bu iş kuralları çerçevesinde hızlıca yerine getirmeye başla.

# MSY MÜHENDİSLİK - Depo Takip Sistemi Kullanım Kılavuzu

Bu kılavuz, MSY Mühendislik Depo Takip Sistemi'nin temel özelliklerini ve kullanımını adım adım anlatmaktadır. Uygulama, şirketinizin malzeme giriş/çıkış süreçlerini, stok takibini ve depo yönetimini dijital ortamda hatasız bir şekilde gerçekleştirmeniz için tasarlanmıştır.

## 1. Sisteme Giriş (Login)
Uygulamayı açtığınızda karşınıza şifreli bir giriş ekranı gelir. Size tanımlanmış olan **Kullanıcı Adı** ve **Şifre** ile sisteme güvenli bir şekilde giriş yapabilirsiniz.
- Sadece yetkili kullanıcılar sisteme erişebilir.
- Sol altta bulunan "i" ikonuna tıklayarak sürüm bilgilerini görebilir veya geliştirici ile doğrudan iletişime geçebilirsiniz.

## 2. Stok Durumu (Özet)
Sisteme giriş yaptıktan sonra ilk açılan ekrandır.
- **Canlı Stok Takibi:** Deponuzda bulunan tüm malzemelerin listesini, "Toplam Değer"ini ve depolar (Ana depo, şantiye depoları, taşeronlar) arasındaki malzeme dağılımını canlı olarak gösterir.
- **Hızlı Arama:** Üst kısımda bulunan arama çubuğu ile binlerce kalem malzeme arasından istediğiniz malzemeyi veya poz numarasını saniyeler içinde bulabilirsiniz.
- **Excel İndirme:** Sağ üst köşedeki **Excel İndir** butonuna tıklayarak güncel stok tablosunu tek tıkla Excel formatında bilgisayarınıza kaydedebilir, raporlama için kullanabilirsiniz.

## 3. Yeni Stok Hareketi (Giriş / Çıkış)
Malzeme alımları veya sahaya yapılan çıkış işlemleri bu sayfadan yönetilir.
- **İşlem Tipi Seçimi:** 
  - **Malzeme Girişi (Tedarikçiden Alım):** Yeni alınan malzemeleri depoya eklemek için kullanılır.
  - **Malzeme Çıkışı (Sahaya/Taşerona):** Depodan sahaya gönderilen malzemeleri düşmek için kullanılır.
  - **İade İşlemleri:** Sahadan depoya iade gelen malzemeler için kullanılır.
- **Detaylı Kayıt:** İşlem yaparken; malzemenin geldiği/gittiği firma, İhale Grubu, Proje Adı, Belge No ve İrsaliye/Fatura PDF belgelerini sisteme ekleyebilirsiniz.
- **Otomatik PDF Fişi:** "Listeye Ekle" deyip "KAYDET" butonuna bastığınızda, sistem yapılan işlemin otomatik olarak resmi PDF fişini (irsaliyesini) oluşturur ve yazdırmanız için ekrana getirir.

## 4. Stok Hareketleri (Geçmiş)
Geçmişte yapılan tüm giriş-çıkış hareketlerinin tarih sırasına göre listelendiği bölümdür.
- **Filtreleme:** Sadece belirli bir projenin veya deponun hareketlerini görmek için filtreleri kullanabilirsiniz.
- **Raporlama:** "Çıkış Raporu", "İçe Aktar" ve "Tüm Hareketler" butonları sayesinde istediğiniz zaman aralığındaki hareketleri Excel'e dökebilirsiniz.
- **İşlem İptali:** Yanlış yapılan bir giriş/çıkış işlemi varsa, listeden bularak silebilirsiniz. Silinen işlemin malzemeleri otomatik olarak stoğa geri eklenir/düşülür.

## 5. Malzeme Listesi (Yönetim)
Sisteme yeni malzeme cinsleri tanımlanan sayfadır.
- **Yeni Kayıt:** Kullanılacak malzemelerin Malzeme Grubu, Poz Numarası, Malzeme Adı, Temel Ölçü Birimi (Adet, Kg, Metre vb.) ve Birim Fiyatları buradan sisteme eklenir.
- **Excel Aktarımı:** Malzeme listenizi topluca sisteme yüklemek için "Excel İçe Aktar" özelliğini kullanabilirsiniz. Veya mevcut listenizi "Excel Dışa Aktar" ile indirebilirsiniz.

## 6. Depo Listesi (Yönetim)
Malzemelerin fiziksel olarak bulunabileceği lokasyonların tanımlandığı sayfadır.
- **Depo Türleri:** Sistemde 3 farklı depo tipi bulunur: Ana Depo, Tedarikçi ve Taşeron.
- Bu ekrandan açtığınız yeni bir depo (Örn: "Afyon Şantiye"), anında "Stok Durumu" tablosunda yeni bir sütun olarak belirir ve o şantiyenin stoğunu ayrı takip etmenizi sağlar.

## 7. Firma Ayarları
Uygulamanın kişiselleştirildiği bölümdür. (Sadece Admin yetkisiyle erişilebilir)
- **Firma Bilgileri:** Çıktı alınan PDF fişlerinin başlığında görünecek olan Firma Adı, Vergi Dairesi, Telefon ve Adres gibi bilgileri buradan güncelleyebilirsiniz.
- **Firma Logosu:** Sistemin giriş ekranında ve raporlarda görünecek firmanızın logosunu (Resim dosyası) bu alandan yükleyebilirsiniz.

## 8. Admin Paneli (Sistem Yöneticisi)
Uygulamayı kullanacak diğer personellerin yönetildiği kısımdır. (Sadece Admin yetkisiyle erişilebilir)
- Yeni personeller için kullanıcı adı ve şifre tanımlayabilirsiniz.
- Personellere "Admin" (tam yetkili) veya "Kullanıcı" (sadece işlem yapabilen, ayarları değiştiremeyen) yetkisi verebilirsiniz.
- Artık çalışmayan personellerin hesaplarını silebilirsiniz.

---
**Teknik Destek ve İletişim**
Uygulama ile ilgili her türlü soru, sorun veya yeni özellik talepleriniz için "Uygulama Hakkında" sayfasındaki **Geliştiriciyle İletişime Geç** butonunu kullanarak destek alabilirsiniz.

*Sürüm: v1.9.23*
*Geliştirici: Harun Şeker*

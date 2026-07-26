const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
    let win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true } });
    
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { color: #1a56db; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
            h2 { color: #2563eb; margin-top: 30px; }
            ul { margin-bottom: 20px; }
            li { margin-bottom: 8px; }
            p { margin-bottom: 15px; }
            .footer { margin-top: 50px; font-size: 0.9em; color: #666; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; }
        </style>
    </head>
    <body>
        <h1>MSY MÜHENDİSLİK<br>Depo Takip Sistemi Kullanım Kılavuzu</h1>
        <p>Bu kılavuz, MSY Mühendislik Depo Takip Sistemi'nin temel özelliklerini ve kullanımını adım adım anlatmaktadır. Uygulama, şirketinizin malzeme giriş/çıkış süreçlerini, stok takibini ve depo yönetimini dijital ortamda hatasız bir şekilde gerçekleştirmeniz için tasarlanmıştır.</p>

        <h2>1. Sisteme Giriş (Login)</h2>
        <p>Uygulamayı açtığınızda karşınıza şifreli bir giriş ekranı gelir. Size tanımlanmış olan <strong>Kullanıcı Adı</strong> ve <strong>Şifre</strong> ile sisteme güvenli bir şekilde giriş yapabilirsiniz.</p>
        <ul>
            <li>Sadece yetkili kullanıcılar sisteme erişebilir.</li>
            <li>Sol altta bulunan "i" ikonuna tıklayarak sürüm bilgilerini görebilir veya geliştirici ile doğrudan iletişime geçebilirsiniz.</li>
        </ul>

        <h2>2. Stok Durumu (Özet)</h2>
        <p>Sisteme giriş yaptıktan sonra ilk açılan ekrandır.</p>
        <ul>
            <li><strong>Canlı Stok Takibi:</strong> Deponuzda bulunan tüm malzemelerin listesini, "Toplam Değer"ini ve depolar (Ana depo, şantiye depoları, taşeronlar) arasındaki malzeme dağılımını canlı olarak gösterir.</li>
            <li><strong>Hızlı Arama:</strong> Üst kısımda bulunan arama çubuğu ile binlerce kalem malzeme arasından istediğiniz malzemeyi veya poz numarasını saniyeler içinde bulabilirsiniz.</li>
            <li><strong>Excel İndirme:</strong> Sağ üst köşedeki <strong>Excel İndir</strong> butonuna tıklayarak güncel stok tablosunu tek tıkla Excel formatında bilgisayarınıza kaydedebilir, raporlama için kullanabilirsiniz.</li>
        </ul>

        <h2>3. Yeni Stok Hareketi (Giriş / Çıkış)</h2>
        <p>Malzeme alımları veya sahaya yapılan çıkış işlemleri bu sayfadan yönetilir.</p>
        <ul>
            <li><strong>İşlem Tipi Seçimi:</strong> 
                <ul>
                    <li><strong>Malzeme Girişi (Tedarikçiden Alım):</strong> Yeni alınan malzemeleri depoya eklemek için kullanılır.</li>
                    <li><strong>Malzeme Çıkışı (Sahaya/Taşerona):</strong> Depodan sahaya gönderilen malzemeleri düşmek için kullanılır.</li>
                    <li><strong>İade İşlemleri:</strong> Sahadan depoya iade gelen malzemeler için kullanılır.</li>
                </ul>
            </li>
            <li><strong>Detaylı Kayıt:</strong> İşlem yaparken; malzemenin geldiği/gittiği firma, İhale Grubu, Proje Adı, Belge No ve İrsaliye/Fatura PDF belgelerini sisteme ekleyebilirsiniz.</li>
            <li><strong>Otomatik PDF Fişi:</strong> "Listeye Ekle" deyip "KAYDET" butonuna bastığınızda, sistem yapılan işlemin otomatik olarak resmi PDF fişini (irsaliyesini) oluşturur ve yazdırmanız için ekrana getirir.</li>
        </ul>

        <h2>4. Stok Hareketleri (Geçmiş)</h2>
        <p>Geçmişte yapılan tüm giriş-çıkış hareketlerinin tarih sırasına göre listelendiği bölümdür.</p>
        <ul>
            <li><strong>Filtreleme:</strong> Sadece belirli bir projenin veya deponun hareketlerini görmek için filtreleri kullanabilirsiniz.</li>
            <li><strong>Raporlama:</strong> "Çıkış Raporu", "İçe Aktar" ve "Tüm Hareketler" butonları sayesinde istediğiniz zaman aralığındaki hareketleri Excel'e dökebilirsiniz.</li>
            <li><strong>İşlem İptali:</strong> Yanlış yapılan bir giriş/çıkış işlemi varsa, listeden bularak silebilirsiniz. Silinen işlemin malzemeleri otomatik olarak stoğa geri eklenir/düşülür.</li>
        </ul>

        <h2>5. Malzeme Listesi (Yönetim)</h2>
        <p>Sisteme yeni malzeme cinsleri tanımlanan sayfadır.</p>
        <ul>
            <li><strong>Yeni Kayıt:</strong> Kullanılacak malzemelerin Malzeme Grubu, Poz Numarası, Malzeme Adı, Temel Ölçü Birimi (Adet, Kg, Metre vb.) ve Birim Fiyatları buradan sisteme eklenir.</li>
            <li><strong>Excel Aktarımı:</strong> Malzeme listenizi topluca sisteme yüklemek için "Excel İçe Aktar" özelliğini kullanabilirsiniz. Veya mevcut listenizi "Excel Dışa Aktar" ile indirebilirsiniz.</li>
        </ul>

        <h2>6. Depo Listesi (Yönetim)</h2>
        <p>Malzemelerin fiziksel olarak bulunabileceği lokasyonların tanımlandığı sayfadır.</p>
        <ul>
            <li><strong>Depo Türleri:</strong> Sistemde 3 farklı depo tipi bulunur: Ana Depo, Tedarikçi ve Taşeron.</li>
            <li>Bu ekrandan açtığınız yeni bir depo (Örn: "Afyon Şantiye"), anında "Stok Durumu" tablosunda yeni bir sütun olarak belirir ve o şantiyenin stoğunu ayrı takip etmenizi sağlar.</li>
        </ul>

        <h2>7. Firma Ayarları</h2>
        <p>Uygulamanın kişiselleştirildiği bölümdür. (Sadece Admin yetkisiyle erişilebilir)</p>
        <ul>
            <li><strong>Firma Bilgileri:</strong> Çıktı alınan PDF fişlerinin başlığında görünecek olan Firma Adı, Vergi Dairesi, Telefon ve Adres gibi bilgileri buradan güncelleyebilirsiniz.</li>
            <li><strong>Firma Logosu:</strong> Sistemin giriş ekranında ve raporlarda görünecek firmanızın logosunu (Resim dosyası) bu alandan yükleyebilirsiniz.</li>
        </ul>

        <h2>8. Admin Paneli (Sistem Yöneticisi)</h2>
        <p>Uygulamayı kullanacak diğer personellerin yönetildiği kısımdır. (Sadece Admin yetkisiyle erişilebilir)</p>
        <ul>
            <li>Yeni personeller için kullanıcı adı ve şifre tanımlayabilirsiniz.</li>
            <li>Personellere "Admin" (tam yetkili) veya "Kullanıcı" (sadece işlem yapabilen, ayarları değiştiremeyen) yetkisi verebilirsiniz.</li>
            <li>Artık çalışmayan personellerin hesaplarını silebilirsiniz.</li>
        </ul>

        <div class="footer">
            <p><strong>Teknik Destek ve İletişim</strong><br>
            Uygulama ile ilgili her türlü soru, sorun veya yeni özellik talepleriniz için hrnskr21@gmail.com adresinden geliştiriciyle iletişime geçebilirsiniz.</p>
            <p>Sürüm: v1.9.23<br>Geliştirici: Harun Şeker (Elektrik-Elektronik Mühendisi)</p>
        </div>
    </body>
    </html>
    `;
    
    const tempHtml = path.join(__dirname, 'temp_kilavuz.html');
    fs.writeFileSync(tempHtml, htmlContent);
    
    await win.loadFile(tempHtml);
    
    try {
        const data = await win.webContents.printToPDF({
            printBackground: true,
            pageSize: 'A4'
        });
        
        const publicDir = path.join(__dirname, 'client', 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(publicDir, 'Kullanim_Kilavuzu.pdf'), data);
        console.log("PDF SUCCESS");
    } catch (err) {
        console.error("PDF ERROR:", err);
    }
    
    app.quit();
});

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const uploadsDir = process.env.USER_DATA_PATH ? path.join(process.env.USER_DATA_PATH, 'uploads') : path.join(__dirname, 'public/uploads');

app.use('/uploads', express.static(uploadsDir));

const PORT = 3001;

// --- YEDEKLEME (BACKUP) SİSTEMİ ---
function backupDatabase() {
    try {
        if (!process.env.USER_DATA_PATH) return; // Sadece Electron'da çalışır
        
        // Belgelerim klasörünü bulalım
        const userDocsPath = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Documents', 'HS_Stok_Takip_Yedekler');
        
        // Klasör yoksa oluştur
        if (!fs.existsSync(userDocsPath)) {
            fs.mkdirSync(userDocsPath, { recursive: true });
        }

        const today = new Date().toISOString().split('T')[0];
        const dbPath = path.join(process.env.USER_DATA_PATH, 'stok.db');
        const backupPath = path.join(userDocsPath, `stok_yedek_${today}.db`);

        // Sadece bugün yedek alınmamışsa al (Günde 1 kez)
        if (fs.existsSync(dbPath) && !fs.existsSync(backupPath)) {
            fs.copyFileSync(dbPath, backupPath);
            console.log('Günlük Yedek Alındı: ', backupPath);
        }
    } catch (err) {
        console.error('Yedekleme Hatası:', err);
    }
}

// Uygulama her başlatıldığında yedek kontrolü yap
backupDatabase();
// Uygulama açık kalırsa her 12 saatte bir kontrol et
setInterval(backupDatabase, 12 * 60 * 60 * 1000);

// --- API ENDPOINTS ---

// Kullanıcı Girişi (Login)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT id, username, role FROM Kullanicilar WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre' });
        res.json({ success: true, user: row });
    });
});

// Admin Şifresi Doğrulama (Düzenleme İşlemleri İçin)
app.post('/api/verify-admin', (req, res) => {
    const { password } = req.body;
    db.get("SELECT id FROM Kullanicilar WHERE role = 'admin' AND password = ?", [password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Hatalı admin şifresi' });
        res.json({ success: true });
    });
});

// Kullanıcıları Getir
app.get('/api/kullanicilar', (req, res) => {
    db.all("SELECT id, username, role FROM Kullanicilar", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Kullanıcı Ekle
app.post('/api/kullanicilar', (req, res) => {
    const { username, password, role } = req.body;
    db.run("INSERT INTO Kullanicilar (username, password, role) VALUES (?, ?, ?)", [username, password, role || 'user'], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Bu kullanıcı adı zaten mevcut' });
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: this.lastID });
    });
});

// Kullanıcı Sil
app.delete('/api/kullanicilar/:id', (req, res) => {
    db.run("DELETE FROM Kullanicilar WHERE id = ? AND username != 'admin'", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Kullanıcı Güncelle (Şifre/Yetki)
app.put('/api/kullanicilar/:id', (req, res) => {
    const { username, password, role } = req.body;
    db.run("UPDATE Kullanicilar SET username = ?, password = ?, role = ? WHERE id = ?", [username, password, role, req.params.id], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Bu kullanıcı adı zaten mevcut' });
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});


// Multer (Dosya Yükleme) Ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        cb(null, 'file-' + Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// --- API ENDPOINTS ---

// Ayarları Getir
app.get('/api/ayarlar', (req, res) => {
    db.all("SELECT * FROM Ayarlar", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const ayarlar = {};
        rows.forEach(r => ayarlar[r.key] = r.value);
        res.json(ayarlar);
    });
});

// Ayarları Güncelle (Firma Adı vs)
app.post('/api/ayarlar', (req, res) => {
    const ayarlar = req.body;
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare("INSERT OR REPLACE INTO Ayarlar (key, value) VALUES (?, ?)");
        for (const [key, value] of Object.entries(ayarlar)) {
            stmt.run([key, value]);
        }
        stmt.finalize();
        db.run('COMMIT');
        res.json({ success: true });
    });
});

// Logo Yükle
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenemedi' });
    }
    const logoUrl = 'http://localhost:3001/uploads/' + req.file.filename;
    db.run("UPDATE Ayarlar SET value = ? WHERE key = 'logo_url'", [logoUrl], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, logo_url: logoUrl });
    });
});

// Belge (Fatura/İrsaliye vb) Yükle
app.post('/api/upload-belge', upload.single('belge'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenemedi' });
    }
    const belgeUrl = 'http://localhost:3001/uploads/' + req.file.filename;
    res.json({ success: true, url: belgeUrl });
});


// Malzemeleri Getir
app.get('/api/malzemeler', (req, res) => {
    db.all("SELECT * FROM Malzemeler", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Malzeme Ekle
app.post('/api/malzemeler', (req, res) => {
    const { pozNo, adi, birim, birimFiyat, malzemeGrubu } = req.body;
    const fiyat = parseFloat(birimFiyat) || 0;
    db.run("INSERT INTO Malzemeler (poz_no, adi, birim, birim_fiyat, malzeme_grubu) VALUES (?, ?, ?, ?, ?)", [pozNo, adi, birim, fiyat, malzemeGrubu || ''], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Malzeme Sil
app.delete('/api/malzemeler/:pozNo', (req, res) => {
    db.run("DELETE FROM Malzemeler WHERE poz_no = ?", [req.params.pozNo], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Malzeme Toplu Sil
app.post('/api/malzemeler/bulk-delete', (req, res) => {
    const { pozNos } = req.body;
    if (!pozNos || !Array.isArray(pozNos) || pozNos.length === 0) {
        return res.status(400).json({ error: 'Geçersiz veri.' });
    }
    const placeholders = pozNos.map(() => '?').join(',');
    db.run(`DELETE FROM Malzemeler WHERE poz_no IN (${placeholders})`, pozNos, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deletedCount: this.changes });
    });
});

// Malzeme Düzenle
app.put('/api/malzemeler/:pozNo', (req, res) => {
    const { adi, birim, birimFiyat, malzemeGrubu } = req.body;
    const fiyat = parseFloat(birimFiyat) || 0;
    db.run("UPDATE Malzemeler SET adi = ?, birim = ?, birim_fiyat = ?, malzeme_grubu = ? WHERE poz_no = ?", [adi, birim, fiyat, malzemeGrubu || '', req.params.pozNo], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Malzemeleri Excel'den İçe Aktar
app.post('/api/malzemeler/import', upload.single('excel'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    
    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        // Önce parse edilen veriyi çıkar
        const parsedItems = [];
        data.forEach(row => {
            const rowKeys = Object.keys(row);
            const getVal = (...searchKeys) => {
                for (let k of rowKeys) {
                    const lowerK = k.toLowerCase().replace(/\s/g, '');
                    if (searchKeys.some(sk => lowerK.includes(sk.toLowerCase().replace(/\s/g, '')))) {
                        return row[k];
                    }
                }
                return undefined;
            };

            const pozNo = getVal('pozno', 'malzemekodu');
            const adi = getVal('malzemead', 'kısametni', 'kisametni');
            const birim = getVal('ölçübirimi', 'olcubirimi', 'birim', 'teme');
            const malzemeGrubu = getVal('malzemegrubu', 'grup', 'grubu');
            let fiyat = getVal('birimfiyat', 'fiyat');
            
            if (typeof fiyat === 'string') {
                fiyat = fiyat.replace(',', '.');
            }
            fiyat = parseFloat(fiyat) || 0;

            if (pozNo && adi) {
                parsedItems.push({ pozNo: String(pozNo), adi: String(adi), birim: String(birim||'Adet'), fiyat, malzemeGrubu: String(malzemeGrubu || '') });
            }
        });

        // Eğer preview modu istenmişse veritabanına kaydetmeden dön
        if (req.query.preview === 'true') {
            db.all("SELECT poz_no FROM Malzemeler", [], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                const existingPozNos = new Set(rows.map(r => String(r.poz_no)));
                
                const duplicateItems = [];
                const newItems = [];
                
                parsedItems.forEach(item => {
                    if (existingPozNos.has(item.pozNo)) {
                        duplicateItems.push(item);
                    } else {
                        newItems.push(item);
                    }
                });
                
                return res.json({ newItems, duplicateItems, total: parsedItems.length });
            });
            return;
        }
        
        db.all("SELECT poz_no FROM Malzemeler", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const existingPozNos = new Set(rows.map(r => String(r.poz_no)));
            
            let successCount = 0;
            let duplicateCount = 0;
            let processedCount = 0;
            const duplicatePozNos = [];

            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                const stmt = db.prepare("INSERT OR IGNORE INTO Malzemeler (poz_no, adi, birim, birim_fiyat, malzeme_grubu) VALUES (?, ?, ?, ?, ?)");
                
                parsedItems.forEach(item => {
                    if (existingPozNos.has(item.pozNo)) {
                        duplicateCount++;
                        duplicatePozNos.push(item.pozNo);
                    } else {
                        stmt.run([item.pozNo, item.adi, item.birim, item.fiyat, item.malzemeGrubu]);
                        successCount++;
                    }
                    processedCount++;
                });

                stmt.finalize();
                db.run('COMMIT');
                
                try { fs.unlinkSync(req.file.path); } catch (e) {}

                res.json({ 
                    success: true, 
                    added: successCount, 
                    duplicates: duplicateCount,
                    duplicateItems: duplicatePozNos,
                    total: processedCount 
                });
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Malzemeleri Toplu Yükleme (Önizlemeden Sonra)
app.post('/api/malzemeler/bulk', (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Geçersiz veri' });

    let successCount = 0;
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        // Hem yeni ekler hem de mükerrer olanı günceller (pozNo primary key olduğu için REPLACE kullanılabilir)
        const stmt = db.prepare("REPLACE INTO Malzemeler (poz_no, adi, birim, birim_fiyat, malzeme_grubu) VALUES (?, ?, ?, ?, ?)");
        
        items.forEach(item => {
            if (item.pozNo && item.adi) {
                stmt.run([String(item.pozNo), String(item.adi), String(item.birim || 'Adet'), parseFloat(item.fiyat) || 0, String(item.malzemeGrubu || '')]);
                successCount++;
            }
        });

        stmt.finalize();
        db.run('COMMIT', (err) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, count: successCount });
        });
    });
});


// Depoları Getir
app.get('/api/depolar', (req, res) => {
    db.all("SELECT * FROM Depolar", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Depo Ekle
app.post('/api/depolar', (req, res) => {
    const { adi, tipi } = req.body;
    db.run("INSERT INTO Depolar (adi, tipi) VALUES (?, ?)", [adi, tipi], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Depo Sil
app.delete('/api/depolar/:id', (req, res) => {
    db.run("DELETE FROM Depolar WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// İhale Gruplarını Getir
app.get('/api/ihalegruplari', (req, res) => {
    db.all("SELECT * FROM IhaleGruplari", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// İhale Grubu Ekle
app.post('/api/ihalegruplari', (req, res) => {
    const { adi, depoId } = req.body;
    db.run("INSERT INTO IhaleGruplari (adi, depo_id) VALUES (?, ?)", [adi, depoId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// İhale Grubu Sil
app.delete('/api/ihalegruplari/:id', (req, res) => {
    db.run("DELETE FROM IhaleGruplari WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Proje İsimlerini Getir
app.get('/api/projeler', (req, res) => {
    db.all("SELECT DISTINCT proje_adi FROM StokHareketleri WHERE proje_adi IS NOT NULL AND proje_adi != ''", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.proje_adi));
    });
});

// Stok Hareketlerini Getir
app.get('/api/hareketler', (req, res) => {
    const depoAdi = req.query.depo;
    let query = "SELECT * FROM StokHareketleri";
    let params = [];

    if (depoAdi && depoAdi !== 'Tüm Depolar') {
        query += " WHERE depo_adi = ?";
        params.push(depoAdi);
    }
    
    query += " ORDER BY id DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Net Stok (Malzeme birim fiyatı ile birlikte)
app.get('/api/ozet', (req, res) => {
    const query = `
        SELECT 
            s.malzeme_adi, 
            s.poz_no, 
            s.ihale_grubu, 
            s.depo_adi, 
            SUM(s.miktar) as net_stok, 
            m.birim, 
            m.birim_fiyat,
            m.malzeme_grubu
        FROM StokHareketleri s
        LEFT JOIN Malzemeler m ON s.poz_no = m.poz_no
        GROUP BY s.malzeme_adi, s.ihale_grubu, s.depo_adi, m.malzeme_grubu
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// İrsaliye Numarası Üret
app.get('/api/irsaliye-no', (req, res) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `${yyyy}${mm}${dd}-`;

    db.get("SELECT irsaliye_no FROM StokHareketleri WHERE irsaliye_no LIKE ? ORDER BY irsaliye_no DESC LIMIT 1", [`${prefix}%`], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let nextNumber = 1;
        if (row && row.irsaliye_no) {
            const parts = row.irsaliye_no.split('-');
            if (parts.length === 2) {
                nextNumber = parseInt(parts[1], 10) + 1;
            }
        }
        
        const irsaliyeNo = `${prefix}${String(nextNumber).padStart(3, '0')}`;
        res.json({ irsaliye_no: irsaliyeNo });
    });
});

// Stok Hareketi Ekle
app.post('/api/hareketler', (req, res) => {
    const items = req.body.items || [req.body];
    const { islemTuru, depoAdi, belgeNo, ihaleGrubu, transferDepo, projeAdi, islemYapan, ekBelge, teslimAlan, irsaliyeNo, islemNo } = req.body;
    const tarih = new Date().toISOString();

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const insertQuery = `INSERT INTO StokHareketleri (poz_no, malzeme_adi, miktar, birim, islem_turu, depo_adi, belge_no, ihale_grubu, islem_tarihi, transfer_depo, proje_adi, islem_yapan, ek_belge, teslim_alan, irsaliye_no, islem_no, malzeme_grubu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        let hasError = false;
        let processed = 0;

        items.forEach((item) => {
            let netMiktar = parseFloat(item.miktar);
            if (['Çıkış', 'İade', 'İade Çıkışı', 'Ters Kayıt'].includes(islemTuru)) {
                netMiktar = -Math.abs(netMiktar);
            } else {
                netMiktar = Math.abs(netMiktar);
            }

            db.run(insertQuery, [item.pozNo, item.malzemeAdi, netMiktar, item.birim, islemTuru, depoAdi, belgeNo, ihaleGrubu, tarih, transferDepo, projeAdi, islemYapan, ekBelge || null, teslimAlan || null, irsaliyeNo || null, islemNo || `ISL-${Date.now()}`, item.malzemeGrubu || ''], function(err) {
                if (err) hasError = true;
                
                if (!hasError && islemTuru === 'Ters Kayıt') {
                    db.run(insertQuery, [item.pozNo, item.malzemeAdi, Math.abs(netMiktar), item.birim, islemTuru, depoAdi, belgeNo, transferDepo, tarih, ihaleGrubu, projeAdi, islemYapan, ekBelge || null, null, null, islemNo || `ISL-${Date.now()}`, item.malzemeGrubu || ''], function(err2) {
                        if (err2) hasError = true;
                        processed++;
                        checkCompletion();
                    });
                } else {
                    processed++;
                    checkCompletion();
                }
            });
        });

        function checkCompletion() {
            if (processed === items.length) {
                if (hasError) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Kayıt sırasında hata oluştu' });
                } else {
                    db.run('COMMIT');
                    res.json({ message: 'Kayıt başarılı' });
                }
            }
        }
    });
});

// Stok Hareketlerini İçe Aktar (Excel)
app.post('/api/hareketler/import', upload.single('excel'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        let hasError = false;
        let successCount = 0;

        // Önce mevcut depoları ve ihale gruplarını al
        db.all("SELECT adi FROM Depolar", [], (err, depolar) => {
            if (err) return res.status(500).json({ error: 'Depolar okunamadı' });
            const existingDepolar = new Set(depolar.map(d => d.adi));

            db.all("SELECT adi FROM IhaleGruplari", [], (err, ihaleler) => {
                if (err) return res.status(500).json({ error: 'İhale grupları okunamadı' });
                const existingIhaleler = new Set(ihaleler.map(i => i.adi));

                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');

                    const insertMalzeme = db.prepare("INSERT OR IGNORE INTO Malzemeler (poz_no, adi, birim, birim_fiyat) VALUES (?, ?, ?, 0)");
                    const insertDepo = db.prepare("INSERT INTO Depolar (adi, tipi) VALUES (?, ?)");
                    const insertIhale = db.prepare("INSERT INTO IhaleGruplari (adi, depo_id) VALUES (?, NULL)");
                    const insertHareket = db.prepare(`
                        INSERT INTO StokHareketleri (
                            poz_no, malzeme_adi, miktar, birim, islem_turu, depo_adi, 
                            belge_no, ihale_grubu, islem_tarihi, transfer_depo, proje_adi, 
                            islem_yapan, teslim_alan, islem_no, malzeme_grubu
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);

                    data.forEach((row, index) => {
                        const getVal = (key) => row[key] || row[key.trim()] || null;

                        const islemTuru = getVal('İşlem Türü') || 'Giriş';
                        const depoAdi = getVal('ANA DEPO') || getVal('Ana Depo');
                        const transferDepo = getVal('İşlem Depo Adı') || getVal('İşlem Depo');
                        const pozNo = getVal('Poz Numarası') || getVal('Malzeme Kodu');
                        const malzemeAdi = getVal('Malzeme Adı');
                        const malzemeGrubu = getVal('Malzeme Grubu') || '';
                        const miktar = parseFloat(getVal('Miktar')) || 0;
                        const birim = getVal('Birim');
                        const ihaleGrubu = getVal('İhale Grubu') || getVal('İhale Grubu (İş Yeri)');
                        const belgeNo = getVal('Belge No') || 'Aktarim';
                        const projeAdi = getVal('Proje Adı');
                        const islemYapan = getVal('İŞLEM YAPAN DEPO PERSONELİ') || getVal('İşlemi Yapan');
                        const teslimAlan = getVal('TESLİM ALAN') || getVal('Teslim Alan');
                        
                        let islemTarihi = new Date().toISOString();
                        const excelDate = getVal('İşlem Tarihi') || getVal('Tarih');
                        if (excelDate) {
                            const parts = String(excelDate).split('.');
                            if (parts.length === 3) {
                                const dateObj = new Date(`${parts[2].split(' ')[0]}-${parts[1]}-${parts[0]}T12:00:00Z`);
                                if (!isNaN(dateObj.getTime())) islemTarihi = dateObj.toISOString();
                            } else {
                                const dateObj = new Date(excelDate);
                                if (!isNaN(dateObj.getTime())) islemTarihi = dateObj.toISOString();
                            }
                        }

                        if (depoAdi && !existingDepolar.has(depoAdi)) {
                            insertDepo.run([depoAdi, 'Ana Depo']);
                            existingDepolar.add(depoAdi);
                        }
                        if (transferDepo && !existingDepolar.has(transferDepo)) {
                            let karsiTipi = 'Tedarikçi';
                            if (islemTuru === 'Çıkış' || islemTuru === 'İade Girişi') karsiTipi = 'Taşeron';
                            insertDepo.run([transferDepo, karsiTipi]);
                            existingDepolar.add(transferDepo);
                        }
                        if (ihaleGrubu && !existingIhaleler.has(ihaleGrubu)) {
                            insertIhale.run([ihaleGrubu]);
                            existingIhaleler.add(ihaleGrubu);
                        }
                        if (pozNo && malzemeAdi) {
                            insertMalzeme.run([pozNo, malzemeAdi, birim || 'Adet']);
                            
                            insertHareket.run([
                                pozNo, malzemeAdi, miktar, birim || 'Adet', islemTuru, 
                                depoAdi, belgeNo, ihaleGrubu, islemTarihi, transferDepo, projeAdi,
                                islemYapan, teslimAlan, "ISL-EXCEL-" + Date.now() + "-" + index, malzemeGrubu
                            ]);
                            successCount++;
                        }
                    });

                    insertMalzeme.finalize();
                    insertDepo.finalize();
                    insertIhale.finalize();
                    insertHareket.finalize();

                    db.run('COMMIT', (err) => {
                        try { fs.unlinkSync(req.file.path); } catch(e) {}
                        if (hasError || err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Kayıt sırasında hata oluştu. Veriler geri alındı.' });
                        }
                        res.json({ success: true, count: successCount });
                    });
                });
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stok Hareketi Sil
app.delete('/api/hareketler/:id', (req, res) => {
    db.run("DELETE FROM StokHareketleri WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Toplu Stok Hareketi Silme
app.post('/api/hareketler/bulk-delete', (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Silinecek ID listesi geçersiz.' });
    }
    
    const chunkSize = 500;
    const chunks = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
        chunks.push(ids.slice(i, i + chunkSize));
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        let hasError = false;
        let completed = 0;

        if (chunks.length === 0) {
            db.run('COMMIT');
            return res.json({ success: true });
        }

        chunks.forEach(chunk => {
            const placeholders = chunk.map(() => '?').join(',');
            db.run(`DELETE FROM StokHareketleri WHERE id IN (${placeholders})`, chunk, function(err) {
                if (err) hasError = true;
                completed++;
                if (completed === chunks.length) {
                    if (hasError) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Toplu silme sırasında veritabanı hatası oluştu.' });
                    } else {
                        db.run('COMMIT');
                        return res.json({ success: true });
                    }
                }
            });
        });
    });
});

// Stok Hareketi Düzenle
app.put('/api/hareketler/:id', (req, res) => {
    const id = req.params.id;
    const { pozNo, malzemeAdi, miktar, birim, islemTuru, depoAdi, belgeNo, ihaleGrubu, projeAdi, islemYapan, teslimAlan, transferDepo } = req.body;
    
    let netMiktar = parseFloat(miktar);
    if (['Çıkış', 'İade', 'İade Çıkışı', 'Ters Kayıt'].includes(islemTuru)) {
        netMiktar = -Math.abs(netMiktar);
    } else {
        netMiktar = Math.abs(netMiktar);
    }

    db.run(
        `UPDATE StokHareketleri SET 
         poz_no = ?, malzeme_adi = ?, miktar = ?, birim = ?, islem_turu = ?, 
         depo_adi = ?, belge_no = ?, ihale_grubu = ?, proje_adi = ?, 
         islem_yapan = ?, teslim_alan = ?, transfer_depo = ? 
         WHERE id = ?`,
        [pozNo, malzemeAdi, netMiktar, birim, islemTuru, depoAdi, belgeNo, ihaleGrubu, projeAdi, islemYapan, teslimAlan, transferDepo, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});

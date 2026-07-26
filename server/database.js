const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const userDataPath = process.env.USER_DATA_PATH || __dirname;
const dbPath = path.resolve(userDataPath, 'stok.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanına bağlanılamadı:', err.message);
    } else {
        console.log('SQLite veritabanına bağlanıldı.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Malzemeler Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS Malzemeler (
            poz_no TEXT PRIMARY KEY,
            adi TEXT NOT NULL,
            birim TEXT NOT NULL,
            birim_fiyat REAL DEFAULT 0,
            malzeme_grubu TEXT
        )`);
        db.run(`ALTER TABLE Malzemeler ADD COLUMN birim_fiyat REAL DEFAULT 0`, (err) => {});
        db.run(`ALTER TABLE Malzemeler ADD COLUMN malzeme_grubu TEXT`, (err) => {});

        // Depolar Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS Depolar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            adi TEXT NOT NULL,
            tipi TEXT NOT NULL
        )`);

        // İhale Grupları Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS IhaleGruplari (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            adi TEXT NOT NULL,
            depo_id INTEGER,
            FOREIGN KEY (depo_id) REFERENCES Depolar(id)
        )`);

        // Stok Hareketleri Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS StokHareketleri (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            poz_no TEXT,
            malzeme_adi TEXT,
            miktar REAL,
            birim TEXT,
            islem_turu TEXT,
            depo_adi TEXT,
            belge_no TEXT,
            ihale_grubu TEXT,
            islem_tarihi TEXT,
            transfer_depo TEXT,
            proje_adi TEXT,
            islem_yapan TEXT,
            ek_belge TEXT,
            teslim_alan TEXT,
            irsaliye_no TEXT,
            islem_no TEXT,
            malzeme_grubu TEXT
        )`);
        db.run(`ALTER TABLE StokHareketleri ADD COLUMN islem_yapan TEXT`, (err) => {});
        db.run(`ALTER TABLE StokHareketleri ADD COLUMN ek_belge TEXT`, (err) => {});
        db.run(`ALTER TABLE StokHareketleri ADD COLUMN teslim_alan TEXT`, (err) => {});
        db.run(`ALTER TABLE StokHareketleri ADD COLUMN irsaliye_no TEXT`, (err) => {});
        db.run(`ALTER TABLE StokHareketleri ADD COLUMN islem_no TEXT`, (err) => {});
        db.run(`ALTER TABLE StokHareketleri ADD COLUMN malzeme_grubu TEXT`, (err) => {});

        // Kullanıcılar Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS Kullanicilar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )`);
        db.run(`INSERT OR IGNORE INTO Kullanicilar (username, password, role) VALUES ('admin', '123456', 'admin')`);

        // Ayarlar Tablosu
        db.run(`CREATE TABLE IF NOT EXISTS Ayarlar (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )`);
        db.run(`INSERT OR IGNORE INTO Ayarlar (key, value) VALUES ('firma_adi', 'Firma Adı (Ayarlardan Değiştirin)')`);
        db.run(`INSERT OR IGNORE INTO Ayarlar (key, value) VALUES ('logo_url', '')`);
        
        console.log('Tablolar oluşturuldu/kontrol edildi.');
    });
}

module.exports = db;

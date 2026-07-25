const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = 'C:\\Users\\LENOVO\\AppData\\Roaming\\hs-stok-takip\\stok.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Veritabanına bağlanılamadı:", err.message);
        return;
    }
    console.log("Kullanıcı veritabanına bağlanıldı:", dbPath);
});

db.serialize(() => {
    // Depolar tablosundan mükerrerleri sil (en küçük id kalacak)
    db.run(`DELETE FROM Depolar WHERE id NOT IN (SELECT MIN(id) FROM Depolar GROUP BY adi)`, function(err) {
        if(err) console.error(err);
        else console.log(`Depolar temizlendi. Silinen mükerrer sayısı: ${this.changes}`);
    });
    // İhale Grupları tablosundan mükerrerleri sil
    db.run(`DELETE FROM IhaleGruplari WHERE id NOT IN (SELECT MIN(id) FROM IhaleGruplari GROUP BY adi)`, function(err) {
        if(err) console.error(err);
        else console.log(`İhale Grupları temizlendi. Silinen mükerrer sayısı: ${this.changes}`);
    });
});
db.close();

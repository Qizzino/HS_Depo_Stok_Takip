const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/stok.db');

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

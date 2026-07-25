const db = require('./database');

setTimeout(() => {
    db.serialize(() => {
        // Örnek Malzemeler
        db.run("INSERT OR IGNORE INTO Malzemeler (poz_no, adi, birim) VALUES ('32.4.1.3', '0.6/1KV. NVV(NYM) 2X 6 MM^2 KABLO', 'M')");
        db.run("INSERT OR IGNORE INTO Malzemeler (poz_no, adi, birim) VALUES ('ISG-1', 'İŞ AYAKKABISI', 'ADT')");
        db.run("INSERT OR IGNORE INTO Malzemeler (poz_no, adi, birim) VALUES ('26.2.4.YM', 'ÖTÜ(TEHLİKE LEVHASI)', 'ADT')");

        // Örnek Depolar
        db.run("INSERT OR IGNORE INTO Depolar (id, adi, tipi) VALUES (1, 'AFYON DEPO', 'Tedarikçi')");
        db.run("INSERT OR IGNORE INTO Depolar (id, adi, tipi) VALUES (2, 'BAKIM SEVİYE 1', 'Taşeron')");
        db.run("INSERT OR IGNORE INTO Depolar (id, adi, tipi) VALUES (3, 'YATIRIM 2.GRUP', 'Taşeron')");
        
        // Örnek İhale Grupları
        db.run("INSERT OR IGNORE INTO IhaleGruplari (id, adi, depo_id) VALUES (1, 'BAKIM S1', 2)");
        db.run("INSERT OR IGNORE INTO IhaleGruplari (id, adi, depo_id) VALUES (2, 'YATIRIM 2.GRUP', 3)");
        db.run("INSERT OR IGNORE INTO IhaleGruplari (id, adi, depo_id) VALUES (3, 'AFYON DEPO', 1)");

        console.log('Örnek veriler eklendi.');
    });
}, 1000); // Tabloların oluşması için kısa bir süre bekle

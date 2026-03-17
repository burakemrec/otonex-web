const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- VERİTABANI BAĞLANTISI ---
const db = new sqlite3.Database('./araba.db', (err) => {
  if (err) console.error('Hata:', err.message);
  else {
    console.log('Veritabanına bağlanıldı.');
    db.run(`CREATE TABLE IF NOT EXISTS talepler (
        id INTEGER PRIMARY KEY AUTOINCREMENT, yil INTEGER, marka TEXT, model TEXT, renk TEXT, yakit TEXT, sanziman TEXT, motor TEXT, donanim TEXT, sunroof TEXT, kilometre INTEGER, hasar_durumu TEXT, tramer TEXT, ad_soyad TEXT, telefon TEXT, durum TEXT DEFAULT 'Bekliyor', olusturulma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // İLANLAR TABLOSUNA YENİ SÜTUNLAR EKLENDİ (yakit, sanziman, donanim, hasar_durumu)
    db.run(`CREATE TABLE IF NOT EXISTS ilanlar (
        id INTEGER PRIMARY KEY AUTOINCREMENT, marka TEXT, model TEXT, yil INTEGER, kilometre INTEGER, fiyat TEXT, resim_url TEXT, yakit TEXT, sanziman TEXT, donanim TEXT, hasar_durumu TEXT, olusturulma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// --- TALEPLER API ---
app.post('/api/talep-olustur', (req, res) => {
  const d = req.body;
  db.run(`INSERT INTO talepler (yil, marka, model, renk, yakit, sanziman, motor, donanim, sunroof, kilometre, hasar_durumu, tramer, ad_soyad, telefon) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, 
  [d.yil, d.marka, d.model, d.renk, d.yakit, d.sanziman, d.motor, d.donanim, d.sunroof, d.kilometre, d.hasar_durumu, d.tramer, d.ad_soyad, d.telefon], function(err) {
    if (err) return res.status(500).json({ hata: err.message }); res.json({ mesaj: 'Başarılı' });
  });
});

app.get('/api/talepler', (req, res) => { 
    db.all("SELECT * FROM talepler ORDER BY olusturulma_tarihi DESC", [], (err, rows) => { 
        res.json(rows); 
    }); 
});

app.post('/api/teklif-ver', (req, res) => { 
    db.run(`UPDATE talepler SET durum = ? WHERE id = ?`, [`Teklif Verildi: ${req.body.teklif_fiyati} TL`, req.body.id], function(err) { 
        res.json({ mesaj: 'İletildi' }); 
    }); 
});

// YENİ EKLENEN: Talebi İncelendi olarak güncelleme (Listeden gizlemek için)
app.put('/api/talep-durum/:id', (req, res) => {
    db.run(`UPDATE talepler SET durum = ? WHERE id = ?`, [req.body.durum, req.params.id], function(err) {
        if (err) return res.status(500).json({ hata: err.message });
        res.json({ mesaj: 'Talep durumu güncellendi' });
    });
});

// YENİ EKLENEN: Talebi veritabanından kalıcı olarak silme
app.delete('/api/talep-sil/:id', (req, res) => {
    db.run(`DELETE FROM talepler WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ hata: err.message });
        res.json({ mesaj: 'Talep kalıcı olarak silindi' });
    });
});

// --- İLANLAR API ---
app.post('/api/ilan-ekle', (req, res) => {
  const d = req.body;
  db.run(`INSERT INTO ilanlar (marka, model, yil, kilometre, fiyat, resim_url, yakit, sanziman, donanim, hasar_durumu) VALUES (?,?,?,?,?,?,?,?,?,?)`, 
  [d.marka, d.model, d.yil, d.kilometre, d.fiyat, d.resim_url, d.yakit, d.sanziman, d.donanim, d.hasar_durumu], function(err) {
    if (err) return res.status(500).json({ hata: err.message }); res.json({ mesaj: 'Eklendi' });
  });
});

app.get('/api/ilanlar', (req, res) => { 
    db.all("SELECT * FROM ilanlar ORDER BY olusturulma_tarihi DESC", [], (err, rows) => { 
        res.json(rows); 
    }); 
});

app.delete('/api/ilan-sil/:id', (req, res) => { 
    db.run(`DELETE FROM ilanlar WHERE id = ?`, req.params.id, function(err) { 
        res.json({ mesaj: 'Silindi' }); 
    }); 
});

app.get('/admin', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'admin.html')); });
app.listen(port, () => { console.log(`Sunucu http://localhost:${port} adresinde çalışıyor 🚀`); });
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Veritabanına bağlanılamadı:', err.stack);
  }
  console.log('Bulut Veritabanına (Supabase) başarıyla bağlanıldı.');
  
  const createTalepler = `
    CREATE TABLE IF NOT EXISTS talepler (
      id SERIAL PRIMARY KEY,
      yil INTEGER, marka VARCHAR(100), model VARCHAR(100), renk VARCHAR(50), 
      yakit VARCHAR(50), sanziman VARCHAR(50), motor VARCHAR(100), donanim VARCHAR(100), 
      sunroof VARCHAR(50), kilometre INTEGER, hasar_durumu TEXT, tramer VARCHAR(50), 
      ad_soyad VARCHAR(100), telefon VARCHAR(20), durum VARCHAR(50) DEFAULT 'Bekliyor', 
      olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  const createIlanlar = `
    CREATE TABLE IF NOT EXISTS ilanlar (
      id SERIAL PRIMARY KEY, 
      marka VARCHAR(100), model VARCHAR(100), yil INTEGER, kilometre INTEGER, 
      fiyat VARCHAR(50), resim_url TEXT, yakit VARCHAR(50), sanziman VARCHAR(50), 
      donanim VARCHAR(100), hasar_durumu TEXT, 
      olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  client.query(createTalepler, (err) => { if (err) console.error("Talepler tablosu hatası:", err); });
  client.query(createIlanlar, (err) => { if (err) console.error("İlanlar tablosu hatası:", err); });
  release();
});

// --- TALEPLER API ---
app.post('/api/talep-olustur', async (req, res) => {
  const d = req.body;
  const query = `INSERT INTO talepler (yil, marka, model, renk, yakit, sanziman, motor, donanim, sunroof, kilometre, hasar_durumu, tramer, ad_soyad, telefon) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`;
  const values = [d.yil, d.marka, d.model, d.renk, d.yakit, d.sanziman, d.motor, d.donanim, d.sunroof, d.kilometre, d.hasar_durumu, d.tramer, d.ad_soyad, d.telefon];
  
  try {
    await pool.query(query, values);
    res.json({ mesaj: 'Talebiniz başarıyla alındı.' });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

app.get('/api/talepler', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM talepler ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

app.put('/api/talep-guncelle/:id', async (req, res) => {
  try {
    await pool.query(`UPDATE talepler SET durum = $1 WHERE id = $2`, [req.body.durum, req.params.id]);
    res.json({ mesaj: 'Talep durumu güncellendi' });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

app.delete('/api/talep-sil/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM talepler WHERE id = $1`, [req.params.id]);
    res.json({ mesaj: 'Talep kalıcı olarak silindi' });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// --- İLANLAR API ---
app.post('/api/ilan-ekle', async (req, res) => {
  const d = req.body;
  const query = `INSERT INTO ilanlar (marka, model, yil, kilometre, fiyat, resim_url, yakit, sanziman, donanim, hasar_durumu) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
  const values = [d.marka, d.model, d.yil, d.kilometre, d.fiyat, d.resim_url, d.yakit, d.sanziman, d.donanim, d.hasar_durumu];
  
  try {
    await pool.query(query, values);
    res.json({ mesaj: 'Eklendi' });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

app.get('/api/ilanlar', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ilanlar ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

app.delete('/api/ilan-sil/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM ilanlar WHERE id = $1`, [req.params.id]);
    res.json({ mesaj: 'Silindi' });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});
// Admin Giriş Kontrolü
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Render'daki kasayla, kullanıcının girdiği şifreyi karşılaştır
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor...`);
});

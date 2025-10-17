import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

const app = express();

// 🧠 Konfigurasi CORS — ganti URL Netlify sesuai domainmu
app.use(
  cors({
    origin: [
      'https://kaskintamani03.netlify.app', // frontend production
      'http://localhost:5173',              // frontend local dev
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// 🩺 Health check route
app.get('/', (req, res) => {
  res.send('✅ Kas RT Backend aktif dan berjalan');
});

// ✅ Tes koneksi DB
db.raw('SELECT 1+1 AS result')
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch((err) => console.error('❌ DB connection failed:', err));

// 🧑‍💻 Auth route contoh
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db('users').where({ username }).first();
    if (!user) return res.status(401).json({ error: 'User tidak ditemukan' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Password salah' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1d' }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// 🧾 Residents API
app.get('/residents', async (req, res) => {
  try {
    const residents = await db('residents').select();
    res.json(residents);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data warga' });
  }
});

app.post('/residents', async (req, res) => {
  try {
    const data = req.body;
    await db('residents').insert(data);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menambahkan data warga' });
  }
});

app.put('/residents/:id', async (req, res) => {
  try {
    await db('residents').where({ id: req.params.id }).update(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate data warga' });
  }
});

app.delete('/residents/:id', async (req, res) => {
  try {
    await db('residents').where({ id: req.params.id }).del();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus data warga' });
  }
});

// 🏦 Payments API
app.get('/payments', async (req, res) => {
  try {
    const payments = await db('payments').select();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data pembayaran' });
  }
});

app.post('/payments', async (req, res) => {
  try {
    await db('payments').insert(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambahkan pembayaran' });
  }
});

// 💸 Expenses API
app.get('/expenses', async (req, res) => {
  try {
    const expenses = await db('expenses').select();
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data pengeluaran' });
  }
});

app.post('/expenses', async (req, res) => {
  try {
    await db('expenses').insert(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambahkan pengeluaran' });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// =============================
// ✅ server.js (PostgreSQL)
// =============================
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// =============================
// ✅ Tes koneksi DB
// =============================
db.raw('SELECT 1+1 AS result')
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch((err) => console.error('❌ DB connection failed:', err));

// =============================
// 🧑 Auth Middleware
// =============================
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// =============================
// 👤 Login
// =============================
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db('users').where({ username }).first();
  if (!user) return res.status(401).json({ message: 'User not found' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid password' });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, role: user.role });
});

// =============================
// 🏠 Residents
// =============================
app.get('/residents', authMiddleware, async (req, res) => {
  const rows = await db('residents').select('*').orderBy('name', 'asc');
  res.json(rows);
});

app.post('/residents', authMiddleware, async (req, res) => {
  const data = req.body;
  await db('residents').insert(data);
  res.json({ message: 'Resident added' });
});

app.put('/residents/:id', authMiddleware, async (req, res) => {
  await db('residents').where({ id: req.params.id }).update(req.body);
  res.json({ message: 'Resident updated' });
});

app.delete('/residents/:id', authMiddleware, async (req, res) => {
  await db('residents').where({ id: req.params.id }).del();
  res.json({ message: 'Resident deleted' });
});

// =============================
// 💸 Payments
// =============================
app.get('/payments', authMiddleware, async (req, res) => {
  const rows = await db('payments').select('*').orderBy('date', 'desc');
  res.json(rows);
});

app.post('/payments', authMiddleware, async (req, res) => {
  await db('payments').insert(req.body);
  res.json({ message: 'Payment recorded' });
});

app.put('/payments/:id', authMiddleware, async (req, res) => {
  await db('payments').where({ id: req.params.id }).update(req.body);
  res.json({ message: 'Payment updated' });
});

app.delete('/payments/:id', authMiddleware, async (req, res) => {
  await db('payments').where({ id: req.params.id }).del();
  res.json({ message: 'Payment deleted' });
});

// =============================
// 🧾 Expenses
// =============================
app.get('/expenses', authMiddleware, async (req, res) => {
  const rows = await db('expenses').select('*').orderBy('date', 'desc');
  res.json(rows);
});

app.post('/expenses', authMiddleware, async (req, res) => {
  await db('expenses').insert(req.body);
  res.json({ message: 'Expense recorded' });
});

app.put('/expenses/:id', authMiddleware, async (req, res) => {
  await db('expenses').where({ id: req.params.id }).update(req.body);
  res.json({ message: 'Expense updated' });
});

app.delete('/expenses/:id', authMiddleware, async (req, res) => {
  await db('expenses').where({ id: req.params.id }).del();
  res.json({ message: 'Expense deleted' });
});

// 🆕 Settings
app.get("/settings", async (req, res) => {
  try {
    const settings = await db("settings").where({ id: 1 }).first();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.put("/settings", async (req, res) => {
  const { initial_cash, warning_threshold } = req.body;
  try {
    await db("settings")
      .where({ id: 1 })
      .update({
        initial_cash: initial_cash || 0,
        warning_threshold: warning_threshold || 0
      });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});


// =============================
// 🟢 Start Server
// =============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

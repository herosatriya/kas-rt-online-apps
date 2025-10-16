import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const dbPromise = open({
  filename: './data.db',
  driver: sqlite3.Database
})

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

// ========= Init DB =========
;(async () => {
  const db = await dbPromise
  await db.exec(`CREATE TABLE IF NOT EXISTS residents (
    id TEXT PRIMARY KEY,
    name TEXT,
    address TEXT,
    phone TEXT
  )`)
  await db.exec(`CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    residentId TEXT,
    date TEXT,
    type TEXT,
    amount REAL,
    note TEXT
  )`)
  await db.exec(`CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    date TEXT,
    amount REAL,
    note TEXT
  )`)
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','viewer'))
  )`)

  // Seed user jika kosong
  const row = await db.get('SELECT COUNT(*) as c FROM users')
  if (row.c === 0) {
    const adminHash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10)
    const viewerHash = await bcrypt.hash('warga123', 10)
    await db.run('INSERT INTO users (id, username, password, role) VALUES (?,?,?,?)',
      ['u_admin', 'admin', adminHash, 'admin'])
    await db.run('INSERT INTO users (id, username, password, role) VALUES (?,?,?,?)',
      ['u_viewer', 'warga', viewerHash, 'viewer'])
    console.log('✅ Seed users: admin/admin123 & warga/warga123')
  }
})()

// ========= Auth helpers =========
function authRequired(req, res, next) {
  const hdr = req.headers.authorization || ''
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
  next()
}

// ========= Auth routes =========
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body
  const db = await dbPromise
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username])
  if (!user) return res.status(401).json({ message: 'User tidak ditemukan' })
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ message: 'Password salah' })
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' })
  res.json({ token, role: user.role })
})

app.get('/auth/me', authRequired, (req, res) => {
  res.json({ id: req.user.id, role: req.user.role })
})

// ========= Public GET (read) =========
app.get('/residents', async (req, res) => {
  const db = await dbPromise
  const rows = await db.all('SELECT * FROM residents')
  res.json(rows)
})
app.get('/payments', async (req, res) => {
  const db = await dbPromise
  const rows = await db.all('SELECT * FROM payments')
  res.json(rows)
})
app.get('/expenses', async (req, res) => {
  const db = await dbPromise
  const rows = await db.all('SELECT * FROM expenses')
  res.json(rows)
})

// ========= Write ops (admin only) =========
app.post('/residents', authRequired, adminOnly, async (req, res) => {
  const db = await dbPromise
  const { id, name, address, phone } = req.body
  await db.run('INSERT INTO residents VALUES (?,?,?,?)', [id, name, address, phone])
  res.json({ ok: true })
})
app.put('/residents/:id', authRequired, adminOnly, async (req, res) => {
  const db = await dbPromise
  const { name, address, phone } = req.body
  await db.run('UPDATE residents SET name=?, address=?, phone=? WHERE id=?', [name, address, phone, req.params.id])
  res.json({ ok: true })
})
app.delete('/residents/:id', authRequired, adminOnly, async (req, res) => {
  const db = await dbPromise
  await db.run('DELETE FROM residents WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

app.post('/payments', authRequired, adminOnly, async (req, res) => {
  const db = await dbPromise
  const { id, residentId, date, type, amount, note } = req.body
  await db.run('INSERT INTO payments VALUES (?,?,?,?,?,?)', [id, residentId, date, type, amount, note])
  res.json({ ok: true })
})

app.post('/expenses', authRequired, adminOnly, async (req, res) => {
  const db = await dbPromise
  const { id, date, amount, note } = req.body
  await db.run('INSERT INTO expenses VALUES (?,?,?,?)', [id, date, amount, note])
  res.json({ ok: true })
})

app.listen(4000, () => {
  console.log('✅ Backend running on http://localhost:4000')
})

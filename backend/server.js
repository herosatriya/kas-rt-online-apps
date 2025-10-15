import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const app = express()
app.use(cors())
app.use(express.json())

const dbPromise = open({
  filename: './data.db',
  driver: sqlite3.Database
})

// init table
;(async () => {
  const db = await dbPromise
  await db.exec(`CREATE TABLE IF NOT EXISTS residents (
    id TEXT PRIMARY KEY,
    name TEXT,
    address TEXT,
    phone TEXT
  )`);
  await db.exec(`CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    residentId TEXT,
    date TEXT,
    type TEXT,
    amount REAL,
    note TEXT
  )`);
  await db.exec(`CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    date TEXT,
    amount REAL,
    note TEXT
  )`);
})()

// Residents
app.get('/residents', async (req,res)=>{
  const db = await dbPromise
  const rows = await db.all('SELECT * FROM residents')
  res.json(rows)
})
app.post('/residents', async (req,res)=>{
  const db = await dbPromise
  const {id,name,address,phone} = req.body
  await db.run('INSERT INTO residents VALUES (?,?,?,?)',[id,name,address,phone])
  res.json({ok:true})
})

// Payments
app.get('/payments', async (req,res)=>{
  const db = await dbPromise
  const rows = await db.all('SELECT * FROM payments')
  res.json(rows)
})
app.post('/payments', async (req,res)=>{
  const db = await dbPromise
  const {id,residentId,date,type,amount,note} = req.body
  await db.run('INSERT INTO payments VALUES (?,?,?,?,?,?)',[id,residentId,date,type,amount,note])
  res.json({ok:true})
})

// Expenses
app.get('/expenses', async (req,res)=>{
  const db = await dbPromise
  const rows = await db.all('SELECT * FROM expenses')
  res.json(rows)
})
app.post('/expenses', async (req,res)=>{
  const db = await dbPromise
  const {id,date,amount,note} = req.body
  await db.run('INSERT INTO expenses VALUES (?,?,?,?)',[id,date,amount,note])
  res.json({ok:true})
})

// Update resident (simple via delete+insert)
app.put('/residents/:id', async (req, res) => {
  const db = await dbPromise
  const { name, address, phone } = req.body
  await db.run('UPDATE residents SET name=?, address=?, phone=? WHERE id=?', [name, address, phone, req.params.id])
  res.json({ ok: true })
})

// Delete resident
app.delete('/residents/:id', async (req, res) => {
  const db = await dbPromise
  await db.run('DELETE FROM residents WHERE id=?', [req.params.id])
  res.json({ ok: true })
})

app.listen(4000, () => {
  console.log('✅ Backend running on http://localhost:4000')
})

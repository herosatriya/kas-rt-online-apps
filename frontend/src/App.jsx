import React, { useEffect, useState } from 'react';
import {
  Box, Button, Heading, Input, Table, Tbody, Td, Th, Thead, Tr,
  Tabs, TabList, TabPanels, Tab, TabPanel, Stack, useToast, Text, Select
} from '@chakra-ui/react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';


const API_URL = 'http://localhost:4000'; // sesuaikan saat deploy

function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n || 0));
}

function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function App() {
  const toast = useToast();
  const [residents, setResidents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [initialCash, setInitialCash] = useState(0);
  const [warningThreshold, setWarningThreshold] = useState(100000);

  // load data
  useEffect(() => {
    axios.get(`${API_URL}/residents`).then(r => setResidents(r.data));
    axios.get(`${API_URL}/payments`).then(r => setPayments(r.data));
    axios.get(`${API_URL}/expenses`).then(r => setExpenses(r.data));
  }, []);

  const totalCash = () => {
    const totalP = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalE = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    return Number(initialCash || 0) + totalP - totalE;
  };
  // === Export Excel ===
  function exportExcel() {
    const wb = XLSX.utils.book_new();
    const wsResidents = XLSX.utils.json_to_sheet(residents);
    const wsPayments = XLSX.utils.json_to_sheet(payments);
    const wsExpenses = XLSX.utils.json_to_sheet(expenses);
    const summary = [{
      initialCash,
      totalPayments: payments.reduce((s, p) => s + Number(p.amount || 0), 0),
      totalExpenses: expenses.reduce((s, e) => s + Number(e.amount || 0), 0),
      currentCash: totalCash()
    }];
    const wsSummary = XLSX.utils.json_to_sheet(summary);

    XLSX.utils.book_append_sheet(wb, wsResidents, 'Residents');
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments');
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `rt-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // === Export PDF ===
  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text('Laporan RT Keuangan', 10, 10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString()}`, 10, 18);
    doc.text(`Kas Awal: Rp ${formatCurrency(initialCash)}`, 10, 26);
    doc.text(`Total Iuran & Donasi: Rp ${formatCurrency(payments.reduce((s, p) => s + Number(p.amount || 0), 0))}`, 10, 34);
    doc.text(`Total Pengeluaran: Rp ${formatCurrency(expenses.reduce((s, e) => s + Number(e.amount || 0), 0))}`, 10, 42);
    doc.text(`Saldo Saat Ini: Rp ${formatCurrency(totalCash())}`, 10, 50);

    let y = 60;
    doc.setFontSize(10);
    doc.text('Pembayaran:', 10, y);
    y += 6;
    payments.slice(-30).reverse().forEach(p => {
      const r = residents.find(r => r.id === p.residentId);
      const line = `${p.date} | ${r?.name || '-'} | ${p.type} | Rp ${formatCurrency(p.amount)} | ${p.note || ''}`;
      if (y > 270) { doc.addPage(); y = 10; }
      doc.text(line, 10, y);
      y += 6;
    });

    doc.save(`rt-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // === Add Resident ===
  const [newResident, setNewResident] = useState({ name: '', address: '', phone: '' });
  const addResident = async () => {
    if (!newResident.name.trim()) return;
    const newData = {
      id: crypto.randomUUID(),
      name: newResident.name,
      address: newResident.address,
      phone: newResident.phone
    };
    setResidents([...residents, newData]);
    await axios.post(`${API_URL}/residents`, newData);
    setNewResident({ name: '', address: '', phone: '' });
  };

  // === Add Payment ===
  const [newPayment, setNewPayment] = useState({ residentId: '', date: '', type: 'iuran', amount: '', note: '' });
  function addPayment() {
    const p = { id: generateId('p_'), ...newPayment, amount: Number(newPayment.amount || 0) };
    axios.post(`${API_URL}/payments`, p).then(() => {
      setPayments([...payments, p]);
      setNewPayment({ residentId: '', date: '', type: 'iuran', amount: '', note: '' });
      toast({ title: 'Pembayaran tercatat ✅', status: 'success', duration: 2000 });
    });
  }

  // === Add Expense ===
  const [newExpense, setNewExpense] = useState({ date: '', amount: '', note: '' });
  function addExpense() {
    const e = { id: generateId('e_'), ...newExpense, amount: Number(newExpense.amount || 0) };
    axios.post(`${API_URL}/expenses`, e).then(() => {
      setExpenses([...expenses, e]);
      setNewExpense({ date: '', amount: '', note: '' });
      toast({ title: 'Pengeluaran tercatat ✅', status: 'success', duration: 2000 });
    });
  }

  // --- Sorting state & helpers ---
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const sortedResidents = React.useMemo(() => {
    const data = [...residents];
    if (!sortConfig.key) return data;
    return data.sort((a, b) => {
      const av = (a[sortConfig.key] ?? '').toString().toLowerCase();
      const bv = (b[sortConfig.key] ?? '').toString().toLowerCase();
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [residents, sortConfig]);

  function handleSort(key) {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }

  return (
    <Box p={6}>
      <Heading mb={4}>💰KAS ONLINE RT03 KINTAMANI💰</Heading>
      <Tabs colorScheme="teal" variant="enclosed">
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab>Warga</Tab>
          <Tab>Pembayaran</Tab>
          <Tab>Pengeluaran</Tab>
          <Tab>Settings</Tab>
        </TabList>

        <TabPanels>
          {/* === Dashboard === */}
          <TabPanel>
            <Stack direction={{ base: "column", md: "row" }} spacing={6} mt={4}>
              <Box flex="1">
                <Heading size="sm" mb={2}>📋 Pembayaran Terakhir</Heading>
                <Table size="sm" variant="striped">
                  <Thead>
                    <Tr>
                      <Th>Tanggal</Th>
                      <Th>Nama</Th>
                      <Th>Jenis</Th>
                      <Th>Jumlah</Th>
                      <Th>Catatan</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {payments.slice(-10).reverse().map(p => (
                      <Tr key={p.id}>
                        <Td>{p.date}</Td>
                        <Td>{residents.find(r => r.id === p.residentId)?.name || '-'}</Td>
                        <Td>{p.type}</Td>
                        <Td>Rp {formatCurrency(p.amount)}</Td>
                        <Td>{p.note || '-'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <Box flex="1">
                <Heading size="sm" mb={2}>💸 Pengeluaran Terakhir</Heading>
                <Table size="sm" variant="striped">
                  <Thead>
                    <Tr>
                      <Th>Tanggal</Th>
                      <Th>Jumlah</Th>
                      <Th>Catatan</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {expenses.slice(-10).reverse().map(e => (
                      <Tr key={e.id}>
                        <Td>{e.date}</Td>
                        <Td>Rp {formatCurrency(e.amount)}</Td>
                        <Td>{e.note || '-'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Stack>

          </TabPanel>

          {/* === Warga === */}
          <TabPanel>
            <Heading size="md" mb={4}>Data Warga</Heading>

            {/* Form Tambah Warga */}
            <Stack
              direction={{ base: 'column', md: 'row' }}
              spacing={2}
              mb={4}
              align="stretch"
            >
              <Input
                placeholder="Nama"
                value={newResident.name}
                onChange={e => setNewResident({ ...newResident, name: e.target.value })}
              />
              <Input
                placeholder="Alamat"
                value={newResident.address}
                onChange={e => setNewResident({ ...newResident, address: e.target.value })}
              />
              <Input
                placeholder="Telepon"
                value={newResident.phone}
                onChange={e => setNewResident({ ...newResident, phone: e.target.value })}
              />
              <Button
                colorScheme="teal"
                minW={{ base: '100%', md: '100px' }}
                onClick={addResident}
              >
                Tambah
              </Button>
            </Stack>

            {/* Tabel Warga */}
            <Table variant="striped" size="sm">
              <Thead>
                <Tr>
                  <Th cursor="pointer" onClick={() => handleSort('name')}>
                    Nama {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </Th>
                  <Th cursor="pointer" onClick={() => handleSort('address')}>
                    Alamat {sortConfig.key === 'address' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </Th>
                  <Th cursor="pointer" onClick={() => handleSort('phone')}>
                    Telepon {sortConfig.key === 'phone' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </Th>
                  <Th>Aksi</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedResidents.map(r => (
                  <Tr key={r.id}>
                    <Td>{r.name}</Td>
                    <Td>{r.address}</Td>
                    <Td>{r.phone}</Td>
                    <Td>
                      <Stack direction="row" spacing={2}>
                        <Button
                          size="xs"
                          colorScheme="blue"
                          onClick={() => {
                            const newName = prompt('Ubah nama:', r.name);
                            const newAddress = prompt('Ubah alamat:', r.address);
                            const newPhone = prompt('Ubah telepon:', r.phone);
                            if (newName !== null) {
                              const updated = { name: newName, address: newAddress, phone: newPhone };
                              setResidents(residents.map(rr => rr.id === r.id ? { ...rr, ...updated } : rr));
                              axios.put(`${API_URL}/residents/${r.id}`, updated);
                            }
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="red"
                          onClick={() => {
                            if (confirm(`Hapus data ${r.name}?`)) {
                              setResidents(residents.filter(rr => rr.id !== r.id));
                              axios.delete(`${API_URL}/residents/${r.id}`);
                            }
                          }}
                        >
                          Hapus
                        </Button>
                      </Stack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

          </TabPanel>


          {/* === Pembayaran === */}
          <TabPanel>
            <Stack
              direction={{ base: 'column', md: 'row' }}
              spacing={2}
              mb={4}
              align="stretch"
            >
              <Select
                placeholder="Pilih Warga"
                value={newPayment.residentId}
                onChange={e => setNewPayment({ ...newPayment, residentId: e.target.value })}
              >
                {residents.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>

              <Input
                type="date"
                value={newPayment.date}
                onChange={e => setNewPayment({ ...newPayment, date: e.target.value })}
              />

              <Select
                value={newPayment.type}
                onChange={e => setNewPayment({ ...newPayment, type: e.target.value })}
              >
                <option value="iuran">Iuran Bulanan</option>
                <option value="donation">Donasi</option>
              </Select>

              <Input
                placeholder="Jumlah (Rp)"
                type="number"
                value={newPayment.amount}
                onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
              />

              <Input
                placeholder="Catatan"
                value={newPayment.note}
                onChange={e => setNewPayment({ ...newPayment, note: e.target.value })}
              />

              <Button
                colorScheme="teal"
                minW={{ base: '100%', md: '120px' }}
                onClick={addPayment}
              >
                Simpan
              </Button>
            </Stack>

            <Table variant="striped" size="sm">
              <Thead>
                <Tr>
                  <Th>Tanggal</Th>
                  <Th>Nama</Th>
                  <Th>Jenis</Th>
                  <Th>Jumlah</Th>
                  <Th>Catatan</Th> {/* 🆕 Tambah kolom catatan */}
                </Tr>
              </Thead>
              <Tbody>
                {payments.map(p => (
                  <Tr key={p.id}>
                    <Td>{p.date}</Td>
                    <Td>{residents.find(r => r.id === p.residentId)?.name || '-'}</Td>
                    <Td>{p.type}</Td>
                    <Td>Rp {Number(p.amount).toLocaleString('id-ID')}</Td>
                    <Td>{p.note || '-'}</Td> {/* 🆕 tampilkan isi note */}
                  </Tr>
                ))}
              </Tbody>
            </Table>

          </TabPanel>

          {/* === Pengeluaran === */}
          <TabPanel>
            <Stack
              direction={{ base: 'column', md: 'row' }}
              spacing={2}
              mb={4}
              align="stretch"
            >
              <Input
                type="date"
                value={newExpense.date}
                onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
              />
              <Input
                placeholder="Jumlah (Rp)"
                type="number"
                value={newExpense.amount}
                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
              />
              <Input
                placeholder="Catatan"
                value={newExpense.note}
                onChange={e => setNewExpense({ ...newExpense, note: e.target.value })}
              />
              <Button
                colorScheme="teal"
                minW={{ base: '100%', md: '120px' }}
                onClick={addExpense}
              >
                Simpan
              </Button>
            </Stack>

            <Table variant="striped" size="sm">
              <Thead>
                <Tr>
                  <Th>Tanggal</Th>
                  <Th>Jumlah</Th>
                  <Th>Catatan</Th>
                </Tr>
              </Thead>
              <Tbody>
                {expenses.slice().reverse().map(e => (
                  <Tr key={e.id}>
                    <Td>{e.date}</Td>
                    <Td>Rp {formatCurrency(e.amount)}</Td>
                    <Td>{e.note}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>

          {/* === Settings === */}
          <TabPanel>
            <Stack spacing={4}>
              <Box>
                <Text>Kas Awal</Text>
                <Input type="number" value={initialCash} onChange={e => setInitialCash(e.target.value)} />
              </Box>
              <Box>
                <Text>Warning Threshold</Text>
                <Input type="number" value={warningThreshold} onChange={e => setWarningThreshold(e.target.value)} />
              </Box>
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

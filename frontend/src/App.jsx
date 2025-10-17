import React, { useEffect, useState } from 'react';
import {
  Box, Button, Heading, Input, Table, Tbody, Td, Th, Thead, Tr,
  Tabs, TabList, TabPanels, Tab, TabPanel, Stack, useToast, Text, Select
} from '@chakra-ui/react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

const API_URL = import.meta.env.VITE_API_URL;

function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n || 0));
}
function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function App() {
  const toast = useToast();

  // 🧠 Auth state
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || '',
    role: localStorage.getItem('role') || ''
  });

  // 🧠 Data state
  const [residents, setResidents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [initialCash, setInitialCash] = useState(0);
  const [warningThreshold, setWarningThreshold] = useState(100000);

  // 🧠 Loading + last update
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (auth.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [auth.token]);

  // === FETCH DATA ===
  async function fetchData() {
    try {
      setLoading(true);
      const [resResidents, resPayments, resExpenses] = await Promise.all([
        axios.get(`${API_URL}/residents`),
        axios.get(`${API_URL}/payments`),
        axios.get(`${API_URL}/expenses`)
      ]);
      setResidents(resResidents.data);
      setPayments(resPayments.data);
      setExpenses(resExpenses.data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Gagal ambil data:', err);
      toast({
        title: 'Gagal memuat data',
        description: 'Pastikan server backend aktif',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  }

  // 🧭 Refresh otomatis tiap 5 menit
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 menit
    return () => clearInterval(interval);
  }, []);

  // 🧮 Hitung total saldo
  const totalCash = () => {
    const totalP = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalE = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    return Number(initialCash || 0) + totalP - totalE;
  };

  // === Export Excel & PDF ===
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

  // === Login Panel ===
  function LoginPanel() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    async function doLogin() {
      try {
        const res = await axios.post(`${API_URL}/auth/login`, { username, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        setAuth({ token: res.data.token, role: res.data.role });
        toast({ title: 'Login berhasil', status: 'success', duration: 1500 });
      } catch (e) {
        toast({ title: 'Login gagal', description: 'Username/Password salah', status: 'error' });
      }
    }
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50" p={6}>
        <Box p={6} bg="white" borderWidth="1px" borderRadius="md" w="100%" maxW="sm">
          <Heading size="md" mb={4}>Masuk Kas RT</Heading>
          <Stack spacing={3}>
            <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <Button colorScheme="teal" onClick={doLogin}>Login</Button>
          </Stack>
          <Text fontSize="sm" mt={3} color="gray.500">Admin awal: <b>admin/admin123</b> • Viewer: <b>warga/warga123</b></Text>
        </Box>
      </Box>
    );
  }

  // 🌀 Loading screen
  if (loading && !auth.token) {
    return (
      <Box p={6} textAlign="center">
        <Text fontSize="lg" color="gray.600">⏳ Memuat data...</Text>
      </Box>
    );
  }

  if (!auth.token) return <LoginPanel />;

  return (
    <Box p={6}>
      <Heading mb={4}>
        💰KAS ONLINE RT03 KINTAMANI💰
        <Button
          size="sm"
          ml={3}
          colorScheme="gray"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            setAuth({ token: '', role: '' });
          }}
        >
          Logout
        </Button>
      </Heading>

      <Text fontSize="sm" color="gray.500" mb={2}>
        Terakhir update: {lastUpdate || '-'}
      </Text>

      <Tabs colorScheme="teal" variant="enclosed">
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab isDisabled={auth.role === 'viewer'}>Warga</Tab>
          <Tab isDisabled={auth.role === 'viewer'}>Pembayaran</Tab>
          <Tab isDisabled={auth.role === 'viewer'}>Pengeluaran</Tab>
          <Tab isDisabled={auth.role === 'viewer'}>Settings</Tab>
        </TabList>

        <TabPanels>
          {/* === Dashboard === */}
          <TabPanel>
            <Box p={4} shadow="md" borderWidth="1px" borderRadius="md" mb={4}>
              <Text>Kas Awal: <b>Rp {formatCurrency(initialCash)}</b></Text>
              <Text>Saldo Sekarang: <b>Rp {formatCurrency(totalCash())}</b></Text>
            </Box>
          </TabPanel>

          {/* === Placeholder Tab lainnya === */}
          <TabPanel><Text>📊 Halaman Warga</Text></TabPanel>
          <TabPanel><Text>💸 Halaman Pembayaran</Text></TabPanel>
          <TabPanel><Text>🧾 Halaman Pengeluaran</Text></TabPanel>
          <TabPanel><Text>⚙️ Pengaturan</Text></TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

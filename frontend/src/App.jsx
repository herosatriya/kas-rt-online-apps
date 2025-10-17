// 📁 App.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  useToast
} from '@chakra-ui/react';
import axios from 'axios';

// 🧩 Komponen modular
import DashboardTab from "./components/DashboardTab";
import ResidentsTab from "./components/ResidentsTab";
import PaymentsTab from "./components/PaymentsTab";
import ExpensesTab from "./components/ExpensesTab";
import SettingsTab from "./components/SettingsTab";
import LoginPanel from "./components/LoginPanel";
// 🟢 URL backend dari environment (Netlify/Vercel)
const API_URL = import.meta.env.VITE_API_URL;

// 💰 Helper Format
function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n || 0));
}

export default function App() {
  const toast = useToast();

  // 🌐 Auth state
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || '',
    role: localStorage.getItem('role') || ''
  });

  // 💾 State global
  const [residents, setResidents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [initialCash, setInitialCash] = useState(0);
  const [warningThreshold, setWarningThreshold] = useState(100000);

  // 🪝 Pasang token header jika login
  useEffect(() => {
    if (auth.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [auth.token]);

  // 🕒 Fetch data dari server
  async function fetchData() {
    try {
      const [resRes, resPay, resExp] = await Promise.all([
        axios.get(`${API_URL}/residents`),
        axios.get(`${API_URL}/payments`),
        axios.get(`${API_URL}/expenses`)
      ]);
      setResidents(resRes.data);
      setPayments(resPay.data);
      setExpenses(resExp.data);
    } catch (e) {
      console.error('Gagal load data:', e);
    }
  }

  // 📅 Auto refresh data setiap 5 menit
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 💵 Hitung total saldo kas
  const totalCash = () => {
    const totalP = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalE = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    return Number(initialCash || 0) + totalP - totalE;
  };

  // 🚪 Jika belum login
  if (!auth.token) {
    return <LoginPanel setAuth={setAuth} API_URL={API_URL} toast={toast} />;
  }

  return (
    <Box p={6}>
      {/* Header */}
      <Heading mb={4} display="flex" alignItems="center" justifyContent="space-between">
        💰 KAS ONLINE RT03 KINTAMANI
        <Button
          size="sm"
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
            <DashboardTab
              payments={payments}
              expenses={expenses}
              residents={residents}
              initialCash={initialCash}
              totalCash={totalCash}
            />
          </TabPanel>

          {/* === Warga === */}
          <TabPanel>
            {auth.role === 'viewer' ? (
              <Box color="gray.500" p={4}>Akses terbatas (viewer)</Box>
            ) : (
              <ResidentsTab
                residents={residents}
                setResidents={setResidents}
                API_URL={API_URL}
              />
            )}
          </TabPanel>

          {/* === Pembayaran === */}
          <TabPanel>
            {auth.role === 'viewer' ? (
              <Box color="gray.500" p={4}>Akses terbatas (viewer)</Box>
            ) : (
              <PaymentsTab
                payments={payments}
                setPayments={setPayments}
                residents={residents}
                API_URL={API_URL}
                toast={toast}
              />
            )}
          </TabPanel>

          {/* === Pengeluaran === */}
          <TabPanel>
            {auth.role === 'viewer' ? (
              <Box color="gray.500" p={4}>Akses terbatas (viewer)</Box>
            ) : (
              <ExpensesTab
                expenses={expenses}
                setExpenses={setExpenses}
                API_URL={API_URL}
                toast={toast}
              />
            )}
          </TabPanel>

          {/* === Settings === */}
          <TabPanel>
            {auth.role === 'viewer' ? (
              <Box color="gray.500" p={4}>Akses terbatas (viewer)</Box>
            ) : (
              <SettingsTab
                initialCash={initialCash}
                setInitialCash={setInitialCash}
                warningThreshold={warningThreshold}
                setWarningThreshold={setWarningThreshold}
              />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

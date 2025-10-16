import React, { useEffect, useState } from 'react';
import {
  Box, Button, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, Text
} from '@chakra-ui/react';
import axios from 'axios';
import LoginPanel from './components/LoginPanel.jsx';
import ResidentsTab from './components/ResidentsTab.jsx';
import PaymentsTab from './components/PaymentsTab.jsx';
import ExpensesTab from './components/ExpensesTab.jsx';
import DashboardTab from './components/DashboardTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || '',
    role: localStorage.getItem('role') || ''
  });

  const [residents, setResidents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [initialCash, setInitialCash] = useState(0);
  const [warningThreshold, setWarningThreshold] = useState(100000);

  useEffect(() => {
    if (auth.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [auth.token]);

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

  if (!auth.token) return <LoginPanel setAuth={setAuth} />;

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

      <Tabs colorScheme="teal" variant="enclosed">
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab isDisabled={auth.role === 'viewer'}>Warga</Tab>
          <Tab isDisabled={auth.role === 'viewer'}>Pembayaran</Tab>
          <Tab isDisabled={auth.role === 'viewer'}>Pengeluaran</Tab>
          <Tab isDisabled={auth.role === 'viewer'}>Settings</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <DashboardTab
              residents={residents}
              payments={payments}
              expenses={expenses}
              initialCash={initialCash}
              totalCash={totalCash}
            />
          </TabPanel>

          <TabPanel>
            {auth.role === 'viewer' ? (
              <Text color="gray.500" p={4}>Akses terbatas (viewer)</Text>
            ) : (
              <ResidentsTab residents={residents} setResidents={setResidents} />
            )}
          </TabPanel>

          <TabPanel>
            {auth.role === 'viewer' ? (
              <Text color="gray.500" p={4}>Akses terbatas (viewer)</Text>
            ) : (
              <PaymentsTab payments={payments} setPayments={setPayments} residents={residents} />
            )}
          </TabPanel>

          <TabPanel>
            {auth.role === 'viewer' ? (
              <Text color="gray.500" p={4}>Akses terbatas (viewer)</Text>
            ) : (
              <ExpensesTab expenses={expenses} setExpenses={setExpenses} />
            )}
          </TabPanel>

          <TabPanel>
            {auth.role === 'viewer' ? (
              <Text color="gray.500" p={4}>Akses terbatas (viewer)</Text>
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

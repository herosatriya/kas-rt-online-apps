import { Table, Thead, Tbody, Tr, Th, Td, Button, Stack, Input } from '@chakra-ui/react';
import { useState } from 'react';
import axios from 'axios';
import { formatCurrency } from '../utils/formatUtils';

export default function ExpensesTab({ expenses, setExpenses, API_URL, toast }) {
  const [newExpense, setNewExpense] = useState({ date: '', amount: '', note: '' });

  function addExpense() {
    if (!newExpense.date || !newExpense.amount) return;
    const e = { id: `e_${Date.now()}`, ...newExpense, amount: Number(newExpense.amount || 0) };
    axios.post(`${API_URL}/expenses`, e).then(() => {
      setExpenses([...expenses, e]);
      setNewExpense({ date: '', amount: '', note: '' });
      toast({ title: 'Pengeluaran tercatat ✅', status: 'success', duration: 2000 });
    });
  }

  return (
    <>
      <Stack direction={{ base: 'column', md: 'row' }} spacing={2} mb={4}>
        <Input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} />
        <Input placeholder="Jumlah (Rp)" type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
        <Input placeholder="Catatan" value={newExpense.note} onChange={e => setNewExpense({ ...newExpense, note: e.target.value })} />
        <Button colorScheme="teal" minW={{ base: '100%', md: '120px' }} onClick={addExpense}>Simpan</Button>
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
    </>
  );
}

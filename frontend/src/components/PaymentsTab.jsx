import { Table, Thead, Tbody, Tr, Th, Td, Button, Stack, Input, Select } from '@chakra-ui/react';
import { useState } from 'react';
import axios from 'axios';
import { formatCurrency } from '../utils/formatUtils';

export default function PaymentsTab({ payments, setPayments, residents, API_URL, toast }) {
  const [newPayment, setNewPayment] = useState({
    residentId: '',
    date: '',
    type: 'iuran',
    amount: '',
    note: ''
  });

  function addPayment() {
    if (!newPayment.residentId || !newPayment.date || !newPayment.amount) return;
    const p = { id: `p_${Date.now()}`, ...newPayment, amount: Number(newPayment.amount || 0) };
    axios.post(`${API_URL}/payments`, p).then(() => {
      setPayments([...payments, p]);
      setNewPayment({ residentId: '', date: '', type: 'iuran', amount: '', note: '' });
      toast({ title: 'Pembayaran tercatat ✅', status: 'success', duration: 2000 });
    });
  }

  return (
    <>
      <Stack direction={{ base: 'column', md: 'row' }} spacing={2} mb={4}>
        <Select
          placeholder="Pilih Warga"
          value={newPayment.residentId}
          onChange={e => setNewPayment({ ...newPayment, residentId: e.target.value })}
        >
          {residents.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
        <Input type="date" value={newPayment.date} onChange={e => setNewPayment({ ...newPayment, date: e.target.value })} />
        <Select value={newPayment.type} onChange={e => setNewPayment({ ...newPayment, type: e.target.value })}>
          <option value="iuran">Iuran Bulanan</option>
          <option value="donation">Donasi</option>
        </Select>
        <Input placeholder="Jumlah (Rp)" type="number" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} />
        <Input placeholder="Catatan" value={newPayment.note} onChange={e => setNewPayment({ ...newPayment, note: e.target.value })} />
        <Button colorScheme="teal" minW={{ base: '100%', md: '120px' }} onClick={addPayment}>Simpan</Button>
      </Stack>

      <Table variant="striped" size="sm">
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
          {payments.map(p => (
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
    </>
  );
}

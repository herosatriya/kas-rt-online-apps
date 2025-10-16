import { Button, Heading, Input, Stack, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { useState, useMemo } from 'react';
import axios from 'axios';
import { formatCurrency } from '../utils/formatUtils.js';

const API_URL = import.meta.env.VITE_API_URL;

export default function ResidentsTab({ residents, setResidents }) {
  const [newResident, setNewResident] = useState({ name: '', address: '', phone: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  function handleSort(key) {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }

  const sortedResidents = useMemo(() => {
    const data = [...residents];
    return data.sort((a, b) => {
      const av = (a[sortConfig.key] ?? '').toString().toLowerCase();
      const bv = (b[sortConfig.key] ?? '').toString().toLowerCase();
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [residents, sortConfig]);

  async function addResident() {
    if (!newResident.name.trim()) return;
    const newData = { id: crypto.randomUUID(), ...newResident };
    setResidents([...residents, newData]);
    await axios.post(`${API_URL}/residents`, newData);
    setNewResident({ name: '', address: '', phone: '' });
  }

  return (
    <>
      <Heading size="md" mb={4}>Data Warga</Heading>
      <Stack direction={{ base: 'column', md: 'row' }} spacing={2} mb={4} align="stretch">
        <Input placeholder="Nama" value={newResident.name} onChange={e => setNewResident({ ...newResident, name: e.target.value })} />
        <Input placeholder="Alamat" value={newResident.address} onChange={e => setNewResident({ ...newResident, address: e.target.value })} />
        <Input placeholder="Telepon" value={newResident.phone} onChange={e => setNewResident({ ...newResident, phone: e.target.value })} />
        <Button colorScheme="teal" minW={{ base: '100%', md: '100px' }} onClick={addResident}>Tambah</Button>
      </Stack>

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
    </>
  );
}

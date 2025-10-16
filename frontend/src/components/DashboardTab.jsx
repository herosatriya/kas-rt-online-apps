import {
  Box, Heading, Table, Tbody, Td, Th, Thead, Tr, Stack
} from '@chakra-ui/react';
import { formatCurrency } from '../utils/formatUtils.js';

export default function DashboardTab({ residents, payments, expenses, initialCash, totalCash }) {
  return (
    <>
      <Box p={4} shadow="md" borderWidth="1px" borderRadius="md" mb={4}>
        <p>Kas Awal: <b>Rp {formatCurrency(initialCash)}</b></p>
        <p>Saldo Sekarang: <b>Rp {formatCurrency(totalCash())}</b></p>
      </Box>

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
    </>
  );
}

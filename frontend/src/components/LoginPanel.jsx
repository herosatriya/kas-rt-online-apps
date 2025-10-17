import { Box, Heading, Stack, Input, Button, Text } from '@chakra-ui/react';
import { useState } from 'react';
import axios from 'axios';

export default function LoginPanel({ setAuth, API_URL, toast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function doLogin() {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      setAuth({ token: res.data.token, role: res.data.role });
      toast({ title: 'Login berhasil', status: 'success', duration: 1500 });
    } catch {
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
        <Text fontSize="sm" mt={3} color="gray.500">
          Admin: <b>admin/admin123</b> • Viewer: <b>warga/warga123</b>
        </Text>
      </Box>
    </Box>
  );
}

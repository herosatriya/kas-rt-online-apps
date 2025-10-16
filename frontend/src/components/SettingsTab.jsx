import { Box, Input, Stack, Text } from '@chakra-ui/react';

export default function SettingsTab({ initialCash, setInitialCash, warningThreshold, setWarningThreshold }) {
  return (
    <Stack spacing={4}>
      <Box>
        <Text>Kas Awal</Text>
        <Input
          type="number"
          value={initialCash}
          onChange={e => setInitialCash(e.target.value)}
        />
      </Box>
      <Box>
        <Text>Warning Threshold</Text>
        <Input
          type="number"
          value={warningThreshold}
          onChange={e => setWarningThreshold(e.target.value)}
        />
      </Box>
    </Stack>
  );
}

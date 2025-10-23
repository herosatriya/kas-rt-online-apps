import React from "react";
import { Box, Input, Stack, Text, useToast } from "@chakra-ui/react";
import axios from "axios";

export default function SettingsTab({
  initialCash,
  setInitialCash,
  warningThreshold,
  setWarningThreshold,
  API_URL
}) {
  const toast = useToast();

  const saveSettings = async (field, value) => {
    try {
      await axios.put(`${API_URL}/settings`, {
        initialCash: field === "initialCash" ? value : initialCash,
        warningThreshold: field === "warningThreshold" ? value : warningThreshold
      });
      toast({
        title: "Pengaturan tersimpan",
        status: "success",
        duration: 1500,
      });
    } catch (err) {
      toast({
        title: "Gagal menyimpan pengaturan",
        status: "error",
        duration: 1500,
      });
    }
  };

  return (
    <Stack spacing={4}>
      <Box>
        <Text>Kas Awal</Text>
        <Input
          type="number"
          value={initialCash}
          onChange={e => {
            const val = e.target.value;
            setInitialCash(val);
            saveSettings("initialCash", val);
          }}
        />
      </Box>
      <Box>
        <Text>Warning Threshold</Text>
        <Input
          type="number"
          value={warningThreshold}
          onChange={e => {
            const val = e.target.value;
            setWarningThreshold(val);
            saveSettings("warningThreshold", val);
          }}
        />
      </Box>
    </Stack>
  );
}

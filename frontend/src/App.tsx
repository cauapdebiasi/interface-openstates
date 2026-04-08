import { useState } from 'react';
import { Container, Grid, Select, Box, Title, LoadingOverlay, Paper } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { Header } from './components/Header';
import { PoliticianGrid } from './components/PoliticianGrid';
import { getPeople, getStates, getParties } from './services/api';

function App() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);

  const [debouncedState] = useDebouncedValue(selectedState, 300);
  const [debouncedParty] = useDebouncedValue(selectedParty, 300);

  const { data: states = [], isLoading: isLoadingStates } = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const data = await getStates();
      return data.filter(Boolean);
    },
  });

  const { data: parties = [], isLoading: isLoadingParties } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const data = await getParties();
      return data.filter(Boolean);
    },
  });

  const { data: politicians = [], isLoading: isLoadingPoliticians } = useQuery({
    queryKey: ['people', debouncedState, debouncedParty],
    queryFn: () => getPeople(debouncedState || undefined, debouncedParty || undefined),
  });

  return (
    <Box mih="100vh" pb="xl">
      <Header />

      <Container size="xl" mt="xl">
        <Paper shadow="sm" p="md" radius="md" mb="xl" pos="relative">
          <LoadingOverlay visible={isLoadingStates || isLoadingParties} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

          <Title order={3} mb="md">Filtros</Title>

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Estado"
                placeholder="Selecione o estado"
                data={states}
                value={selectedState}
                onChange={(val) => setSelectedState(val)}
                clearable
                searchable
                disabled={isLoadingStates}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Partido"
                placeholder="Selecione o partido"
                data={parties}
                value={selectedParty}
                onChange={(val) => setSelectedParty(val)}
                clearable
                searchable
                disabled={isLoadingParties}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        <Box pos="relative" style={{ minHeight: 300 }}>
          <LoadingOverlay visible={isLoadingPoliticians} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
          <PoliticianGrid politicians={politicians} />
        </Box>
      </Container>
    </Box>
  );
}

export default App;

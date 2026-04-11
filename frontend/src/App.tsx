import { useMemo } from 'react';
import { Container, Grid, Select, Box, Title, LoadingOverlay, Paper } from '@mantine/core';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Header } from './components/Header';
import { PoliticianGrid } from './components/PoliticianGrid';
import { getPeople, getStates, getParties } from './services/api';
import { useUrlFilters } from './hooks/useUrlFilters';

function App() {
  const {
    selectedState, setSelectedState,
    selectedParty, setSelectedParty,
    debouncedState, debouncedParty,
  } = useUrlFilters();

  const { data: states = [], isLoading: isLoadingStates } = useQuery({
    queryKey: ['states'],
    queryFn: getStates,
  });

  const { data: parties = [], isLoading: isLoadingParties } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const data = await getParties();
      return data.filter(Boolean);
    },
  });

  const {
    data,
    isLoading: isLoadingPoliticians,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['people', debouncedState, debouncedParty],
    queryFn: ({ pageParam }) =>
      getPeople(debouncedState || undefined, debouncedParty || undefined, pageParam || undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pagination?.next_cursor ?? undefined,
  });

  const politicians = useMemo(
    () => data?.pages.flatMap((page) => page.results) ?? [],
    [data]
  );

  return (
    <Box mih="100vh" pb="xl">
      <Header />

      <Container size="xl" mt="xl">
        <Paper className="filter-paper" p="md" mb="xl" pos="relative">
          <LoadingOverlay visible={isLoadingStates || isLoadingParties} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

          <Title className="filter-title" order={3} mb="md">Filtros</Title>

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
          <PoliticianGrid
            politicians={politicians}
            hasFilters={!!debouncedState || !!debouncedParty}
            onLoadMore={() => fetchNextPage()}
            hasMore={!!hasNextPage}
            isLoadingMore={isFetchingNextPage}
          />
        </Box>
      </Container>
    </Box>
  );
}

export default App;

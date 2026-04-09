import { SimpleGrid, Text, Center, Stack, Button } from '@mantine/core';
import { IconRefresh, IconDatabaseOff } from '@tabler/icons-react';
import { PoliticianCard } from './PoliticianCard';
import { useSyncMutation } from '../hooks/useSyncMutation';
import type { Politician } from '../services/api';

interface PoliticianGridProps {
  politicians: Politician[];
  hasFilters: boolean;
}

export function PoliticianGrid({ politicians, hasFilters }: PoliticianGridProps) {
  const syncMutation = useSyncMutation();

  if (!politicians || politicians.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconDatabaseOff size={48} style={{ opacity: 0.3 }} />
          {hasFilters ? (
            <Text className="empty-state" c="dimmed" size="lg">
              Nenhum político encontrado para os filtros selecionados.
            </Text>
          ) : (
            <>
              <Text className="empty-state" c="dimmed" size="lg" ta="center">
                Nenhuma informação disponível no banco de dados. Atualize os dados agora!
              </Text>
              <Button
                className="sync-button"
                leftSection={<IconRefresh size={16} />}
                onClick={() => syncMutation.mutate()}
                loading={syncMutation.isPending}
                size="md"
              >
                Atualizar Dados
              </Button>
            </>
          )}
        </Stack>
      </Center>
    );
  }

  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
      spacing="lg"
      verticalSpacing="lg"
    >
      {politicians.map((politician) => (
        <PoliticianCard key={politician.id} politician={politician} />
      ))}
    </SimpleGrid>
  );
}


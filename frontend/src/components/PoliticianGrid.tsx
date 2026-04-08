import { SimpleGrid, Text, Center } from '@mantine/core';
import { PoliticianCard } from './PoliticianCard';
import type { Politician } from '../services/api';

interface PoliticianGridProps {
  politicians: Politician[];
}

export function PoliticianGrid({ politicians }: PoliticianGridProps) {
  if (!politicians || politicians.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed" size="lg">Nenhum político encontrado para os filtros selecionados.</Text>
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

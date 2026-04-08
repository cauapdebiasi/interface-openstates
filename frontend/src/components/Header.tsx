import { Group, Title, Container, Paper } from '@mantine/core';
import { IconBuildingMonument } from '@tabler/icons-react';

export function Header() {
  return (
    <Paper radius={0} py="md" pos="sticky" top={0} style={{ zIndex: 100, borderBottom: '1px solid black' }}>
      <Container size="xl">
        <Group justify="space-between">
          <Group gap="sm">
            <IconBuildingMonument size={32} />
            <Title order={2} style={{ fontFamily: 'Inter, sans-serif' }}>
              Teste Técnico OpenStates
            </Title>
          </Group>
        </Group>
      </Container>
    </Paper>
  );
}

import { Group, Title, Container, Paper, Button } from '@mantine/core';
import { IconBuildingMonument, IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { syncPeople } from '../services/api';

export function Header() {
  const syncMutation = useMutation({
    mutationFn: syncPeople,
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'A atualização de dados foi iniciada em segundo plano!',
        color: 'green',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Erro ao iniciar a sincronização';
      notifications.show({
        title: 'Atenção',
        message: errorMessage,
        color: error.response?.status === 409 ? 'orange' : 'red',
      });
    }
  });

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

          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => syncMutation.mutate()}
            loading={syncMutation.isPending}
            variant="light"
          >
            Atualizar Dados
          </Button>
        </Group>
      </Container>
    </Paper>
  );
}

import { Group, Title, Container, Paper, Button, Select } from '@mantine/core';
import { IconBuildingMonument, IconRefresh, IconClock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { syncPeople, getSyncSchedule, updateSyncSchedule } from '../services/api';

export function Header() {
  const queryClient = useQueryClient();

  const { data: currentSchedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['syncSchedule'],
    queryFn: getSyncSchedule,
  });

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

  const scheduleMutation = useMutation({
    mutationFn: updateSyncSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncSchedule'] });
      notifications.show({
        title: 'Agendamento Atualizado',
        message: 'A frequência de sincronização foi alterada.',
        color: 'blue',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível alterar a frequência de sincronização.',
        color: 'red',
      });
    }
  });

  return (
    <Paper className="app-header" radius={0} py="md" pos="sticky" top={0} style={{ zIndex: 100 }}>
      <Container size="xl">
        <Group justify="space-between">
          <Group gap="sm">
            <IconBuildingMonument className="app-header-icon" size={32} />
            <Title className="app-header-title" order={2}>
              OpenStates
            </Title>
          </Group>

          <Group className="header-actions" gap="md">
            <Select
              leftSection={<IconClock size={16} />}
              placeholder="Agendamento"
              data={[
                { value: 'none', label: 'Nunca (Manual)' },
                { value: 'hourly', label: 'A cada hora' },
                { value: 'daily', label: 'Diariamente' },
                { value: 'every2days', label: 'A cada 2 dias' },
                { value: 'every3days', label: 'A cada 3 dias' },
                { value: 'weekly', label: 'Semanalmente' }
              ]}
              value={currentSchedule || 'none'}
              onChange={(val) => {
                if (val) scheduleMutation.mutate(val);
              }}
              disabled={isScheduleLoading || scheduleMutation.isPending}
              allowDeselect={false}
            />

            <Button
              className="sync-button"
              leftSection={<IconRefresh size={16} />}
              onClick={() => syncMutation.mutate()}
              loading={syncMutation.isPending}
            >
              Atualizar Dados
            </Button>
          </Group>
        </Group>
      </Container>
    </Paper>
  );
}

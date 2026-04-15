import { Group, Title, Container, Paper, Button, Select, Tooltip } from '@mantine/core';
import { IconBuildingMonument, IconRefresh, IconClock, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { getSyncSchedule, updateSyncSchedule, getSyncProgressData, cancelSyncRequest } from '../services/api';
import { useSyncMutation } from '../hooks/useSyncMutation';

export function Header() {
  const queryClient = useQueryClient();
  const refetchIntervalMs = 2000

  const { data: currentSchedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['syncSchedule'],
    queryFn: getSyncSchedule,
  });

  const { data: progress } = useQuery({
    queryKey: ['syncProgress'],
    queryFn: getSyncProgressData,
    refetchInterval: (query) => {
      // refetch enquanto estiver sincronizando, senão para
      return query.state.data?.isSyncing ? refetchIntervalMs : false;
    },
  });

  const isSyncing = progress?.isSyncing ?? false;

  const syncMutation = useSyncMutation();

  const cancelMutation = useMutation({
    mutationFn: cancelSyncRequest,
    onSuccess: () => {
      notifications.show({
        title: 'Cancelado',
        message: 'A sincronização será interrompida em breve.',
        color: 'blue',
      });
    },
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

  const handleSyncClick = () => {
    if (isSyncing) {
      cancelMutation.mutate();
    } else {
      syncMutation.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['syncProgress'] });
        },
        onError: (error: any) => {
          // se já tem sync rodando então vai invalidar
          // pra cair no loop de refetch e permitir acompanhar e cancelar
          if (error.response?.status === 409) {
            queryClient.invalidateQueries({ queryKey: ['syncProgress'] });
          }
        },
      });
    }
  };

  const progressLabel = isSyncing && progress
    ? progress.total > 0
      ? `${progress.synced}/${progress.total} jurisdições${progress.current ? ` — ${progress.current}` : ''}`
      : 'Mapeando jurisdições...'
    : undefined;

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

          <Group className="header-actions" gap="md" align="flex-end">
            <Select
              label="Sincronização automática"
              leftSection={<IconClock size={16} />}
              placeholder="Agendamento"
              data={[
                { value: 'none', label: 'Nunca (Manual)' },
                { value: 'everyMinute', label: 'A cada minuto' },
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

            <Tooltip
              label={progressLabel}
              disabled={!progressLabel}
              position="bottom"
              withArrow
            >
              <Button
                className={`sync-button ${isSyncing ? 'sync-button--active' : ''}`}
                leftSection={isSyncing ? <IconX size={16} /> : <IconRefresh size={16} />}
                onClick={handleSyncClick}
                loading={syncMutation.isPending || cancelMutation.isPending}
                color={isSyncing ? 'red' : undefined}
                variant={isSyncing ? 'light' : 'filled'}
              >
                {isSyncing ? 'Parar processo' : 'Atualizar Dados'}
              </Button>
            </Tooltip>
          </Group>
        </Group>
      </Container>
    </Paper>
  );
}

import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { syncPeople } from '../services/api';

export function useSyncMutation() {
  return useMutation({
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
}

import cron from 'node-cron';
import { triggerBackgroundSync } from './openstatesService.js';
import { Setting } from '../models/Setting.js';

let currentTask: cron.ScheduledTask | null = null;

const frequencyToCron: Record<string, string> = {
  hourly: '0 * * * *',
  daily: '0 0 * * *',
  every2days: '0 0 */2 * *',
  every3days: '0 0 */3 * *',
  weekly: '0 0 * * 0',
};

export const initSchedule = async () => {
  try {
    const setting = await Setting.findByPk('sync_frequency');
    const frequency = setting?.value || 'none';
    console.log(`[Schedule] Frequência de atualização inicializada como: ${frequency}`);
    applySchedule(frequency);
  } catch (error) {
    console.error('[Schedule] Erro ao carregar agendamento do banco:', error);
  }
};

export const updateSchedule = async (frequency: string) => {
  const allowed = ['none', 'hourly', 'daily', 'every2days', 'every3days', 'weekly'];
  if (!allowed.includes(frequency)) {
    throw new Error('Frequência de sincronização inválida.');
  }

  await Setting.upsert({ key: 'sync_frequency', value: frequency });
  console.log(`[Schedule] Frequência atualizada para: ${frequency}`);
  applySchedule(frequency);
};

export const getSchedule = async (): Promise<string> => {
  const setting = await Setting.findByPk('sync_frequency');
  return setting?.value || 'none';
};

const applySchedule = (frequency: string) => {
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
  }

  if (frequency === 'none') {
    console.log('[Schedule] Sincronização automática desativada.');
    return;
  }

  const cronPattern = frequencyToCron[frequency];
  if (!cronPattern) return;

  currentTask = cron.schedule(cronPattern, () => {
    console.log(`[Schedule] Executando sincronização automática (${frequency})...`);
    triggerBackgroundSync();
  });

  console.log(`[Schedule] Agendado ativo: ${cronPattern}`);
};

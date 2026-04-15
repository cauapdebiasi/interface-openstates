import { Person } from '../models/Person.js';
import { Jurisdiction } from '../models/Jurisdiction.js';
import sequelize from '../config/database.js';
import { fetchWithRetries, DailyLimitError, OpenStatesResult } from './openstatesApi.js';

export let isSyncing = false;
let shouldCancel = false;

interface SyncProgress {
  synced: number;
  total: number;
  current: string | null;
}

const syncProgress: SyncProgress = { synced: 0, total: 0, current: null };

export const getSyncProgress = () => ({ isSyncing, ...syncProgress });

export const cancelSync = () => {
  if (!isSyncing) return false;
  shouldCancel = true;
  return true;
};

export const resetSyncingStateForTests = () => {
  isSyncing = false;
  shouldCancel = false;
};

const savePeopleBatch = async (results: OpenStatesResult[]) => {
  const peopleData = results.map((item) => ({
    id: item.id,
    name: item.name,
    role_title: item.current_role?.title || null,
    party: item.party,
    jurisdiction_id: item.jurisdiction?.id || null,
    gender: item.gender || null,
    birth_date: item.birth_date || null,
    death_date: item.death_date || null,
    image: item.image || null,
  }));

  await sequelize.transaction(async (t) => {
    await Person.bulkCreate(peopleData, {
      updateOnDuplicate: ['name', 'role_title', 'party', 'jurisdiction_id', 'gender', 'birth_date', 'death_date', 'image'],
      transaction: t,
    });
  });
};

const saveJurisdictions = async (jurisdictions: OpenStatesResult[]) => {
  const data = jurisdictions.map((j) => ({
    id: j.id,
    name: j.name,
    classification: j.classification || null,
  }));

  await sequelize.transaction(async (t) => {
    await Jurisdiction.bulkCreate(data, {
      updateOnDuplicate: ['name', 'classification'],
      transaction: t,
    });
  });
};

const checkCancel = () => {
  if (shouldCancel) throw new Error('Sincronização cancelada pelo usuário.');
};

const markDone = (task: JurisdictionTask, tasks: JurisdictionTask[]) => {
  task.done = true;
  syncProgress.synced = tasks.filter((t) => t.done).length;
};

interface JurisdictionTask {
  id: string;
  name: string;
  maxPage: number;
  done: boolean;
}

const fetchAllJurisdictions = async (): Promise<OpenStatesResult[]> => {
  let jurisdictions: OpenStatesResult[] = [];
  let page = 1;
  let maxPage = 1;

  do {
    checkCancel();
    console.log(`[Worker] Mapeando Jurisdições - Página ${page}...`);

    const res = await fetchWithRetries('/jurisdictions', {
      classification: 'state',
      per_page: 52,
      page,
    });

    maxPage = res.data.pagination?.max_page || 1;
    jurisdictions = jurisdictions.concat(res.data.results || []);
    page++;
  } while (page <= maxPage);

  return jurisdictions;
};

const processTask = async (task: JurisdictionTask, tasks: JurisdictionTask[], pageLevel: number) => {
  if (pageLevel > task.maxPage) {
    markDone(task, tasks);
    return;
  }

  try {
    syncProgress.current = task.name;
    console.log(`[Worker] Buscando ${task.name} - Página ${pageLevel}/${task.maxPage}...`);

    const res = await fetchWithRetries('/people', {
      jurisdiction: task.name,
      per_page: 50,
      page: pageLevel,
    });

    task.maxPage = res.data.pagination?.max_page || 1;
    const results = res.data.results || [];

    if (results.length > 0) {
      await savePeopleBatch(results);
      console.log(`[Worker] -> ${results.length} salvos em ${task.name} (Página ${pageLevel}/${task.maxPage})`);
    }

    if (pageLevel >= task.maxPage) {
      markDone(task, tasks);
      await Jurisdiction.update(
        { last_synced_at: new Date() },
        { where: { id: task.id } },
      );
    }
  } catch (error: unknown) {
    if (error instanceof DailyLimitError) {
      console.warn(`[Worker] ${error.message}. Abortando sincronização.`);
      throw error;
    }
    if (error instanceof Error && error.message?.includes('cancelada')) throw error;

    console.error(`[Worker] Erro ao buscar ${task.name} - Página ${pageLevel}. Continuando...`);
    markDone(task, tasks);
  }
};

const runSyncWorker = async () => {
  try {
    console.log('[Worker] Iniciando sincronização...');
    syncProgress.synced = 0;
    syncProgress.total = 0;
    syncProgress.current = null;

    const jurisdictions = await fetchAllJurisdictions();

    if (jurisdictions.length > 0) {
      await saveJurisdictions(jurisdictions);
      console.log(`[Worker] ${jurisdictions.length} jurisdições salvas no banco.`);
    }

    // prioriza estados que nunca foram sincronizados ou sincronizados há mais tempo
    const ordered = await Jurisdiction.findAll({
      order: [
        [sequelize.literal('last_synced_at IS NOT NULL'), 'ASC'],
        ['last_synced_at', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    console.log('[Worker] Iniciando varredura horizontal...');

    // Varredura horizontal: página X de TODOS os estados,
    // depois página X+1 de todos, pra ter variedade maior de dados
    const tasks: JurisdictionTask[] = ordered.map((j) => ({
      id: j.id,
      name: j.name,
      maxPage: 1,
      done: false,
    }));

    syncProgress.total = tasks.length;
    let pageLevel = 1;

    while (tasks.some((t) => !t.done)) {
      checkCancel();
      const pending = tasks.filter((t) => !t.done);
      console.log(`[Worker] ── Varredura página ${pageLevel} | ${pending.length} jurisdições pendentes ──`);

      for (const task of pending) {
        checkCancel();
        await processTask(task, tasks, pageLevel);
      }

      pageLevel++;
    }

    console.log('[Worker] Sincronização concluída com sucesso!');
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('cancelada')) {
      console.log('[Worker] Sincronização cancelada pelo usuário.');
    } else {
      console.error('[Worker] Falha na sincronização:', error);
    }
  } finally {
    isSyncing = false;
    shouldCancel = false;
    syncProgress.current = null;
  }
};


export const triggerBackgroundSync = () => {
  if (isSyncing) {
    return { status: 'rejected', message: 'Já existe uma sincronização em andamento.' };
  }

  isSyncing = true;
  shouldCancel = false;

  runSyncWorker().catch((e) => {
    console.error('[Worker] Erro ao executar sincronização:', e);
    isSyncing = false;
    shouldCancel = false;
  });

  return { status: 'accepted', message: 'Job de Sincronização disparado em background!' };
};

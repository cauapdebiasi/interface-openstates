import axios from 'axios';
import { env } from '../config/env.js';
import { Person } from '../models/Person.js';
import { Jurisdiction } from '../models/Jurisdiction.js';
import sequelize from '../config/database.js';

const openstatesApi = axios.create({
  baseURL: 'https://v3.openstates.org',
  headers: {
    'x-api-key': env.OPENSTATES_API_KEY,
  },
});

const MAX_REQUESTS_PER_WINDOW = 10;
const WINDOW_MS = 60_000;
const SAFETY_BUFFER_MS = 200;

const requestTimestamps: number[] = [];

const isTestEnv = () => process.env.NODE_ENV === 'test';

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, isTestEnv() ? 1 : ms));

// A API permite 10 requests por minuto
// Em vez de esperar um delay fixo entre cada request, armazenamos
// os timestamps das últimas requisições e quando a última passar um minuto
// libero o espaço para mais 10 requests
const waitForRateLimit = async (): Promise<void> => {
  if (isTestEnv()) return;

  while (true) {
    const now = Date.now();

    while (requestTimestamps.length > 0 && now - requestTimestamps[0] >= WINDOW_MS) {
      requestTimestamps.shift();
    }

    if (requestTimestamps.length < MAX_REQUESTS_PER_WINDOW) {
      requestTimestamps.push(now);
      return;
    }

    // espero até o mais antigo sair da janela
    const oldestTimestamp = requestTimestamps[0];
    const waitTime = WINDOW_MS - (now - oldestTimestamp) + SAFETY_BUFFER_MS;
    console.log(`[RateLimiter] Janela cheia (${requestTimestamps.length}/${MAX_REQUESTS_PER_WINDOW}). Aguardando ${(waitTime / 1000).toFixed(1)}s...`);
    await sleep(waitTime);
  }
};

export let isSyncing = false;

// para limpar o estado nos testes
export const resetSyncingStateForTests = () => { isSyncing = false; };

class DailyLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DailyLimitError';
  }
}

const fetchWithRetries = async (url: string, params: any, retries = 4): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await waitForRateLimit();
      return await openstatesApi.get(url, { params });
    } catch (error: any) {
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail || '';

      // Se a api retornar limite diário excedido, aborta tudo
      if (status === 429 && /day/i.test(detail)) {
        throw new DailyLimitError(`Limite diário atingido: ${detail}`);
      }

      if (attempt === retries) throw error;

      // espera exponencial para 429 (rate limit por minuto)
      if (status === 429) {
        const backoff = Math.min(3000 * Math.pow(2, attempt - 1), WINDOW_MS); // 3s, 6s, 12s... máx 60s
        console.warn(`[Worker] 429 na tentativa ${attempt} para ${url}. Aguardando ${(backoff / 1000).toFixed(0)}s...`);
        await sleep(backoff);
      } else {
        console.warn(`[Worker] Falha na tentativa ${attempt} para ${url}. Retentando em 2s...`);
        await sleep(2000);
      }
    }
  }
};

const savePeopleBatch = async (results: any[]) => {
  const peopleData = results.map((item: any) => ({
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

const saveJurisdictions = async (jurisdictions: any[]) => {
  const data = jurisdictions.map((j: any) => ({
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

interface JurisdictionTask {
  id: string;
  name: string;
  maxPage: number;
  done: boolean;
}

const runSyncWorker = async () => {
  try {
    console.log('[Worker] Iniciando sincronização...');

    let jurisdictions: any[] = [];
    let jurCurrentPage = 1;
    let jurMaxPage = 1;

    do {
      console.log(`[Worker] Mapeando Jurisdições - Página ${jurCurrentPage}...`);
      const jurRes = await fetchWithRetries('/jurisdictions', {
        classification: 'state',
        per_page: 52,
        page: jurCurrentPage,
      });

      jurMaxPage = jurRes.data.pagination?.max_page || 1;
      const results = jurRes.data.results || [];
      jurisdictions = jurisdictions.concat(results);
      jurCurrentPage++;
    } while (jurCurrentPage <= jurMaxPage);

    if (jurisdictions.length > 0) {
      await saveJurisdictions(jurisdictions);
      console.log(`[Worker] ${jurisdictions.length} jurisdições salvas no banco.`);
    }

    // prioriza estados que nunca foram sincronizados ou sincronizados há mais tempo
    const orderedJurisdictions = await Jurisdiction.findAll({
      order: [
        [sequelize.literal('last_synced_at IS NOT NULL'), 'ASC'],
        ['last_synced_at', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    console.log(`[Worker] Iniciando varredura horizontal...`);

    // Em vez de buscar todas as páginas de um estado antes de ir ao
    // próximo, busco a página X de TODOS os estados,
    // depois a página X+1 de todos, e assim por diante.
    // Pra ter uma variedade maior de dados
    const tasks: JurisdictionTask[] = orderedJurisdictions.map((j) => ({
      id: j.id,
      name: j.name,
      maxPage: 1,
      done: false,
    }));

    let currentPageLevel = 1;

    while (tasks.some((t) => !t.done)) {
      const pendingTasks = tasks.filter((t) => !t.done);
      console.log(`[Worker] ── Varredura página ${currentPageLevel} | ${pendingTasks.length} jurisdições pendentes ──`);

      for (const task of pendingTasks) {
        if (currentPageLevel > task.maxPage) {
          task.done = true;
          continue;
        }

        try {
          console.log(`[Worker] Buscando ${task.name} - Página ${currentPageLevel}/${task.maxPage}...`);

          const peopleRes = await fetchWithRetries('/people', {
            jurisdiction: task.name,
            per_page: 50,
            page: currentPageLevel,
          });

          task.maxPage = peopleRes.data.pagination?.max_page || 1;
          const results = peopleRes.data.results || [];

          if (results.length > 0) {
            await savePeopleBatch(results);
            console.log(`[Worker] -> ${results.length} salvos em ${task.name} (Página ${currentPageLevel}/${task.maxPage})`);
          }

          if (currentPageLevel >= task.maxPage) {
            task.done = true;
            await Jurisdiction.update(
              { last_synced_at: new Date() },
              { where: { id: task.id } }
            );
          }

        } catch (pageError: any) {
          // se atingiu o limite diário não adianta continuar
          if (pageError instanceof DailyLimitError) {
            console.warn(`[Worker] ${pageError.message}. Abortando sincronização.`);
            throw pageError;
          }

          console.error(`[Worker] Erro ao buscar ${task.name} - Página ${currentPageLevel}. Continuando...`);
          task.done = true;
        }
      }

      currentPageLevel++;
    }

    console.log('[Worker] Sincronização concluída com sucesso!');
  } catch (globalError) {
    console.error('[Worker] Falha na sincronização:', globalError);
  } finally {
    isSyncing = false;
  }
};

export const triggerBackgroundSync = () => {
  if (isSyncing) {
    return { status: 'rejected', message: 'Já existe uma sincronização em andamento.' };
  }

  isSyncing = true;

  runSyncWorker().catch((e) => {
    console.error('[Worker] Erro ao executar sincronização:', e);
    isSyncing = false;
  });

  return { status: 'accepted', message: 'Job de Sincronização disparado em background!' };
};


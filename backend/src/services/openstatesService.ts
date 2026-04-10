import axios from 'axios';
import { env } from '../config/env.js';
import { Person } from '../models/Person.js';
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

const fetchWithRetries = async (url: string, params: any, retries = 3): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await waitForRateLimit();
      return await openstatesApi.get(url, { params });
    } catch (error: any) {
      if (attempt === retries) throw error;
      console.warn(`[Worker] Falha na tentativa ${attempt} para ${url}. Retentando...`);
      await sleep(2000);
    }
  }
};

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
        page: jurCurrentPage
        per_page: 52,
      });

      jurMaxPage = jurRes.data.pagination?.max_page || 1;
      const results = jurRes.data.results || [];
      jurisdictions = jurisdictions.concat(results);
      await sleep(6100);
      jurCurrentPage++;
    } while (jurCurrentPage <= jurMaxPage);

    console.log(`[Worker] Total de ${jurisdictions.length} jurisdições catalogadas com sucesso. Iniciando Scan de Pessoas...`);

    for (const jurisdiction of jurisdictions) {
      const stateName = jurisdiction.name;
      let currentPage = 1;
      let maxPage = 1;

      do {
        console.log(`[Worker] Buscando ${stateName} - Página ${currentPage}...`);

        try {
          const peopleRes = await fetchWithRetries('/people', {
            jurisdiction: stateName,
            per_page: 50,
            page: currentPage,
          });

          maxPage = peopleRes.data.pagination?.max_page || 1;
          const results = peopleRes.data.results || [];

          if (results.length > 0) {
            const peopleData = results.map((item: any) => ({
              id: item.id,
              name: item.name,
              role_title: item.current_role?.title || null,
              party: item.party,
              state: item.jurisdiction?.name || null,
              image: item.image || null,
            }));

            await sequelize.transaction(async (t) => {
              await Person.bulkCreate(peopleData, {
                updateOnDuplicate: ['name', 'role_title', 'party', 'state', 'image'],
                transaction: t,
              });
            });
            console.log(`[Worker] -> ${results.length} salvos em ${stateName} (Page ${currentPage}/${maxPage})`);
          }

        } catch (pageError) {
          console.error(`[Worker] Erro final (após retries) ao buscar ${stateName} - Página ${currentPage}: O processo continuará para a próxima!`, pageError);
        }

        await sleep(6100);
        currentPage++;

      } while (currentPage <= maxPage);
    }

    console.log('[Worker] Sincronização concluída com Sucesso!');
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

  runSyncWorker().catch(e => {
    console.error('[Worker] Erro ao executar sincronização:', e);
    isSyncing = false;
  });

  return { status: 'accepted', message: 'Job de Sincronização disparado em background!' };
};

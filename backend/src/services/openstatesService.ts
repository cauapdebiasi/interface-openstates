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

// Delay de 6.1s pois a api só permite 10 requests/min, coloquei 100 ms a mais pois estava bloqueando
const OPENSTATES_DELAY = 6100;
const OPENSTATES_DELAY_SECONDS = OPENSTATES_DELAY / 1000;

// Tava dando erro nos testes, então quando for teste, diminui o delay pra 1ms
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, process.env.NODE_ENV === 'test' ? 1 : ms));

export let isSyncing = false;

// para limpar o estado nos testes
export const resetSyncingStateForTests = () => { isSyncing = false; };

const fetchWithRetries = async (url: string, params: any, retries = 3): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await openstatesApi.get(url, { params });
    } catch (error: any) {
      if (attempt === retries) throw error;
      console.warn(`[Worker] Falha na tentativa ${attempt} para ${url}. Tentando novamente em ${OPENSTATES_DELAY_SECONDS}s...`);
      await sleep(OPENSTATES_DELAY);
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
        per_page: 50,
        page: jurCurrentPage
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

import axios, { AxiosResponse } from 'axios';
import { env } from '../config/env.js';
import { waitForRateLimit, sleep, WINDOW_MS } from './rateLimiter.js';

export interface OpenStatesResult {
  id: string;
  name: string;
  party?: string;
  current_role?: { title?: string };
  jurisdiction?: { id?: string; name?: string };
  gender?: string;
  birth_date?: string;
  death_date?: string;
  image?: string;
  classification?: string;
}

interface OpenStatesPagination {
  max_page?: number;
}

export interface OpenStatesResponse {
  results: OpenStatesResult[];
  pagination?: OpenStatesPagination;
}

const openstatesApi = axios.create({
  baseURL: 'https://v3.openstates.org',
  headers: {
    'x-api-key': env.OPENSTATES_API_KEY,
  },
});

export class DailyLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DailyLimitError';
  }
}

export const fetchWithRetries = async (
  url: string,
  params: Record<string, unknown>,
  retries = 4,
): Promise<AxiosResponse<OpenStatesResponse>> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await waitForRateLimit();
      return await openstatesApi.get(url, { params });
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const detail = axios.isAxiosError(error)
        ? (error.response?.data as Record<string, string>)?.detail || ''
        : '';

      if (status === 429 && /day/i.test(detail)) {
        throw new DailyLimitError(`Limite diário atingido: ${detail}`);
      }

      if (attempt === retries) throw error;

      // espera exponencial para 429 (rate limit por minuto)
      if (status === 429) {
        const backoff = Math.min(3000 * Math.pow(2, attempt - 1), WINDOW_MS);
        console.warn(`[Worker] 429 na tentativa ${attempt} para ${url}. Aguardando ${(backoff / 1000).toFixed(0)}s...`);
        await sleep(backoff);
      } else {
        console.warn(`[Worker] Falha na tentativa ${attempt} para ${url}. Retentando em 2s...`);
        await sleep(2000);
      }
    }
  }

  throw new Error(`Todas as ${retries} tentativas falharam para ${url}`);
};

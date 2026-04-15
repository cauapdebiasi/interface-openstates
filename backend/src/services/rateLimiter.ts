const MAX_REQUESTS_PER_WINDOW = 10;
const WINDOW_MS = 60_000;
const SAFETY_BUFFER_MS = 200;

const requestTimestamps: number[] = [];

const isTestEnv = () => process.env.NODE_ENV === 'test';

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, isTestEnv() ? 1 : ms));

// A API permite 10 requests por minuto
// Em vez de esperar um delay fixo entre cada request, armazenamos
// os timestamps das últimas requisições e quando a última passar um minuto
// libero o espaço para mais 10 requests
export const waitForRateLimit = async (): Promise<void> => {
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

    const oldestTimestamp = requestTimestamps[0];
    const waitTime = WINDOW_MS - (now - oldestTimestamp) + SAFETY_BUFFER_MS;
    console.log(`[RateLimiter] Janela cheia (${requestTimestamps.length}/${MAX_REQUESTS_PER_WINDOW}). Aguardando ${(waitTime / 1000).toFixed(1)}s...`);
    await sleep(waitTime);
  }
};

export { WINDOW_MS };

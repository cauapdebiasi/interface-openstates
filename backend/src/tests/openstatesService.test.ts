import { describe, it, expect, beforeEach, vi } from 'vitest';
import { triggerBackgroundSync, resetSyncingStateForTests } from '../services/openstatesService.js';

// cria um mock do axios pra não bater na api nos testes
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn().mockImplementation(async () => {
          console.log("Axios mockado")
          // Demora um pouco só pra simular o tempo da api mas não aumentar esse valor
          // se não estoura o tempo limite do vitest e torna o teste lento
          return new Promise(resolve => setTimeout(() => resolve({ data: { results: [] } }), 50));
        }),
      })),
    },
  };
});

describe('OpenStates Service - Sincronização em background', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSyncingStateForTests();
  });

  it('deve aceitar a sincronização na primeira chamada e trancar na segunda', async () => {

    const response1 = triggerBackgroundSync();
    expect(response1.status).toBe('accepted');
    expect(response1.message).toMatch(/disparado em background/);


    const response2 = triggerBackgroundSync();
    expect(response2.status).toBe('rejected');
    expect(response2.message).toMatch(/andamento/);
  });

  it('deve aceitar a sincronização depois que uma acabar e permitir nova sincronização', async () => {

    const response1 = triggerBackgroundSync();
    expect(response1.status).toBe('accepted');

    // espera o dobro do delay só por garantia
    await new Promise(resolve => setTimeout(resolve, 100));

    const response2 = triggerBackgroundSync();
    expect(response2.status).toBe('accepted');
  });
});

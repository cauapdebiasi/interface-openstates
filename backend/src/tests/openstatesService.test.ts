import { describe, it, expect, beforeEach, vi } from 'vitest';
import { triggerBackgroundSync, resetSyncingStateForTests, cancelSync, getSyncProgress } from '../services/openstatesService.js';

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

vi.mock('../models/Jurisdiction.js', () => ({
  Jurisdiction: {
    bulkCreate: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
  },
}));

vi.mock('../models/Person.js', () => ({
  Person: {
    bulkCreate: vi.fn(),
  },
}));

vi.mock('../config/database.js', () => ({
  default: {
    transaction: vi.fn((cb: (t: object) => void) => cb({})),
    literal: vi.fn((val: string) => val),
  },
}));

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

  it('deve cancelar a sincronização e liberar para uma nova', async () => {
    const response = triggerBackgroundSync();
    expect(response.status).toBe('accepted');
    expect(getSyncProgress().isSyncing).toBe(true);

    // cancela enquanto está rodando
    const cancelled = cancelSync();
    expect(cancelled).toBe(true);

    // espera o worker processar o cancelamento
    await new Promise(resolve => setTimeout(resolve, 100));

    // deve ter liberado o lock
    expect(getSyncProgress().isSyncing).toBe(false);

    // deve aceitar nova sync
    const response2 = triggerBackgroundSync();
    expect(response2.status).toBe('accepted');
  });

  it('cancelSync deve retornar false quando não há sincronização ativa', () => {
    expect(cancelSync()).toBe(false);
  });
});

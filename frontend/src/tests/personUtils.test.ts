import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateAge } from '../utils/personUtils';

describe('calculateAge', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve calcular a idade corretamente quando já fez aniversário no ano', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-15'));

    expect(calculateAge('1990-03-20')).toBe(36);
  });

  it('deve calcular a idade corretamente quando ainda não fez aniversário no ano', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-10'));

    expect(calculateAge('1990-03-20')).toBe(35);
  });

  it('deve calcular a idade no dia exato do aniversário', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20'));

    expect(calculateAge('1990-03-20')).toBe(36);
  });

  it('deve calcular a idade até a data de falecimento quando fornecida', () => {
    expect(calculateAge('1960-05-04', '2019-04-10')).toBe(58);
  });

  it('deve calcular a idade até a data de falecimento quando já fez aniversário', () => {
    expect(calculateAge('1960-05-04', '2019-06-10')).toBe(59);
  });

  it('deve retornar null para data de nascimento inválida', () => {
    expect(calculateAge('data-invalida')).toBeNull();
  });

  it('deve retornar null para data de falecimento inválida', () => {
    expect(calculateAge('1990-03-20', 'data-invalida')).toBeNull();
  });

  it('deve retornar null para string vazia', () => {
    expect(calculateAge('')).toBeNull();
  });
});

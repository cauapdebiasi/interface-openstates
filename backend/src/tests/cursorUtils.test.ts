import { describe, it, expect } from 'vitest';
import { encodeCursor, decodeCursor } from '../utils/cursorUtils.js';

describe('Cursor Utils', () => {
  describe('encodeCursor', () => {
    it('deve codificar dados de cursor em base64', () => {
      const data = { name: 'John Doe', id: 'abc-123' };
      const encoded = encodeCursor(data);

      expect(encoded).toBeTypeOf('string');
      expect(encoded.length).toBeGreaterThan(0);

      // Decodifica manualmente
      const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
      expect(decoded).toEqual(data);
    });

    it('deve gerar cursors diferentes para dados diferentes', () => {
      const cursor1 = encodeCursor({ name: 'Alice', id: '1' });
      const cursor2 = encodeCursor({ name: 'Bob', id: '2' });

      expect(cursor1).not.toBe(cursor2);
    });

    it('deve lidar com caracteres especiais no nome', () => {
      const data = { name: "O'Brien-Smith", id: 'special-chars' };
      const encoded = encodeCursor(data);
      const decoded = decodeCursor(encoded);

      expect(decoded.name).toBe("O'Brien-Smith");
    });

    it('deve lidar com strings vazias', () => {
      const data = { name: '', id: '' };
      const encoded = encodeCursor(data);
      const decoded = decodeCursor(encoded);

      expect(decoded).toEqual(data);
    });
  });

  describe('decodeCursor', () => {
    it('deve decodificar corretamente um cursor válido', () => {
      const original = { name: 'Jane Doe', id: 'xyz-456' };
      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded);

      expect(decoded).toEqual(original);
    });

    it('deve lançar erro para cursor inválido (não é base64)', () => {
      expect(() => decodeCursor('!!!invalid!!!')).toThrow();
    });

    it('deve lançar erro para cursor base64 com JSON inválido', () => {
      const invalidJson = Buffer.from('not json').toString('base64');
      expect(() => decodeCursor(invalidJson)).toThrow();
    });
  });
});

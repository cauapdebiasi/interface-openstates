import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  DB_NAME: z.string('DB_NAME é obrigatório').min(1, 'DB_NAME deve conter pelo menos um caractere'),
  DB_USER: z.string('DB_USER é obrigatório').min(1, 'DB_USER deve conter pelo menos um caractere'),
  DB_PASS: z.string('DB_PASS é obrigatório').min(1, 'DB_PASS deve conter pelo menos um caractere'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5433),
  OPENSTATES_API_KEY: z.string('OPENSTATES_API_KEY é obrigatório').min(1, 'OPENSTATES_API_KEY deve conter pelo menos um caractere'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Variáveis de ambiente inválidas!');
  console.error(z.prettifyError(_env.error));
  process.exit(1);
}

export const env = _env.data;

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  DB_NAME: z.string().min(1, 'DB_NAME é obrigatório'),
  DB_USER: z.string().min(1, 'DB_USER é obrigatório'),
  DB_PASS: z.string().min(1, 'DB_PASS é obrigatório'),
  DB_HOST: z.string().default('localhost'),
  OPENSTATES_API_KEY: z.string().min(1, 'OPENSTATES_API_KEY é obrigatório'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Variáveis de ambiente inválidas!');
  console.error(z.treeifyError(_env.error));
  process.exit(1);
}

export const env = _env.data;

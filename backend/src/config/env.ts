import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: process.env.DATABASE_URL ?? 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET ?? 'clinica_piedra_azul_dev_secret_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '4h',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
};

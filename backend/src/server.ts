import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const server = app.listen(env.PORT, () => {
  console.log(`🏥 Clínica Piedra Azul API ejecutándose en http://localhost:${env.PORT}`);
  console.log(`   Healthcheck: http://localhost:${env.PORT}/api/health`);
});

const shutdown = async (signal: string) => {
  console.log(`\nRecibida señal ${signal}. Cerrando servidor y desconectando Prisma...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

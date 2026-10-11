import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

declare global {
  // eslint-disable-next-line no-var
  var prismaInstance: PrismaClient | undefined;
}

export const prisma =
  global.prismaInstance ||
  new PrismaClient({
    log: config.isProduction ? ['error', 'warn'] : ['query', 'info', 'warn', 'error'],
  });

if (!config.isProduction) {
  global.prismaInstance = prisma;
}

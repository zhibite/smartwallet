import { PrismaClient } from '@prisma/client';

declare global {
  var __smartwallet_prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__smartwallet_prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__smartwallet_prisma = prisma;
}

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    adapter: process.env.DATABASE_URL,
  } as any); // Using 'as any' to bypass temporary type drift during migration

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

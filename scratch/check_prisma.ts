import { PrismaClient } from '@prisma/client';
console.log('PrismaClient constructor keys:', Object.keys(PrismaClient.prototype));
// This might not work if it's not instantiated.
try {
  const p = new PrismaClient({} as any);
  console.log('Instance keys:', Object.keys(p));
} catch(e) {}

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma with optimized settings
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    // Connection pool configuration via datasource URL params
    // Add ?connection_limit=10&pool_timeout=30 to DATABASE_URL for production
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
async function handleShutdown() {
  await prisma.$disconnect()
}

// Only register in Node.js environment (not Edge runtime)
if (typeof process !== 'undefined' && process.on) {
  process.on('beforeExit', handleShutdown)
}

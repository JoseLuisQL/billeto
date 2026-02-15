import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Singleton de PrismaClient para evitar múltiples conexiones
 * durante el desarrollo con hot-reload de Next.js.
 *
 * Prisma 7 requiere un driver adapter para conectarse a la BD.
 * Usamos @prisma/adapter-pg para PostgreSQL.
 */

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL no está definida en las variables de entorno");
    }

    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

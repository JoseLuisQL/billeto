import { PrismaClient } from "@prisma/client";

/**
 * Singleton de PrismaClient para evitar múltiples conexiones
 * durante el desarrollo con hot-reload de Next.js.
 *
 * Usa lazy initialization para evitar conexiones prematuras
 * durante el build de Next.js cuando la BD no está disponible.
 */

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * Obtener la instancia de PrismaClient.
 * Se inicializa de forma lazy para evitar errores de conexión
 * cuando la BD no está disponible (ej: durante `next build`).
 */
function getPrismaClient(): PrismaClient {
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = new PrismaClient();
    }
    return globalForPrisma.prisma;
}

// Exportar un proxy que inicializa PrismaClient de forma lazy
export const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        const client = getPrismaClient();
        const value = (client as any)[prop];
        if (typeof value === "function") {
            return value.bind(client);
        }
        return value;
    },
});

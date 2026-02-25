/**
 * Utilidades de cálculo para transacciones recurrentes.
 * Separado de server actions para evitar restricciones de "use server".
 */

import type { PrismaClient, Prisma } from "@prisma/client";

export type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export const toAuditJson = (value: unknown): Prisma.InputJsonValue =>
    JSON.parse(JSON.stringify(value));

/**
 * Calcular la siguiente fecha de ejecución según la frecuencia.
 */
export function calcularSiguienteFecha(desde: Date, frecuencia: string): Date {
    const next = new Date(desde);

    switch (frecuencia) {
        case "daily":
            next.setDate(next.getDate() + 1);
            break;
        case "weekly":
            next.setDate(next.getDate() + 7);
            break;
        case "biweekly":
            next.setDate(next.getDate() + 14);
            break;
        case "monthly":
            next.setMonth(next.getMonth() + 1);
            break;
        case "yearly":
            next.setFullYear(next.getFullYear() + 1);
            break;
        default:
            next.setMonth(next.getMonth() + 1);
    }

    return next;
}

/**
 * Helper: get days in month for a given date.
 */
export function daysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

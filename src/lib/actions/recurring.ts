"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PrismaClient, Prisma } from "@prisma/client";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

function toAuditJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value));
}

/**
 * Server Actions para Transacciones Recurrentes.
 * Maneja suscripciones y pagos periódicos.
 */

async function obtenerWorkspace(minRole: "owner" | "admin" | "member" = "member") {
    return requireWorkspaceAccess(minRole);
}

/**
 * Listar transacciones recurrentes del workspace.
 */
export async function listarRecurrentes() {
    try {
        const { workspace } = await obtenerWorkspace();

        const recurrentes = await prisma.recurringTransaction.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
            },
            orderBy: { nextRunAt: "asc" },
        });

        return {
            recurrentes: recurrentes.map((r) => ({
                id: r.id,
                name: r.name,
                amount: Number(r.amount),
                currency: r.currency,
                accountId: r.accountId,
                categoryId: r.categoryId,
                type: r.type,
                frequency: r.frequency,
                status: r.status,
                nextRunAt: r.nextRunAt.toISOString(),
                lastRunAt: r.lastRunAt?.toISOString() || null,
                createdAt: r.createdAt.toISOString(),
            })),
        };
    } catch {
        return { recurrentes: [] };
    }
}

/**
 * Crear una transacción recurrente.
 */
export async function crearRecurrente(data: {
    name: string;
    amount: number;
    type: string;
    frequency: string;
    accountId?: string;
    categoryId?: string;
    nextRunAt?: string;
}) {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "recurring:create:user",
            key: userId,
            limit: 15,
            windowMs: 60_000,
        });

        // Calcular próxima ejecución si no se proporciona
        const nextRun = data.nextRunAt
            ? new Date(data.nextRunAt)
            : calcularSiguienteFecha(new Date(), data.frequency);

        const recurrente = await prisma.recurringTransaction.create({
            data: {
                workspaceId: workspace.id,
                name: data.name,
                amount: data.amount,
                currency: workspace.baseCurrency,
                accountId: data.accountId || null,
                categoryId: data.categoryId || null,
                type: data.type,
                frequency: data.frequency,
                status: "active",
                nextRunAt: nextRun,
            },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "recurring.create",
                entity: "RecurringTransaction",
                entityId: recurrente.id,
                after: { name: data.name, amount: data.amount, frequency: data.frequency },
            },
        });

        revalidatePath("/dashboard/recurring");
        return { ok: true, recurrente };
    } catch (err: unknown) {
        if (isRateLimitError(err)) {
            return { ok: false, error: err.message };
        }
        if (err instanceof Error) {
            return { ok: false, error: err.message || "Error al crear recurrente" };
        }
        return { ok: false, error: "Error al crear recurrente" };
    }
}

/**
 * Actualizar una transacción recurrente.
 */
export async function actualizarRecurrente(
    id: string,
    data: {
        name?: string;
        amount?: number;
        type?: string;
        frequency?: string;
        accountId?: string;
        categoryId?: string;
        status?: string;
    }
) {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "recurring:update:user",
            key: userId,
            limit: 30,
            windowMs: 60_000,
        });

        const existente = await prisma.recurringTransaction.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!existente) return { ok: false, error: "Recurrente no encontrado" };

        const updateData: Record<string, unknown> = {};
        if (data.name) updateData.name = data.name;
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.type) updateData.type = data.type;
        if (data.frequency) updateData.frequency = data.frequency;
        if (data.accountId !== undefined) updateData.accountId = data.accountId || null;
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
        if (data.status) updateData.status = data.status;

        const updated = await prisma.recurringTransaction.updateMany({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            data: updateData,
        });

        if (updated.count === 0) {
            return { ok: false, error: "Recurrente no encontrado o sin permisos" };
        }

        const recurrente = await prisma.recurringTransaction.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!recurrente) {
            return { ok: false, error: "Recurrente no encontrado tras actualizar" };
        }

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "recurring.update",
                entity: "RecurringTransaction",
                entityId: id,
                before: { name: existente.name },
                after: toAuditJson(updateData),
            },
        });

        revalidatePath("/dashboard/recurring");
        return { ok: true, recurrente };
    } catch (err: unknown) {
        if (isRateLimitError(err)) {
            return { ok: false, error: err.message };
        }
        if (err instanceof Error) {
            return { ok: false, error: err.message || "Error al actualizar recurrente" };
        }
        return { ok: false, error: "Error al actualizar recurrente" };
    }
}

/**
 * Eliminar una transacción recurrente (soft delete).
 */
export async function eliminarRecurrente(id: string) {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "recurring:delete:user",
            key: userId,
            limit: 10,
            windowMs: 60_000,
        });

        const existente = await prisma.recurringTransaction.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!existente) return { ok: false, error: "Recurrente no encontrado" };

        const deleted = await prisma.recurringTransaction.updateMany({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            data: { deletedAt: new Date(), deletedBy: userId },
        });

        if (deleted.count === 0) {
            return { ok: false, error: "Recurrente no encontrado o sin permisos" };
        }

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "recurring.delete",
                entity: "RecurringTransaction",
                entityId: id,
            },
        });

        revalidatePath("/dashboard/recurring");
        return { ok: true };
    } catch (err: unknown) {
        if (isRateLimitError(err)) {
            return { ok: false, error: err.message };
        }
        if (err instanceof Error) {
            return { ok: false, error: err.message || "Error al eliminar recurrente" };
        }
        return { ok: false, error: "Error al eliminar recurrente" };
    }
}

/**
 * Ejecutar todas las transacciones recurrentes que ya están vencidas.
 * Crea transacciones reales y actualiza nextRunAt.
 */
export async function ejecutarRecurrentes() {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "recurring:run:user",
            key: userId,
            limit: 8,
            windowMs: 60_000,
        });

        const ahora = new Date();

        const pendientes = await prisma.recurringTransaction.findMany({
            where: {
                workspaceId: workspace.id,
                status: "active",
                deletedAt: null,
                nextRunAt: { lte: ahora },
            },
        });

        let ejecutadas = 0;

        for (const rec of pendientes) {
            // Si no tiene cuenta asignada, skip
            if (!rec.accountId) continue;

            const cambioBalance = rec.type === "income" ? Number(rec.amount) : -Number(rec.amount);

            await prisma.$transaction(async (tx: TxClient) => {
                // 1. Crear la transacción real
                await tx.transaction.create({
                    data: {
                        workspaceId: workspace.id,
                        accountId: rec.accountId!,
                        categoryId: rec.categoryId,
                        amountOriginal: rec.amount,
                        currencyOriginal: rec.currency,
                        amountBase: rec.amount,
                        baseCurrency: workspace.baseCurrency,
                        description: `${rec.name} (recurrente)`,
                        type: rec.type,
                        date: ahora,
                        source: "recurring",
                    },
                });

                // 2. Actualizar balance de la cuenta
                await tx.account.update({
                    where: { id: rec.accountId! },
                    data: {
                        currentBalance: { increment: cambioBalance },
                    },
                });

                // 3. Actualizar la transacción recurrente
                await tx.recurringTransaction.update({
                    where: { id: rec.id },
                    data: {
                        lastRunAt: ahora,
                        nextRunAt: calcularSiguienteFecha(ahora, rec.frequency),
                    },
                });
            });

            ejecutadas++;
        }

        // Audit log
        if (ejecutadas > 0) {
            await prisma.auditLog.create({
                data: {
                    workspaceId: workspace.id,
                    actorId: userId,
                    action: "recurring.execute",
                    entity: "RecurringTransaction",
                    metadata: { count: ejecutadas, timestamp: ahora.toISOString() },
                },
            });
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/recurring");
        revalidatePath("/dashboard/transactions");
        return { ok: true, ejecutadas };
    } catch (err: unknown) {
        if (isRateLimitError(err)) {
            return { ok: false, error: err.message, ejecutadas: 0 };
        }
        if (err instanceof Error) {
            return { ok: false, error: err.message || "Error al ejecutar recurrentes", ejecutadas: 0 };
        }
        return { ok: false, error: "Error al ejecutar recurrentes", ejecutadas: 0 };
    }
}

/**
 * Calcular la siguiente fecha de ejecución según la frecuencia.
 */
function calcularSiguienteFecha(desde: Date, frecuencia: string): Date {
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

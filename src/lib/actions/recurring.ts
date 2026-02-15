"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PrismaClient } from "@prisma/client";

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Server Actions para Transacciones Recurrentes.
 * Maneja suscripciones y pagos periódicos.
 */

async function obtenerWorkspace() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
        include: { workspace: true },
    });

    if (!membership) throw new Error("Sin workspace asignado");
    return { userId: session.user.id, workspace: membership.workspace };
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
            recurrentes: recurrentes.map((r: any) => ({
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
        const { userId, workspace } = await obtenerWorkspace();

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
    } catch (err: any) {
        return { ok: false, error: err.message || "Error al crear recurrente" };
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
        const { userId, workspace } = await obtenerWorkspace();

        const existente = await prisma.recurringTransaction.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!existente) return { ok: false, error: "Recurrente no encontrado" };

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.type) updateData.type = data.type;
        if (data.frequency) updateData.frequency = data.frequency;
        if (data.accountId !== undefined) updateData.accountId = data.accountId || null;
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
        if (data.status) updateData.status = data.status;

        const recurrente = await prisma.recurringTransaction.update({
            where: { id },
            data: updateData,
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "recurring.update",
                entity: "RecurringTransaction",
                entityId: id,
                before: { name: existente.name },
                after: updateData,
            },
        });

        revalidatePath("/dashboard/recurring");
        return { ok: true, recurrente };
    } catch (err: any) {
        return { ok: false, error: err.message || "Error al actualizar recurrente" };
    }
}

/**
 * Eliminar una transacción recurrente (soft delete).
 */
export async function eliminarRecurrente(id: string) {
    try {
        const { userId, workspace } = await obtenerWorkspace();

        const existente = await prisma.recurringTransaction.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!existente) return { ok: false, error: "Recurrente no encontrado" };

        await prisma.recurringTransaction.update({
            where: { id },
            data: { deletedAt: new Date(), deletedBy: userId },
        });

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
    } catch (err: any) {
        return { ok: false, error: err.message || "Error al eliminar recurrente" };
    }
}

/**
 * Ejecutar todas las transacciones recurrentes que ya están vencidas.
 * Crea transacciones reales y actualiza nextRunAt.
 */
export async function ejecutarRecurrentes() {
    try {
        const { userId, workspace } = await obtenerWorkspace();

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
    } catch (err: any) {
        return { ok: false, error: err.message || "Error al ejecutar recurrentes", ejecutadas: 0 };
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

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";
import { calcularSiguienteFecha, daysInMonth, toAuditJson, type TxClient } from "@/lib/utils/recurring-utils";

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

        // Fetch category names for the ones that have categoryId
        const categoryIds = recurrentes
            .map((r) => r.categoryId)
            .filter((id): id is string => !!id);

        const categories = categoryIds.length > 0
            ? await prisma.category.findMany({
                where: { id: { in: categoryIds } },
                select: { id: true, name: true, icon: true },
            })
            : [];

        const categoryMap = new Map(categories.map((c) => [c.id, c]));

        return {
            recurrentes: recurrentes.map((r) => {
                const cat = r.categoryId ? categoryMap.get(r.categoryId) : null;
                return {
                    id: r.id,
                    name: r.name,
                    description: r.description,
                    amount: Number(r.amount),
                    currency: r.currency,
                    accountId: r.accountId,
                    categoryId: r.categoryId,
                    categoryName: cat?.name || null,
                    categoryIcon: cat?.icon || null,
                    type: r.type,
                    frequency: r.frequency,
                    dayOfMonth: r.dayOfMonth,
                    status: r.status,
                    startDate: r.startDate?.toISOString() || null,
                    nextRunAt: r.nextRunAt.toISOString(),
                    lastRunAt: r.lastRunAt?.toISOString() || null,
                    endCondition: r.endCondition,
                    endDate: r.endDate?.toISOString() || null,
                    maxOccurrences: r.maxOccurrences,
                    executionCount: r.executionCount,
                    createdAt: r.createdAt.toISOString(),
                };
            }),
        };
    } catch {
        return { recurrentes: [] };
    }
}

/**
 * Obtener estadísticas de recurrentes por categoría para el gráfico de barras.
 * @param tipoFiltro - "Todos" | "Gastos" | "Ingresos"
 */
export async function obtenerEstadisticasRecurrentes(tipoFiltro: string = "Todos") {
    try {
        const { workspace } = await obtenerWorkspace();

        const whereClause: Record<string, unknown> = {
            workspaceId: workspace.id,
            status: "active",
            deletedAt: null,
        };
        if (tipoFiltro === "Gastos") whereClause.type = "expense";
        else if (tipoFiltro === "Ingresos") whereClause.type = "income";

        const recurrentes = await prisma.recurringTransaction.findMany({
            where: whereClause,
        });

        const categoryIds = recurrentes
            .map((r) => r.categoryId)
            .filter((id): id is string => !!id);

        const categories = categoryIds.length > 0
            ? await prisma.category.findMany({
                where: { id: { in: categoryIds } },
                select: { id: true, name: true, icon: true, color: true },
            })
            : [];

        const categoryMap = new Map(categories.map((c) => [c.id, c]));

        // Group by category
        const byCategory = new Map<string, { name: string; total: number; color: string }>();
        let totalMensual = 0;

        for (const r of recurrentes) {
            const catName = r.categoryId ? (categoryMap.get(r.categoryId)?.name || "Sin categoría") : "Sin categoría";
            const catColor = r.categoryId ? (categoryMap.get(r.categoryId)?.color || "#6366f1") : "#6366f1";
            const amount = Number(r.amount);

            // Normalize to monthly
            let mensual = amount;
            switch (r.frequency) {
                case "daily": mensual = amount * 30; break;
                case "weekly": mensual = amount * 4.33; break;
                case "biweekly": mensual = amount * 2.17; break;
                case "yearly": mensual = amount / 12; break;
            }

            totalMensual += mensual;

            const existing = byCategory.get(catName);
            if (existing) {
                existing.total += mensual;
            } else {
                byCategory.set(catName, { name: catName, total: mensual, color: catColor });
            }
        }

        const datos = Array.from(byCategory.values())
            .sort((a, b) => b.total - a.total)
            .map((d) => ({
                name: d.name,
                value: Math.round(d.total * 100) / 100,
                fill: d.color,
            }));

        return {
            datos,
            totalMensual: Math.round(totalMensual * 100) / 100,
            moneda: workspace.baseCurrency,
        };
    } catch {
        return { datos: [], totalMensual: 0, moneda: "PEN" };
    }
}

/**
 * Crear una transacción recurrente.
 */
export async function crearRecurrente(data: {
    name: string;
    description?: string;
    amount: number;
    currency?: string;
    type: string;
    frequency: string;
    dayOfMonth?: number;
    accountId?: string;
    categoryId?: string;
    startDate?: string;
    endCondition?: string;
    endDate?: string;
    maxOccurrences?: number;
}) {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "recurring:create:user",
            key: userId,
            limit: 15,
            windowMs: 60_000,
        });

        // Calculate next run date
        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        let nextRun: Date;

        if (data.dayOfMonth && data.frequency === "monthly") {
            // Set to the specific day of month
            nextRun = new Date(startDate);
            nextRun.setDate(Math.min(data.dayOfMonth, daysInMonth(nextRun)));
            if (nextRun <= new Date()) {
                nextRun.setMonth(nextRun.getMonth() + 1);
                nextRun.setDate(Math.min(data.dayOfMonth, daysInMonth(nextRun)));
            }
        } else {
            nextRun = calcularSiguienteFecha(startDate, data.frequency);
        }

        const recurrente = await prisma.recurringTransaction.create({
            data: {
                workspaceId: workspace.id,
                name: data.name,
                description: data.description || null,
                amount: data.amount,
                currency: data.currency || workspace.baseCurrency,
                accountId: data.accountId || null,
                categoryId: data.categoryId || null,
                type: data.type,
                frequency: data.frequency,
                dayOfMonth: data.dayOfMonth || null,
                status: "active",
                startDate: startDate,
                nextRunAt: nextRun,
                endCondition: data.endCondition || "never",
                endDate: data.endDate ? new Date(data.endDate) : null,
                maxOccurrences: data.maxOccurrences || null,
                executionCount: 0,
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

        revalidatePath("/transactions/recurring-transactions");
        return { ok: true, id: recurrente.id };
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
        description?: string;
        amount?: number;
        currency?: string;
        type?: string;
        frequency?: string;
        dayOfMonth?: number;
        accountId?: string;
        categoryId?: string;
        status?: string;
        endCondition?: string;
        endDate?: string;
        maxOccurrences?: number;
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
        if (data.description !== undefined) updateData.description = data.description || null;
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.currency) updateData.currency = data.currency;
        if (data.type) updateData.type = data.type;
        if (data.frequency) updateData.frequency = data.frequency;
        if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth || null;
        if (data.accountId !== undefined) updateData.accountId = data.accountId || null;
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
        if (data.status) updateData.status = data.status;
        if (data.endCondition) updateData.endCondition = data.endCondition;
        if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
        if (data.maxOccurrences !== undefined) updateData.maxOccurrences = data.maxOccurrences || null;

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

        revalidatePath("/transactions/recurring-transactions");
        return { ok: true };
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

        revalidatePath("/transactions/recurring-transactions");
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
        const sinCuenta: string[] = [];

        for (const rec of pendientes) {
            // Si no tiene cuenta asignada, track it for error
            if (!rec.accountId) {
                sinCuenta.push(rec.name);
                continue;
            }

            // Check end condition
            if (rec.endCondition === "after_count" && rec.maxOccurrences && rec.executionCount >= rec.maxOccurrences) {
                // Auto-pause
                await prisma.recurringTransaction.updateMany({
                    where: { id: rec.id, workspaceId: workspace.id },
                    data: { status: "paused" },
                });
                continue;
            }
            if (rec.endCondition === "on_date" && rec.endDate && ahora >= rec.endDate) {
                await prisma.recurringTransaction.updateMany({
                    where: { id: rec.id, workspaceId: workspace.id },
                    data: { status: "paused" },
                });
                continue;
            }

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

                // 3. Calculate next run date
                let nextRun: Date;
                if (rec.dayOfMonth && rec.frequency === "monthly") {
                    nextRun = new Date(ahora);
                    nextRun.setMonth(nextRun.getMonth() + 1);
                    nextRun.setDate(Math.min(rec.dayOfMonth, daysInMonth(nextRun)));
                } else {
                    nextRun = calcularSiguienteFecha(ahora, rec.frequency);
                }

                // 4. Actualizar la transacción recurrente
                await tx.recurringTransaction.update({
                    where: { id: rec.id },
                    data: {
                        lastRunAt: ahora,
                        nextRunAt: nextRun,
                        executionCount: { increment: 1 },
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
        revalidatePath("/transactions/recurring-transactions");
        revalidatePath("/transactions");

        if (sinCuenta.length > 0 && ejecutadas === 0) {
            return {
                ok: false,
                error: `No se pudieron ejecutar. Las siguientes recurrentes no tienen cuenta asignada: ${sinCuenta.join(", ")}`,
                ejecutadas: 0,
            };
        }

        return { ok: true, ejecutadas, sinCuenta };
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

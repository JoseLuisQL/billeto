"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { aplicarReglas } from "@/lib/actions/rules";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";
import { SYSTEM_CATEGORY_OWNER_ID } from "@/lib/categories-defaults";

type TxClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/**
 * Server Actions para Transacciones.
 * Incluye lógica de actualización de balance de cuentas.
 */

async function obtenerWorkspace(minRole: "owner" | "admin" | "member" = "member") {
    return requireWorkspaceAccess(minRole);
}

/**
 * Listar transacciones del workspace con paginación y filtros.
 */
export async function listarTransacciones(opciones?: {
    page?: number;
    pageSize?: number;
    accountId?: string;
    categoryId?: string;
    type?: string;
    from?: string;
    to?: string;
}) {
    try {
        const { workspace } = await obtenerWorkspace();
        const page = opciones?.page ?? 1;
        const pageSize = opciones?.pageSize ?? 20;

        // Construir filtros
        const where: Record<string, unknown> = {
            workspaceId: workspace.id,
            deletedAt: null,
        };

        if (opciones?.accountId) where.accountId = opciones.accountId;
        if (opciones?.categoryId) where.categoryId = opciones.categoryId;
        if (opciones?.type) where.type = opciones.type;
        if (opciones?.from || opciones?.to) {
            const dateFilter: { gte?: Date; lte?: Date } = {};
            if (opciones?.from) dateFilter.gte = new Date(opciones.from);
            if (opciones?.to) dateFilter.lte = new Date(opciones.to);
            where.date = dateFilter;
        }

        const [transacciones, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    account: { select: { id: true, name: true, currency: true } },
                    category: { select: { id: true, name: true, icon: true, color: true } },
                },
                orderBy: { date: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.transaction.count({ where }),
        ]);

        return {
            transacciones: transacciones.map((tx) => ({
                ...tx,
                amountOriginal: Number(tx.amountOriginal),
                amountBase: Number(tx.amountBase),
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    } catch {
        return { error: "Error al obtener transacciones", transacciones: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    }
}

/**
 * Crear una nueva transacción y actualizar el balance de la cuenta.
 * Todo en una transacción de BD para consistencia.
 */
export async function crearTransaccion(formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "transactions:create:user",
            key: userId,
            limit: 25,
            windowMs: 60_000,
        });

        const accountId = (formData.get("accountId") as string) || null;
        let categoryId = (formData.get("categoryId") as string) || null;
        const description = formData.get("description") as string;

        // Auto-categorizacion: si no se especifico categoria, aplicar reglas
        if (!categoryId && description) {
            const catAutoId = await aplicarReglas(description, userId);
            if (catAutoId) categoryId = catAutoId;
        }
        const type = (formData.get("type") as string) || "expense";
        const amount = parseFloat(formData.get("amount") as string);
        const dateStr = formData.get("date") as string;
        const date = dateStr ? new Date(dateStr) : new Date();

        // Validaciones
        if (!description || description.trim().length === 0) return { error: "La descripción es obligatoria." };
        if (isNaN(amount) || amount <= 0) return { error: "El monto debe ser mayor a 0." };

        let cuenta: { id: string; currency: string } | null = null;
        if (accountId) {
            cuenta = await prisma.account.findFirst({
                where: { id: accountId, workspaceId: workspace.id, deletedAt: null },
                select: { id: true, currency: true },
            });
            if (!cuenta) return { error: "Cuenta no encontrada." };
        }

        if (categoryId) {
            const categoria = await prisma.category.findFirst({
                where: {
                    id: categoryId,
                    workspaceId: workspace.id,
                    deletedAt: null,
                    OR: [
                        { ownerUserId: SYSTEM_CATEGORY_OWNER_ID },
                        { ownerUserId: userId },
                    ],
                },
                select: { id: true },
            });

            if (!categoria) {
                return { error: "Categoría no válida para este usuario." };
            }
        }

        // Calcular el cambio de balance
        // expense -> resta, income -> suma
        const cambioBalance = type === "income" ? amount : -amount;

        // Crear transaccion y actualizar balance en una transaccion atomica
        const resultado = await prisma.$transaction(async (tx: TxClient) => {
            // 1. Crear la transaccion
            const transaccion = await tx.transaction.create({
                data: {
                    workspaceId: workspace.id,
                    accountId: accountId ?? undefined,
                    categoryId,
                    amountOriginal: amount,
                    currencyOriginal: cuenta?.currency || workspace.baseCurrency,
                    amountBase: amount,
                    baseCurrency: workspace.baseCurrency,
                    description: description.trim(),
                    type,
                    source: "web",
                    date,
                },
            });

            // 2. Actualizar balance de la cuenta (solo si tiene cuenta asignada)
            if (accountId && cuenta) {
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        currentBalance: {
                            increment: cambioBalance,
                        },
                    },
                });
            }

            // 3. Auditoria
            await tx.auditLog.create({
                data: {
                    workspaceId: workspace.id,
                    actorId: userId,
                    action: "create",
                    entity: "transaction",
                    entityId: transaccion.id,
                    after: { description, amount, type, accountId, categoryId },
                },
            });

            return transaccion;
        });

        revalidatePath("/transactions");
        revalidatePath("/dashboard");
        return { success: true, transaccion: resultado };
    } catch (error) {
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        console.error("Error al crear transacción:", error);
        return { error: "Error al crear la transacción." };
    }
}

export async function crearTransferenciaEntreCuentas(formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "transactions:transfer:user",
            key: userId,
            limit: 15,
            windowMs: 60_000,
        });

        const fromAccountId = (formData.get("fromAccountId") as string)?.trim();
        const toAccountId = (formData.get("toAccountId") as string)?.trim();
        const amount = Number.parseFloat((formData.get("amount") as string) || "0");
        const dateInput = (formData.get("date") as string) || "";
        const descriptionInput = ((formData.get("description") as string) || "").trim();
        const date = dateInput ? new Date(dateInput) : new Date();

        if (!fromAccountId || !toAccountId) return { error: "Debes seleccionar cuentas de origen y destino." };
        if (fromAccountId === toAccountId) return { error: "La cuenta destino debe ser distinta a la cuenta origen." };
        if (!Number.isFinite(amount) || amount <= 0) return { error: "El monto debe ser mayor a 0." };
        if (Number.isNaN(date.getTime())) return { error: "Fecha inválida." };

        const [fromAccount, toAccount] = await Promise.all([
            prisma.account.findFirst({
                where: { id: fromAccountId, workspaceId: workspace.id, deletedAt: null },
                select: { id: true, name: true, currency: true },
            }),
            prisma.account.findFirst({
                where: { id: toAccountId, workspaceId: workspace.id, deletedAt: null },
                select: { id: true, name: true, currency: true },
            }),
        ]);

        if (!fromAccount || !toAccount) return { error: "Cuenta origen o destino no encontrada." };

        const transferGroupId = randomUUID();
        const baseDescription = descriptionInput.length > 0 ? descriptionInput : `Transferencia ${fromAccount.name} → ${toAccount.name}`;

        await prisma.$transaction(async (tx: TxClient) => {
            const salida = await tx.transaction.create({
                data: {
                    workspaceId: workspace.id,
                    accountId: fromAccount.id,
                    amountOriginal: amount,
                    currencyOriginal: fromAccount.currency,
                    amountBase: amount,
                    baseCurrency: workspace.baseCurrency,
                    description: `Transferencia a ${toAccount.name}${descriptionInput ? ` · ${descriptionInput}` : ""}`,
                    type: "expense",
                    source: "transfer",
                    transferGroupId,
                    transferPeerAccountId: toAccount.id,
                    date,
                },
            });

            const entrada = await tx.transaction.create({
                data: {
                    workspaceId: workspace.id,
                    accountId: toAccount.id,
                    amountOriginal: amount,
                    currencyOriginal: toAccount.currency,
                    amountBase: amount,
                    baseCurrency: workspace.baseCurrency,
                    description: `Transferencia desde ${fromAccount.name}${descriptionInput ? ` · ${descriptionInput}` : ""}`,
                    type: "income",
                    source: "transfer",
                    transferGroupId,
                    transferPeerAccountId: fromAccount.id,
                    date,
                },
            });

            await tx.account.update({
                where: { id: fromAccount.id },
                data: {
                    currentBalance: { decrement: amount },
                },
            });

            await tx.account.update({
                where: { id: toAccount.id },
                data: {
                    currentBalance: { increment: amount },
                },
            });

            await tx.auditLog.create({
                data: {
                    workspaceId: workspace.id,
                    actorId: userId,
                    action: "create",
                    entity: "transaction",
                    entityId: salida.id,
                    after: {
                        operation: "transfer",
                        transferGroupId,
                        fromAccountId: fromAccount.id,
                        toAccountId: toAccount.id,
                        amount,
                        description: baseDescription,
                        pairedTransactionId: entrada.id,
                    },
                },
            });
        });

        revalidatePath("/accounts");
        revalidatePath("/transactions");
        revalidatePath("/dashboard");

        return { success: true, transferGroupId };
    } catch (error) {
        if (isRateLimitError(error)) return { error: error.message };
        return { error: "Error al crear transferencia." };
    }
}

/**
 * Eliminar una transacción (soft delete) y revertir el balance.
 */
export async function editarTransaccion(input: {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    accountId?: string | null;
    categoryId?: string | null;
}) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "transactions:update:user",
            key: userId,
            limit: 30,
            windowMs: 60_000,
        });

        const description = input.description?.trim();
        const amount = Number(input.amount);
        const type = input.type;
        const accountId = input.accountId || null;
        const categoryId = input.categoryId || null;
        const date = input.date ? new Date(input.date) : new Date();

        if (!input.id) return { error: "Transacción inválida." };
        if (!description) return { error: "La descripción es obligatoria." };
        if (!Number.isFinite(amount) || amount <= 0) return { error: "El monto debe ser mayor a 0." };
        if (type !== "income" && type !== "expense") return { error: "Tipo inválido." };
        if (Number.isNaN(date.getTime())) return { error: "Fecha inválida." };

        const transaccionActual = await prisma.transaction.findFirst({
            where: {
                id: input.id,
                workspaceId: workspace.id,
                deletedAt: null,
            },
            select: {
                id: true,
                accountId: true,
                categoryId: true,
                description: true,
                amountOriginal: true,
                type: true,
                date: true,
            },
        });

        if (!transaccionActual) return { error: "Transacción no encontrada." };

        let cuentaNueva: { id: string; currency: string } | null = null;
        if (accountId) {
            cuentaNueva = await prisma.account.findFirst({
                where: { id: accountId, workspaceId: workspace.id, deletedAt: null },
                select: { id: true, currency: true },
            });
            if (!cuentaNueva) return { error: "Cuenta no encontrada." };
        }

        if (categoryId) {
            const categoria = await prisma.category.findFirst({
                where: {
                    id: categoryId,
                    workspaceId: workspace.id,
                    deletedAt: null,
                    OR: [
                        { ownerUserId: SYSTEM_CATEGORY_OWNER_ID },
                        { ownerUserId: userId },
                    ],
                },
                select: { id: true },
            });

            if (!categoria) {
                return { error: "Categoría no válida para este usuario." };
            }
        }

        const impactoAnterior = transaccionActual.type === "income"
            ? Number(transaccionActual.amountOriginal)
            : -Number(transaccionActual.amountOriginal);

        const impactoNuevo = type === "income" ? amount : -amount;

        await prisma.$transaction(async (tx: TxClient) => {
            if (transaccionActual.accountId) {
                await tx.account.update({
                    where: { id: transaccionActual.accountId },
                    data: {
                        currentBalance: {
                            increment: -impactoAnterior,
                        },
                    },
                });
            }

            if (accountId) {
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        currentBalance: {
                            increment: impactoNuevo,
                        },
                    },
                });
            }

            const updated = await tx.transaction.updateMany({
                where: { id: input.id, workspaceId: workspace.id, deletedAt: null },
                data: {
                    accountId,
                    categoryId,
                    amountOriginal: amount,
                    currencyOriginal: cuentaNueva?.currency || workspace.baseCurrency,
                    amountBase: amount,
                    baseCurrency: workspace.baseCurrency,
                    description,
                    type,
                    date,
                },
            });

            if (updated.count === 0) {
                throw new Error("No se pudo actualizar la transacción");
            }

            await tx.auditLog.create({
                data: {
                    workspaceId: workspace.id,
                    actorId: userId,
                    action: "update",
                    entity: "transaction",
                    entityId: input.id,
                    before: {
                        description: transaccionActual.description,
                        amount: Number(transaccionActual.amountOriginal),
                        type: transaccionActual.type,
                        accountId: transaccionActual.accountId,
                        categoryId: transaccionActual.categoryId,
                        date: transaccionActual.date.toISOString(),
                    },
                    after: {
                        description,
                        amount,
                        type,
                        accountId,
                        categoryId,
                        date: date.toISOString(),
                    },
                },
            });
        });

        revalidatePath("/transactions");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        if (error instanceof Error) {
            return { error: error.message || "Error al editar la transacción." };
        }
        return { error: "Error al editar la transacción." };
    }
}

export async function eliminarTransaccion(id: string) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "transactions:delete:user",
            key: userId,
            limit: 20,
            windowMs: 60_000,
        });

        const transaccion = await prisma.transaction.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!transaccion) return { error: "Transacción no encontrada." };

        // Revertir el cambio de balance
        const reversion = transaccion.type === "income"
            ? -Number(transaccion.amountOriginal)
            : Number(transaccion.amountOriginal);

        await prisma.$transaction(async (tx: TxClient) => {
            // 1. Soft delete de la transaccion
            const deleted = await tx.transaction.updateMany({
                where: { id, workspaceId: workspace.id, deletedAt: null },
                data: { deletedAt: new Date(), deletedBy: userId },
            });

            if (deleted.count === 0) {
                throw new Error("Transacción no encontrada o sin permisos");
            }

            // 2. Revertir balance (solo si tiene cuenta asignada)
            if (transaccion.accountId) {
                await tx.account.update({
                    where: { id: transaccion.accountId },
                    data: {
                        currentBalance: { increment: reversion },
                    },
                });
            }

            // 3. Auditoría
            await tx.auditLog.create({
                data: {
                    workspaceId: workspace.id,
                    actorId: userId,
                    action: "delete",
                    entity: "transaction",
                    entityId: id,
                    before: {
                        description: transaccion.description,
                        amount: Number(transaccion.amountOriginal),
                        type: transaccion.type,
                    },
                },
            });
        });

        revalidatePath("/transactions");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        return { error: "Error al eliminar la transacción." };
    }
}

/**
 * Obtener resumen financiero del mes actual para el dashboard.
 */
export async function obtenerResumenDashboard(rango?: { from?: string; to?: string }) {
    try {
        const { workspace } = await obtenerWorkspace();

        const ahora = new Date();
        const inicioMes = rango?.from ? new Date(rango.from) : new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = rango?.to ? new Date(rango.to) : new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

        // Balance total de cuentas
        const cuentas = await prisma.account.findMany({
            where: { workspaceId: workspace.id, deletedAt: null },
        });

        const balanceTotal = cuentas.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);

        // Ingresos y gastos del mes
        const transaccionesMes = await prisma.transaction.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
                date: { gte: inicioMes, lte: finMes },
            },
            select: { type: true, amountBase: true },
        });

        const ingresosMes = transaccionesMes
            .filter((tx) => tx.type === "income")
            .reduce((sum: number, tx) => sum + Number(tx.amountBase), 0);

        const gastosMes = transaccionesMes
            .filter((tx) => tx.type === "expense")
            .reduce((sum: number, tx) => sum + Number(tx.amountBase), 0);

        // Últimas transacciones globales, priorizando hoy
        const candidatasUltimas = await prisma.transaction.findMany({
            where: { workspaceId: workspace.id, deletedAt: null },
            include: {
                account: { select: { name: true } },
                category: { select: { name: true, icon: true, color: true } },
            },
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            take: 100,
        });

        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);
        const finHoy = new Date();
        finHoy.setHours(23, 59, 59, 999);

        const ultimasTransacciones = candidatasUltimas
            .sort((a, b) => {
                const aHoy = a.date >= inicioHoy && a.date <= finHoy;
                const bHoy = b.date >= inicioHoy && b.date <= finHoy;

                if (aHoy !== bHoy) {
                    return aHoy ? -1 : 1;
                }

                const byDate = b.date.getTime() - a.date.getTime();
                if (byDate !== 0) return byDate;

                return b.createdAt.getTime() - a.createdAt.getTime();
            })
            .slice(0, 5);

        const dias = Array.from({ length: 30 }, (_, i) => {
            const d = new Date(finMes);
            d.setDate(finMes.getDate() - (29 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });

        const transaccionesUltimos30 = await prisma.transaction.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
                date: {
                    gte: dias[0],
                    lte: finMes,
                },
            },
            select: { date: true },
        });

        const conteoPorDia = new Map<string, number>();
        for (const tx of transaccionesUltimos30) {
            const k = tx.date.toISOString().slice(0, 10);
            conteoPorDia.set(k, (conteoPorDia.get(k) ?? 0) + 1);
        }

        const streakDays = dias.map((d) => {
            const key = d.toISOString().slice(0, 10);
            return { date: key, count: conteoPorDia.get(key) ?? 0 };
        });

        let current = 0;
        let maxStreak = 0;
        for (const day of streakDays) {
            if (day.count > 0) {
                current += 1;
                maxStreak = Math.max(maxStreak, current);
            } else {
                current = 0;
            }
        }

        return {
            balanceTotal,
            ingresosMes,
            gastosMes,
            totalTransacciones: transaccionesMes.length,
            moneda: workspace.baseCurrency,
            streak: {
                days: streakDays,
                maxStreak,
                totalInWindow: transaccionesUltimos30.length,
            },
            cuentas: cuentas.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
                currency: c.currency,
                currentBalance: Number(c.currentBalance),
            })),
            ultimasTransacciones: ultimasTransacciones.map((tx) => ({
                id: tx.id,
                description: tx.description,
                amount: Number(tx.amountOriginal),
                type: tx.type,
                date: tx.date.toISOString(),
                source: tx.source,
                account: tx.account?.name,
                category: tx.category,
            })),
        };
    } catch {
        return {
            balanceTotal: 0,
            ingresosMes: 0,
            gastosMes: 0,
            totalTransacciones: 0,
            moneda: "PEN",
            streak: {
                days: [],
                maxStreak: 0,
                totalInWindow: 0,
            },
            cuentas: [],
            ultimasTransacciones: [],
        };
    }
}

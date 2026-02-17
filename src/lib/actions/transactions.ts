"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PrismaClient } from "@prisma/client";
import { aplicarReglas } from "@/lib/actions/rules";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";

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
                    account: { select: { name: true, currency: true } },
                    category: { select: { name: true, icon: true, color: true } },
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

        const accountId = formData.get("accountId") as string;
        let categoryId = (formData.get("categoryId") as string) || null;
        const description = formData.get("description") as string;

        // Auto-categorización: si no se especificó categoría, aplicar reglas
        if (!categoryId && description) {
            const catAutoId = await aplicarReglas(description);
            if (catAutoId) categoryId = catAutoId;
        }
        const type = (formData.get("type") as string) || "expense";
        const amount = parseFloat(formData.get("amount") as string);
        const dateStr = formData.get("date") as string;
        const date = dateStr ? new Date(dateStr) : new Date();

        // Validaciones
        if (!accountId) return { error: "Seleccioná una cuenta." };
        if (!description || description.trim().length === 0) return { error: "La descripción es obligatoria." };
        if (isNaN(amount) || amount <= 0) return { error: "El monto debe ser mayor a 0." };

        // Verificar que la cuenta pertenece al workspace
        const cuenta = await prisma.account.findFirst({
            where: { id: accountId, workspaceId: workspace.id, deletedAt: null },
        });

        if (!cuenta) return { error: "Cuenta no encontrada." };

        // Calcular el cambio de balance
        // expense → resta, income → suma
        const cambioBalance = type === "income" ? amount : -amount;

        // Crear transacción y actualizar balance en una transacción atómica
        const resultado = await prisma.$transaction(async (tx: TxClient) => {
            // 1. Crear la transacción
            const transaccion = await tx.transaction.create({
                data: {
                    workspaceId: workspace.id,
                    accountId,
                    categoryId,
                    amountOriginal: amount,
                    currencyOriginal: cuenta.currency,
                    amountBase: amount, // Misma moneda por ahora (multi-moneda posterior)
                    baseCurrency: workspace.baseCurrency,
                    description: description.trim(),
                    type,
                    source: "web",
                    date,
                },
            });

            // 2. Actualizar balance de la cuenta
            await tx.account.update({
                where: { id: accountId },
                data: {
                    currentBalance: {
                        increment: cambioBalance,
                    },
                },
            });

            // 3. Auditoría
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

        revalidatePath("/dashboard/transactions");
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

/**
 * Eliminar una transacción (soft delete) y revertir el balance.
 */
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
            // 1. Soft delete de la transacción
            const deleted = await tx.transaction.updateMany({
                where: { id, workspaceId: workspace.id, deletedAt: null },
                data: { deletedAt: new Date(), deletedBy: userId },
            });

            if (deleted.count === 0) {
                throw new Error("Transacción no encontrada o sin permisos");
            }

            // 2. Revertir balance
            await tx.account.update({
                where: { id: transaccion.accountId },
                data: {
                    currentBalance: { increment: reversion },
                },
            });

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

        revalidatePath("/dashboard/transactions");
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
export async function obtenerResumenDashboard() {
    try {
        const { workspace } = await obtenerWorkspace();

        // Primer día del mes actual
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

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

        // Últimas transacciones
        const ultimasTransacciones = await prisma.transaction.findMany({
            where: { workspaceId: workspace.id, deletedAt: null },
            include: {
                account: { select: { name: true } },
                category: { select: { name: true, icon: true, color: true } },
            },
            orderBy: { date: "desc" },
            take: 5,
        });

        return {
            balanceTotal,
            ingresosMes,
            gastosMes,
            totalTransacciones: transaccionesMes.length,
            moneda: workspace.baseCurrency,
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
            cuentas: [],
            ultimasTransacciones: [],
        };
    }
}

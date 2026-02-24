"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";

async function obtenerWorkspace(minRole: "owner" | "admin" | "member" = "member") {
    return requireWorkspaceAccess(minRole);
}

type BudgetType = "fixed" | "percentage";

const VALID_BUDGET_TYPES = new Set<BudgetType>(["fixed", "percentage"]);

function toNumber(value: unknown) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function getBudgetType(value: unknown): BudgetType {
    const next = String(value || "fixed") as BudgetType;
    return VALID_BUDGET_TYPES.has(next) ? next : "fixed";
}

/**
 * Obtiene el rango de fechas del periodo actual (solo "monthly" por ahora).
 */
function getPeriodRange(period: string): { start: Date; end: Date } {
    const now = new Date();
    if (period === "weekly") {
        const dayOfWeek = now.getDay();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return { start, end };
    }
    // Default: monthly
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
}

/**
 * Calcula el gasto actual para un presupuesto en el periodo actual.
 */
async function calcularGastoActual(
    workspaceId: string,
    categoryId: string | null,
    period: string
) {
    const { start, end } = getPeriodRange(period);

    const where: Record<string, unknown> = {
        workspaceId,
        type: "expense",
        deletedAt: null,
        date: { gte: start, lt: end },
    };

    if (categoryId) {
        where.categoryId = categoryId;
    }

    const aggregate = await prisma.transaction.aggregate({
        where,
        _sum: { amountBase: true },
    });

    return Math.abs(Number(aggregate._sum.amountBase ?? 0));
}

/**
 * Calcula el total de ingresos del periodo actual.
 */
async function calcularIngresosPeriodo(workspaceId: string, period: string) {
    const { start, end } = getPeriodRange(period);

    const aggregate = await prisma.transaction.aggregate({
        where: {
            workspaceId,
            type: "income",
            deletedAt: null,
            date: { gte: start, lt: end },
        },
        _sum: { amountBase: true },
    });

    return Math.abs(Number(aggregate._sum.amountBase ?? 0));
}

function formatBudget(
    budget: {
        id: string;
        workspaceId: string;
        categoryId: string | null;
        name: string;
        amount: { toString(): string };
        currency: string;
        period: string;
        budgetType: string;
        alertAt80: boolean;
        alertAt100: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        category?: {
            id: string;
            name: string;
            icon: string | null;
            color: string | null;
        } | null;
    },
    spentAmount: number,
    incomeAmount?: number
) {
    const amount = Number(budget.amount);
    const budgetType = getBudgetType(budget.budgetType);

    let effectiveLimit: number;
    if (budgetType === "percentage" && incomeAmount != null) {
        effectiveLimit = (amount / 100) * incomeAmount;
    } else {
        effectiveLimit = amount;
    }

    const progressPct = effectiveLimit > 0 ? Math.min((spentAmount / effectiveLimit) * 100, 100) : 0;
    const remaining = Math.max(effectiveLimit - spentAmount, 0);

    const { start, end } = getPeriodRange(budget.period);

    return {
        id: budget.id,
        categoryId: budget.categoryId,
        name: budget.name,
        amount,
        currency: budget.currency,
        period: budget.period,
        budgetType,
        alertAt80: budget.alertAt80,
        alertAt100: budget.alertAt100,
        spentAmount,
        effectiveLimit,
        remaining,
        progressPct,
        incomeAmount: incomeAmount ?? 0,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        category: budget.category
            ? {
                id: budget.category.id,
                name: budget.category.name,
                icon: budget.category.icon,
                color: budget.category.color,
            }
            : null,
        createdAt: budget.createdAt.toISOString(),
        updatedAt: budget.updatedAt.toISOString(),
    };
}

// ─────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────

export async function listarPresupuestos() {
    try {
        const { workspace } = await obtenerWorkspace("member");

        const budgets = await prisma.budget.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
            },
            include: {
                category: {
                    select: { id: true, name: true, icon: true, color: true },
                },
            },
            orderBy: [{ createdAt: "desc" }],
        });

        const incomeAmount = await calcularIngresosPeriodo(workspace.id, "monthly");

        const presupuestos = await Promise.all(
            budgets.map(async (budget) => {
                const spentAmount = await calcularGastoActual(
                    workspace.id,
                    budget.categoryId,
                    budget.period
                );
                return formatBudget(budget, spentAmount, incomeAmount);
            })
        );

        return { presupuestos };
    } catch {
        return { error: "Error al listar presupuestos", presupuestos: [] };
    }
}

export async function crearPresupuesto(formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "budgets:create:user",
            key: userId,
            limit: 20,
            windowMs: 60_000,
        });

        const categoryId = String(formData.get("categoryId") || "").trim() || null;
        const name = String(formData.get("name") || "").trim();
        const amount = toNumber(formData.get("amount"));
        const currency = String(formData.get("currency") || "PEN").trim().toUpperCase();
        const budgetType = getBudgetType(formData.get("budgetType"));
        const period = String(formData.get("period") || "monthly").trim();
        const alertAt80 = formData.get("alertAt80") !== "false";
        const alertAt100 = formData.get("alertAt100") !== "false";

        if (!name) return { error: "El nombre del presupuesto es obligatorio." };
        if (!Number.isFinite(amount) || amount <= 0) {
            return { error: budgetType === "percentage" ? "El porcentaje debe ser mayor a 0." : "El monto debe ser mayor a 0." };
        }
        if (budgetType === "percentage" && amount > 100) {
            return { error: "El porcentaje no puede ser mayor a 100%." };
        }

        if (categoryId) {
            const category = await prisma.category.findFirst({
                where: { id: categoryId, workspaceId: workspace.id, deletedAt: null },
                select: { id: true },
            });
            if (!category) return { error: "La categoría seleccionada no es válida." };
        }

        const budget = await prisma.budget.create({
            data: {
                workspaceId: workspace.id,
                categoryId,
                name,
                amount,
                currency,
                period,
                budgetType,
                alertAt80,
                alertAt100,
            },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "create",
                entity: "budget",
                entityId: budget.id,
                after: {
                    name,
                    amount,
                    currency,
                    budgetType,
                    period,
                    categoryId,
                    alertAt80,
                    alertAt100,
                },
            },
        });

        revalidatePath("/budgets");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("[crearPresupuesto] Error:", error);
        if (isRateLimitError(error)) return { error: error.message };
        return { error: "Error al crear el presupuesto." };
    }
}

export async function actualizarPresupuesto(id: string, formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "budgets:update:user",
            key: userId,
            limit: 30,
            windowMs: 60_000,
        });

        const budget = await prisma.budget.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!budget) return { error: "Presupuesto no encontrado." };

        const categoryId = String(formData.get("categoryId") || budget.categoryId || "").trim() || null;
        const name = String(formData.get("name") || budget.name).trim();
        const amount = toNumber(formData.get("amount") ?? budget.amount);
        const currency = String(formData.get("currency") || budget.currency).trim().toUpperCase();
        const budgetType = getBudgetType(formData.get("budgetType") || budget.budgetType);
        const period = String(formData.get("period") || budget.period).trim();
        const alertAt80 = formData.get("alertAt80") !== "false";
        const alertAt100 = formData.get("alertAt100") !== "false";

        if (!name) return { error: "El nombre del presupuesto es obligatorio." };
        if (!Number.isFinite(amount) || amount <= 0) {
            return { error: budgetType === "percentage" ? "El porcentaje debe ser mayor a 0." : "El monto debe ser mayor a 0." };
        }
        if (budgetType === "percentage" && amount > 100) {
            return { error: "El porcentaje no puede ser mayor a 100%." };
        }

        await prisma.budget.update({
            where: { id },
            data: { categoryId, name, amount, currency, budgetType, period, alertAt80, alertAt100 },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "update",
                entity: "budget",
                entityId: id,
                before: {
                    name: budget.name,
                    amount: Number(budget.amount),
                    currency: budget.currency,
                    budgetType: budget.budgetType,
                    categoryId: budget.categoryId,
                },
                after: { name, amount, currency, budgetType, categoryId },
            },
        });

        revalidatePath("/budgets");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        if (isRateLimitError(error)) return { error: error.message };
        return { error: "Error al actualizar el presupuesto." };
    }
}

export async function eliminarPresupuesto(id: string) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "budgets:delete:user",
            key: userId,
            limit: 15,
            windowMs: 60_000,
        });

        const budget = await prisma.budget.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!budget) return { error: "Presupuesto no encontrado." };

        await prisma.budget.update({
            where: { id },
            data: { deletedAt: new Date(), deletedBy: userId },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "delete",
                entity: "budget",
                entityId: id,
                before: {
                    name: budget.name,
                    amount: Number(budget.amount),
                    currency: budget.currency,
                    budgetType: budget.budgetType,
                },
            },
        });

        revalidatePath("/budgets");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        if (isRateLimitError(error)) return { error: error.message };
        return { error: "Error al eliminar el presupuesto." };
    }
}

/**
 * Obtiene el gasto diario acumulado para un presupuesto en el periodo actual.
 * Retorna un array de { date, cumulative } para graficar.
 */
export async function obtenerGastoDiarioPresupuesto(budgetId: string) {
    try {
        const { workspace } = await obtenerWorkspace("member");

        const budget = await prisma.budget.findFirst({
            where: { id: budgetId, workspaceId: workspace.id, deletedAt: null },
        });

        if (!budget) return { error: "Presupuesto no encontrado.", datos: [] };

        const { start, end } = getPeriodRange(budget.period);

        const where: Record<string, unknown> = {
            workspaceId: workspace.id,
            type: "expense",
            deletedAt: null,
            date: { gte: start, lt: end },
        };

        if (budget.categoryId) {
            where.categoryId = budget.categoryId;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            select: { date: true, amountBase: true },
            orderBy: { date: "asc" },
        });

        // Build daily map
        const dailyMap = new Map<string, number>();
        const now = new Date();
        const endDate = now < end ? now : end;

        // Initialize all days in period
        const cursor = new Date(start);
        while (cursor <= endDate) {
            const key = cursor.toISOString().slice(0, 10);
            dailyMap.set(key, 0);
            cursor.setDate(cursor.getDate() + 1);
        }

        // Sum transactions by day
        for (const tx of transactions) {
            const key = new Date(tx.date).toISOString().slice(0, 10);
            dailyMap.set(key, (dailyMap.get(key) || 0) + Math.abs(Number(tx.amountBase ?? 0)));
        }

        // Build cumulative array
        const datos: { date: string; daily: number; cumulative: number }[] = [];
        let cumulative = 0;
        for (const [date, daily] of dailyMap.entries()) {
            cumulative += daily;
            datos.push({ date, daily, cumulative });
        }

        // Calculate effective limit
        const amount = Number(budget.amount);
        let effectiveLimit: number;
        if (budget.budgetType === "percentage") {
            const income = await calcularIngresosPeriodo(workspace.id, budget.period);
            effectiveLimit = (amount / 100) * income;
        } else {
            effectiveLimit = amount;
        }

        return {
            datos,
            limit: effectiveLimit,
            currency: budget.currency,
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),
        };
    } catch {
        return { error: "Error al obtener datos del gráfico.", datos: [] };
    }
}

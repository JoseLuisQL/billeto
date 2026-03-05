"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin-access";

/**
 * Métricas globales para analytics admin.
 */
export async function obtenerAnalyticsGlobalesAdmin() {
    await requireAdmin();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
        totalUsers,
        usersLast30,
        usersPrev30,
        totalWorkspaces,
        wsLast30,
        wsPrev30,
        totalTxns,
        txnsLast30,
        txnsPrev30,
        totalAccounts,
        totalGoals,
        totalBudgets,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
        prisma.workspace.count({ where: { deletedAt: null } }),
        prisma.workspace.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
        prisma.workspace.count({ where: { deletedAt: null, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
        prisma.transaction.count({ where: { deletedAt: null } }),
        prisma.transaction.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
        prisma.transaction.count({ where: { deletedAt: null, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
        prisma.account.count({ where: { deletedAt: null } }),
        prisma.goal.count(),
        prisma.budget.count({ where: { deletedAt: null } }),
    ]);

    const calcGrowth = (current: number, prev: number) =>
        prev === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - prev) / prev) * 100);

    return {
        users: { total: totalUsers, last30: usersLast30, growth: calcGrowth(usersLast30, usersPrev30) },
        workspaces: { total: totalWorkspaces, last30: wsLast30, growth: calcGrowth(wsLast30, wsPrev30) },
        transactions: { total: totalTxns, last30: txnsLast30, growth: calcGrowth(txnsLast30, txnsPrev30) },
        accounts: totalAccounts,
        goals: totalGoals,
        budgets: totalBudgets,
    };
}

/**
 * Datos de crecimiento de usuarios por día (últimos N días).
 */
export async function obtenerCrecimientoUsuariosAdmin(dias: number = 60) {
    await requireAdmin();

    const since = new Date();
    since.setDate(since.getDate() - dias);

    const users = await prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
    });

    const grouped: Record<string, number> = {};
    for (let i = 0; i < dias; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (dias - 1 - i));
        grouped[d.toISOString().split("T")[0]] = 0;
    }

    for (const u of users) {
        const key = u.createdAt.toISOString().split("T")[0];
        if (grouped[key] !== undefined) grouped[key]++;
    }

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}

/**
 * Distribución de transacciones por tipo.
 */
export async function obtenerDistribucionTransaccionesAdmin() {
    await requireAdmin();

    const dist = await prisma.transaction.groupBy({
        by: ["type"],
        where: { deletedAt: null },
        _count: { id: true },
        _sum: { amountBase: true },
    });

    return dist.map((d) => ({
        type: d.type,
        count: d._count.id,
        total: Number(d._sum.amountBase ?? 0),
    }));
}

/**
 * Top categorías por uso global.
 */
export async function obtenerTopCategoriasAdmin(limit: number = 10) {
    await requireAdmin();

    const cats = await prisma.transaction.groupBy({
        by: ["categoryId"],
        where: { deletedAt: null, categoryId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: limit,
    });

    const catIds = cats.map((c) => c.categoryId).filter(Boolean) as string[];
    const catNames = await prisma.category.findMany({
        where: { id: { in: catIds } },
        select: { id: true, name: true, icon: true, color: true },
    });

    const nameMap = new Map(catNames.map((c) => [c.id, c]));

    return cats.map((c) => {
        const cat = nameMap.get(c.categoryId!);
        return {
            name: cat?.name ?? "Sin categoría",
            icon: cat?.icon ?? "📁",
            color: cat?.color ?? null,
            count: c._count.id,
        };
    });
}

/**
 * Top países por usuarios.
 */
export async function obtenerTopPaisesAdmin() {
    await requireAdmin();

    const countries = await prisma.user.groupBy({
        by: ["country"],
        where: { country: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
    });

    return countries.map((c) => ({
        country: c.country ?? "Desconocido",
        count: c._count.id,
    }));
}

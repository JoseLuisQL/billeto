"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin-access";

/**
 * Obtener KPIs globales del dashboard admin.
 */
export async function obtenerKPIsAdmin() {
    await requireAdmin();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
        totalUsers,
        newUsersWeek,
        totalWorkspaces,
        transactionsToday,
        subscriptionCounts,
        activeUsers30d,
        totalTransactions,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.workspace.count({ where: { deletedAt: null } }),
        prisma.transaction.count({ where: { date: { gte: todayStart }, deletedAt: null } }),
        prisma.subscription.groupBy({
            by: ["planTier"],
            _count: { id: true },
        }),
        prisma.workspace.count({
            where: {
                deletedAt: null,
                transactions: { some: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } },
            },
        }),
        prisma.transaction.count({ where: { deletedAt: null } }),
    ]);

    const planDistribution = subscriptionCounts.reduce<Record<string, number>>((acc, s) => {
        acc[s.planTier] = s._count.id;
        return acc;
    }, {});

    const retentionRate = totalWorkspaces > 0 ? Math.round((activeUsers30d / totalWorkspaces) * 100) : 0;

    return {
        totalUsers,
        newUsersWeek,
        totalWorkspaces,
        transactionsToday,
        totalTransactions,
        retentionRate,
        planDistribution,
    };
}

/**
 * Obtener gráfico de registros de usuarios por día.
 */
export async function obtenerGraficoRegistros(dias: number = 30) {
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
 * Últimos usuarios registrados.
 */
export async function obtenerUltimosUsuarios(limit: number = 10) {
    await requireAdmin();

    const users = await prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            country: true,
            createdAt: true,
            isAdmin: true,
            emailVerified: true,
            memberships: {
                take: 1,
                orderBy: { createdAt: "desc" },
                include: {
                    workspace: {
                        include: { subscription: { select: { planTier: true } } },
                    },
                },
            },
        },
    });

    return users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        country: u.country,
        createdAt: u.createdAt.toISOString(),
        isAdmin: u.isAdmin,
        emailVerified: !!u.emailVerified,
        plan: u.memberships[0]?.workspace?.subscription?.planTier ?? "free",
    }));
}

/**
 * Últimas transacciones globales.
 */
export async function obtenerUltimasTransacciones(limit: number = 5) {
    await requireAdmin();

    const txs = await prisma.transaction.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        where: { deletedAt: null },
        include: {
            category: { select: { name: true } },
            account: { select: { name: true } },
            workspace: { select: { name: true } },
        },
    });

    return txs.map((t) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amountBase),
        currency: t.baseCurrency,
        type: t.type,
        category: t.category?.name ?? "Sin categoría",
        account: t.account?.name ?? "Sin cuenta",
        workspace: t.workspace?.name ?? "—",
        date: t.date.toISOString(),
    }));
}

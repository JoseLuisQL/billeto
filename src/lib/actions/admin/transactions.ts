"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin-access";

/**
 * Listar todas las transacciones globalmente.
 */
export async function listarTransaccionesAdmin() {
    await requireAdmin();

    const txs = await prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 500,
        include: {
            category: { select: { name: true } },
            account: { select: { name: true } },
            workspace: { select: { name: true } },
        },
    });

    return txs.map((t) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amountOriginal),
        currency: t.currencyOriginal,
        amountBase: Number(t.amountBase),
        baseCurrency: t.baseCurrency,
        type: t.type,
        category: t.category?.name ?? "Sin categoría",
        account: t.account?.name ?? "Sin cuenta",
        workspace: t.workspace?.name ?? "—",
        workspaceId: t.workspaceId,
        deletedAt: t.deletedAt?.toISOString() ?? null,
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
    }));
}

export type AdminTransactionRow = Awaited<ReturnType<typeof listarTransaccionesAdmin>>[number];

/**
 * Eliminar transacción (soft delete).
 */
export async function eliminarTransaccionAdmin(transactionId: string) {
    const admin = await requireAdmin();

    await prisma.transaction.update({
        where: { id: transactionId },
        data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "delete_transaction",
            entity: "transaction",
            entityId: transactionId,
        },
    });

    return { success: true };
}

/**
 * Restaurar transacción eliminada.
 */
export async function restaurarTransaccionAdmin(transactionId: string) {
    const admin = await requireAdmin();

    await prisma.transaction.update({
        where: { id: transactionId },
        data: { deletedAt: null },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "restore_transaction",
            entity: "transaction",
            entityId: transactionId,
        },
    });

    return { success: true };
}

/**
 * Estadísticas rápidas de transacciones.
 */
export async function obtenerEstadisticasTransaccionesAdmin() {
    await requireAdmin();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const [total, today, thisWeek, deleted] = await Promise.all([
        prisma.transaction.count({ where: { deletedAt: null } }),
        prisma.transaction.count({ where: { deletedAt: null, createdAt: { gte: todayStart } } }),
        prisma.transaction.count({ where: { deletedAt: null, createdAt: { gte: weekStart } } }),
        prisma.transaction.count({ where: { deletedAt: { not: null } } }),
    ]);

    return { total, today, thisWeek, deleted };
}

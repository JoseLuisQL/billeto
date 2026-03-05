"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin-access";

/**
 * Listar audit logs con paginación.
 */
export async function listarAuditLogsAdmin(limit: number = 200) {
    await requireAdmin();

    const logs = await prisma.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            actor: { select: { name: true, email: true } },
            workspace: { select: { name: true } },
        },
    });

    return logs.map((l) => ({
        id: l.id,
        actorId: l.actorId,
        actorName: l.actor.name ?? l.actor.email,
        actorType: l.actorType,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        workspaceName: l.workspace?.name ?? null,
        before: l.before as Record<string, unknown> | null,
        after: l.after as Record<string, unknown> | null,
        createdAt: l.createdAt.toISOString(),
    }));
}

export type AdminAuditLogRow = Awaited<ReturnType<typeof listarAuditLogsAdmin>>[number];

/**
 * Estadísticas de audit logs.
 */
export async function obtenerEstadisticasAuditAdmin() {
    await requireAdmin();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(today);
    week.setDate(week.getDate() - 7);

    const [total, todayCount, weekCount, byAction] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
        prisma.auditLog.count({ where: { createdAt: { gte: week } } }),
        prisma.auditLog.groupBy({
            by: ["action"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 10,
        }),
    ]);

    return {
        total,
        todayCount,
        weekCount,
        topActions: byAction.map((a) => ({ action: a.action, count: a._count.id })),
    };
}

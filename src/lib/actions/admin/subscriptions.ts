"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin-access";

/**
 * Listar todas las suscripciones.
 */
export async function listarSuscripcionesAdmin() {
    await requireAdmin();

    const subs = await prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            workspace: {
                select: {
                    name: true,
                    memberships: {
                        where: { role: "owner" },
                        take: 1,
                        include: { user: { select: { name: true, email: true } } },
                    },
                },
            },
        },
    });

    return subs.map((s) => ({
        id: s.id,
        workspaceId: s.workspaceId,
        workspaceName: s.workspace.name,
        ownerName: s.workspace.memberships[0]?.user?.name ?? "—",
        ownerEmail: s.workspace.memberships[0]?.user?.email ?? "—",
        planTier: s.planTier,
        status: s.status,
        currentPeriodStart: s.currentPeriodStart?.toISOString() ?? null,
        currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
        trialEndsAt: s.trialEndsAt?.toISOString() ?? null,
        cancelledAt: s.cancelledAt?.toISOString() ?? null,
        paymentProvider: s.paymentProvider,
        createdAt: s.createdAt.toISOString(),
    }));
}

export type AdminSubscriptionRow = Awaited<ReturnType<typeof listarSuscripcionesAdmin>>[number];

/**
 * Cambiar plan de una suscripción.
 */
export async function cambiarPlanAdmin(subscriptionId: string, newPlan: string) {
    const admin = await requireAdmin();

    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) throw new Error("Suscripción no encontrada");

    await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { planTier: newPlan },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "change_plan",
            entity: "subscription",
            entityId: subscriptionId,
            before: { planTier: sub.planTier },
            after: { planTier: newPlan },
        },
    });

    return { success: true };
}

/**
 * Cancelar suscripción.
 */
export async function cancelarSuscripcionAdmin(subscriptionId: string) {
    const admin = await requireAdmin();

    await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: "cancelled", cancelledAt: new Date() },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "cancel_subscription",
            entity: "subscription",
            entityId: subscriptionId,
        },
    });

    return { success: true };
}

/**
 * Reactivar suscripción cancelada.
 */
export async function reactivarSuscripcionAdmin(subscriptionId: string) {
    const admin = await requireAdmin();

    await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: "active", cancelledAt: null },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "reactivate_subscription",
            entity: "subscription",
            entityId: subscriptionId,
        },
    });

    return { success: true };
}

/**
 * Métricas de revenue.
 */
export async function obtenerMetricasRevenueAdmin() {
    await requireAdmin();

    const subs = await prisma.subscription.groupBy({
        by: ["planTier"],
        _count: { id: true },
    });

    const totalActive = await prisma.subscription.count({ where: { status: "active" } });
    const totalCancelled = await prisma.subscription.count({ where: { status: "cancelled" } });

    const distribution = subs.reduce<Record<string, number>>((acc, s) => {
        acc[s.planTier] = s._count.id;
        return acc;
    }, {});

    return {
        totalActive,
        totalCancelled,
        distribution,
        freeCount: distribution["free"] ?? 0,
        proCount: distribution["pro"] ?? 0,
        premiumCount: distribution["premium"] ?? 0,
    };
}

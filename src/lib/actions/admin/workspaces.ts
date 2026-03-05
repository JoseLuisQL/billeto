"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin-access";

/**
 * Listar todos los workspaces con datos resumidos.
 */
export async function listarWorkspacesAdmin() {
    await requireAdmin();

    const workspaces = await prisma.workspace.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            subscription: { select: { planTier: true, status: true } },
            _count: {
                select: { memberships: true, transactions: true, accounts: true },
            },
            memberships: {
                where: { role: "owner" },
                take: 1,
                include: { user: { select: { name: true, email: true } } },
            },
        },
    });

    return workspaces.map((ws) => ({
        id: ws.id,
        name: ws.name,
        country: ws.country,
        currency: ws.baseCurrency,
        plan: ws.subscription?.planTier ?? "free",
        subscriptionStatus: ws.subscription?.status ?? "active",
        members: ws._count.memberships,
        transactions: ws._count.transactions,
        accounts: ws._count.accounts,
        onboardingCompleted: ws.onboardingCompleted,
        ownerName: ws.memberships[0]?.user?.name ?? "—",
        ownerEmail: ws.memberships[0]?.user?.email ?? "—",
        deletedAt: ws.deletedAt?.toISOString() ?? null,
        createdAt: ws.createdAt.toISOString(),
    }));
}

export type AdminWorkspaceRow = Awaited<ReturnType<typeof listarWorkspacesAdmin>>[number];

/**
 * Obtener detalle de un workspace.
 */
export async function obtenerDetalleWorkspaceAdmin(workspaceId: string) {
    await requireAdmin();

    const ws = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
            subscription: true,
            memberships: {
                include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
            },
            accounts: {
                where: { deletedAt: null },
                select: { id: true, name: true, type: true, currentBalance: true, currency: true },
            },
            _count: {
                select: { transactions: true, categories: true, budgets: true, goals: true, recurringTransactions: true },
            },
        },
    });

    if (!ws) throw new Error("Workspace no encontrado");

    return {
        id: ws.id,
        name: ws.name,
        country: ws.country,
        currency: ws.baseCurrency,
        timezone: ws.timezone,
        onboardingCompleted: ws.onboardingCompleted,
        deletedAt: ws.deletedAt?.toISOString() ?? null,
        createdAt: ws.createdAt.toISOString(),
        plan: ws.subscription?.planTier ?? "free",
        subscriptionStatus: ws.subscription?.status ?? "active",
        members: ws.memberships.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            avatar: m.user.avatar,
            role: m.role,
        })),
        accounts: ws.accounts.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            balance: Number(a.currentBalance),
            currency: a.currency,
        })),
        counts: {
            transactions: ws._count.transactions,
            categories: ws._count.categories,
            budgets: ws._count.budgets,
            goals: ws._count.goals,
            recurring: ws._count.recurringTransactions,
        },
    };
}

/**
 * Eliminar workspace (soft delete).
 */
export async function eliminarWorkspaceAdmin(workspaceId: string) {
    const admin = await requireAdmin();

    await prisma.workspace.update({
        where: { id: workspaceId },
        data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "delete_workspace",
            entity: "workspace",
            entityId: workspaceId,
        },
    });

    return { success: true };
}

/**
 * Restaurar workspace eliminado.
 */
export async function restaurarWorkspaceAdmin(workspaceId: string) {
    const admin = await requireAdmin();

    await prisma.workspace.update({
        where: { id: workspaceId },
        data: { deletedAt: null },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "restore_workspace",
            entity: "workspace",
            entityId: workspaceId,
        },
    });

    return { success: true };
}

/**
 * Cambiar plan de un workspace.
 */
export async function cambiarPlanWorkspaceAdmin(workspaceId: string, newPlan: string) {
    const admin = await requireAdmin();

    await prisma.subscription.updateMany({
        where: { workspaceId },
        data: { planTier: newPlan },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "change_plan",
            entity: "workspace",
            entityId: workspaceId,
            after: { planTier: newPlan },
        },
    });

    return { success: true };
}

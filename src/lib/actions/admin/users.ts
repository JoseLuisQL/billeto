"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin-access";

/**
 * Listar todos los usuarios con datos resumidos.
 */
export async function listarUsuariosAdmin() {
    await requireAdmin();

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            country: true,
            isAdmin: true,
            emailVerified: true,
            scheduledForDeletionAt: true,
            createdAt: true,
            updatedAt: true,
            memberships: {
                take: 1,
                include: {
                    workspace: {
                        include: { subscription: { select: { planTier: true } } },
                    },
                },
            },
            _count: {
                select: { sessions: true },
            },
        },
    });

    return users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        country: u.country,
        isAdmin: u.isAdmin,
        emailVerified: !!u.emailVerified,
        scheduledForDeletionAt: u.scheduledForDeletionAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        plan: u.memberships[0]?.workspace?.subscription?.planTier ?? "free",
        activeSessions: u._count.sessions,
        status: u.scheduledForDeletionAt
            ? "eliminación programada"
            : "activo",
    }));
}

export type AdminUserRow = Awaited<ReturnType<typeof listarUsuariosAdmin>>[number];

/**
 * Obtener detalle completo de un usuario.
 */
export async function obtenerDetalleUsuarioAdmin(userId: string) {
    await requireAdmin();

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            memberships: {
                include: {
                    workspace: {
                        include: {
                            subscription: true,
                            _count: {
                                select: { transactions: true, accounts: true, members: true },
                            },
                        },
                    },
                },
            },
            sessions: {
                select: { id: true, expires: true },
                orderBy: { expires: "desc" },
            },
            auditLogs: {
                take: 20,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    action: true,
                    entity: true,
                    entityId: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!user) throw new Error("Usuario no encontrado");

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        country: user.country,
        isAdmin: user.isAdmin,
        emailVerified: !!user.emailVerified,
        scheduledForDeletionAt: user.scheduledForDeletionAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        workspaces: user.memberships.map((m) => ({
            id: m.workspace.id,
            name: m.workspace.name,
            role: m.role,
            plan: m.workspace.subscription?.planTier ?? "free",
            transactions: m.workspace._count.transactions,
            accounts: m.workspace._count.accounts,
            members: m.workspace._count.members,
        })),
        sessions: user.sessions.map((s) => ({
            id: s.id,
            expires: s.expires.toISOString(),
        })),
        recentActivity: user.auditLogs.map((l) => ({
            id: l.id,
            action: l.action,
            entity: l.entity,
            entityId: l.entityId,
            createdAt: l.createdAt.toISOString(),
        })),
    };
}

/**
 * Verificar email de un usuario manualmente.
 */
export async function verificarEmailAdmin(userId: string) {
    const admin = await requireAdmin();

    await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "verify_email",
            entity: "user",
            entityId: userId,
        },
    });

    return { success: true };
}

/**
 * Suspender usuario (marcar para eliminación en 30 días).
 */
export async function suspenderUsuarioAdmin(userId: string) {
    const admin = await requireAdmin();

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await prisma.user.update({
        where: { id: userId },
        data: { scheduledForDeletionAt: deletionDate },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "suspend_user",
            entity: "user",
            entityId: userId,
        },
    });

    return { success: true };
}

/**
 * Reactivar usuario suspendido.
 */
export async function reactivarUsuarioAdmin(userId: string) {
    const admin = await requireAdmin();

    await prisma.user.update({
        where: { id: userId },
        data: { scheduledForDeletionAt: null },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "reactivate_user",
            entity: "user",
            entityId: userId,
        },
    });

    return { success: true };
}

/**
 * Promover usuario a admin.
 */
export async function promoverAdminAdmin(userId: string) {
    const admin = await requireAdmin();

    await prisma.user.update({
        where: { id: userId },
        data: { isAdmin: true },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "promote_admin",
            entity: "user",
            entityId: userId,
        },
    });

    return { success: true };
}

/**
 * Revocar admin de un usuario.
 */
export async function revocarAdminAdmin(userId: string) {
    const admin = await requireAdmin();

    // No permitir revocar al propio admin
    if (admin.userId === userId) {
        throw new Error("No puedes revocar tus propios permisos de administrador");
    }

    // Verificar que no sea el último admin
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    if (adminCount <= 1) {
        throw new Error("No se puede revocar al último administrador del sistema");
    }

    await prisma.user.update({
        where: { id: userId },
        data: { isAdmin: false },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "revoke_admin",
            entity: "user",
            entityId: userId,
        },
    });

    return { success: true };
}

/**
 * Eliminar usuario inmediatamente (hard delete).
 */
export async function eliminarUsuarioAdmin(userId: string) {
    const admin = await requireAdmin();

    if (admin.userId === userId) {
        throw new Error("No puedes eliminar tu propia cuenta desde el panel admin");
    }

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "delete_user",
            entity: "user",
            entityId: userId,
        },
    });

    await prisma.user.delete({ where: { id: userId } });

    return { success: true };
}

/**
 * Cancelar eliminación programada.
 */
export async function cancelarEliminacionAdmin(userId: string) {
    const admin = await requireAdmin();

    await prisma.user.update({
        where: { id: userId },
        data: { scheduledForDeletionAt: null },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "cancel_deletion",
            entity: "user",
            entityId: userId,
        },
    });

    return { success: true };
}

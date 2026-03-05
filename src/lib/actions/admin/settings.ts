"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin-access";

// ─── Generic System Config ───

export async function obtenerSystemConfigAdmin() {
    await requireAdmin();
    const configs = await prisma.systemConfig.findMany({ orderBy: { key: "asc" } });
    return configs.map((c) => ({
        id: c.id,
        key: c.key,
        value: c.value as Record<string, unknown>,
        updatedBy: c.updatedBy,
        updatedAt: c.updatedAt.toISOString(),
    }));
}

export type AdminSystemConfigRow = Awaited<ReturnType<typeof obtenerSystemConfigAdmin>>[number];

export async function guardarSystemConfigAdmin(key: string, value: Record<string, unknown>) {
    const admin = await requireAdmin();

    await prisma.systemConfig.upsert({
        where: { key },
        update: { value, updatedBy: admin.userId },
        create: { key, value, updatedBy: admin.userId },
    });

    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "update_system_config", entity: "system_config", entityId: key },
    });

    return { success: true };
}

export async function eliminarSystemConfigAdmin(key: string) {
    const admin = await requireAdmin();

    await prisma.systemConfig.deleteMany({ where: { key } });

    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "delete_system_config", entity: "system_config", entityId: key },
    });

    return { success: true };
}

// ─── Feature Flags ───

export async function obtenerFeatureFlagsAdmin() {
    await requireAdmin();
    const config = await prisma.systemConfig.findFirst({ where: { key: "feature_flags" } });
    const flags = (config?.value as Record<string, boolean>) ?? {};
    return flags;
}

export async function guardarFeatureFlagsAdmin(flags: Record<string, boolean>) {
    const admin = await requireAdmin();

    await prisma.systemConfig.upsert({
        where: { key: "feature_flags" },
        update: { value: flags, updatedBy: admin.userId },
        create: { key: "feature_flags", value: flags, updatedBy: admin.userId },
    });

    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "update_feature_flags", entity: "system_config", entityId: "feature_flags" },
    });

    return { success: true };
}

// ─── Maintenance Mode ───

export async function obtenerMaintenanceModeAdmin() {
    await requireAdmin();
    const config = await prisma.systemConfig.findFirst({ where: { key: "maintenance_mode" } });
    const value = config?.value as Record<string, unknown> | null;

    return {
        enabled: (value?.enabled as boolean) ?? false,
        message: (value?.message as string) ?? "El sistema está en mantenimiento. Vuelva más tarde.",
        allowAdmins: (value?.allowAdmins as boolean) ?? true,
        estimatedEnd: (value?.estimatedEnd as string) ?? null,
    };
}

export async function guardarMaintenanceModeAdmin(data: {
    enabled: boolean;
    message: string;
    allowAdmins: boolean;
    estimatedEnd: string | null;
}) {
    const admin = await requireAdmin();

    await prisma.systemConfig.upsert({
        where: { key: "maintenance_mode" },
        update: { value: data, updatedBy: admin.userId },
        create: { key: "maintenance_mode", value: data, updatedBy: admin.userId },
    });

    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "update_maintenance_mode", entity: "system_config", entityId: "maintenance_mode" },
    });

    return { success: true };
}

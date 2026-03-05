"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin-access";

/**
 * Listar incidentes de seguridad.
 */
export async function listarIncidentesAdmin() {
    await requireAdmin();

    const incidents = await prisma.incident.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
    });

    return incidents.map((i) => ({
        id: i.id,
        type: i.type,
        severity: i.severity,
        title: i.title,
        description: i.description,
        status: i.status,
        resolvedAt: i.resolvedAt?.toISOString() ?? null,
        resolvedBy: i.resolvedBy,
        metadata: i.metadata as Record<string, unknown> | null,
        createdAt: i.createdAt.toISOString(),
    }));
}

export type AdminIncidentRow = Awaited<ReturnType<typeof listarIncidentesAdmin>>[number];

/**
 * Resolver un incidente.
 */
export async function resolverIncidenteAdmin(incidentId: string) {
    const admin = await requireAdmin();

    await prisma.incident.update({
        where: { id: incidentId },
        data: { status: "resolved", resolvedAt: new Date(), resolvedBy: admin.userId },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "resolve_incident",
            entity: "incident",
            entityId: incidentId,
        },
    });

    return { success: true };
}

/**
 * Reabrir un incidente.
 */
export async function reabrirIncidenteAdmin(incidentId: string) {
    const admin = await requireAdmin();

    await prisma.incident.update({
        where: { id: incidentId },
        data: { status: "open", resolvedAt: null, resolvedBy: null },
    });

    await prisma.auditLog.create({
        data: {
            actorId: admin.userId,
            actorType: "admin",
            action: "reopen_incident",
            entity: "incident",
            entityId: incidentId,
        },
    });

    return { success: true };
}

/**
 * Estadísticas de seguridad.
 */
export async function obtenerEstadisticasSecurityAdmin() {
    await requireAdmin();

    const [total, open, resolved, bySeverity] = await Promise.all([
        prisma.incident.count(),
        prisma.incident.count({ where: { status: "open" } }),
        prisma.incident.count({ where: { status: "resolved" } }),
        prisma.incident.groupBy({
            by: ["severity"],
            _count: { id: true },
        }),
    ]);

    const severityMap = bySeverity.reduce<Record<string, number>>((acc, s) => {
        acc[s.severity] = s._count.id;
        return acc;
    }, {});

    return {
        total,
        open,
        resolved,
        critical: severityMap["critical"] ?? 0,
        high: severityMap["high"] ?? 0,
        medium: severityMap["medium"] ?? 0,
        low: severityMap["low"] ?? 0,
    };
}

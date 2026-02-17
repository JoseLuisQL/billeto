"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { SYSTEM_CATEGORY_OWNER_ID } from "@/lib/categories-defaults";

/**
 * Server Actions para el Rules Engine.
 * Maneja reglas de auto-categorización de transacciones.
 */

function toAuditJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value));
}

async function obtenerWorkspace(minRole: "owner" | "admin" | "member" = "member") {
    return requireWorkspaceAccess(minRole);
}

/**
 * Listar todas las reglas activas del workspace.
 */
export async function listarReglas() {
    try {
        const { workspace } = await obtenerWorkspace();

        const reglas = await prisma.rule.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        });

        return {
            reglas: reglas.map((r) => ({
                id: r.id,
                name: r.name,
                conditions: r.conditions as Record<string, unknown>,
                actions: r.actions as Record<string, unknown>,
                status: r.status,
                priority: r.priority,
                createdAt: r.createdAt.toISOString(),
            })),
        };
    } catch {
        return { reglas: [] };
    }
}

/**
 * Crear una nueva regla de auto-categorización.
 */
export async function crearRegla(data: {
    name: string;
    conditionField: string;
    conditionOperator: string;
    conditionValue: string;
    actionCategoryId: string;
    priority?: number;
}) {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "rules:create:user",
            key: userId,
            limit: 15,
            windowMs: 60_000,
        });

        const conditions = {
            field: data.conditionField,
            operator: data.conditionOperator,
            value: data.conditionValue,
        };

        const actions = {
            type: "setCategory",
            categoryId: data.actionCategoryId,
        };

        const regla = await prisma.rule.create({
            data: {
                workspaceId: workspace.id,
                name: data.name,
                conditions,
                actions,
                priority: data.priority ?? 0,
                status: "active",
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "rule.create",
                entity: "Rule",
                entityId: regla.id,
                after: { name: data.name, conditions, actions },
            },
        });

        revalidatePath("/dashboard/rules");
        return { ok: true, regla };
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { ok: false, error: err.message || "Error al crear regla" };
        }
        return { ok: false, error: "Error al crear regla" };
    }
}

/**
 * Actualizar una regla existente.
 */
export async function actualizarRegla(
    id: string,
    data: {
        name?: string;
        conditionField?: string;
        conditionOperator?: string;
        conditionValue?: string;
        actionCategoryId?: string;
        priority?: number;
        status?: string;
    }
) {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "rules:update:user",
            key: userId,
            limit: 30,
            windowMs: 60_000,
        });

        const reglaExistente = await prisma.rule.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!reglaExistente) return { ok: false, error: "Regla no encontrada" };

        const updateData: Record<string, unknown> = {};

        if (data.name) updateData.name = data.name;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.status) {
            if (data.status !== "active" && data.status !== "paused") {
                return { ok: false, error: "Estado inválido. Usá active o paused." };
            }
            updateData.status = data.status;
        }

        if (data.conditionField && data.conditionOperator && data.conditionValue) {
            updateData.conditions = {
                field: data.conditionField,
                operator: data.conditionOperator,
                value: data.conditionValue,
            };
        }

        if (data.actionCategoryId) {
            updateData.actions = {
                type: "setCategory",
                categoryId: data.actionCategoryId,
            };
        }

        const updated = await prisma.rule.updateMany({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            data: updateData,
        });

        if (updated.count === 0) {
            return { ok: false, error: "Regla no encontrada o sin permisos" };
        }

        const regla = await prisma.rule.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!regla) {
            return { ok: false, error: "Regla no encontrada tras actualizar" };
        }

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "rule.update",
                entity: "Rule",
                entityId: id,
                before: { name: reglaExistente.name },
                after: toAuditJson(updateData),
            },
        });

        revalidatePath("/dashboard/rules");
        return { ok: true, regla };
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { ok: false, error: err.message || "Error al actualizar regla" };
        }
        return { ok: false, error: "Error al actualizar regla" };
    }
}

/**
 * Eliminar una regla (soft delete).
 */
export async function eliminarRegla(id: string) {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "rules:delete:user",
            key: userId,
            limit: 10,
            windowMs: 60_000,
        });

        const regla = await prisma.rule.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!regla) return { ok: false, error: "Regla no encontrada" };

        const deleted = await prisma.rule.updateMany({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            data: { deletedAt: new Date(), deletedBy: userId },
        });

        if (deleted.count === 0) {
            return { ok: false, error: "Regla no encontrada o sin permisos" };
        }

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "rule.delete",
                entity: "Rule",
                entityId: id,
            },
        });

        revalidatePath("/dashboard/rules");
        return { ok: true };
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { ok: false, error: err.message || "Error al eliminar regla" };
        }
        return { ok: false, error: "Error al eliminar regla" };
    }
}

/**
 * Aplicar reglas de auto-categorización a una descripción.
 * Retorna el categoryId de la primera regla que coincida, o null.
 */
export async function aplicarReglas(description: string, ownerUserId?: string): Promise<string | null> {
    try {
        const { workspace } = await obtenerWorkspace();

        const reglas = await prisma.rule.findMany({
            where: {
                workspaceId: workspace.id,
                status: "active",
                deletedAt: null,
            },
            orderBy: { priority: "desc" },
        });

        const descLower = description.toLowerCase();

        for (const regla of reglas) {
            const conditions = regla.conditions as { operator?: string; value?: string };
            const actions = regla.actions as { type?: string; categoryId?: string };

            if (!conditions || !actions) continue;

            let match = false;
            const valueLower = (conditions.value || "").toLowerCase();

            switch (conditions.operator) {
                case "contains":
                    match = descLower.includes(valueLower);
                    break;
                case "startsWith":
                    match = descLower.startsWith(valueLower);
                    break;
                case "equals":
                    match = descLower === valueLower;
                    break;
                case "regex":
                    try {
                        const re = new RegExp(conditions.value || "", "i");
                        match = re.test(description);
                    } catch {
                        match = false;
                    }
                    break;
            }

            if (match && actions.type === "setCategory" && actions.categoryId) {
                const category = await prisma.category.findFirst({
                    where: {
                        id: actions.categoryId,
                        workspaceId: workspace.id,
                        deletedAt: null,
                        OR: ownerUserId
                            ? [
                                { ownerUserId: SYSTEM_CATEGORY_OWNER_ID },
                                { ownerUserId },
                            ]
                            : [{ ownerUserId: SYSTEM_CATEGORY_OWNER_ID }],
                    },
                    select: { id: true },
                });

                if (category) {
                    return category.id;
                }
            }
        }

        return null;
    } catch {
        return null;
    }
}

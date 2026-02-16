"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Server Actions para el Rules Engine.
 * Maneja reglas de auto-categorización de transacciones.
 */

async function obtenerWorkspace() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
        include: { workspace: true },
    });

    if (!membership) throw new Error("Sin workspace asignado");
    return { userId: session.user.id, workspace: membership.workspace };
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
            reglas: reglas.map((r: any) => ({
                id: r.id,
                name: r.name,
                conditions: r.conditions as any,
                actions: r.actions as any,
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
        const { userId, workspace } = await obtenerWorkspace();

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
    } catch (err: any) {
        return { ok: false, error: err.message || "Error al crear regla" };
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
        const { userId, workspace } = await obtenerWorkspace();

        const reglaExistente = await prisma.rule.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!reglaExistente) return { ok: false, error: "Regla no encontrada" };

        const updateData: any = {};

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
                after: updateData,
            },
        });

        revalidatePath("/dashboard/rules");
        return { ok: true, regla };
    } catch (err: any) {
        return { ok: false, error: err.message || "Error al actualizar regla" };
    }
}

/**
 * Eliminar una regla (soft delete).
 */
export async function eliminarRegla(id: string) {
    try {
        const { userId, workspace } = await obtenerWorkspace();

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
    } catch (err: any) {
        return { ok: false, error: err.message || "Error al eliminar regla" };
    }
}

/**
 * Aplicar reglas de auto-categorización a una descripción.
 * Retorna el categoryId de la primera regla que coincida, o null.
 */
export async function aplicarReglas(description: string): Promise<string | null> {
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
            const conditions = regla.conditions as any;
            const actions = regla.actions as any;

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
                        const re = new RegExp(conditions.value, "i");
                        match = re.test(description);
                    } catch {
                        match = false;
                    }
                    break;
            }

            if (match && actions.type === "setCategory" && actions.categoryId) {
                return actions.categoryId;
            }
        }

        return null;
    } catch {
        return null;
    }
}

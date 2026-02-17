"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";
import {
    SYSTEM_CATEGORY_OWNER_ID,
    ensureDefaultCategoriesForWorkspace,
    normalizeCategoryName,
} from "@/lib/categories-defaults";

/**
 * Server Actions para Categorías.
 * CRUD completo con validación de workspace y auditoría.
 */

async function obtenerWorkspace(minRole: "owner" | "admin" | "member" = "member") {
    return requireWorkspaceAccess(minRole);
}

/**
 * Listar categorías activas del workspace.
 */
export async function listarCategorias() {
    try {
        const { workspace, userId } = await obtenerWorkspace();
        await ensureDefaultCategoriesForWorkspace(prisma, workspace.id);

        const categorias = await prisma.category.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
                OR: [
                    { ownerUserId: SYSTEM_CATEGORY_OWNER_ID },
                    { ownerUserId: userId },
                ],
            },
            orderBy: [{ type: "asc" }, { name: "asc" }],
        });

        return { categorias };
    } catch {
        return { error: "Error al obtener categorías", categorias: [] };
    }
}

/**
 * Crear una nueva categoría.
 */
export async function crearCategoria(formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "categories:create:user",
            key: userId,
            limit: 20,
            windowMs: 60_000,
        });

        const name = formData.get("name") as string;
        const icon = (formData.get("icon") as string) || "📁";
        const color = (formData.get("color") as string) || "#71717A";
        const type = (formData.get("type") as string) || "expense";

        if (!name || name.trim().length === 0) {
            return { error: "El nombre es obligatorio." };
        }

        const normalizedName = normalizeCategoryName(name);

        const existente = await prisma.category.findFirst({
            where: {
                workspaceId: workspace.id,
                ownerUserId: userId,
                normalizedName,
                deletedAt: null,
            },
        });

        if (existente) return { error: "Ya existe una categoría personal con ese nombre." };

        const categoria = await prisma.category.create({
            data: {
                workspaceId: workspace.id,
                ownerUserId: userId,
                name: name.trim(),
                normalizedName,
                icon,
                color,
                type,
            },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "create",
                entity: "category",
                entityId: categoria.id,
                after: { name, icon, color, type },
            },
        });

        revalidatePath("/dashboard/categories");
        return { success: true, categoria };
    } catch (error) {
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        return { error: "Error al crear la categoría." };
    }
}

/**
 * Actualizar una categoría.
 */
export async function actualizarCategoria(id: string, formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "categories:update:user",
            key: userId,
            limit: 30,
            windowMs: 60_000,
        });

        const name = formData.get("name") as string;
        const icon = formData.get("icon") as string;
        const color = formData.get("color") as string;
        const type = formData.get("type") as string;

        if (!name || name.trim().length === 0) {
            return { error: "El nombre es obligatorio." };
        }

        const normalizedName = normalizeCategoryName(name);

        const categoria = await prisma.category.findFirst({
            where: {
                id,
                workspaceId: workspace.id,
                ownerUserId: userId,
                deletedAt: null,
            },
        });

        if (!categoria) return { error: "Categoría no encontrada o no editable." };

        const existente = await prisma.category.findFirst({
            where: {
                workspaceId: workspace.id,
                ownerUserId: userId,
                normalizedName,
                deletedAt: null,
                NOT: { id },
            },
        });

        if (existente) return { error: "Ya existe una categoría personal con ese nombre." };

        const updated = await prisma.category.updateMany({
            where: {
                id,
                workspaceId: workspace.id,
                ownerUserId: userId,
                deletedAt: null,
            },
            data: { name: name.trim(), normalizedName, icon, color, type },
        });

        if (updated.count === 0) {
            return { error: "Categoría no encontrada o sin permisos." };
        }

        const actualizada = await prisma.category.findFirst({
            where: {
                id,
                workspaceId: workspace.id,
                ownerUserId: userId,
                deletedAt: null,
            },
        });

        if (!actualizada) {
            return { error: "Categoría no encontrada tras actualizar." };
        }

        revalidatePath("/dashboard/categories");
        return { success: true, categoria: actualizada };
    } catch (error) {
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        return { error: "Error al actualizar la categoría." };
    }
}

/**
 * Eliminar una categoría (soft delete).
 */
export async function eliminarCategoria(id: string) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "categories:delete:user",
            key: userId,
            limit: 10,
            windowMs: 60_000,
        });

        const categoria = await prisma.category.findFirst({
            where: {
                id,
                workspaceId: workspace.id,
                ownerUserId: userId,
                deletedAt: null,
            },
        });

        if (!categoria) return { error: "Categoría no encontrada o no editable." };

        // Verificar si tiene transacciones
        const txCount = await prisma.transaction.count({
            where: { categoryId: id, deletedAt: null },
        });

        if (txCount > 0) {
            return { error: `No se puede eliminar: tiene ${txCount} transacciones asociadas.` };
        }

        const deleted = await prisma.category.updateMany({
            where: {
                id,
                workspaceId: workspace.id,
                ownerUserId: userId,
                deletedAt: null,
            },
            data: { deletedAt: new Date(), deletedBy: userId },
        });

        if (deleted.count === 0) {
            return { error: "Categoría no encontrada o sin permisos." };
        }

        revalidatePath("/dashboard/categories");
        return { success: true };
    } catch (error) {
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        return { error: "Error al eliminar la categoría." };
    }
}

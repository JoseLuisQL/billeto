"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Server Actions para Categorías.
 * CRUD completo con validación de workspace y auditoría.
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
 * Listar categorías activas del workspace.
 */
export async function listarCategorias() {
    try {
        const { workspace } = await obtenerWorkspace();

        const categorias = await prisma.category.findMany({
            where: { workspaceId: workspace.id, deletedAt: null },
            orderBy: [{ type: "asc" }, { name: "asc" }],
        });

        return { categorias };
    } catch (error) {
        return { error: "Error al obtener categorías", categorias: [] };
    }
}

/**
 * Crear una nueva categoría.
 */
export async function crearCategoria(formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace();

        const name = formData.get("name") as string;
        const icon = (formData.get("icon") as string) || "📁";
        const color = (formData.get("color") as string) || "#71717A";
        const type = (formData.get("type") as string) || "expense";

        if (!name || name.trim().length === 0) {
            return { error: "El nombre es obligatorio." };
        }

        const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const existente = await prisma.category.findFirst({
            where: { workspaceId: workspace.id, normalizedName, deletedAt: null },
        });

        if (existente) return { error: "Ya existe una categoría con ese nombre." };

        const categoria = await prisma.category.create({
            data: {
                workspaceId: workspace.id,
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
        return { error: "Error al crear la categoría." };
    }
}

/**
 * Actualizar una categoría.
 */
export async function actualizarCategoria(id: string, formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace();

        const name = formData.get("name") as string;
        const icon = formData.get("icon") as string;
        const color = formData.get("color") as string;
        const type = formData.get("type") as string;

        if (!name || name.trim().length === 0) {
            return { error: "El nombre es obligatorio." };
        }

        const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const categoria = await prisma.category.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!categoria) return { error: "Categoría no encontrada." };

        const existente = await prisma.category.findFirst({
            where: {
                workspaceId: workspace.id,
                normalizedName,
                deletedAt: null,
                NOT: { id },
            },
        });

        if (existente) return { error: "Ya existe una categoría con ese nombre." };

        const updated = await prisma.category.updateMany({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            data: { name: name.trim(), normalizedName, icon, color, type },
        });

        if (updated.count === 0) {
            return { error: "Categoría no encontrada o sin permisos." };
        }

        const actualizada = await prisma.category.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!actualizada) {
            return { error: "Categoría no encontrada tras actualizar." };
        }

        revalidatePath("/dashboard/categories");
        return { success: true, categoria: actualizada };
    } catch (error) {
        return { error: "Error al actualizar la categoría." };
    }
}

/**
 * Eliminar una categoría (soft delete).
 */
export async function eliminarCategoria(id: string) {
    try {
        const { workspace, userId } = await obtenerWorkspace();

        const categoria = await prisma.category.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!categoria) return { error: "Categoría no encontrada." };

        // Verificar si tiene transacciones
        const txCount = await prisma.transaction.count({
            where: { categoryId: id, deletedAt: null },
        });

        if (txCount > 0) {
            return { error: `No se puede eliminar: tiene ${txCount} transacciones asociadas.` };
        }

        const deleted = await prisma.category.updateMany({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            data: { deletedAt: new Date(), deletedBy: userId },
        });

        if (deleted.count === 0) {
            return { error: "Categoría no encontrada o sin permisos." };
        }

        revalidatePath("/dashboard/categories");
        return { success: true };
    } catch (error) {
        return { error: "Error al eliminar la categoría." };
    }
}

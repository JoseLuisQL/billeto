"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Server Actions para Cuentas Financieras.
 * Todas las operaciones validan sesión y workspace del usuario.
 */

/**
 * Obtener el workspace del usuario autenticado.
 * Helper compartido entre todas las acciones.
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
 * Listar todas las cuentas activas del workspace.
 */
export async function listarCuentas() {
    try {
        const { workspace } = await obtenerWorkspace();

        const cuentas = await prisma.account.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
            },
            orderBy: { createdAt: "asc" },
        });

        return {
            cuentas: cuentas.map((c: any) => ({
                ...c,
                initialBalance: Number(c.initialBalance),
                currentBalance: Number(c.currentBalance),
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
                deletedAt: c.deletedAt?.toISOString() || null,
            })),
        };
    } catch (error) {
        return { error: "Error al obtener cuentas", cuentas: [] };
    }
}

/**
 * Crear una nueva cuenta financiera.
 */
export async function crearCuenta(formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace();

        const name = formData.get("name") as string;
        const type = (formData.get("type") as string) || "cash";
        const currency = (formData.get("currency") as string) || workspace.baseCurrency;
        const initialBalance = parseFloat((formData.get("initialBalance") as string) || "0");

        if (!name || name.trim().length === 0) {
            return { error: "El nombre es obligatorio." };
        }

        const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Verificar nombre único en el workspace
        const existente = await prisma.account.findFirst({
            where: { workspaceId: workspace.id, normalizedName, deletedAt: null },
        });

        if (existente) {
            return { error: "Ya existe una cuenta con ese nombre." };
        }

        const cuenta = await prisma.account.create({
            data: {
                workspaceId: workspace.id,
                name: name.trim(),
                normalizedName,
                type,
                currency,
                initialBalance,
                currentBalance: initialBalance,
            },
        });

        // Auditoría
        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "create",
                entity: "account",
                entityId: cuenta.id,
                after: { name, type, currency, initialBalance },
            },
        });

        revalidatePath("/dashboard/accounts");
        revalidatePath("/dashboard");
        return { success: true, cuenta };
    } catch (error) {
        return { error: "Error al crear la cuenta." };
    }
}

/**
 * Actualizar una cuenta existente.
 */
export async function actualizarCuenta(id: string, formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace();

        const name = formData.get("name") as string;
        const type = formData.get("type") as string;
        const currency = formData.get("currency") as string;

        if (!name || name.trim().length === 0) {
            return { error: "El nombre es obligatorio." };
        }

        const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Verificar que la cuenta pertenece al workspace
        const cuenta = await prisma.account.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!cuenta) return { error: "Cuenta no encontrada." };

        // Verificar nombre único (excluyendo la cuenta actual)
        const existente = await prisma.account.findFirst({
            where: {
                workspaceId: workspace.id,
                normalizedName,
                deletedAt: null,
                NOT: { id },
            },
        });

        if (existente) return { error: "Ya existe una cuenta con ese nombre." };

        const before = { name: cuenta.name, type: cuenta.type, currency: cuenta.currency };

        const actualizada = await prisma.account.update({
            where: { id },
            data: { name: name.trim(), normalizedName, type, currency },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "update",
                entity: "account",
                entityId: id,
                before,
                after: { name, type, currency },
            },
        });

        revalidatePath("/dashboard/accounts");
        return { success: true, cuenta: actualizada };
    } catch (error) {
        return { error: "Error al actualizar la cuenta." };
    }
}

/**
 * Eliminar una cuenta (soft delete).
 */
export async function eliminarCuenta(id: string) {
    try {
        const { workspace, userId } = await obtenerWorkspace();

        const cuenta = await prisma.account.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!cuenta) return { error: "Cuenta no encontrada." };

        // Verificar que no tenga transacciones
        const txCount = await prisma.transaction.count({
            where: { accountId: id, deletedAt: null },
        });

        if (txCount > 0) {
            return { error: `No se puede eliminar: tiene ${txCount} transacciones asociadas.` };
        }

        await prisma.account.update({
            where: { id },
            data: { deletedAt: new Date(), deletedBy: userId },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "delete",
                entity: "account",
                entityId: id,
                before: { name: cuenta.name },
            },
        });

        revalidatePath("/dashboard/accounts");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { error: "Error al eliminar la cuenta." };
    }
}

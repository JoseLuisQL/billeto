"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";

/**
 * Server Actions para Cuentas Financieras.
 * Todas las operaciones validan sesión y workspace del usuario.
 */

/**
 * Obtener el workspace del usuario autenticado.
 * Helper compartido entre todas las acciones.
 */
async function obtenerWorkspace(minRole: "owner" | "admin" | "member" = "member") {
    return requireWorkspaceAccess(minRole);
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
            cuentas: cuentas.map((c) => ({
                ...c,
                initialBalance: Number(c.initialBalance),
                currentBalance: Number(c.currentBalance),
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
                deletedAt: c.deletedAt?.toISOString() || null,
            })),
        };
    } catch {
        return { error: "Error al obtener cuentas", cuentas: [] };
    }
}

/**
 * Crear una nueva cuenta financiera.
 */
export async function crearCuenta(formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "accounts:create:user",
            key: userId,
            limit: 15,
            windowMs: 60_000,
        });

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
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        return { error: "Error al crear la cuenta." };
    }
}

/**
 * Actualizar una cuenta existente.
 */
export async function actualizarCuenta(id: string, formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "accounts:update:user",
            key: userId,
            limit: 30,
            windowMs: 60_000,
        });

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

        const updated = await prisma.account.updateMany({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            data: { name: name.trim(), normalizedName, type, currency },
        });

        if (updated.count === 0) {
            return { error: "Cuenta no encontrada o sin permisos." };
        }

        const actualizada = await prisma.account.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!actualizada) {
            return { error: "Cuenta no encontrada tras actualizar." };
        }

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
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        return { error: "Error al actualizar la cuenta." };
    }
}

/**
 * Eliminar una cuenta (soft delete).
 */
export async function eliminarCuenta(id: string) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "accounts:delete:user",
            key: userId,
            limit: 10,
            windowMs: 60_000,
        });

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

        const deleted = await prisma.account.updateMany({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            data: { deletedAt: new Date(), deletedBy: userId },
        });

        if (deleted.count === 0) {
            return { error: "Cuenta no encontrada o sin permisos." };
        }

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
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        return { error: "Error al eliminar la cuenta." };
    }
}

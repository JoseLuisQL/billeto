"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Account } from "@prisma/client";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";

async function obtenerWorkspace(minRole: "owner" | "admin" | "member" = "member") {
    return requireWorkspaceAccess(minRole);
}

function normalizarNombre(value: string) {
    return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function serializarCuenta(c: Account) {
    return {
        id: c.id,
        workspaceId: c.workspaceId,
        name: c.name,
        normalizedName: c.normalizedName,
        type: c.type,
        icon: c.icon,
        accountNumber: c.accountNumber,
        currency: c.currency,
        initialBalance: Number(c.initialBalance),
        currentBalance: Number(c.currentBalance),
        isFavorite: c.isFavorite,
        favoriteRank: c.favoriteRank,
        deletedAt: c.deletedAt?.toISOString() ?? null,
        deletedBy: c.deletedBy,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    };
}

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

        const sorted = [...cuentas].sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
            if (a.isFavorite && b.isFavorite) {
                const aRank = a.favoriteRank ?? Number.MAX_SAFE_INTEGER;
                const bRank = b.favoriteRank ?? Number.MAX_SAFE_INTEGER;
                if (aRank !== bRank) return aRank - bRank;
            }
            return a.createdAt.getTime() - b.createdAt.getTime();
        });

        return {
            cuentas: sorted.map((c) => ({
                id: c.id,
                name: c.name,
                normalizedName: c.normalizedName,
                type: c.type,
                icon: c.icon,
                accountNumber: c.accountNumber,
                currency: c.currency,
                initialBalance: Number(c.initialBalance),
                currentBalance: Number(c.currentBalance),
                balance: Number(c.currentBalance),
                isFavorite: c.isFavorite,
                favoriteRank: c.favoriteRank,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
            })),
        };
    } catch {
        return { error: "Error al obtener cuentas", cuentas: [] };
    }
}

export async function obtenerHistorialCuenta(accountId: string, opciones?: { page?: number; pageSize?: number }) {
    try {
        const { workspace } = await obtenerWorkspace("member");
        const page = opciones?.page ?? 1;
        const pageSize = opciones?.pageSize ?? 20;

        const cuenta = await prisma.account.findFirst({
            where: { id: accountId, workspaceId: workspace.id, deletedAt: null },
            select: { id: true },
        });

        if (!cuenta) return { error: "Cuenta no encontrada.", transacciones: [], total: 0, totalPages: 0, page, pageSize };

        const where = {
            workspaceId: workspace.id,
            deletedAt: null,
            accountId,
        };

        const [transacciones, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    account: { select: { id: true, name: true, currency: true } },
                    category: { select: { id: true, name: true, icon: true } },
                },
                orderBy: [{ date: "desc" }, { createdAt: "desc" }],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.transaction.count({ where }),
        ]);

        return {
            transacciones: transacciones.map((tx) => ({
                ...tx,
                amountOriginal: Number(tx.amountOriginal),
                amountBase: Number(tx.amountBase),
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    } catch {
        return { error: "Error al cargar historial", transacciones: [], total: 0, totalPages: 0, page: 1, pageSize: 20 };
    }
}

export async function crearCuenta(formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "accounts:create:user",
            key: userId,
            limit: 15,
            windowMs: 60_000,
        });

        const name = (formData.get("name") as string)?.trim();
        const type = ((formData.get("type") as string) || "cash").trim();
        const icon = ((formData.get("icon") as string) || "💰").trim();
        const accountNumber = ((formData.get("accountNumber") as string) || "").trim() || null;
        const currency = ((formData.get("currency") as string) || workspace.baseCurrency).trim();
        const initialBalance = Number.parseFloat((formData.get("initialBalance") as string) || "0");
        const createInitialTransaction = formData.get("createTransaction") === "on";

        if (!name) return { error: "El nombre es obligatorio." };
        if (!Number.isFinite(initialBalance) || initialBalance < 0) return { error: "El balance inicial no es válido." };

        const normalizedName = normalizarNombre(name);

        const existente = await prisma.account.findFirst({
            where: { workspaceId: workspace.id, normalizedName, deletedAt: null },
            select: { id: true },
        });

        if (existente) return { error: "Ya existe una cuenta con ese nombre." };

        const cuenta = await prisma.$transaction(async (tx) => {
            const creada = await tx.account.create({
                data: {
                    workspaceId: workspace.id,
                    name,
                    normalizedName,
                    type,
                    icon,
                    accountNumber,
                    currency,
                    initialBalance,
                    currentBalance: initialBalance,
                },
            });

            if (createInitialTransaction && initialBalance > 0) {
                await tx.transaction.create({
                    data: {
                        workspaceId: workspace.id,
                        accountId: creada.id,
                        amountOriginal: initialBalance,
                        currencyOriginal: currency,
                        amountBase: initialBalance,
                        baseCurrency: workspace.baseCurrency,
                        description: "Balance inicial",
                        type: "income",
                        source: "initial_balance",
                        date: new Date(),
                    },
                });
            }

            await tx.auditLog.create({
                data: {
                    workspaceId: workspace.id,
                    actorId: userId,
                    action: "create",
                    entity: "account",
                    entityId: creada.id,
                    after: { name, type, icon, accountNumber, currency, initialBalance, createInitialTransaction },
                },
            });

            return creada;
        });

        revalidatePath("/accounts");
        revalidatePath("/dashboard");
        revalidatePath("/transactions");
        return { success: true, cuenta: serializarCuenta(cuenta) };
    } catch (error) {
        if (isRateLimitError(error)) return { error: error.message };
        const message = error instanceof Error ? error.message : "Error al crear la cuenta.";
        console.error("crearCuenta error:", error);
        return { error: message || "Error al crear la cuenta." };
    }
}

export async function actualizarCuenta(id: string, formData: FormData) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "accounts:update:user",
            key: userId,
            limit: 30,
            windowMs: 60_000,
        });

        const name = (formData.get("name") as string)?.trim();
        const type = ((formData.get("type") as string) || "cash").trim();
        const icon = ((formData.get("icon") as string) || "💰").trim();
        const accountNumber = ((formData.get("accountNumber") as string) || "").trim() || null;
        const currency = ((formData.get("currency") as string) || workspace.baseCurrency).trim();
        const currentBalanceRaw = formData.get("currentBalance") as string | null;

        if (!name) return { error: "El nombre es obligatorio." };

        const normalizedName = normalizarNombre(name);

        const cuenta = await prisma.account.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!cuenta) return { error: "Cuenta no encontrada." };

        const currentBalance = currentBalanceRaw != null
            ? Number.parseFloat(currentBalanceRaw)
            : Number(cuenta.currentBalance);

        if (!Number.isFinite(currentBalance)) return { error: "El balance no es válido." };

        const existente = await prisma.account.findFirst({
            where: {
                workspaceId: workspace.id,
                normalizedName,
                deletedAt: null,
                NOT: { id },
            },
            select: { id: true },
        });

        if (existente) return { error: "Ya existe una cuenta con ese nombre." };

        const updated = await prisma.account.update({
            where: { id },
            data: { name, normalizedName, type, icon, accountNumber, currency, currentBalance },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "update",
                entity: "account",
                entityId: id,
                before: {
                    name: cuenta.name,
                    type: cuenta.type,
                    icon: cuenta.icon,
                    accountNumber: cuenta.accountNumber,
                    currency: cuenta.currency,
                    currentBalance: Number(cuenta.currentBalance),
                },
                after: { name, type, icon, accountNumber, currency, currentBalance },
            },
        });

        revalidatePath("/accounts");
        revalidatePath("/dashboard");
        return { success: true, cuenta: serializarCuenta(updated) };
    } catch (error) {
        if (isRateLimitError(error)) return { error: error.message };
        return { error: "Error al actualizar la cuenta." };
    }
}

export async function editarCuenta(id: string, formData: FormData) {
    return actualizarCuenta(id, formData);
}

export async function marcarCuentaFavorita(id: string, isFavorite: boolean) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "accounts:favorite:user",
            key: userId,
            limit: 40,
            windowMs: 60_000,
        });

        const cuenta = await prisma.account.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            select: { id: true, isFavorite: true, favoriteRank: true },
        });

        if (!cuenta) return { error: "Cuenta no encontrada." };

        let rank: number | null = null;

        if (isFavorite) {
            if (cuenta.favoriteRank != null) {
                rank = cuenta.favoriteRank;
            } else {
                const maxRank = await prisma.account.aggregate({
                    where: { workspaceId: workspace.id, deletedAt: null, isFavorite: true },
                    _max: { favoriteRank: true },
                });
                rank = (maxRank._max.favoriteRank ?? 0) + 1;
            }
        }

        await prisma.account.update({
            where: { id },
            data: {
                isFavorite,
                favoriteRank: isFavorite ? rank : null,
            },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "update",
                entity: "account",
                entityId: id,
                after: { isFavorite, favoriteRank: rank },
            },
        });

        revalidatePath("/accounts");
        return { success: true };
    } catch (error) {
        if (isRateLimitError(error)) return { error: error.message };
        return { error: "Error al actualizar favorito." };
    }
}

export async function reordenarFavoritos(accountIdsOrdered: string[]) {
    try {
        const { workspace, userId } = await obtenerWorkspace("member");
        if (!Array.isArray(accountIdsOrdered) || accountIdsOrdered.length === 0) {
            return { error: "No se recibió un orden válido." };
        }

        await prisma.$transaction(async (tx) => {
            for (let index = 0; index < accountIdsOrdered.length; index += 1) {
                await tx.account.updateMany({
                    where: {
                        id: accountIdsOrdered[index],
                        workspaceId: workspace.id,
                        deletedAt: null,
                        isFavorite: true,
                    },
                    data: { favoriteRank: index + 1 },
                });
            }

            await tx.auditLog.create({
                data: {
                    workspaceId: workspace.id,
                    actorId: userId,
                    action: "update",
                    entity: "account",
                    entityId: accountIdsOrdered[0],
                    after: { favoriteOrder: accountIdsOrdered },
                },
            });
        });

        revalidatePath("/accounts");
        return { success: true };
    } catch {
        return { error: "Error al reordenar favoritos." };
    }
}

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

        const txCount = await prisma.transaction.count({
            where: { accountId: id, deletedAt: null },
        });

        if (txCount > 0) {
            return { error: `No se puede eliminar: tiene ${txCount} transacciones asociadas.` };
        }

        const deleted = await prisma.account.updateMany({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            data: { deletedAt: new Date(), deletedBy: userId, isFavorite: false, favoriteRank: null },
        });

        if (deleted.count === 0) return { error: "Cuenta no encontrada o sin permisos." };

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

        revalidatePath("/accounts");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        if (isRateLimitError(error)) return { error: error.message };
        return { error: "Error al eliminar la cuenta." };
    }
}

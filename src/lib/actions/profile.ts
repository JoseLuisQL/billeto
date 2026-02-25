"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Server Actions para el módulo de Perfil.
 * Maneja lectura y actualización de datos del usuario,
 * reseteo selectivo de datos y eliminación de cuenta.
 */

// ─── Helpers ───────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("No autenticado");
    }
    return session.user;
}

async function getUserWorkspace(userId: string) {
    const membership = await prisma.membership.findFirst({
        where: { userId, role: "owner" },
        include: { workspace: true },
    });
    return membership?.workspace ?? null;
}

// ─── Obtener Perfil ────────────────────────────────────────────────────

export async function obtenerPerfil() {
    try {
        const sessionUser = await getAuthenticatedUser();

        const user = await prisma.user.findUnique({
            where: { id: sessionUser.id },
        });

        if (!user) {
            return { error: "Usuario no encontrado" };
        }

        const workspace = await getUserWorkspace(user.id);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                avatar: user.avatar,
                country: (user as Record<string, unknown>).country as string | null ?? null,
                createdAt: user.createdAt.toISOString(),
                scheduledForDeletionAt: user.scheduledForDeletionAt?.toISOString() ?? null,
            },
            workspace: workspace
                ? {
                    id: workspace.id,
                    name: workspace.name,
                    country: workspace.country,
                    baseCurrency: workspace.baseCurrency,
                }
                : null,
            // Referral stats (placeholder — no referral tracking model yet)
            referralStats: {
                referidos: 0,
                actualizados: 0,
                clicks: 0,
            },
        };
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        return { error: "Error al cargar el perfil" };
    }
}

// ─── Actualizar Nombre ─────────────────────────────────────────────────

export async function actualizarNombre(name: string) {
    try {
        const sessionUser = await getAuthenticatedUser();

        if (!name || name.trim().length === 0) {
            return { error: "El nombre no puede estar vacío" };
        }

        if (name.trim().length > 50) {
            return { error: "El nombre no puede exceder 50 caracteres" };
        }

        await prisma.user.update({
            where: { id: sessionUser.id },
            data: { name: name.trim() },
        });

        await prisma.auditLog.create({
            data: {
                actorId: sessionUser.id,
                action: "update",
                entity: "user",
                entityId: sessionUser.id,
                after: { name: name.trim() },
            },
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar nombre:", error);
        return { error: "Error al actualizar el nombre" };
    }
}

// ─── Actualizar País ───────────────────────────────────────────────────

export async function actualizarPais(country: string) {
    try {
        const sessionUser = await getAuthenticatedUser();

        // Use raw SQL since the Prisma client types may be stale for the new country field
        await prisma.$executeRawUnsafe(
            `UPDATE users SET country = $1 WHERE id = $2`,
            country,
            sessionUser.id
        );

        // Also update workspace country
        const workspace = await getUserWorkspace(sessionUser.id);
        if (workspace) {
            await prisma.workspace.update({
                where: { id: workspace.id },
                data: { country },
            });
        }

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar país:", error);
        return { error: "Error al actualizar el país" };
    }
}

// ─── Actualizar Avatar ─────────────────────────────────────────────────

export async function actualizarAvatar(avatarDataUrl: string) {
    try {
        const sessionUser = await getAuthenticatedUser();

        if (!avatarDataUrl) {
            return { error: "No se proporcionó una imagen" };
        }

        // Store the base64 data URL directly (for simplicity; in production use cloud storage)
        await prisma.user.update({
            where: { id: sessionUser.id },
            data: { avatar: avatarDataUrl },
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar avatar:", error);
        return { error: "Error al actualizar el avatar" };
    }
}

// ─── Resetear Datos (Zona de Peligro) ──────────────────────────────────

export type ResetOptions = {
    transactions: boolean;
    accounts: boolean;
    budgets: boolean;
    customCategories: boolean;
    settings: boolean;
    recurringTransactions: boolean;
};

export type ResetCounts = {
    transactions?: number;
    accounts?: number;
    budgets?: number;
    customCategories?: number;
    settings?: number;
    recurringTransactions?: number;
};

export async function contarDatosParaResetear(options: ResetOptions): Promise<{ counts?: ResetCounts; error?: string }> {
    try {
        const sessionUser = await getAuthenticatedUser();
        const workspace = await getUserWorkspace(sessionUser.id);

        if (!workspace) {
            return { error: "No se encontró el workspace" };
        }

        const wId = workspace.id;
        const counts: ResetCounts = {};

        if (options.transactions) {
            counts.transactions = await prisma.transaction.count({ where: { workspaceId: wId } });
        }
        if (options.accounts) {
            counts.accounts = await prisma.account.count({ where: { workspaceId: wId } });
        }
        if (options.budgets) {
            counts.budgets = await prisma.budget.count({ where: { workspaceId: wId } });
        }
        if (options.customCategories) {
            counts.customCategories = await prisma.category.count({
                where: { workspaceId: wId, ownerUserId: { not: "__SYSTEM__" } },
            });
        }
        if (options.settings) {
            counts.settings = 1; // Always 1 (workspace settings)
        }
        if (options.recurringTransactions) {
            counts.recurringTransactions = await prisma.recurringTransaction.count({ where: { workspaceId: wId } });
        }

        return { counts };
    } catch (error) {
        console.error("Error al contar datos:", error);
        return { error: "Error al calcular los datos" };
    }
}

export async function resetearDatos(options: ResetOptions) {
    try {
        const sessionUser = await getAuthenticatedUser();
        const workspace = await getUserWorkspace(sessionUser.id);

        if (!workspace) {
            return { error: "No se encontró el workspace" };
        }

        const wId = workspace.id;

        await prisma.$transaction(async (tx) => {
            // ── 1. Recurring Transactions (no FK dependents) ──
            if (options.recurringTransactions) {
                await tx.recurringTransaction.deleteMany({ where: { workspaceId: wId } });
            }

            // ── 2. Transactions (careful with FK dependents) ──
            if (options.transactions) {
                // GoalContribution references Transaction (onDelete: SetNull)
                // We manually delete the ones linked to transactions in this workspace
                await tx.goalContribution.deleteMany({
                    where: { workspaceId: wId, transactionId: { not: null } },
                });
                // Attachments have onDelete: Cascade on Transaction, so they auto-delete
                // But let's be explicit for safety
                const txIds = await tx.transaction.findMany({
                    where: { workspaceId: wId },
                    select: { id: true },
                });
                if (txIds.length > 0) {
                    await tx.attachment.deleteMany({
                        where: { transactionId: { in: txIds.map((t) => t.id) } },
                    });
                }
                await tx.transaction.deleteMany({ where: { workspaceId: wId } });
            }

            // ── 3. Budgets (references Category via nullable FK) ──
            if (options.budgets) {
                await tx.budget.deleteMany({ where: { workspaceId: wId } });
            }

            // ── 4. Accounts (referenced by Transaction.accountId, nullable) ──
            if (options.accounts) {
                if (!options.transactions) {
                    // Nullify accountId on remaining transactions to avoid FK issues
                    await tx.transaction.updateMany({
                        where: { workspaceId: wId },
                        data: { accountId: null },
                    });
                }
                await tx.account.deleteMany({ where: { workspaceId: wId } });
            }

            // ── 5. Custom Categories (referenced by Transaction.categoryId & Budget.categoryId) ──
            if (options.customCategories) {
                // Get IDs of custom categories to clean up FK references
                const customCatIds = await tx.category.findMany({
                    where: {
                        workspaceId: wId,
                        ownerUserId: { not: "__SYSTEM__" },
                    },
                    select: { id: true },
                });
                const catIds = customCatIds.map((c) => c.id);

                if (catIds.length > 0) {
                    // Nullify categoryId on transactions referencing these categories
                    if (!options.transactions) {
                        await tx.transaction.updateMany({
                            where: { workspaceId: wId, categoryId: { in: catIds } },
                            data: { categoryId: null },
                        });
                    }
                    // Delete budgets referencing these categories
                    if (!options.budgets) {
                        await tx.budget.deleteMany({
                            where: { workspaceId: wId, categoryId: { in: catIds } },
                        });
                    }
                    // Now safe to delete the categories
                    await tx.category.deleteMany({
                        where: {
                            workspaceId: wId,
                            ownerUserId: { not: "__SYSTEM__" },
                        },
                    });
                }
            }

            // ── 6. Settings (reset workspace defaults) ──
            if (options.settings) {
                await tx.workspace.update({
                    where: { id: wId },
                    data: {
                        baseCurrency: "PEN",
                        country: "PE",
                        timezone: "America/Lima",
                    },
                });
            }

            // ── Audit log ──
            await tx.auditLog.create({
                data: {
                    workspaceId: wId,
                    actorId: sessionUser.id,
                    action: "reset_data",
                    entity: "workspace",
                    entityId: wId,
                    after: JSON.parse(JSON.stringify(options)),
                },
            });
        });

        revalidatePath("/profile");
        revalidatePath("/dashboard");
        revalidatePath("/transactions");
        revalidatePath("/accounts");
        return { success: true };
    } catch (error) {
        console.error("Error al resetear datos:", error);
        return { error: "Error al resetear los datos" };
    }
}

// ─── Eliminar Cuenta (con período de gracia de 5 días) ─────────────────

export async function eliminarCuenta() {
    try {
        const sessionUser = await getAuthenticatedUser();

        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 5);

        await prisma.user.update({
            where: { id: sessionUser.id },
            data: { scheduledForDeletionAt: scheduledDate },
        });

        await prisma.auditLog.create({
            data: {
                actorId: sessionUser.id,
                action: "schedule_deletion",
                entity: "user",
                entityId: sessionUser.id,
                after: { scheduledForDeletionAt: scheduledDate.toISOString() },
            },
        });

        revalidatePath("/profile");
        return { success: true, scheduledDate: scheduledDate.toISOString() };
    } catch (error) {
        console.error("Error al programar eliminación:", error);
        return { error: "Error al programar la eliminación de la cuenta" };
    }
}

// ─── Cancelar Eliminación ──────────────────────────────────────────────

export async function cancelarEliminacion() {
    try {
        const sessionUser = await getAuthenticatedUser();

        await prisma.user.update({
            where: { id: sessionUser.id },
            data: { scheduledForDeletionAt: null },
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Error al cancelar eliminación:", error);
        return { error: "Error al cancelar la eliminación" };
    }
}

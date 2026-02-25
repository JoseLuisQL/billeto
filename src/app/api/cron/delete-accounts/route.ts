import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * CRON: Elimina cuentas programadas para eliminación cuya fecha de gracia ya expiró.
 * 
 * Estrategia de eliminación:
 * 1. Buscar usuarios con scheduledForDeletionAt <= ahora
 * 2. Para cada usuario:
 *    a. Obtener sus workspaces (via memberships)
 *    b. Eliminar audit logs del usuario (no tienen cascade)
 *    c. Eliminar workspaces (cascadea a: accounts, transactions, attachments,
 *       categories, budgets, goals, goal_contributions, rules, 
 *       recurring_transactions, integrations, whatsapp_messages, subscriptions)
 *    d. Eliminar el usuario (cascadea a: auth_accounts, sessions, memberships)
 * 
 * Protección: requiere CRON_SECRET en el header Authorization.
 * Frecuencia recomendada: 1 vez al día.
 */
export async function GET(request: Request) {
    try {
        // ── Verificar secreto CRON ──────────────────────────────────────
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error("[CRON delete-accounts] CRON_SECRET not configured");
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── Buscar usuarios programados para eliminación ────────────────
        const now = new Date();
        const usersToDelete = await prisma.user.findMany({
            where: {
                scheduledForDeletionAt: {
                    lte: now,
                },
            },
            select: {
                id: true,
                email: true,
                name: true,
                scheduledForDeletionAt: true,
                memberships: {
                    select: {
                        workspaceId: true,
                    },
                },
            },
        });

        if (usersToDelete.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No accounts to delete",
                deletedCount: 0,
                timestamp: now.toISOString(),
            });
        }

        const results: Array<{
            userId: string;
            email: string;
            status: "deleted" | "error";
            error?: string;
        }> = [];

        // ── Procesar cada usuario ───────────────────────────────────────
        for (const user of usersToDelete) {
            try {
                const workspaceIds = user.memberships.map((m) => m.workspaceId);

                await prisma.$transaction(async (tx) => {
                    // 1. Eliminar audit logs del usuario (no tienen onDelete: Cascade en el User)
                    await tx.auditLog.deleteMany({
                        where: { actorId: user.id },
                    });

                    // 2. Eliminar audit logs de los workspaces del usuario
                    if (workspaceIds.length > 0) {
                        await tx.auditLog.deleteMany({
                            where: { workspaceId: { in: workspaceIds } },
                        });
                    }

                    // 3. Eliminar los workspaces del usuario
                    //    Esto cascadea automáticamente a todos los datos del workspace:
                    //    accounts, transactions, attachments, categories, budgets, goals,
                    //    goal_contributions, rules, recurring_transactions, integrations,
                    //    whatsapp_messages, subscriptions, memberships
                    if (workspaceIds.length > 0) {
                        await tx.workspace.deleteMany({
                            where: { id: { in: workspaceIds } },
                        });
                    }

                    // 4. Eliminar el usuario
                    //    Esto cascadea a: auth_accounts, sessions, memberships (ya borrados)
                    await tx.user.delete({
                        where: { id: user.id },
                    });
                });

                console.log(`[CRON delete-accounts] ✅ Deleted user: ${user.email} (${user.id})`);
                results.push({ userId: user.id, email: user.email, status: "deleted" });
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                console.error(`[CRON delete-accounts] ❌ Error deleting user ${user.email}:`, message);
                results.push({ userId: user.id, email: user.email, status: "error", error: message });
            }
        }

        const deletedCount = results.filter((r) => r.status === "deleted").length;
        const errorCount = results.filter((r) => r.status === "error").length;

        return NextResponse.json({
            success: errorCount === 0,
            message: `Processed ${usersToDelete.length} accounts: ${deletedCount} deleted, ${errorCount} errors`,
            deletedCount,
            errorCount,
            results,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error("[CRON delete-accounts] Fatal error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

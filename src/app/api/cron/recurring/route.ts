import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint para ejecutar transacciones recurrentes vencidas.
 * Protegido por CRON_SECRET usando Authorization Bearer.
 *
 * Requerido: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : null;
    const cronSecret = process.env.CRON_SECRET;

    // Validar secreto (si está configurado)
    if (cronSecret && bearerToken !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const ahora = new Date();

        // Buscar todas las recurrentes vencidas de todos los workspaces
        const pendientes = await prisma.recurringTransaction.findMany({
            where: {
                status: "active",
                deletedAt: null,
                nextRunAt: { lte: ahora },
            },
            include: { workspace: true },
        });

        let ejecutadas = 0;
        const errores: string[] = [];

        for (const rec of pendientes) {
            const accountId = rec.accountId;
            if (!accountId) continue;

            // Check end conditions
            if (rec.endCondition === "after_count" && rec.maxOccurrences && rec.executionCount >= rec.maxOccurrences) {
                await prisma.recurringTransaction.updateMany({
                    where: { id: rec.id },
                    data: { status: "paused" },
                });
                continue;
            }
            if (rec.endCondition === "on_date" && rec.endDate && ahora >= rec.endDate) {
                await prisma.recurringTransaction.updateMany({
                    where: { id: rec.id },
                    data: { status: "paused" },
                });
                continue;
            }

            try {
                const cambioBalance =
                    rec.type === "income" ? Number(rec.amount) : -Number(rec.amount);

                // Calcular siguiente fecha
                let nextRun: Date;
                if (rec.dayOfMonth && rec.frequency === "monthly") {
                    nextRun = new Date(ahora);
                    nextRun.setMonth(nextRun.getMonth() + 1);
                    const maxDay = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
                    nextRun.setDate(Math.min(rec.dayOfMonth, maxDay));
                } else {
                    nextRun = calcularSiguiente(ahora, rec.frequency);
                }

                await prisma.$transaction(async (tx) => {
                    await tx.transaction.create({
                        data: {
                            workspaceId: rec.workspaceId,
                            accountId,
                            categoryId: rec.categoryId,
                            amountOriginal: rec.amount,
                            currencyOriginal: rec.currency,
                            amountBase: rec.amount,
                            baseCurrency: rec.workspace.baseCurrency,
                            description: `${rec.name} (recurrente)`,
                            type: rec.type,
                            date: ahora,
                            source: "cron",
                        },
                    });

                    const accountUpdated = await tx.account.updateMany({
                        where: { id: accountId, workspaceId: rec.workspaceId, deletedAt: null },
                        data: { currentBalance: { increment: cambioBalance } },
                    });

                    if (accountUpdated.count === 0) {
                        throw new Error("Cuenta recurrente no encontrada o sin permisos");
                    }

                    const recurringUpdated = await tx.recurringTransaction.updateMany({
                        where: { id: rec.id, workspaceId: rec.workspaceId, deletedAt: null, status: "active" },
                        data: {
                            lastRunAt: ahora,
                            nextRunAt: nextRun,
                            executionCount: { increment: 1 },
                        },
                    });

                    if (recurringUpdated.count === 0) {
                        throw new Error("Recurrente no disponible para actualización");
                    }
                });

                ejecutadas++;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Error desconocido";
                errores.push(`${rec.name}: ${message}`);
            }
        }

        return NextResponse.json({
            ok: true,
            ejecutadas,
            pendientesProcesadas: pendientes.length,
            errores: errores.length > 0 ? errores : undefined,
            timestamp: ahora.toISOString(),
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error interno";
        return NextResponse.json(
            { ok: false, error: message },
            { status: 500 }
        );
    }
}

function calcularSiguiente(desde: Date, frecuencia: string): Date {
    const next = new Date(desde);
    switch (frecuencia) {
        case "daily":
            next.setDate(next.getDate() + 1);
            break;
        case "weekly":
            next.setDate(next.getDate() + 7);
            break;
        case "biweekly":
            next.setDate(next.getDate() + 14);
            break;
        case "monthly":
            next.setMonth(next.getMonth() + 1);
            break;
        case "yearly":
            next.setFullYear(next.getFullYear() + 1);
            break;
        default:
            next.setMonth(next.getMonth() + 1);
    }
    return next;
}

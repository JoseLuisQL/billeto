import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint para ejecutar transacciones recurrentes vencidas.
 * Protegido por CRON_SECRET. Puede ser llamado por Vercel Cron o externamente.
 *
 * GET /api/cron/recurring?secret=xxx
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    // Validar secreto (si está configurado)
    if (cronSecret && secret !== cronSecret) {
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

            try {
                const cambioBalance =
                    rec.type === "income" ? Number(rec.amount) : -Number(rec.amount);

                // Calcular siguiente fecha
                const nextRun = calcularSiguiente(ahora, rec.frequency);

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
                        data: { lastRunAt: ahora, nextRunAt: nextRun },
                    });

                    if (recurringUpdated.count === 0) {
                        throw new Error("Recurrente no disponible para actualización");
                    }
                });

                ejecutadas++;
            } catch (err: any) {
                errores.push(`${rec.name}: ${err.message}`);
            }
        }

        return NextResponse.json({
            ok: true,
            ejecutadas,
            pendientesProcesadas: pendientes.length,
            errores: errores.length > 0 ? errores : undefined,
            timestamp: ahora.toISOString(),
        });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err.message },
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

import { z } from "zod";
import { type InferSchema } from "xmcp";
import { prisma } from "@/lib/prisma";

export const schema = {
    range: z
        .enum(["current_month", "last_month", "current_year"])
        .default("current_month")
        .describe("Rango temporal para el resumen"),
};

export const metadata = {
    name: "analytics_summary",
    description: "Obtener resumen financiero (ingresos, gastos, balance neto) de un período. Responde preguntas como '¿cuánto gasté este mes?' o '¿cómo van mis finanzas?'.",
    annotations: {
        title: "Resumen financiero",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
    },
};

function getDateRange(range: string): { from: Date; to: Date } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    switch (range) {
        case "last_month":
            return {
                from: new Date(year, month - 1, 1),
                to: new Date(year, month, 0, 23, 59, 59),
            };
        case "current_year":
            return {
                from: new Date(year, 0, 1),
                to: now,
            };
        default: // current_month
            return {
                from: new Date(year, month, 1),
                to: now,
            };
    }
}

export default async function analyticsSummary(
    args: InferSchema<typeof schema>,
    context: { workspaceId: string }
) {
    const { from, to } = getDateRange(args.range);

    const txs = await prisma.transaction.findMany({
        where: {
            workspaceId: context.workspaceId,
            deletedAt: null,
            date: { gte: from, lte: to },
        },
        select: { type: true, amountBase: true },
    });

    let ingresos = 0;
    let gastos = 0;
    let countIngresos = 0;
    let countGastos = 0;

    for (const t of txs) {
        const amt = Number(t.amountBase);
        if (t.type === "income") {
            ingresos += amt;
            countIngresos++;
        } else {
            gastos += amt;
            countGastos++;
        }
    }

    const balance = ingresos - gastos;
    const rangeLabel =
        args.range === "current_month"
            ? "este mes"
            : args.range === "last_month"
                ? "el mes pasado"
                : "este año";

    return `📊 Resumen financiero (${rangeLabel}):
💰 Ingresos: S/ ${ingresos.toFixed(2)} (${countIngresos} transacciones)
💸 Gastos: S/ ${gastos.toFixed(2)} (${countGastos} transacciones)
📈 Balance neto: S/ ${balance.toFixed(2)}
📝 Total transacciones: ${txs.length}`;
}

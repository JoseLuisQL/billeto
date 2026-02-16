import { z } from "zod";
import { type InferSchema } from "xmcp";
import { prisma } from "@/lib/prisma";

export const schema = {
    range: z
        .enum(["current_month", "last_month", "current_year"])
        .default("current_month")
        .describe("Rango temporal"),
    type: z.enum(["income", "expense"]).default("expense").describe("Tipo de transacción a analizar"),
};

export const metadata = {
    name: "analytics_by_category",
    description: "Obtener distribución de gastos o ingresos por categoría. Responde preguntas como '¿en qué gasté más este mes?' o '¿cuáles son mis principales categorías de gasto?'.",
    annotations: {
        title: "Análisis por categoría",
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
        default:
            return {
                from: new Date(year, month, 1),
                to: now,
            };
    }
}

export default async function analyticsByCategory(
    args: InferSchema<typeof schema>,
    context: { workspaceId: string }
) {
    const { from, to } = getDateRange(args.range);

    const txs = await prisma.transaction.findMany({
        where: {
            workspaceId: context.workspaceId,
            deletedAt: null,
            type: args.type,
            date: { gte: from, lte: to },
        },
        include: {
            category: { select: { name: true, icon: true } },
        },
    });

    // Agrupar por categoría
    const byCategory = new Map<string, number>();
    for (const t of txs) {
        const catName = t.category?.name || "Sin categoría";
        byCategory.set(catName, (byCategory.get(catName) || 0) + Number(t.amountBase));
    }

    if (byCategory.size === 0) {
        return `No hay ${args.type === "expense" ? "gastos" : "ingresos"} en el período seleccionado.`;
    }

    // Ordenar de mayor a menor
    const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((acc, [, v]) => acc + v, 0);

    const lines = sorted.map(([cat, amount]) => {
        const pct = ((amount / total) * 100).toFixed(1);
        return `• ${cat}: S/ ${amount.toFixed(2)} (${pct}%)`;
    });

    const typeLabel = args.type === "expense" ? "gastos" : "ingresos";
    const rangeLabel =
        args.range === "current_month" ? "este mes" : args.range === "last_month" ? "el mes pasado" : "este año";

    return `📊 Distribución de ${typeLabel} por categoría (${rangeLabel}):\n${lines.join("\n")}\n\n💰 Total: S/ ${total.toFixed(2)}`;
}

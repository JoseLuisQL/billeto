import { z } from "zod";
import { type InferSchema } from "xmcp";
import { prisma } from "@/lib/prisma";

export const schema = {
    date_from: z.string().optional().describe("Fecha inicio (ISO 8601)"),
    date_to: z.string().optional().describe("Fecha fin (ISO 8601)"),
    type: z.enum(["income", "expense"]).optional().describe("Filtrar por tipo"),
    category_id: z.string().optional().describe("Filtrar por categoría"),
    account_id: z.string().optional().describe("Filtrar por cuenta"),
    limit: z.number().default(20).describe("Número máximo de resultados"),
};

export const metadata = {
    name: "transactions_list",
    description: "Listar transacciones financieras con filtros opcionales. Útil para consultas como '¿cuáles fueron mis últimos gastos?' o 'mostrame las transacciones de esta semana'.",
    annotations: {
        title: "Listar transacciones",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
    },
};

export default async function transactionsList(
    args: InferSchema<typeof schema>,
    context: { workspaceId: string }
) {
    const where: Record<string, unknown> = {
        workspaceId: context.workspaceId,
        deletedAt: null,
    };

    if (args.type) where.type = args.type;
    if (args.category_id) where.categoryId = args.category_id;
    if (args.account_id) where.accountId = args.account_id;

    if (args.date_from || args.date_to) {
        where.date = {};
        if (args.date_from) (where.date as Record<string, unknown>).gte = new Date(args.date_from);
        if (args.date_to) (where.date as Record<string, unknown>).lte = new Date(args.date_to);
    }

    const txs = await prisma.transaction.findMany({
        where,
        include: {
            account: { select: { name: true } },
            category: { select: { name: true } },
        },
        orderBy: { date: "desc" },
        take: Math.min(args.limit, 50),
    });

    if (txs.length === 0) return "No se encontraron transacciones con esos filtros.";

    const lines = txs.map((t) => {
        const emoji = t.type === "income" ? "💰" : "💸";
        const cat = t.category?.name || "Sin categoría";
        return `${emoji} ${t.date.toLocaleDateString("es-PE")} | ${t.description} | S/ ${Number(t.amountOriginal).toFixed(2)} | ${cat} | ${t.account?.name || ""}`;
    });

    return `📋 ${txs.length} transacciones:\n${lines.join("\n")}`;
}

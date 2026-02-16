import { z } from "zod";
import { type InferSchema } from "xmcp";
import { prisma } from "@/lib/prisma";

export const schema = {
    type: z.string().optional().describe("Filtrar por tipo de cuenta (cash, bank, credit_card, wallet, investment)"),
};

export const metadata = {
    name: "accounts_list",
    description: "Listar las cuentas financieras del usuario con sus balances actuales. Útil para preguntas como '¿cuánto tengo en mi cuenta?' o '¿cuáles son mis cuentas?'.",
    annotations: {
        title: "Listar cuentas",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
    },
};

export default async function accountsList(
    args: InferSchema<typeof schema>,
    context: { workspaceId: string }
) {
    const where: Record<string, unknown> = {
        workspaceId: context.workspaceId,
        deletedAt: null,
    };
    if (args.type) where.type = args.type;

    const cuentas = await prisma.account.findMany({
        where,
        orderBy: { createdAt: "asc" },
    });

    if (cuentas.length === 0) return "No hay cuentas creadas todavía.";

    const lines = cuentas.map((c) => {
        const balance = Number(c.currentBalance).toFixed(2);
        return `🏦 ${c.name} (${c.type}) — S/ ${balance} ${c.currency}`;
    });

    const total = cuentas.reduce((acc, c) => acc + Number(c.currentBalance), 0);

    return `${lines.join("\n")}\n\n💰 Balance total: S/ ${total.toFixed(2)}`;
}

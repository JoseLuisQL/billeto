import { z } from "zod";
import { type InferSchema } from "xmcp";
import { prisma } from "@/lib/prisma";
import { aplicarReglas } from "@/lib/actions/rules";

export const schema = {
    amount: z.number().positive().describe("Monto de la transacción"),
    description: z.string().describe("Descripción de la transacción"),
    type: z.enum(["income", "expense"]).default("expense").describe("Tipo: income o expense"),
    account_id: z.string().optional().describe("ID de la cuenta (si no se indica, usa la primera)"),
    category_id: z.string().optional().describe("ID de la categoría"),
    date: z.string().optional().describe("Fecha (ISO 8601). Si no se indica, usa hoy"),
    source: z.string().default("mcp").describe("Fuente: mcp, whatsapp, web"),
    request_id: z.string().optional().describe("ID idempotente para evitar duplicados"),
};

export const metadata = {
    name: "transactions_create",
    description: "Crear una nueva transacción financiera (gasto o ingreso). El usuario puede decir algo como 'gasté 50 en almuerzo' y esta herramienta lo registra.",
    annotations: {
        title: "Crear transacción",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
    },
};

export default async function transactionsCreate(
    args: InferSchema<typeof schema>,
    context: { workspaceId: string; userId: string }
) {
    const { workspaceId, userId } = context;

    // Si se proporcionó request_id, verificar idempotencia real
    if (args.request_id) {
        const existing = await prisma.transaction.findFirst({
            where: { workspaceId, requestId: args.request_id, deletedAt: null },
        });
        if (existing) {
            return `⚠️ Transacción ya registrada (request_id: ${args.request_id}). ID: ${existing.id}`;
        }
    }

    // Obtener cuenta
    let accountId = args.account_id;
    if (!accountId) {
        const defaultAccount = await prisma.account.findFirst({
            where: { workspaceId, deletedAt: null },
            orderBy: { createdAt: "asc" },
        });
        if (!defaultAccount) return "❌ No hay cuentas creadas. Creá una cuenta primero.";
        accountId = defaultAccount.id;
    }

    const cuenta = await prisma.account.findFirst({
        where: { id: accountId, workspaceId, deletedAt: null },
    });
    if (!cuenta) return "❌ Cuenta no encontrada.";

    // Auto-categorización si no se especificó categoría
    let categoryId = args.category_id || null;
    if (!categoryId && args.description) {
        const autoId = await aplicarReglas(args.description);
        if (autoId) categoryId = autoId;
    }

    const date = args.date ? new Date(args.date) : new Date();
    const cambioBalance = args.type === "income" ? args.amount : -args.amount;

    const tx = await prisma.$transaction(async (db) => {
        const transaccion = await db.transaction.create({
            data: {
                workspaceId,
                accountId: accountId!,
                categoryId,
                amountOriginal: args.amount,
                currencyOriginal: cuenta.currency,
                amountBase: args.amount,
                baseCurrency: "PEN",
                description: args.description.trim(),
                type: args.type,
                source: args.source,
                requestId: args.request_id,
                date,
            },
        });

        const accountUpdated = await db.account.updateMany({
            where: { id: accountId!, workspaceId, deletedAt: null },
            data: { currentBalance: { increment: cambioBalance } },
        });

        if (accountUpdated.count === 0) {
            throw new Error("Cuenta no encontrada o sin permisos");
        }

        await db.auditLog.create({
            data: {
                workspaceId,
                actorId: userId,
                action: "create",
                entity: "transaction",
                entityId: transaccion.id,
                after: { description: args.description, amount: args.amount, type: args.type, source: "mcp" },
            },
        });

        return transaccion;
    });

    const emoji = args.type === "income" ? "💰" : "💸";
    return `${emoji} Transacción creada: ${args.description} — S/ ${args.amount.toFixed(2)} (${args.type === "income" ? "ingreso" : "gasto"}) en cuenta "${cuenta.name}". ID: ${tx.id}`;
}

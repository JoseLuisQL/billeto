import { z } from "zod";
import { type InferSchema } from "xmcp";
import { prisma } from "@/lib/prisma";
import { aplicarReglasCompleto, applyDescriptionModification } from "@/lib/actions/rules";
import { SYSTEM_CATEGORY_OWNER_ID } from "@/lib/categories-defaults";

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
    const accountId = args.account_id;
    const cuenta = accountId
        ? await prisma.account.findFirst({
            where: { id: accountId, workspaceId, deletedAt: null },
        })
        : null;
    if (accountId && !cuenta) return "❌ Cuenta no encontrada.";

    let categoryId = args.category_id || null;
    if (categoryId) {
        const categoria = await prisma.category.findFirst({
            where: {
                id: categoryId,
                workspaceId,
                deletedAt: null,
                OR: [
                    { ownerUserId: SYSTEM_CATEGORY_OWNER_ID },
                    { ownerUserId: userId },
                ],
            },
            select: { id: true },
        });
        if (!categoria) return "❌ Categoría no válida para este usuario.";
    }

    // ── Full Rule Engine ──
    let description = args.description;
    const ruleResult = await aplicarReglasCompleto(
        { description, amount: args.amount, type: args.type, accountId },
        userId
    );

    // Apply category from rules (if no manual category)
    if (!categoryId && ruleResult.categoryId) {
        categoryId = ruleResult.categoryId;
    }

    // Apply description modification from rules
    if (ruleResult.descriptionModification) {
        description = await applyDescriptionModification(description, ruleResult.descriptionModification);
    }

    const date = args.date ? new Date(args.date) : new Date();
    const cambioBalance = args.type === "income" ? args.amount : -args.amount;

    const tx = await prisma.$transaction(async (db) => {
        const transaccion = await db.transaction.create({
            data: {
                workspaceId,
                accountId: accountId || undefined,
                categoryId,
                amountOriginal: args.amount,
                currencyOriginal: cuenta?.currency || "PEN",
                amountBase: args.amount,
                baseCurrency: "PEN",
                description: description.trim(),
                type: args.type,
                source: args.source,
                requestId: args.request_id,
                date,
            },
        });

        if (accountId) {
            const accountUpdated = await db.account.updateMany({
                where: { id: accountId, workspaceId, deletedAt: null },
                data: { currentBalance: { increment: cambioBalance } },
            });

            if (accountUpdated.count === 0) {
                throw new Error("Cuenta no encontrada o sin permisos");
            }
        }

        // Goal contributions from rules
        if (ruleResult.goalContributions.length > 0) {
            for (const gc of ruleResult.goalContributions) {
                let contributionAmount: number;
                if (gc.amountType === "percentage") {
                    contributionAmount = args.amount * (gc.amountValue / 100);
                } else {
                    contributionAmount = gc.amountValue;
                }
                contributionAmount = Number(contributionAmount.toFixed(2));

                if (contributionAmount > 0) {
                    const goal = await db.goal.findFirst({
                        where: { id: gc.goalId, workspaceId },
                        select: { id: true, currency: true, currentAmount: true, targetAmount: true, status: true },
                    });

                    if (goal) {
                        await db.goalContribution.create({
                            data: {
                                workspaceId,
                                goalId: gc.goalId,
                                transactionId: transaccion.id,
                                amount: contributionAmount,
                                currency: goal.currency,
                                amountBase: contributionAmount,
                                source: "rule",
                                note: `Regla automática: ${description}`,
                            },
                        });

                        const nextCurrent = Number(goal.currentAmount) + contributionAmount;
                        const nextStatus = nextCurrent >= Number(goal.targetAmount) ? "completed" : goal.status;

                        await db.goal.update({
                            where: { id: gc.goalId },
                            data: { currentAmount: nextCurrent, status: nextStatus },
                        });
                    }
                }
            }
        }

        await db.auditLog.create({
            data: {
                workspaceId,
                actorId: userId,
                action: "create",
                entity: "transaction",
                entityId: transaccion.id,
                after: {
                    description, amount: args.amount, type: args.type, source: "mcp",
                    rulesApplied: ruleResult.matchedRuleIds,
                },
            },
        });

        return transaccion;
    });

    const emoji = args.type === "income" ? "💰" : "💸";
    const rulesInfo = ruleResult.matchedRuleIds.length > 0
        ? ` (${ruleResult.matchedRuleIds.length} regla(s) aplicada(s))`
        : "";
    const accountLabel = cuenta?.name ? ` en cuenta "${cuenta.name}"` : " sin cuenta específica";
    return `${emoji} Transacción creada: ${description} — S/ ${args.amount.toFixed(2)} (${args.type === "income" ? "ingreso" : "gasto"})${accountLabel}${rulesInfo}. ID: ${tx.id}`;
}

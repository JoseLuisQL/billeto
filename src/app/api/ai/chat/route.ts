import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aplicarReglas } from "@/lib/actions/rules";

/**
 * AI Chat streaming endpoint.
 * Uses Vercel AI SDK v6 + Google Gemini with tool-calling
 * that mirrors the xMCP tool catalog.
 */
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
        include: { workspace: true },
    });
    if (!membership) {
        return new Response("No workspace", { status: 403 });
    }

    const workspaceId = membership.workspace.id;
    const userId = session.user.id;
    const { messages } = await req.json();

    const currentDate = new Date().toLocaleDateString("es-PE", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const systemPrompt = `Eres Billeto, un asistente financiero inteligente, profesional pero cercano.
Tu misión: ayudar al usuario a registrar gastos/ingresos, consultar balances y analizar sus finanzas.
Hablás en español (latam), sos directo y amigable. Usás emojis con moderación.

Fecha actual: ${currentDate}
Moneda base: PEN (Soles peruanos, S/)
Usuario: ${session.user.name || "Usuario"}

Instrucciones:
- Para registrar gasto/ingreso → usa la herramienta transactions_create
- Para ver transacciones → usa transactions_list
- Para consultar balance → usa accounts_list
- Para resumen mensual → usa analytics_summary
- Para desglose por categoría → usa analytics_by_category
- Para ver categorías → usa categories_list
- Si falta información esencial, PREGUNTÁ — nunca inventes valores.
- Después de crear una transacción, mostrá un resumen claro.
- Respondé siempre en español.`;

    const result = streamText({
        model: google("gemini-2.0-flash"),
        system: systemPrompt,
        messages,
        tools: {
            transactions_create: tool({
                description: "Crear una nueva transacción financiera (gasto o ingreso)",
                inputSchema: z.object({
                    amount: z.number().describe("Monto de la transacción"),
                    description: z.string().describe("Descripción"),
                    type: z.string().describe("Tipo: income o expense. Por defecto expense"),
                    category_id: z.string().optional().describe("ID de categoría"),
                    account_id: z.string().optional().describe("ID de cuenta"),
                    date: z.string().optional().describe("Fecha ISO 8601"),
                }),
                execute: async (args: { amount: number; description: string; type: string; category_id?: string; account_id?: string; date?: string }) => {
                    const type = args.type === "income" ? "income" : "expense";
                    let accountId = args.account_id;
                    if (!accountId) {
                        const defaultAcc = await prisma.account.findFirst({
                            where: { workspaceId, deletedAt: null },
                            orderBy: { createdAt: "asc" },
                        });
                        if (!defaultAcc) return { error: "No hay cuentas creadas." };
                        accountId = defaultAcc.id;
                    }
                    const cuenta = await prisma.account.findFirst({
                        where: { id: accountId, workspaceId, deletedAt: null },
                    });
                    if (!cuenta) return { error: "Cuenta no encontrada." };

                    let categoryId = args.category_id || null;
                    if (!categoryId && args.description) {
                        const autoId = await aplicarReglas(args.description);
                        if (autoId) categoryId = autoId;
                    }

                    const date = args.date ? new Date(args.date) : new Date();
                    const cambio = type === "income" ? args.amount : -args.amount;

                    const tx = await prisma.$transaction(async (db: any) => {
                        const t = await db.transaction.create({
                            data: {
                                workspaceId, accountId: accountId!, categoryId,
                                amountOriginal: args.amount, currencyOriginal: cuenta.currency,
                                amountBase: args.amount, baseCurrency: membership.workspace.baseCurrency,
                                description: args.description.trim(), type, source: "ai-chat", date,
                            },
                        });
                        await db.account.update({
                            where: { id: accountId! },
                            data: { currentBalance: { increment: cambio } },
                        });
                        await db.auditLog.create({
                            data: {
                                workspaceId, actorId: userId, action: "create",
                                entity: "transaction", entityId: t.id,
                                after: { description: args.description, amount: args.amount, type, source: "ai-chat" },
                            },
                        });
                        return t;
                    });

                    return {
                        success: true, id: tx.id, description: tx.description,
                        amount: Number(tx.amountOriginal), type: tx.type, account: cuenta.name,
                    };
                },
            }),

            transactions_list: tool({
                description: "Listar transacciones con filtros opcionales",
                inputSchema: z.object({
                    date_from: z.string().optional().describe("Fecha inicio ISO"),
                    date_to: z.string().optional().describe("Fecha fin ISO"),
                    type: z.string().optional().describe("income o expense"),
                    limit: z.number().optional().describe("Máximo de resultados (default 10)"),
                }),
                execute: async (args: { date_from?: string; date_to?: string; type?: string; limit?: number }) => {
                    const where: any = { workspaceId, deletedAt: null };
                    if (args.type) where.type = args.type;
                    if (args.date_from || args.date_to) {
                        where.date = {};
                        if (args.date_from) where.date.gte = new Date(args.date_from);
                        if (args.date_to) where.date.lte = new Date(args.date_to);
                    }
                    const txs = await prisma.transaction.findMany({
                        where,
                        include: { account: { select: { name: true } }, category: { select: { name: true } } },
                        orderBy: { date: "desc" },
                        take: Math.min(args.limit || 10, 50),
                    });
                    return txs.map((t: any) => ({
                        date: t.date.toISOString().split("T")[0],
                        description: t.description,
                        amount: Number(t.amountOriginal),
                        type: t.type,
                        category: t.category?.name || "Sin categoría",
                        account: t.account?.name || "",
                    }));
                },
            }),

            accounts_list: tool({
                description: "Listar cuentas financieras con balances",
                inputSchema: z.object({}),
                execute: async () => {
                    const accs = await prisma.account.findMany({
                        where: { workspaceId, deletedAt: null },
                        orderBy: { createdAt: "asc" },
                    });
                    return accs.map((a: any) => ({
                        name: a.name, type: a.type, currency: a.currency, balance: Number(a.currentBalance),
                    }));
                },
            }),

            analytics_summary: tool({
                description: "Resumen financiero: ingresos, gastos y balance neto de un período",
                inputSchema: z.object({
                    range: z.string().optional().describe("current_month, last_month o current_year. Default: current_month"),
                }),
                execute: async (args: { range?: string }) => {
                    const range = args.range || "current_month";
                    const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
                    let from: Date, to: Date;
                    if (range === "last_month") { from = new Date(y, m - 1, 1); to = new Date(y, m, 0, 23, 59, 59); }
                    else if (range === "current_year") { from = new Date(y, 0, 1); to = now; }
                    else { from = new Date(y, m, 1); to = now; }

                    const txs = await prisma.transaction.findMany({
                        where: { workspaceId, deletedAt: null, date: { gte: from, lte: to } },
                        select: { type: true, amountBase: true },
                    });
                    let income = 0, expenses = 0;
                    for (const t of txs) {
                        if (t.type === "income") income += Number(t.amountBase);
                        else expenses += Number(t.amountBase);
                    }
                    return { income, expenses, net: income - expenses, totalTransactions: txs.length };
                },
            }),

            analytics_by_category: tool({
                description: "Distribución de gastos o ingresos por categoría",
                inputSchema: z.object({
                    range: z.string().optional().describe("current_month, last_month o current_year"),
                    type: z.string().optional().describe("income o expense. Default: expense"),
                }),
                execute: async (args: { range?: string; type?: string }) => {
                    const range = args.range || "current_month";
                    const type = args.type || "expense";
                    const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
                    let from: Date, to: Date;
                    if (range === "last_month") { from = new Date(y, m - 1, 1); to = new Date(y, m, 0, 23, 59, 59); }
                    else if (range === "current_year") { from = new Date(y, 0, 1); to = now; }
                    else { from = new Date(y, m, 1); to = now; }

                    const txs = await prisma.transaction.findMany({
                        where: { workspaceId, deletedAt: null, type, date: { gte: from, lte: to } },
                        include: { category: { select: { name: true } } },
                    });
                    const byCategory = new Map<string, number>();
                    for (const t of txs) {
                        const cat = (t as any).category?.name || "Sin categoría";
                        byCategory.set(cat, (byCategory.get(cat) || 0) + Number(t.amountBase));
                    }
                    return [...byCategory.entries()].sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name, amount }));
                },
            }),

            categories_list: tool({
                description: "Listar categorías disponibles del usuario",
                inputSchema: z.object({}),
                execute: async () => {
                    const cats = await prisma.category.findMany({
                        where: { workspaceId, deletedAt: null },
                        select: { id: true, name: true, type: true, icon: true },
                        orderBy: { name: "asc" },
                    });
                    return cats;
                },
            }),
        },
    });

    return result.toTextStreamResponse();
}

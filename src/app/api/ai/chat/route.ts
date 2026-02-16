import { google } from "@ai-sdk/google";
import { streamText, tool, convertToModelMessages } from "ai";
import { z } from "zod"; // Standard import
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aplicarReglas } from "@/lib/actions/rules";

/**
 * AI Chat streaming endpoint.
 * Uses Vercel AI SDK v6 + Google Gemini with tool-calling
 * that mirrors the xMCP tool catalog.
 * Updated for Agentic Behavior (maxSteps: 5) and strict Types.
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

    // Instructions using single quotes for tool names to avoid template string interpolation issues
    const systemPrompt = `Eres Billeto, un asistente financiero experto.
Tu objetivo es ACTUAR, no solo conversar.
Fecha: ${currentDate}. Moneda: PEN (S/). Usuario: ${session.user.name || "Usuario"}.

REGLAS DE ORO:
1. **ACCIÓN INMEDIATA**: Si el usuario menciona un gasto o ingreso, ¡REGÍSTRALO! No pidas confirmación.
2. **INFERENCIA**:
   - Si no dice cuenta, ASUME "Efectivo" (búscala en 'accounts_list'). Si no existe, usa la primera cuenta disponible.
   - Si no dice categoría, usa 'categories_list' para encontrar la mejor coincidencia (ej. "taxi" -> "Transporte").
3. **NO HABLES DE TUS PLANES**: No digas "Voy a buscar...", HAZLO. Ejecuta las herramientas.

EJEMPLOS DE COMPORTAMIENTO ESPERADO:

Usuario: "Gasté 15 soles en menú"
Tú (Pensamiento interno): "Necesito categoría y cuenta. Llamo a tools."
Tool Call: 'categories_list'
Tool Call: 'accounts_list'
... (recibes datos) ...
Tú (Pensamiento interno): "Encontré categoría 'Alimentación' y cuenta 'Efectivo'. Creo la transacción."
Tool Call: 'transactions_create({ amount: 15, description: "Menú", category_id: "...", account_id: "..." })'
Tú (Respuesta final): "Listo 🍛. Registré S/15 en Alimentación (Efectivo)."

Usuario: "Me pagaron 100"
Tú: Calling 'accounts_list'... found 'Banco BCP'... Calling 'transactions_create({ amount: 100, type: 'income', account_id: '...', description: 'Ingreso' })'.
Tú: "Genial 🤑. Registré un ingreso de S/100 en tu Banco."

Respondé siempre en español, sé breve y eficiente.`;

    // Ensure messages is an array and convert to ModelMessage[]
    // convertToModelMessages returns a Promise in recent versions, so we await it.
    const coreMessages = Array.isArray(messages) ? messages : [];
    const modelMessages = await convertToModelMessages(coreMessages);

    const result = streamText({
        model: google("gemini-2.0-flash"),
        system: systemPrompt,
        messages: modelMessages,
        // @ts-ignore - maxSteps is available in newer AI SDK versions but types might be lagging
        maxSteps: 5, // Allow up to 5 steps for tool roundtrips (Agentic behavior)
        tools: {
            transactions_create: tool({
                description: "Crear una nueva transacción financiera (gasto o ingreso)",
                inputSchema: z.object({
                    amount: z.number().describe("Monto de la transacción"),
                    description: z.string().describe("Descripción"),
                    type: z.string().describe("Tipo: income o expense. Por defecto expense"),
                    category_id: z.string().optional().describe("ID de categoría"),
                    account_id: z.string().optional().describe("ID de cuenta"),
                    date: z.string().optional().describe("Fecha ISO-8601 (YYYY-MM-DD)"),
                }),
                execute: async ({ amount, description, type, category_id, account_id, date }) => {
                    console.log("🔧 Tool Call: transactions_create", { amount, description, account_id });
                    try {
                        // 1. Account Fallback Logic
                        let finalAccountId = account_id;
                        if (!finalAccountId) {
                            console.log("  - Finding fallback account...");
                            const accounts = await prisma.account.findMany({
                                where: { workspaceId },
                                orderBy: { name: 'asc' }
                            });

                            if (accounts.length === 0) {
                                console.log("  - No accounts found!");
                                return { success: false, message: "No hay cuentas registradas en el workspace." };
                            }

                            const cashAccount = accounts.find(a =>
                                a.normalizedName === "efectivo" ||
                                a.name.toLowerCase().includes("efectivo") ||
                                a.name.toLowerCase().includes("cash")
                            );

                            finalAccountId = cashAccount ? cashAccount.id : accounts[0].id;
                            console.log("  - Selected account:", finalAccountId);
                        }

                        // 2. Balance update
                        const amountNum = Number(amount);
                        const increment = type === "income" ? amountNum : -amountNum;

                        await prisma.account.update({
                            where: { id: finalAccountId, workspaceId },
                            data: { currentBalance: { increment } },
                        });

                        // 3. Create Transaction
                        console.log("  - Creating transaction record...");
                        const tx = await prisma.transaction.create({
                            data: {
                                amountOriginal: amountNum,
                                amountBase: amountNum,
                                currencyOriginal: "PEN",
                                baseCurrency: "PEN",
                                description,
                                type: type as "income" | "expense",
                                date: date ? new Date(date) : new Date(),
                                categoryId: category_id,
                                accountId: finalAccountId as string,
                                workspaceId,
                                // userId field does not exist on Transaction model
                            },
                            include: { category: true, account: true }
                        });
                        console.log("  - Transaction created:", tx.id);

                        // 4. Rules application (Auto-categorization)
                        if (!category_id) {
                            console.log("  - Applying rules...");
                            const autoCatId = await aplicarReglas(description);
                            if (autoCatId) {
                                console.log("  - Rule match! Category:", autoCatId);
                                await prisma.transaction.update({
                                    where: { id: tx.id },
                                    data: { categoryId: autoCatId }
                                });
                                // Update local category name for response
                                const cat = await prisma.category.findUnique({ where: { id: autoCatId } });
                                if (cat && tx.category) tx.category.name = cat.name;
                            }
                        }

                        return {
                            success: true,
                            message: `Transacción registrada: ${description} (${type === 'income' ? '+' : '-'}S/${amount}).`,
                            transaction: {
                                id: tx.id,
                                description: tx.description,
                                amount: tx.amountBase,
                                accountName: tx.account.name,
                                categoryName: tx.category?.name || "Sin categoría"
                            }
                        };
                    } catch (error: any) {
                        console.error("❌ Error in transactions_create:", error);
                        return { success: false, error: error.message };
                    }
                },
            }),

            transactions_list: tool({
                description: "Listar transacciones recientes con filtros opcionales",
                inputSchema: z.object({
                    limit: z.number().optional().describe("E.g. 10"),
                    type: z.string().optional().describe("income/expense"),
                    search: z.string().optional().describe("Búsqueda texto"),
                    category_id: z.string().optional(),
                    account_id: z.string().optional(),
                }),
                execute: async ({ limit = 10, type, search, category_id, account_id }) => {
                    const where: any = { workspaceId };
                    if (type) where.type = type;
                    if (search) where.description = { contains: search, mode: "insensitive" };
                    if (category_id) where.categoryId = category_id;
                    if (account_id) where.accountId = account_id;

                    const txs = await prisma.transaction.findMany({
                        where,
                        orderBy: { date: "desc" },
                        take: limit,
                        include: { category: true, account: true },
                    });

                    return {
                        count: txs.length,
                        transactions: txs.map(t => ({
                            id: t.id,
                            date: t.date.toISOString().split("T")[0],
                            description: t.description,
                            amount: t.amountBase,
                            type: t.type,
                            category: t.category?.name || "Sin categoría",
                            account: t.account?.name || "Sin cuenta"
                        }))
                    };
                },
            }),

            accounts_list: tool({
                description: "Listar todas las cuentas y sus balances actuales",
                inputSchema: z.object({}),
                execute: async () => {
                    const accounts = await prisma.account.findMany({
                        where: { workspaceId },
                        orderBy: { name: "asc" },
                    });
                    return accounts.map(a => ({
                        id: a.id,
                        name: a.name,
                        currency: a.currency,
                        balance: a.currentBalance
                    }));
                },
            }),

            categories_list: tool({
                description: "Listar todas las categorías disponibles para gastos e ingresos",
                inputSchema: z.object({}),
                execute: async () => {
                    const categories = await prisma.category.findMany({
                        where: { workspaceId },
                        orderBy: { name: "asc" },
                    });
                    return categories.map(c => ({
                        id: c.id,
                        name: c.name,
                        type: c.type
                    }));
                },
            }),

            analytics_summary: tool({
                description: "Obtener resumen financiero del mes actual (ingresos, gastos, balance neto)",
                inputSchema: z.object({
                    month: z.number().optional().describe("1-12"),
                    year: z.number().optional().describe("YYYY"),
                }),
                execute: async ({ month, year }) => {
                    const now = new Date();
                    const m = month || now.getMonth() + 1;
                    const y = year || now.getFullYear();

                    const start = new Date(y, m - 1, 1);
                    const end = new Date(y, m, 0);

                    const aggs = await prisma.transaction.groupBy({
                        by: ["type"],
                        where: {
                            workspaceId,
                            date: { gte: start, lte: end },
                        },
                        _sum: { amountBase: true },
                    });

                    const income = Number(aggs.find(a => a.type === "income")?._sum.amountBase || 0);
                    const expense = Number(aggs.find(a => a.type === "expense")?._sum.amountBase || 0);

                    return {
                        month: m,
                        year: y,
                        income,
                        expense,
                        net: income - expense
                    };
                },
            }),

            analytics_by_category: tool({
                description: "Obtener desglose de gastos por categoría en el periodo actual",
                inputSchema: z.object({
                    limit: z.number().optional(),
                }),
                execute: async ({ limit = 5 }) => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);

                    // We need to fetch and aggregate manually because groupBy doesn't support relation include easily
                    const txs = await prisma.transaction.findMany({
                        where: {
                            workspaceId,
                            type: "expense",
                            date: { gte: start },
                        },
                        include: { category: true },
                    });

                    const map = new Map<string, number>();
                    txs.forEach(t => {
                        const cat = t.category?.name || "Sin categoría";
                        map.set(cat, (map.get(cat) || 0) + Number(t.amountBase));
                    });

                    const sorted = Array.from(map.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, limit)
                        .map(([category, total]) => ({ category, total }));

                    return sorted;
                },
            }),
        },
    });

    return result.toTextStreamResponse();
}

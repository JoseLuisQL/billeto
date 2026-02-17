import { google } from "@ai-sdk/google";
import { streamText, tool, convertToModelMessages } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aplicarReglas } from "@/lib/actions/rules";
import { checkApiRateLimit } from "@/lib/security/api-rate-limit";
import { requireWorkspaceAccess } from "@/lib/security/access";

type ToolErrorResult = {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
};

type ToolCatchError = Error & { message: string };

const TOOL_TIMEOUT_MS = 12_000;
const MAX_TOOL_REPEAT = 2;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function toToolError(code: string, message: string, retryable = false): ToolErrorResult {
  return {
    success: false,
    error: { code, message, retryable },
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), timeoutMs)),
  ]);
}

function makeToolGuard() {
  const calls = new Map<string, number>();

  return (toolName: string, args: unknown) => {
    const signature = `${toolName}:${JSON.stringify(args)}`;
    const next = (calls.get(signature) ?? 0) + 1;
    calls.set(signature, next);

    if (next > MAX_TOOL_REPEAT) {
      throw new Error("Se detectó un posible loop de herramientas. Reformulá la consulta o agregá más contexto.");
    }
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const access = await requireWorkspaceAccess("member");
    const workspaceId = access.workspace.id;
    const userId = access.userId;

    const rateLimitResponse = checkApiRateLimit({
      bucket: "api:ai-chat:user",
      key: `${userId}:${workspaceId}`,
      limit: 40,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const coreMessages = Array.isArray(body?.messages) ? body.messages : [];
    const modelMessages = await convertToModelMessages(coreMessages);

    const currentDate = new Date().toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const guardTool = makeToolGuard();

    const systemPrompt = `Eres Billeto, un asistente financiero experto.
Fecha: ${currentDate}. Moneda: PEN (S/). Usuario: ${session.user.name || "Usuario"}.

Reglas operativas:
1) Respondé en español, de forma breve y clara.
2) Usá herramientas cuando aporten valor real.
3) Si faltan datos críticos para mutar (monto, descripción o tipo), pedí aclaración antes de ejecutar.
4) Nunca inventes IDs ni datos de cuenta/categoría.
5) Si hay error de herramienta, explicalo y propone el siguiente paso.
`;

    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      messages: modelMessages,
      // @ts-expect-error maxSteps está soportado por runtime del SDK, pero no en tipos actuales del proyecto.
      maxSteps: 3,
      tools: {
        transactions_create: tool({
          description: "Crear una nueva transacción financiera (gasto o ingreso)",
          inputSchema: z.object({
            amount: z.number().describe("Monto de la transacción"),
            description: z.string().describe("Descripción"),
            type: z.enum(["income", "expense"]).default("expense"),
            category_id: z.string().optional().describe("ID de categoría"),
            account_id: z.string().optional().describe("ID de cuenta"),
            date: z.string().optional().describe("Fecha ISO-8601 (YYYY-MM-DD)"),
            request_id: z.string().optional().describe("ID idempotente para evitar duplicados"),
          }),
          execute: async (args) => {
            const startedAt = Date.now();
            try {
              guardTool("transactions_create", args);

              if (!args.amount || !args.description?.trim()) {
                return toToolError("missing_critical_data", "Falta monto o descripción para registrar la transacción.");
              }

              return await withTimeout((async () => {
                if (args.request_id) {
                  const existing = await prisma.transaction.findFirst({
                    where: { workspaceId, requestId: args.request_id, deletedAt: null },
                    include: { category: true, account: true },
                  });

                  if (existing) {
                    return {
                      success: true,
                      message: `Transacción ya registrada previamente (${args.request_id}).`,
                      transaction: {
                        id: existing.id,
                        description: existing.description,
                        amount: existing.amountBase,
                        accountName: existing.account.name,
                        categoryName: existing.category?.name || "Sin categoría",
                      },
                      deduplicated: true,
                    };
                  }
                }

                let finalAccountId = args.account_id;
                if (!finalAccountId) {
                  const accounts = await prisma.account.findMany({
                    where: { workspaceId, deletedAt: null },
                    orderBy: { name: "asc" },
                  });

                  if (accounts.length === 0) {
                    return toToolError("account_not_found", "No hay cuentas registradas en el workspace.");
                  }

                  const cashAccount = accounts.find(
                    (a) =>
                      a.normalizedName === "efectivo" ||
                      a.name.toLowerCase().includes("efectivo") ||
                      a.name.toLowerCase().includes("cash")
                  );

                  finalAccountId = cashAccount ? cashAccount.id : accounts[0].id;
                }

                const amountNum = Number(args.amount);
                const increment = args.type === "income" ? amountNum : -amountNum;

                const tx = await prisma.$transaction(async (db) => {
                  const updatedAccount = await db.account.updateMany({
                    where: { id: finalAccountId as string, workspaceId, deletedAt: null },
                    data: { currentBalance: { increment } },
                  });

                  if (updatedAccount.count === 0) {
                    throw new Error("Cuenta no encontrada o sin permisos");
                  }

                  return db.transaction.create({
                    data: {
                      amountOriginal: amountNum,
                      amountBase: amountNum,
                      currencyOriginal: "PEN",
                      baseCurrency: "PEN",
                      description: args.description,
                      type: args.type,
                      date: args.date ? new Date(args.date) : new Date(),
                      categoryId: args.category_id,
                      accountId: finalAccountId as string,
                      workspaceId,
                      requestId: args.request_id,
                    },
                    include: { category: true, account: true },
                  });
                });

                if (!args.category_id) {
                  const autoCatId = await aplicarReglas(args.description);
                  if (autoCatId) {
                    await prisma.transaction.update({
                      where: { id: tx.id },
                      data: { categoryId: autoCatId },
                    });
                    const cat = await prisma.category.findUnique({ where: { id: autoCatId } });
                    if (cat && tx.category) tx.category.name = cat.name;
                  }
                }

                return {
                  success: true,
                  message: `Transacción registrada: ${args.description} (${args.type === "income" ? "+" : "-"}S/${args.amount}).`,
                  transaction: {
                    id: tx.id,
                    description: tx.description,
                    amount: tx.amountBase,
                    accountName: tx.account.name,
                    categoryName: tx.category?.name || "Sin categoría",
                  },
                };
              })(), TOOL_TIMEOUT_MS, "Timeout al crear la transacción");
            } catch (error: unknown) {
              const err = error as ToolCatchError;
              console.error("chat.tool.transactions_create", {
                workspaceId,
                userId,
                durationMs: Date.now() - startedAt,
                message: err?.message,
              });
              return toToolError("tool_execution_error", getErrorMessage(error, "Error al crear transacción"), true);
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
          execute: async (args) => {
            try {
              guardTool("transactions_list", args);

              const where: Record<string, unknown> = { workspaceId };
              if (args.type) where.type = args.type;
              if (args.search) where.description = { contains: args.search, mode: "insensitive" };
              if (args.category_id) where.categoryId = args.category_id;
              if (args.account_id) where.accountId = args.account_id;

              const txs = await withTimeout(
                prisma.transaction.findMany({
                  where,
                  orderBy: { date: "desc" },
                  take: args.limit ?? 10,
                  include: { category: true, account: true },
                }),
                TOOL_TIMEOUT_MS,
                "Timeout al listar transacciones"
              );

              return {
                success: true,
                count: txs.length,
                transactions: txs.map((t) => ({
                  id: t.id,
                  date: t.date.toISOString().split("T")[0],
                  description: t.description,
                  amount: t.amountBase,
                  type: t.type,
                  category: t.category?.name || "Sin categoría",
                  account: t.account?.name || "Sin cuenta",
                })),
              };
            } catch (error: unknown) {
              return toToolError("tool_execution_error", getErrorMessage(error, "Error al listar transacciones"), true);
            }
          },
        }),

        accounts_list: tool({
          description: "Listar todas las cuentas y sus balances actuales",
          inputSchema: z.object({}),
          execute: async (args) => {
            try {
              guardTool("accounts_list", args);
              const accounts = await withTimeout(
                prisma.account.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
                TOOL_TIMEOUT_MS,
                "Timeout al listar cuentas"
              );
              return {
                success: true,
                accounts: accounts.map((a) => ({
                  id: a.id,
                  name: a.name,
                  currency: a.currency,
                  balance: a.currentBalance,
                })),
              };
            } catch (error: unknown) {
              return toToolError("tool_execution_error", getErrorMessage(error, "Error al listar cuentas"), true);
            }
          },
        }),

        categories_list: tool({
          description: "Listar todas las categorías disponibles para gastos e ingresos",
          inputSchema: z.object({}),
          execute: async (args) => {
            try {
              guardTool("categories_list", args);
              const categories = await withTimeout(
                prisma.category.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
                TOOL_TIMEOUT_MS,
                "Timeout al listar categorías"
              );
              return {
                success: true,
                categories: categories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  type: c.type,
                })),
              };
            } catch (error: unknown) {
              return toToolError("tool_execution_error", getErrorMessage(error, "Error al listar categorías"), true);
            }
          },
        }),

        analytics_summary: tool({
          description: "Obtener resumen financiero del mes actual (ingresos, gastos, balance neto)",
          inputSchema: z.object({
            month: z.number().optional().describe("1-12"),
            year: z.number().optional().describe("YYYY"),
          }),
          execute: async (args) => {
            try {
              guardTool("analytics_summary", args);
              const now = new Date();
              const m = args.month || now.getMonth() + 1;
              const y = args.year || now.getFullYear();

              const start = new Date(y, m - 1, 1);
              const end = new Date(y, m, 0);

              const aggs = await withTimeout(
                prisma.transaction.groupBy({
                  by: ["type"],
                  where: { workspaceId, date: { gte: start, lte: end } },
                  _sum: { amountBase: true },
                }),
                TOOL_TIMEOUT_MS,
                "Timeout en resumen analítico"
              );

              const income = Number(aggs.find((a) => a.type === "income")?._sum.amountBase || 0);
              const expense = Number(aggs.find((a) => a.type === "expense")?._sum.amountBase || 0);

              return { success: true, month: m, year: y, income, expense, net: income - expense };
            } catch (error: unknown) {
              return toToolError("tool_execution_error", getErrorMessage(error, "Error en resumen analítico"), true);
            }
          },
        }),

        analytics_by_category: tool({
          description: "Obtener desglose de gastos por categoría en el periodo actual",
          inputSchema: z.object({ limit: z.number().optional() }),
          execute: async (args) => {
            try {
              guardTool("analytics_by_category", args);
              const now = new Date();
              const start = new Date(now.getFullYear(), now.getMonth(), 1);

              const txs = await withTimeout(
                prisma.transaction.findMany({
                  where: { workspaceId, type: "expense", date: { gte: start } },
                  include: { category: true },
                }),
                TOOL_TIMEOUT_MS,
                "Timeout en análisis por categoría"
              );

              const map = new Map<string, number>();
              txs.forEach((t) => {
                const cat = t.category?.name || "Sin categoría";
                map.set(cat, (map.get(cat) || 0) + Number(t.amountBase));
              });

              const sorted = Array.from(map.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, args.limit ?? 5)
                .map(([category, total]) => ({ category, total }));

              return { success: true, items: sorted };
            } catch (error: unknown) {
              return toToolError("tool_execution_error", getErrorMessage(error, "Error en análisis por categoría"), true);
            }
          },
        }),
      },
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error("chat.route.error", { message: getErrorMessage(error, "chat_error") });
    return Response.json(
      {
        error: "chat_failed",
        message: "No se pudo procesar la solicitud del chat en este momento.",
      },
      { status: 500 }
    );
  }
}

import { google } from "@ai-sdk/google";
import {
  streamText,
  tool,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aplicarReglasCompleto } from "@/lib/actions/rules";
import { checkApiRateLimit } from "@/lib/security/api-rate-limit";
import { requireWorkspaceAccess } from "@/lib/security/access";
import {
  analyzePrompt,
  SECURITY_PREAMBLE,
  BLOCKED_RESPONSE_TEXT,
  SUSPICIOUS_REINFORCEMENT,
} from "@/lib/security/prompt-guard";
import {
  SYSTEM_CATEGORY_OWNER_ID,
  ensureDefaultCategoriesForWorkspace,
  normalizeCategoryName,
} from "@/lib/categories-defaults";
import { convertAndSave } from "@/lib/fx-service";
import {
  handleAssistantDocumentUpload,
  handlePendingAssistantDocumentReply,
} from "@/lib/assistant-documents";

type ToolErrorResult = {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
};

type ToolCatchError = Error & { message: string };
type TransactionSummaryCard = {
  title: string;
  id: string;
  amount: string;
  description: string;
  category: string;
  account: string;
  date: string;
  transactionType: string;
};
type AssistantDataParts = {
  transaction_summary: TransactionSummaryCard;
};
type AssistantUIMessage = UIMessage<unknown, AssistantDataParts>;

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

function classifyUserIntent(input: string) {
  const text = input.toLowerCase().trim();
  const simpleGreeting = /^(hola|holi|buenas|buen día|buenas tardes|buenas noches|hello|hi)\b[!.?\s]*$/i.test(text);
  const supportIntent = /(soporte|ayuda técnica|contacto|asesor|humano|atención|atencion al cliente)/i.test(text);

  return {
    simpleGreeting,
    supportIntent,
  };
}

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeFreeText(value: string) {
  return stripAccents(value.toLowerCase().trim());
}

function resolveCategoryByKeywords(
  description: string,
  categories: Array<{ id: string; name: string; normalizedName: string }>
) {
  const text = normalizeFreeText(description);

  const keywordGroups: Array<{ keywords: string[]; preferredCategory: string[] }> = [
    { keywords: ["cafe", "cafeteria", "almuerzo", "desayuno", "cena", "restaurante", "menu", "comida", "helado", "pizza", "pollo", "hamburguesa", "sushi", "snack", "lunch", "brunch", "parrilla", "ceviche", "chifa", "polleria"], preferredCategory: ["comida", "supermercado"] },
    { keywords: ["uber", "taxi", "bus", "pasaje", "movilidad", "metro", "combustible", "gasolina", "peaje", "estacionamiento"], preferredCategory: ["transporte", "combustible", "estacionamiento", "auto"] },
    { keywords: ["internet", "wifi", "fibra", "movistar", "claro", "entel"], preferredCategory: ["internet", "servicios"] },
    { keywords: ["netflix", "spotify", "youtube", "disney", "prime", "stream", "hbo", "apple tv", "crunchyroll"], preferredCategory: ["streaming", "musica", "entretenimiento", "subscripciones"] },
    { keywords: ["botica", "farmacia", "medicina", "medico", "doctor", "clinica", "consulta", "examen", "laboratorio", "lentes", "dentista", "hospital"], preferredCategory: ["farmacia", "salud"] },
    { keywords: ["colegio", "universidad", "curso", "matricula", "educacion", "libro", "taller", "capacitacion", "diplomado", "maestria"], preferredCategory: ["educacion"] },
    { keywords: ["alquiler", "hipoteca", "casa", "departamento", "vivienda", "renta"], preferredCategory: ["vivienda"] },
    { keywords: ["gimnasio", "gym", "crossfit", "yoga", "pilates"], preferredCategory: ["gimnasio", "deportes"] },
    { keywords: ["seguro", "poliza", "soat"], preferredCategory: ["seguros"] },
    { keywords: ["tarjeta", "visa", "mastercard", "credito"], preferredCategory: ["tarjetas", "finanzas"] },
    { keywords: ["trabajo", "sueldo", "salario", "freelance", "honorarios", "bono", "comision", "nomina", "quincena", "mensualidad", "pago de trabajo", "ingreso de trabajo", "ingreso del trabajo"], preferredCategory: ["trabajo", "emprendimiento"] },
    { keywords: ["cine", "teatro", "concierto", "fiesta", "bar", "discoteca", "karaoke", "juego", "videojuego"], preferredCategory: ["entretenimiento"] },
    { keywords: ["ropa", "zapatos", "zapatillas", "pantalon", "camisa", "polo", "jean", "vestido", "casaca", "chaqueta"], preferredCategory: ["ropa"] },
    { keywords: ["supermercado", "mercado", "plaza vea", "wong", "tottus", "vivanda", "bodega", "minimarket"], preferredCategory: ["supermercado"] },
    { keywords: ["luz", "agua", "gas", "recibo", "electricidad", "sedapal"], preferredCategory: ["servicios"] },
    { keywords: ["regalo", "obsequio", "presente", "cumpleanos", "navidad"], preferredCategory: ["regalos"] },
    { keywords: ["mascota", "perro", "gato", "veterinario", "veterinaria", "comida de perro", "comida de gato"], preferredCategory: ["mascotas"] },
    { keywords: ["inversion", "acciones", "bonos", "fondo", "cripto", "bitcoin", "dividendo", "rendimiento"], preferredCategory: ["inversiones", "finanzas"] },
    { keywords: ["ahorro", "ahorros", "guardado", "reserva"], preferredCategory: ["ahorros"] },
    { keywords: ["donacion", "caridad", "ong", "fundacion"], preferredCategory: ["donaciones"] },
    { keywords: ["delivery", "rappi", "pedidos ya", "glovo", "uber eats", "envio"], preferredCategory: ["delivery", "comida"] },
  ];

  for (const group of keywordGroups) {
    if (!group.keywords.some((kw) => text.includes(kw))) continue;

    for (const preferred of group.preferredCategory) {
      const normalizedPreferred = normalizeCategoryName(preferred);
      const match = categories.find((cat) => cat.normalizedName === normalizedPreferred);
      if (match) return match.id;
    }
  }

  return null;
}

function resolveAccountByName(
  accountName: string,
  accounts: Array<{ id: string; name: string; normalizedName: string }>
) {
  const normalizedInput = normalizeCategoryName(accountName);

  const exact = accounts.find((a) => a.normalizedName === normalizedInput);
  if (exact) return { id: exact.id, confidence: 1 };

  const partial = accounts.find(
    (a) => a.normalizedName.includes(normalizedInput) || normalizedInput.includes(a.normalizedName)
  );
  if (partial) return { id: partial.id, confidence: 0.8 };

  return null;
}

function resolveCategoryByName(
  categoryName: string,
  categories: Array<{ id: string; name: string; normalizedName: string }>
) {
  const normalizedInput = normalizeCategoryName(categoryName);

  const exact = categories.find((c) => c.normalizedName === normalizedInput);
  if (exact) return { id: exact.id, confidence: 1 };

  const partial = categories.find(
    (c) => c.normalizedName.includes(normalizedInput) || normalizedInput.includes(c.normalizedName)
  );
  if (partial) return { id: partial.id, confidence: 0.8 };

  return null;
}

function formatDateForWorkspace(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: timezone,
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function createAssistantTextResponse(text: string, headers?: HeadersInit) {
  const id = crypto.randomUUID();

  return createUIMessageStreamResponse({
    headers,
    stream: createUIMessageStream<AssistantUIMessage>({
      execute: async ({ writer }) => {
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: text });
        writer.write({ type: "text-end", id });
      },
    }),
  });
}

function createTransactionSummaryResponse(summaryCard: TransactionSummaryCard, headers?: HeadersInit) {
  return createUIMessageStreamResponse({
    headers,
    stream: createUIMessageStream<AssistantUIMessage>({
      execute: async ({ writer }) => {
        writer.write({
          type: "data-transaction_summary",
          data: summaryCard,
        });
      },
    }),
  });
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
    const workspaceTimezone = access.workspace.timezone || "America/Lima";

    await ensureDefaultCategoriesForWorkspace(prisma, workspaceId);

    const rateLimitResponse = checkApiRateLimit({
      bucket: "api:ai-chat:user",
      key: `${userId}:${workspaceId}`,
      limit: 40,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { messages }: { messages: UIMessage[] } = body;

    const lastUserMsg = [...(messages || [])]
      .reverse()
      .find((m) => m.role === "user");
    let lastUserText = "Hola";
    if (lastUserMsg?.parts) {
      for (const p of lastUserMsg.parts) {
        if (p.type === "text" && p.text?.trim()) {
          lastUserText = p.text;
          break;
        }
      }
    }
    const { simpleGreeting, supportIntent } = classifyUserIntent(lastUserText);

    // --- Prompt Injection Defense ---
    const promptAnalysis = analyzePrompt(lastUserText);

    if (promptAnalysis.blocked) {
      console.warn("prompt-guard:blocked", {
        userId,
        workspaceId,
        inputPreview: lastUserText.slice(0, 80),
      });

      const blockedResult = streamText({
        model: google("gemini-2.5-flash"),
        system: `Responde UNICAMENTE con el siguiente texto exacto, sin modificar nada, sin agregar nada antes ni despues:\n\n${BLOCKED_RESPONSE_TEXT}`,
        messages: [{ role: "user" as const, content: "." }],
      });

      return blockedResult.toUIMessageStreamResponse({
        headers: { "X-Billeto-Security-Block": "1" },
      });
    }

    if (promptAnalysis.riskLevel === "suspicious") {
      console.warn("prompt-guard:suspicious", {
        userId,
        workspaceId,
        inputPreview: lastUserText.slice(0, 80),
      });
    }

    const lastUserFiles = ((lastUserMsg?.parts || []) as Array<{
      type: string;
      url?: string;
      mediaType?: string;
      filename?: string;
    }>).filter((part) => part.type === "file" && typeof part.url === "string");

    if (lastUserFiles.length > 1) {
      return createAssistantTextResponse(
        "Por ahora puedes subir un comprobante por vez. Analizo el primero que envies y luego seguimos con el siguiente.",
        { "X-Billeto-Document-Flow": "1" }
      );
    }

    if (lastUserFiles.length === 1) {
      const documentResult = await handleAssistantDocumentUpload({
        filePart: {
          type: "file",
          url: lastUserFiles[0].url!,
          mediaType: lastUserFiles[0].mediaType || "application/octet-stream",
          filename: lastUserFiles[0].filename,
        },
        userId,
        workspaceId,
        baseCurrency: access.workspace.baseCurrency,
        timezone: workspaceTimezone,
        workspaceName: access.workspace.name,
      });

      if (documentResult.summaryCard) {
        return createTransactionSummaryResponse(documentResult.summaryCard, {
          "X-Billeto-Document-Flow": "1",
        });
      }

      return createAssistantTextResponse(documentResult.message || "No pude procesar el documento.", {
        "X-Billeto-Document-Flow": "1",
      });
    }

    const pendingDocumentReply = await handlePendingAssistantDocumentReply({
      text: lastUserText,
      userId,
      workspaceId,
      timezone: workspaceTimezone,
      baseCurrency: access.workspace.baseCurrency,
    });

    if (pendingDocumentReply) {
      if (pendingDocumentReply.summaryCard) {
        return createTransactionSummaryResponse(pendingDocumentReply.summaryCard, {
          "X-Billeto-Document-Flow": "1",
        });
      }

      return createAssistantTextResponse(pendingDocumentReply.message || "No pude continuar con el comprobante.", {
        "X-Billeto-Document-Flow": "1",
      });
    }

    const currentDate = new Date().toLocaleDateString("es-PE", {
      timeZone: workspaceTimezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const guardTool = makeToolGuard();

    const visibleCategories = await prisma.category.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { ownerUserId: SYSTEM_CATEGORY_OWNER_ID },
          { ownerUserId: userId },
        ],
      },
      select: { id: true, name: true, normalizedName: true, type: true },
    });

    const expenseCategories = visibleCategories.filter((c) => c.type === "expense" || c.type === "both").map((c) => c.name);
    const incomeCategories = visibleCategories.filter((c) => c.type === "income" || c.type === "both").map((c) => c.name);

    const systemPrompt = `${SECURITY_PREAMBLE}Eres Billeto, asistente financiero profesional.
Fecha: ${currentDate}. Moneda: ${access.workspace.baseCurrency}. Usuario: ${session.user.name || "Usuario"}.

Estilo de respuesta:
- Profesional, conciso, sin emojis innecesarios.
- Usa viñetas cuando sea útil (2-4 líneas max).

Categorías disponibles para GASTOS: ${expenseCategories.join(", ")}.
Categorías disponibles para INGRESOS: ${incomeCategories.join(", ")}.

Reglas para registrar gastos/ingresos:
1) Cuando el usuario menciona un gasto o ingreso con monto y descripción, REGISTRALO INMEDIATAMENTE usando transactions_create. NO preguntes confirmación.
2) SIEMPRE envía category_name con el nombre EXACTO de una categoría de las listas de arriba. Infiere la categoría más lógica según el contexto:
   - "trabajo", "sueldo", "salario", "freelance", "honorarios" → category_name: "Trabajo"
   - "cena", "almuerzo", "desayuno", "comida", "restaurante", "helado", "pizza" → category_name: "Comida"
   - "uber", "taxi", "bus", "pasaje", "metro" → category_name: "Transporte"
   - "netflix", "spotify", "youtube", "disney" → category_name: "Streaming"
   - "gasolina", "combustible", "grifo" → category_name: "Combustible"
   - "farmacia", "medicina", "doctor" → category_name: "Farmacia"
   - "curso", "universidad", "libro", "capacitacion" → category_name: "Educación"
   - "ropa", "zapatos", "zapatillas" → category_name: "Ropa"
   - "cine", "fiesta", "bar", "concierto" → category_name: "Entretenimiento"
   - "supermercado", "mercado", "plaza vea", "metro", "wong" → category_name: "Supermercado"
   - "alquiler", "casa", "departamento" → category_name: "Vivienda"
   - "gimnasio", "gym" → category_name: "Gimnasio"
   - "luz", "agua", "gas" → category_name: "Servicios"
3) Infiere el tipo: "income" si dice "ingreso/cobré/gané/sueldo/trabajo", "expense" si dice "gasté/compré/pagué".
4) Si no se menciona cuenta, NO preguntes. El sistema registrará sin cuenta.
5) SOLO pregunta si falta el MONTO (dato realmente crítico). Descripción se puede inferir del contexto.
6) Después de registrar una transacción exitosamente, NO escribas texto adicional. La tarjeta de confirmación ya muestra toda la información al usuario. Solo responde con texto si hubo un error o necesitas aclarar algo.

Reglas generales:
- Si el usuario solo saluda, responde con micro-guía útil (3 viñetas): registrar gasto, ver balance, ver últimos movimientos.
- Nunca pidas IDs internos al usuario.
- Si hay error de herramienta, explica brevemente y sugiere siguiente paso.
- CTA de soporte por WhatsApp SOLO si el usuario solicita soporte/contacto humano.

Contexto de intención detectada:
- Saludo simple: ${simpleGreeting ? "sí" : "no"}
- Soporte: ${supportIntent ? "sí" : "no"}
${promptAnalysis.riskLevel === "suspicious" ? SUSPICIOUS_REINFORCEMENT : ""}
`;

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(5),
      tools: {
        transactions_create: tool({
          description: "Crear una nueva transacción financiera (gasto o ingreso)",
          inputSchema: z.object({
            amount: z.number().describe("Monto de la transacción"),
            description: z.string().describe("Descripción"),
            type: z.enum(["income", "expense"]).default("expense"),
            category_name: z.string().optional().describe("Nombre de categoría (ej: Comida, Transporte)"),
            account_name: z.string().optional().describe("Nombre de cuenta (ej: Efectivo, BCP)"),
            category_id: z.string().optional().describe("ID de categoría (compatibilidad interna)"),
            account_id: z.string().optional().describe("ID de cuenta (compatibilidad interna)"),
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
                        accountName: existing.account?.name || "Sin cuenta específica",
                        categoryName: existing.category?.name || "Sin categoría",
                      },
                      deduplicated: true,
                    };
                  }
                }

                let finalAccountId: string | null = args.account_id || null;
                const accounts = await prisma.account.findMany({
                  where: { workspaceId, deletedAt: null },
                  orderBy: { name: "asc" },
                  select: { id: true, name: true, normalizedName: true, currency: true },
                });

                if (finalAccountId) {
                  const accountExists = accounts.some((account) => account.id === finalAccountId);
                  if (!accountExists) {
                    finalAccountId = null;
                  }
                }

                if (!finalAccountId && args.account_name?.trim() && accounts.length > 0) {
                  const resolvedAccount = resolveAccountByName(args.account_name, accounts);
                  if (resolvedAccount && resolvedAccount.confidence >= 0.75) {
                    finalAccountId = resolvedAccount.id;
                  }
                }

                if (!finalAccountId && accounts.length > 0) {
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

                let finalCategoryId = args.category_id;
                if (finalCategoryId) {
                  const validCategory = visibleCategories.find((c) => c.id === finalCategoryId);
                  if (!validCategory) {
                    finalCategoryId = undefined;
                  }
                }

                if (!finalCategoryId && args.category_name?.trim()) {
                  const resolvedCategory = resolveCategoryByName(args.category_name, visibleCategories);
                  if (!resolvedCategory || resolvedCategory.confidence < 0.75) {
                    return {
                      success: false,
                      needs_confirmation: true,
                      field: "category_name",
                      message: `No pude identificar con precisión la categoría "${args.category_name}". ¿Cuál categoría deseas usar?`,
                      options: visibleCategories.slice(0, 8).map((c) => c.name),
                    };
                  }
                  finalCategoryId = resolvedCategory.id;
                }

                // ── Full Rule Engine ── run BEFORE category chain so result is available
                const ruleRes = await aplicarReglasCompleto(
                  { description: args.description, amount: Number(args.amount), type: args.type, accountId: finalAccountId || undefined },
                  userId
                );

                // Apply category from rules
                if (!finalCategoryId && ruleRes.categoryId && visibleCategories.some((c) => c.id === ruleRes.categoryId)) {
                  finalCategoryId = ruleRes.categoryId;
                }

                if (!finalCategoryId) {
                  const byKeyword = resolveCategoryByKeywords(args.description, visibleCategories);
                  if (byKeyword) {
                    finalCategoryId = byKeyword;
                  }
                }

                if (!finalCategoryId) {
                  const fallback = visibleCategories.find((c) => c.normalizedName === "otros");
                  if (fallback) {
                    finalCategoryId = fallback.id;
                  }
                }

                if (!finalCategoryId) {
                  return {
                    success: false,
                    needs_confirmation: true,
                    field: "category_name",
                    message: "No encontré una categoría confiable para este gasto. ¿Qué categoría deseas usar?",
                    options: visibleCategories.slice(0, 8).map((c) => c.name),
                  };
                }

                const finalAccount = finalAccountId ? accounts.find(a => a.id === finalAccountId) : null;
                const accountCurrency = finalAccount?.currency || access.workspace.baseCurrency;

                // ── Multi-currency conversion ──
                const { converted: chatAmountBase, fxRateId: chatFxId } = await convertAndSave(
                  amountNum, accountCurrency, access.workspace.baseCurrency
                );

                const tx = await prisma.$transaction(async (db) => {
                  if (finalAccountId) {
                    const updatedAccount = await db.account.updateMany({
                      where: { id: finalAccountId, workspaceId, deletedAt: null },
                      data: { currentBalance: { increment } },
                    });

                    if (updatedAccount.count === 0) {
                      throw new Error("Cuenta no encontrada o sin permisos");
                    }
                  }

                  const transaccion = await db.transaction.create({
                    data: {
                      amountOriginal: amountNum,
                      amountBase: chatAmountBase,
                      currencyOriginal: accountCurrency,
                      baseCurrency: access.workspace.baseCurrency,
                      fxRateId: chatFxId ?? undefined,
                      description: args.description,
                      type: args.type,
                      date: args.date ? new Date(args.date) : new Date(),
                      categoryId: finalCategoryId,
                      accountId: finalAccountId ?? undefined,
                      workspaceId,
                      requestId: args.request_id,
                    },
                    include: { category: true, account: true },
                  });

                  // Goal contributions from rules
                  if (ruleRes.goalContributions.length > 0) {
                    for (const gc of ruleRes.goalContributions) {
                      let contributionAmount: number;
                      if (gc.amountType === "percentage") {
                        contributionAmount = amountNum * (gc.amountValue / 100);
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
                              note: `Regla automática: ${args.description}`,
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

                  return transaccion;
                });

                const selectedAccount = finalAccount;

                return {
                  success: true,
                  message: "Transaccion registrada",
                  transaction: {
                    id: tx.id,
                    description: tx.description,
                    amount: tx.amountBase,
                    currency: access.workspace.baseCurrency,
                    accountName: tx.account?.name || "Sin cuenta específica",
                    categoryName: tx.category?.name || "Otros",
                    date: formatDateForWorkspace(tx.date, workspaceTimezone),
                    type: tx.type,
                  },
                  summaryCard: {
                    title: "Transacción Registrada",
                    id: tx.id,
                    amount: `${Number(tx.amountOriginal).toFixed(2)} ${finalAccount?.currency || access.workspace.baseCurrency}${finalAccount?.currency && finalAccount.currency !== access.workspace.baseCurrency ? ` (${Number(tx.amountBase).toFixed(2)} ${access.workspace.baseCurrency})` : ""}`,
                    description: tx.description,
                    category: tx.category?.name || "Otros",
                    account: tx.account?.name || "Sin cuenta específica",
                    date: formatDateForWorkspace(tx.date, workspaceTimezone),
                    transactionType: tx.type === "income" ? "Ingreso" : "Gasto",
                    accountDecision: finalAccountId
                      ? (args.account_name?.trim()
                        ? `Cuenta interpretada: ${selectedAccount?.name || tx.account?.name}`
                        : `Cuenta por defecto: ${selectedAccount?.name || tx.account?.name}`)
                      : "Sin cuenta específica",
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

              const where: Record<string, unknown> = { workspaceId, deletedAt: null };
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
                prisma.category.findMany({
                  where: {
                    workspaceId,
                    deletedAt: null,
                    OR: [
                      { ownerUserId: SYSTEM_CATEGORY_OWNER_ID },
                      { ownerUserId: userId },
                    ],
                  },
                  orderBy: { name: "asc" },
                }),
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

    return result.toUIMessageStreamResponse({
      headers: {
        "X-Billeto-Intent-Support": supportIntent ? "1" : "0",
      },
    });
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

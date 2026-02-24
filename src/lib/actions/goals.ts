"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";
import { ensureDefaultGoalTemplates } from "@/lib/goals-templates";

async function obtenerWorkspace(minRole: "owner" | "admin" | "member" = "member") {
  return requireWorkspaceAccess(minRole);
}

type GoalStatus = "active" | "paused" | "completed" | "archived";

const VALID_STATUS = new Set<GoalStatus>(["active", "paused", "completed", "archived"]);

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getGoalStatus(value: unknown): GoalStatus {
  const next = String(value || "active") as GoalStatus;
  return VALID_STATUS.has(next) ? next : "active";
}

function formatGoal(goal: {
  id: string;
  templateId: string | null;
  name: string;
  targetAmount: { toString(): string };
  currentAmount: { toString(): string };
  currency: string;
  category: string | null;
  emoji: string | null;
  deadline: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}, currentAmountOverride?: number) {
  const targetAmount = Number(goal.targetAmount);
  const currentAmount = typeof currentAmountOverride === "number" ? currentAmountOverride : Number(goal.currentAmount);
  const progressPct = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const remaining = Math.max(targetAmount - currentAmount, 0);

  let monthlyRequired = 0;
  if (goal.deadline && remaining > 0) {
    const now = new Date();
    const ms = goal.deadline.getTime() - now.getTime();
    const months = Math.max(ms / (1000 * 60 * 60 * 24 * 30.4375), 1);
    monthlyRequired = remaining / months;
  }

  return {
    id: goal.id,
    templateId: goal.templateId,
    name: goal.name,
    targetAmount,
    currentAmount,
    remaining,
    progressPct,
    currency: goal.currency,
    category: goal.category,
    emoji: goal.emoji,
    deadline: goal.deadline?.toISOString() ?? null,
    status: getGoalStatus(goal.status),
    monthlyRequired,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

function buildPerspectiva(input: {
  activas: number;
  completadas: number;
  requiereAtencion: number;
  progresoGeneral: number;
}) {
  if (input.activas === 0) {
    return {
      title: "Empieza tu primer objetivo",
      message: "Crea tu primera meta para comenzar a construir tu plan de ahorro.",
      tone: "neutral",
    };
  }

  if (input.requiereAtencion > 0) {
    return {
      title: "Hay metas que requieren atención",
      message: "Revisa tus contribuciones mensuales para evitar atrasos y retomar el ritmo.",
      tone: "warning",
    };
  }

  if (input.progresoGeneral >= 75) {
    return {
      title: "Excelente avance",
      message: "Tu progreso general es sólido. Mantén el ritmo para cerrar tus metas más rápido.",
      tone: "positive",
    };
  }

  if (input.completadas > 0) {
    return {
      title: "Vas por buen camino",
      message: "Ya completaste metas. Mantén la constancia para acelerar los objetivos activos.",
      tone: "positive",
    };
  }

  return {
    title: "Todas las metas están al día. ¡Sigue así!",
    message: "Estás haciendo un gran progreso. Mantén el impulso.",
    tone: "neutral",
  };
}

export async function listarPlantillasMeta(category?: string) {
  try {
    await ensureDefaultGoalTemplates(prisma);

    const normalized = (category || "todas").trim().toLowerCase();
    const where = normalized === "todas" ? { isActive: true } : { isActive: true, category: normalized };

    const templates = await prisma.goalTemplate.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return {
      plantillas: templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        emoji: t.emoji,
        targetAmount: Number(t.targetAmount),
        currency: t.currency,
        suggestedMonths: t.suggestedMonths,
        sortOrder: t.sortOrder,
      })),
    };
  } catch {
    return { error: "Error al cargar plantillas de metas.", plantillas: [] };
  }
}

export async function listarMetas(opciones?: { status?: GoalStatus | "all" }) {
  try {
    const { workspace } = await obtenerWorkspace("member");
    await ensureDefaultGoalTemplates(prisma);

    const status = opciones?.status ?? "all";
    const where: Record<string, unknown> = {
      workspaceId: workspace.id,
      deletedAt: null,
    };

    if (status !== "all") where.status = status;

    const metas = await prisma.goal.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            emoji: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const metasWithTotals = await Promise.all(
      metas.map(async (goal) => {
        const aggregate = await prisma.goalContribution.aggregate({
          where: {
            workspaceId: workspace.id,
            goalId: goal.id,
          },
          _sum: { amount: true },
        });

        const contributionTotal = Number(aggregate._sum.amount ?? 0);
        return {
          goal,
          contributionTotal,
        };
      })
    );

    await Promise.all(
      metasWithTotals
        .filter(({ goal, contributionTotal }) => Number(goal.currentAmount) !== contributionTotal)
        .map(({ goal, contributionTotal }) =>
          prisma.goal.update({
            where: { id: goal.id },
            data: {
              currentAmount: contributionTotal,
              status: contributionTotal >= Number(goal.targetAmount) ? "completed" : getGoalStatus(goal.status),
            },
          })
        )
    );

    return {
      metas: metasWithTotals.map(({ goal, contributionTotal }) => ({
        ...formatGoal(goal, contributionTotal),
        template: goal.template,
      })),
    };
  } catch {
    return { error: "Error al listar metas", metas: [] };
  }
}

export async function listarMetasAsignables() {
  try {
    const { workspace } = await obtenerWorkspace("member");

    const metas = await prisma.goal.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        status: "active",
      },
      orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
    });

    const metasWithTotals = await Promise.all(
      metas.map(async (goal) => {
        const aggregate = await prisma.goalContribution.aggregate({
          where: {
            workspaceId: workspace.id,
            goalId: goal.id,
          },
          _sum: { amount: true },
        });

        return {
          goal,
          contributionTotal: Number(aggregate._sum.amount ?? 0),
        };
      })
    );

    return {
      metas: metasWithTotals.map(({ goal, contributionTotal }) => formatGoal(goal, contributionTotal)),
    };
  } catch {
    return { error: "Error al listar metas activas", metas: [] };
  }
}

export async function obtenerResumenMetas() {
  try {
    const { workspace } = await obtenerWorkspace("member");

    const metas = await prisma.goal.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    const metasWithTotals = await Promise.all(
      metas.map(async (goal) => {
        const aggregate = await prisma.goalContribution.aggregate({
          where: {
            workspaceId: workspace.id,
            goalId: goal.id,
          },
          _sum: { amount: true },
        });

        return {
          ...goal,
          computedCurrent: Number(aggregate._sum.amount ?? 0),
        };
      })
    );

    const activas = metasWithTotals.filter((m) => m.status === "active");
    const completadas = metasWithTotals.filter(
      (m) => m.status === "completed" || m.computedCurrent >= Number(m.targetAmount)
    );

    const totalTarget = activas.reduce((acc, item) => acc + Number(item.targetAmount), 0);
    const totalCurrent = activas.reduce((acc, item) => acc + item.computedCurrent, 0);
    const progresoGeneral = totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;

    const now = Date.now();
    const requiereAtencion = activas.filter((item) => {
      if (!item.deadline) return false;
      const total = Number(item.targetAmount);
      const current = item.computedCurrent;
      if (total <= 0 || current >= total) return false;

      const created = item.createdAt.getTime();
      const end = item.deadline.getTime();
      if (end <= created) return false;

      const elapsedRatio = Math.max(Math.min((now - created) / (end - created), 1), 0);
      const expected = total * elapsedRatio;
      return current + total * 0.05 < expected;
    }).length;

    return {
      metasActivas: activas.length,
      progresoGeneral,
      metasCompletadas: completadas.length,
      requiereAtencion,
      perspectiva: buildPerspectiva({
        activas: activas.length,
        completadas: completadas.length,
        requiereAtencion,
        progresoGeneral,
      }),
    };
  } catch {
    return {
      metasActivas: 0,
      progresoGeneral: 0,
      metasCompletadas: 0,
      requiereAtencion: 0,
      perspectiva: {
        title: "No se pudo calcular perspectivas",
        message: "Inténtalo nuevamente en unos segundos.",
        tone: "warning",
      },
    };
  }
}

export async function crearMeta(formData: FormData) {
  try {
    const { workspace, userId } = await obtenerWorkspace("member");
    enforceRateLimit({
      bucket: "goals:create:user",
      key: userId,
      limit: 20,
      windowMs: 60_000,
    });

    const name = String(formData.get("name") || "").trim();
    const targetAmount = toNumber(formData.get("targetAmount"));
    const currentAmount = Math.max(toNumber(formData.get("currentAmount")), 0);
    const currency = String(formData.get("currency") || workspace.baseCurrency).trim().toUpperCase();
    const category = String(formData.get("category") || "").trim() || null;
    const emoji = String(formData.get("emoji") || "").trim() || null;
    const templateId = String(formData.get("templateId") || "").trim() || null;
    const notes = String(formData.get("notes") || "").trim() || null;
    const deadlineInput = String(formData.get("deadline") || "").trim();

    if (!name) return { error: "El nombre de la meta es obligatorio." };
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return { error: "El monto meta debe ser mayor a 0." };
    }

    const deadline = deadlineInput ? new Date(deadlineInput) : null;
    if (deadline && Number.isNaN(deadline.getTime())) {
      return { error: "La fecha meta no es válida." };
    }

    if (templateId) {
      const template = await prisma.goalTemplate.findFirst({
        where: { id: templateId, isActive: true },
        select: { id: true },
      });
      if (!template) return { error: "La plantilla seleccionada no es válida." };
    }

    const nextStatus: GoalStatus = currentAmount >= targetAmount ? "completed" : "active";

    const goal = await prisma.goal.create({
      data: {
        workspaceId: workspace.id,
        templateId,
        name,
        targetAmount,
        currentAmount,
        currency,
        category,
        emoji,
        notes,
        deadline,
        status: nextStatus,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: userId,
        action: "create",
        entity: "goal",
        entityId: goal.id,
        after: {
          name,
          targetAmount,
          currentAmount,
          currency,
          category,
          emoji,
          deadline: deadline?.toISOString() ?? null,
          status: nextStatus,
          templateId,
        },
      },
    });

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true, meta: formatGoal(goal) };
  } catch (error) {
    if (isRateLimitError(error)) return { error: error.message };
    return { error: "Error al crear la meta." };
  }
}

export async function actualizarMeta(id: string, formData: FormData) {
  try {
    const { workspace, userId } = await obtenerWorkspace("member");
    enforceRateLimit({
      bucket: "goals:update:user",
      key: userId,
      limit: 30,
      windowMs: 60_000,
    });

    const goal = await prisma.goal.findFirst({
      where: { id, workspaceId: workspace.id, deletedAt: null },
    });

    if (!goal) return { error: "Meta no encontrada." };

    const name = String(formData.get("name") || goal.name).trim();
    const targetAmount = toNumber(formData.get("targetAmount") ?? goal.targetAmount);
    const currentAmount = Math.max(toNumber(formData.get("currentAmount") ?? goal.currentAmount), 0);
    const currency = String(formData.get("currency") || goal.currency).trim().toUpperCase();
    const category = String(formData.get("category") || goal.category || "").trim() || null;
    const emoji = String(formData.get("emoji") || goal.emoji || "").trim() || null;
    const notes = String(formData.get("notes") || goal.notes || "").trim() || null;
    const deadlineInput = String(formData.get("deadline") || "").trim();
    const status = getGoalStatus(formData.get("status") || goal.status);

    if (!name) return { error: "El nombre de la meta es obligatorio." };
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return { error: "El monto meta debe ser mayor a 0." };
    }

    const deadline = deadlineInput ? new Date(deadlineInput) : null;
    if (deadline && Number.isNaN(deadline.getTime())) {
      return { error: "La fecha meta no es válida." };
    }

    const autoStatus = currentAmount >= targetAmount ? "completed" : status;

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        name,
        targetAmount,
        currentAmount,
        currency,
        category,
        emoji,
        notes,
        deadline,
        status: autoStatus,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: userId,
        action: "update",
        entity: "goal",
        entityId: id,
        before: {
          name: goal.name,
          targetAmount: Number(goal.targetAmount),
          currentAmount: Number(goal.currentAmount),
          currency: goal.currency,
          category: goal.category,
          emoji: goal.emoji,
          status: goal.status,
          deadline: goal.deadline?.toISOString() ?? null,
        },
        after: {
          name,
          targetAmount,
          currentAmount,
          currency,
          category,
          emoji,
          status: autoStatus,
          deadline: deadline?.toISOString() ?? null,
        },
      },
    });

    revalidatePath("/goals");
    revalidatePath("/dashboard");
    return { success: true, meta: formatGoal(updated) };
  } catch (error) {
    if (isRateLimitError(error)) return { error: error.message };
    return { error: "Error al actualizar la meta." };
  }
}

export async function eliminarMeta(id: string) {
  try {
    const { workspace, userId } = await obtenerWorkspace("member");
    enforceRateLimit({
      bucket: "goals:delete:user",
      key: userId,
      limit: 15,
      windowMs: 60_000,
    });

    const goal = await prisma.goal.findFirst({
      where: { id, workspaceId: workspace.id, deletedAt: null },
    });

    if (!goal) return { error: "Meta no encontrada." };

    await prisma.goal.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: userId,
        action: "delete",
        entity: "goal",
        entityId: id,
        before: {
          name: goal.name,
          targetAmount: Number(goal.targetAmount),
          currentAmount: Number(goal.currentAmount),
          currency: goal.currency,
        },
      },
    });

    revalidatePath("/goals");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    if (isRateLimitError(error)) return { error: error.message };
    return { error: "Error al eliminar la meta." };
  }
}

export async function obtenerHistorialMeta(goalId: string) {
  try {
    const { workspace } = await obtenerWorkspace("member");

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        workspaceId: workspace.id,
        deletedAt: null,
      },
    });

    if (!goal) return { error: "Meta no encontrada.", historial: null };

    const contributions = await prisma.goalContribution.findMany({
      where: {
        workspaceId: workspace.id,
        goalId,
      },
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            date: true,
            type: true,
            amountOriginal: true,
            currencyOriginal: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const contributionTotal = contributions.reduce((acc, item) => acc + Number(item.amount), 0);

    if (Number(goal.currentAmount) !== contributionTotal) {
      await prisma.goal.update({
        where: { id: goal.id },
        data: {
          currentAmount: contributionTotal,
          status: contributionTotal >= Number(goal.targetAmount) ? "completed" : getGoalStatus(goal.status),
        },
      });
    }

    const meta = formatGoal(goal, contributionTotal);

    return {
      historial: {
        meta,
        contributions: contributions.map((item) => ({
          id: item.id,
          amount: Number(item.amount),
          currency: item.currency,
          amountBase: Number(item.amountBase),
          sourceAmount: item.sourceAmount != null ? Number(item.sourceAmount) : null,
          sourceCurrency: item.sourceCurrency,
          exchangeRate: item.exchangeRate != null ? Number(item.exchangeRate) : null,
          source: item.source,
          note: item.note,
          createdAt: item.createdAt.toISOString(),
          transaction: item.transaction
            ? {
                id: item.transaction.id,
                description: item.transaction.description,
                date: item.transaction.date.toISOString(),
                type: item.transaction.type,
                amountOriginal: Number(item.transaction.amountOriginal),
                currencyOriginal: item.transaction.currencyOriginal,
              }
            : null,
        })),
      },
    };
  } catch {
    return { error: "Error al obtener historial de la meta.", historial: null };
  }
}

export async function eliminarContribucionMeta(input: { goalId: string; contributionId: string }) {
  try {
    const { workspace, userId } = await obtenerWorkspace("member");
    enforceRateLimit({
      bucket: "goals:contribution:delete:user",
      key: userId,
      limit: 25,
      windowMs: 60_000,
    });

    const contribution = await prisma.goalContribution.findFirst({
      where: {
        id: input.contributionId,
        workspaceId: workspace.id,
        goalId: input.goalId,
      },
      include: {
        goal: {
          select: {
            id: true,
            targetAmount: true,
            currentAmount: true,
            status: true,
          },
        },
      },
    });

    if (!contribution) return { error: "Contribución no encontrada." };

    await prisma.$transaction(async (tx) => {
      await tx.goalContribution.delete({
        where: { id: contribution.id },
      });

      const aggregate = await tx.goalContribution.aggregate({
        where: {
          workspaceId: workspace.id,
          goalId: contribution.goal.id,
        },
        _sum: { amount: true },
      });

      const nextCurrent = Number(aggregate._sum.amount ?? 0);
      const nextStatus: GoalStatus =
        nextCurrent >= Number(contribution.goal.targetAmount)
          ? "completed"
          : contribution.goal.status === "completed"
            ? "active"
            : getGoalStatus(contribution.goal.status);

      await tx.goal.update({
        where: { id: contribution.goal.id },
        data: {
          currentAmount: nextCurrent,
          status: nextStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: workspace.id,
          actorId: userId,
          action: "delete_contribution",
          entity: "goal",
          entityId: contribution.goal.id,
          metadata: {
            contributionId: contribution.id,
            transactionId: contribution.transactionId,
            removedAmount: Number(contribution.amount),
            removedCurrency: contribution.currency,
          },
        },
      });
    });

    revalidatePath("/goals");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    if (isRateLimitError(error)) return { error: error.message };
    return { error: "No se pudo eliminar la contribución." };
  }
}

export async function asignarTransaccionAMeta(input: {
  goalId: string;
  transactionId: string;
  exchangeRate?: number;
  strategy?: "identity" | "divide" | "multiply";
}) {
  try {
    const { workspace, userId } = await obtenerWorkspace("member");
    enforceRateLimit({
      bucket: "goals:assign:user",
      key: userId,
      limit: 30,
      windowMs: 60_000,
    });

    const goal = await prisma.goal.findFirst({
      where: {
        id: input.goalId,
        workspaceId: workspace.id,
        deletedAt: null,
      },
    });

    if (!goal) return { error: "Meta no encontrada." };

    if (goal.status === "archived") {
      return { error: "No se puede asignar transacciones a una meta archivada." };
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: input.transactionId,
        workspaceId: workspace.id,
        deletedAt: null,
      },
    });

    if (!transaction) return { error: "Transacción no encontrada." };

    const sourceAmount = Math.abs(Number(transaction.amountOriginal));
    if (sourceAmount <= 0) {
      return { error: "La transacción no tiene monto válido para contribuir." };
    }

    const sourceCurrency = transaction.currencyOriginal;
    const needsConversion = sourceCurrency !== goal.currency;

    let contributionAmount = sourceAmount;
    let exchangeRateUsed: number | null = null;

    if (needsConversion && input.exchangeRate != null) {
      const strategy = input.strategy || "divide";
      const exchangeRate = Number(input.exchangeRate);

      if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
        return {
          error: `Si ingresas tipo de cambio, debe ser válido para convertir ${sourceCurrency} a ${goal.currency}.`,
        };
      }

      exchangeRateUsed = exchangeRate;
      contributionAmount =
        strategy === "multiply"
          ? sourceAmount * exchangeRate
          : sourceAmount / exchangeRate;
    }

    if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
      return { error: "No se pudo calcular el monto convertido para la meta." };
    }

    const roundedContribution = Number(contributionAmount.toFixed(2));
    const roundedAmountBase = Number(Math.abs(Number(transaction.amountBase)).toFixed(2));

    const updatedGoal = await prisma.$transaction(async (tx) => {
      const exists = await tx.goalContribution.findFirst({
        where: {
          workspaceId: workspace.id,
          goalId: goal.id,
          transactionId: transaction.id,
        },
        select: { id: true },
      });

      if (exists) {
        throw new Error("duplicate_contribution");
      }

      await tx.goalContribution.create({
        data: {
          workspaceId: workspace.id,
          goalId: goal.id,
          transactionId: transaction.id,
          amount: roundedContribution,
          currency: goal.currency,
          amountBase: roundedAmountBase,
          source: "transaction",
          note: transaction.description,
        },
      });

      const nextCurrent = Number(goal.currentAmount) + roundedContribution;
      const nextStatus: GoalStatus =
        nextCurrent >= Number(goal.targetAmount)
          ? "completed"
          : goal.status === "completed"
            ? "active"
            : getGoalStatus(goal.status);

      const updated = await tx.goal.update({
        where: { id: goal.id },
        data: {
          currentAmount: nextCurrent,
          status: nextStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: workspace.id,
          actorId: userId,
          action: "assign_transaction",
          entity: "goal",
          entityId: goal.id,
          metadata: {
            transactionId: transaction.id,
            contributionAmount: roundedContribution,
            contributionCurrency: goal.currency,
            sourceAmount,
            sourceCurrency,
            exchangeRate: exchangeRateUsed,
            strategy: exchangeRateUsed != null ? (input.strategy || "divide") : "identity",
          },
        },
      });

      return updated;
    });

    revalidatePath("/goals");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true, meta: formatGoal(updatedGoal) };
  } catch (error) {
    if (isRateLimitError(error)) return { error: error.message };
    if (error instanceof Error && error.message === "duplicate_contribution") {
      return { error: "Esta transacción ya fue asignada a la meta seleccionada." };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { error: "Esta transacción ya fue asignada a la meta seleccionada." };
      }
      if (error.code === "P2022") {
        return {
          error: "Tu base de datos está desactualizada para esta función. Ejecuta: npx prisma migrate dev",
        };
      }
      return { error: `No se pudo asignar la meta (DB:${error.code}).` };
    }

    if (error instanceof Error) {
      return { error: error.message || "Error al asignar transacción a la meta." };
    }

    return { error: "Error al asignar transacción a la meta." };
  }
}

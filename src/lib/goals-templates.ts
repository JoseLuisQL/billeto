import type { PrismaClient } from "@prisma/client";

export const GOAL_TEMPLATE_CATEGORIES = [
  "todas",
  "emergencia",
  "compra",
  "viaje",
  "educacion",
  "jubilacion",
  "otra",
] as const;

export type GoalTemplateCategory = Exclude<(typeof GOAL_TEMPLATE_CATEGORIES)[number], "todas">;

type GoalTemplateSeed = {
  name: string;
  description: string;
  category: GoalTemplateCategory;
  emoji: string;
  targetAmount: number;
  currency: string;
  suggestedMonths: number;
  sortOrder: number;
};

export function normalizeGoalTemplateName(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export const GOAL_TEMPLATES_SEED: GoalTemplateSeed[] = [
  {
    name: "Fondo de Emergencia",
    description: "Construye un colchón que cubra 3-6 meses de gastos.",
    category: "emergencia",
    emoji: "🛡️",
    targetAmount: 10000,
    currency: "USD",
    suggestedMonths: 12,
    sortOrder: 10,
  },
  {
    name: "Enganche de Casa",
    description: "Ahorra para el enganche de tu casa soñada.",
    category: "compra",
    emoji: "🏠",
    targetAmount: 50000,
    currency: "USD",
    suggestedMonths: 36,
    sortOrder: 20,
  },
  {
    name: "Vacaciones Soñadas",
    description: "Planifica y ahorra para tu escapada perfecta.",
    category: "viaje",
    emoji: "✈️",
    targetAmount: 5000,
    currency: "USD",
    suggestedMonths: 12,
    sortOrder: 30,
  },
  {
    name: "Auto Nuevo",
    description: "Ahorra para la compra de un vehículo nuevo.",
    category: "compra",
    emoji: "🚗",
    targetAmount: 25000,
    currency: "USD",
    suggestedMonths: 24,
    sortOrder: 40,
  },
  {
    name: "Fondo Educativo",
    description: "Invierte en educación o capacitación.",
    category: "educacion",
    emoji: "🎓",
    targetAmount: 20000,
    currency: "USD",
    suggestedMonths: 24,
    sortOrder: 50,
  },
  {
    name: "Boda",
    description: "Ahorra para tu día especial.",
    category: "otra",
    emoji: "💍",
    targetAmount: 15000,
    currency: "USD",
    suggestedMonths: 18,
    sortOrder: 60,
  },
  {
    name: "Ahorro para Jubilación",
    description: "Construye seguridad financiera a largo plazo.",
    category: "jubilacion",
    emoji: "🏖️",
    targetAmount: 100000,
    currency: "USD",
    suggestedMonths: 120,
    sortOrder: 70,
  },
  {
    name: "Iniciar un Negocio",
    description: "Financia tus sueños empresariales.",
    category: "otra",
    emoji: "💼",
    targetAmount: 30000,
    currency: "USD",
    suggestedMonths: 24,
    sortOrder: 80,
  },
  {
    name: "Pago de Deudas",
    description: "Liquida deudas pendientes.",
    category: "emergencia",
    emoji: "💳",
    targetAmount: 15000,
    currency: "USD",
    suggestedMonths: 18,
    sortOrder: 90,
  },
  {
    name: "Renovación del Hogar",
    description: "Financia tu proyecto de mejora del hogar.",
    category: "compra",
    emoji: "🔨",
    targetAmount: 20000,
    currency: "USD",
    suggestedMonths: 18,
    sortOrder: 100,
  },
];

export async function ensureDefaultGoalTemplates(db: Pick<PrismaClient, "goalTemplate">) {
  const existing = await db.goalTemplate.findMany({
    where: { isActive: true },
    select: { normalizedName: true },
  });

  const existingSet = new Set(existing.map((item) => item.normalizedName));
  const missing = GOAL_TEMPLATES_SEED.filter(
    (item) => !existingSet.has(normalizeGoalTemplateName(item.name))
  );

  if (missing.length === 0) return;

  await db.goalTemplate.createMany({
    data: missing.map((item) => ({
      name: item.name,
      normalizedName: normalizeGoalTemplateName(item.name),
      description: item.description,
      category: item.category,
      emoji: item.emoji,
      targetAmount: item.targetAmount,
      currency: item.currency,
      suggestedMonths: item.suggestedMonths,
      sortOrder: item.sortOrder,
      isActive: true,
    })),
    skipDuplicates: true,
  });
}

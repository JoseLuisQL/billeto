import type { PrismaClient } from "@prisma/client";

export const SYSTEM_CATEGORY_OWNER_ID = "__SYSTEM__";

type SeedCategory = {
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income" | "both";
};

export function normalizeCategoryName(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export const DEFAULT_CATEGORIES_SEED: SeedCategory[] = [
  { name: "Redes Sociales", icon: "💬", color: "#6366F1", type: "expense" },
  { name: "Streaming", icon: "📺", color: "#EF4444", type: "expense" },
  { name: "Música", icon: "🎵", color: "#A855F7", type: "expense" },
  { name: "IA", icon: "🤖", color: "#22C55E", type: "expense" },
  { name: "Productividad", icon: "⚡", color: "#F59E0B", type: "expense" },
  { name: "Desarrollo", icon: "💻", color: "#3B82F6", type: "expense" },
  { name: "Almacenamiento", icon: "☁️", color: "#06B6D4", type: "expense" },
  { name: "Delivery", icon: "🛵", color: "#F97316", type: "expense" },
  { name: "Internet", icon: "📡", color: "#0EA5E9", type: "expense" },
  { name: "Finanzas", icon: "💰", color: "#10B981", type: "both" },
  { name: "Transferencia", icon: "↔️", color: "#64748B", type: "both" },
  { name: "Gimnasio", icon: "🏋️", color: "#84CC16", type: "expense" },
  { name: "Hijos", icon: "👼", color: "#EC4899", type: "expense" },
  { name: "Hobbies", icon: "🎯", color: "#8B5CF6", type: "expense" },
  { name: "Inversiones", icon: "📈", color: "#16A34A", type: "income" },
  { name: "Mantenimiento", icon: "🔧", color: "#6B7280", type: "expense" },
  { name: "Mascotas", icon: "🐶", color: "#F59E0B", type: "expense" },
  { name: "Otros", icon: "📦", color: "#71717A", type: "expense" },
  { name: "Prestamos", icon: "🏦", color: "#1D4ED8", type: "both" },
  { name: "Regalos", icon: "🎁", color: "#E11D48", type: "expense" },
  { name: "Ropa", icon: "👕", color: "#0EA5E9", type: "expense" },
  { name: "Salud", icon: "🏥", color: "#DC2626", type: "expense" },
  { name: "Seguros", icon: "🔒", color: "#334155", type: "expense" },
  { name: "Servicios", icon: "🚰", color: "#0284C7", type: "expense" },
  { name: "Subscripciones", icon: "📱", color: "#7C3AED", type: "expense" },
  { name: "Supermercado", icon: "🛒", color: "#22C55E", type: "expense" },
  { name: "Tarjetas", icon: "💳", color: "#0F766E", type: "both" },
  { name: "Ahorros", icon: "💰", color: "#15803D", type: "income" },
  { name: "Transporte", icon: "🚌", color: "#2563EB", type: "expense" },
  { name: "Vacaciones", icon: "🌴", color: "#14B8A6", type: "expense" },
  { name: "Vivienda", icon: "🏠", color: "#0891B2", type: "expense" },
  { name: "Emprendimiento", icon: "💼", color: "#4F46E5", type: "income" },
  { name: "Pareja", icon: "💑", color: "#DB2777", type: "expense" },
  { name: "Reconciliación de cuenta", icon: "🔄", color: "#475569", type: "both" },
  { name: "Trabajo", icon: "💼", color: "#1D4ED8", type: "income" },
  { name: "Auto", icon: "🚗", color: "#2563EB", type: "expense" },
  { name: "Comida", icon: "🍽️", color: "#F97316", type: "expense" },
  { name: "Combustible", icon: "⛽", color: "#DC2626", type: "expense" },
  { name: "Decoración", icon: "🎨", color: "#9333EA", type: "expense" },
  { name: "Deportes", icon: "⚽", color: "#65A30D", type: "expense" },
  { name: "Donaciones", icon: "🤝", color: "#F43F5E", type: "expense" },
  { name: "Educación", icon: "📚", color: "#0284C7", type: "expense" },
  { name: "Entretenimiento", icon: "🎮", color: "#8B5CF6", type: "expense" },
  { name: "Estacionamiento", icon: "🅿️", color: "#0369A1", type: "expense" },
  { name: "Farmacia", icon: "💊", color: "#EF4444", type: "expense" },
];

export async function ensureDefaultCategoriesForWorkspace(
  db: Pick<PrismaClient, "category">,
  workspaceId: string
) {
  const existing = await db.category.findMany({
    where: {
      workspaceId,
      ownerUserId: SYSTEM_CATEGORY_OWNER_ID,
      deletedAt: null,
    },
    select: { normalizedName: true },
  });

  const existingSet = new Set(existing.map((c) => c.normalizedName));
  const missing = DEFAULT_CATEGORIES_SEED.filter((cat) => !existingSet.has(normalizeCategoryName(cat.name)));

  if (missing.length === 0) return;

  await db.category.createMany({
    data: missing.map((cat) => ({
      workspaceId,
      ownerUserId: SYSTEM_CATEGORY_OWNER_ID,
      name: cat.name,
      normalizedName: normalizeCategoryName(cat.name),
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
    })),
  });
}

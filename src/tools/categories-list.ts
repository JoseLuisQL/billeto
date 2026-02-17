import { type InferSchema } from "xmcp";
import { prisma } from "@/lib/prisma";
import { SYSTEM_CATEGORY_OWNER_ID } from "@/lib/categories-defaults";

export const schema = {};

export const metadata = {
    name: "categories_list",
    description: "Listar las categorías disponibles del usuario. Útil para que el agente sepa a qué categoría asignar una transacción.",
    annotations: {
        title: "Listar categorías",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
    },
};

export default async function categoriesList(
    _args: InferSchema<typeof schema>,
    context: { workspaceId: string; userId?: string }
) {
    const categories = await prisma.category.findMany({
        where: {
            workspaceId: context.workspaceId,
            deletedAt: null,
            OR: context.userId
                ? [
                    { ownerUserId: SYSTEM_CATEGORY_OWNER_ID },
                    { ownerUserId: context.userId },
                ]
                : [{ ownerUserId: SYSTEM_CATEGORY_OWNER_ID }],
        },
        orderBy: { name: "asc" },
        select: { id: true, name: true, icon: true, color: true, type: true },
    });

    if (categories.length === 0) return "No hay categorías creadas.";

    const lines = categories.map((c) => {
        const icon = c.icon || "📁";
        return `${icon} ${c.name} (${c.type}) — ID: ${c.id}`;
    });

    return `📂 Categorías disponibles:\n${lines.join("\n")}`;
}

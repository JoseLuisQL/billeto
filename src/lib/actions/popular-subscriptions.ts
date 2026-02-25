"use server";

import { prisma } from "@/lib/prisma";

/**
 * Server Actions para Suscripciones Populares.
 * Datos globales (no pertenecen a ningún workspace).
 */

/**
 * Listar suscripciones populares con filtro opcional por categoría.
 */
export async function listarSuscripcionesPopulares(category?: string) {
    try {
        const where: Record<string, unknown> = { isActive: true };
        if (category && category !== "Todas") {
            where.category = category;
        }

        const suscripciones = await prisma.popularSubscription.findMany({
            where,
            orderBy: { sortOrder: "asc" },
        });

        return {
            suscripciones: suscripciones.map((s) => ({
                id: s.id,
                name: s.name,
                icon: s.icon,
                color: s.color,
                price: Number(s.price),
                currency: s.currency,
                category: s.category,
                frequency: s.frequency,
            })),
        };
    } catch {
        return { suscripciones: [] };
    }
}

/**
 * Obtener categorías únicas de suscripciones populares.
 */
export async function obtenerCategoriasPopulares() {
    try {
        const result = await prisma.popularSubscription.findMany({
            where: { isActive: true },
            select: { category: true },
            distinct: ["category"],
            orderBy: { sortOrder: "asc" },
        });

        return { categorias: result.map((r) => r.category) };
    } catch {
        return { categorias: [] };
    }
}

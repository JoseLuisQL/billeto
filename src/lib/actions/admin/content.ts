"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin-access";

// ─── Popular Subscriptions ───

export async function listarPopularSubscriptionsAdmin() {
    await requireAdmin();
    const subs = await prisma.popularSubscription.findMany({ orderBy: { sortOrder: "asc" } });
    return subs.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        color: s.color,
        price: Number(s.price),
        currency: s.currency,
        category: s.category,
        frequency: s.frequency,
        isActive: s.isActive,
        sortOrder: s.sortOrder,
    }));
}

export type AdminPopularSubRow = Awaited<ReturnType<typeof listarPopularSubscriptionsAdmin>>[number];

export async function crearPopularSubscriptionAdmin(data: {
    name: string; icon?: string; color?: string; price: number; currency: string; category: string; frequency: string;
}) {
    const admin = await requireAdmin();
    const sub = await prisma.popularSubscription.create({ data: { ...data, price: data.price } });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "create_popular_sub", entity: "popular_subscription", entityId: sub.id },
    });
    return { success: true };
}

export async function actualizarPopularSubscriptionAdmin(id: string, data: {
    name?: string; icon?: string; color?: string; price?: number; currency?: string; category?: string; frequency?: string; isActive?: boolean; sortOrder?: number;
}) {
    const admin = await requireAdmin();
    await prisma.popularSubscription.update({ where: { id }, data });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "update_popular_sub", entity: "popular_subscription", entityId: id },
    });
    return { success: true };
}

export async function eliminarPopularSubscriptionAdmin(id: string) {
    const admin = await requireAdmin();
    await prisma.popularSubscription.delete({ where: { id } });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "delete_popular_sub", entity: "popular_subscription", entityId: id },
    });
    return { success: true };
}

// ─── Goal Templates ───

export async function listarGoalTemplatesAdmin() {
    await requireAdmin();
    const templates = await prisma.goalTemplate.findMany({ orderBy: { sortOrder: "asc" } });
    return templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        emoji: t.emoji,
        targetAmount: Number(t.targetAmount),
        currency: t.currency,
        suggestedMonths: t.suggestedMonths,
        sortOrder: t.sortOrder,
        isActive: t.isActive,
    }));
}

export type AdminGoalTemplateRow = Awaited<ReturnType<typeof listarGoalTemplatesAdmin>>[number];

export async function crearGoalTemplateAdmin(data: {
    name: string; description: string; category: string; emoji?: string; targetAmount: number; currency: string; suggestedMonths: number;
}) {
    const admin = await requireAdmin();
    const normalizedName = data.name.toLowerCase().trim().replace(/\s+/g, "_");
    const template = await prisma.goalTemplate.create({ data: { ...data, normalizedName } });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "create_goal_template", entity: "goal_template", entityId: template.id },
    });
    return { success: true };
}

export async function actualizarGoalTemplateAdmin(id: string, data: {
    name?: string; description?: string; category?: string; emoji?: string; targetAmount?: number; currency?: string; suggestedMonths?: number; isActive?: boolean; sortOrder?: number;
}) {
    const admin = await requireAdmin();
    await prisma.goalTemplate.update({ where: { id }, data });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "update_goal_template", entity: "goal_template", entityId: id },
    });
    return { success: true };
}

export async function eliminarGoalTemplateAdmin(id: string) {
    const admin = await requireAdmin();
    await prisma.goalTemplate.delete({ where: { id } });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "delete_goal_template", entity: "goal_template", entityId: id },
    });
    return { success: true };
}

// ─── System Default Categories (global overview) ───

export async function listarCategoriasGlobalesAdmin() {
    await requireAdmin();

    // Get all unique category names across workspaces with counts
    const categories = await prisma.category.groupBy({
        by: ["name", "type", "icon", "color"],
        where: { deletedAt: null, ownerUserId: "__SYSTEM__" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
    });

    return categories.map((c) => ({
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        workspaceCount: c._count.id,
    }));
}

export type AdminCategoryRow = Awaited<ReturnType<typeof listarCategoriasGlobalesAdmin>>[number];

"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin-access";

const promptGuardConfigSchema = z.object({
    enabled: z.boolean(),
    maxMessageLength: z.coerce.number().int().min(100).max(10000),
});

// ─── AI Provider Config ───

export async function listarProveedoresIAAdmin() {
    await requireAdmin();
    const providers = await prisma.aIProviderConfig.findMany({ orderBy: { createdAt: "desc" } });
    return providers.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        providerType: p.providerType,
        isActive: p.isActive,
        isDefault: p.isDefault,
        hasApiKey: !!p.apiKey,
        baseUrl: p.baseUrl,
        modelId: p.modelId,
        maxTokens: p.maxTokens,
        temperature: p.temperature,
        config: p.config as Record<string, unknown> | null,
        createdAt: p.createdAt.toISOString(),
    }));
}

export type AdminProviderRow = Awaited<ReturnType<typeof listarProveedoresIAAdmin>>[number];

export async function crearProveedorIAAdmin(data: {
    name: string; slug: string; providerType: string; apiKey?: string; baseUrl?: string; modelId: string; maxTokens?: number; temperature?: number;
}) {
    const admin = await requireAdmin();
    const provider = await prisma.aIProviderConfig.create({ data });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "create_ai_provider", entity: "ai_provider", entityId: provider.id },
    });
    return { success: true, id: provider.id };
}

export async function actualizarProveedorIAAdmin(id: string, data: {
    name?: string; providerType?: string; apiKey?: string; baseUrl?: string; modelId?: string; maxTokens?: number; temperature?: number; isActive?: boolean; isDefault?: boolean;
}) {
    const admin = await requireAdmin();

    // If setting as default, unset all others first
    if (data.isDefault === true) {
        await prisma.aIProviderConfig.updateMany({ data: { isDefault: false } });
    }

    await prisma.aIProviderConfig.update({ where: { id }, data });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "update_ai_provider", entity: "ai_provider", entityId: id },
    });
    return { success: true };
}

export async function eliminarProveedorIAAdmin(id: string) {
    const admin = await requireAdmin();
    await prisma.aIProviderConfig.delete({ where: { id } });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "delete_ai_provider", entity: "ai_provider", entityId: id },
    });
    return { success: true };
}

// ─── AI Tool Config ───

export async function listarToolsIAAdmin() {
    await requireAdmin();
    const tools = await prisma.aIToolConfig.findMany({ orderBy: { sortOrder: "asc" } });
    return tools.map((t) => ({
        id: t.id,
        toolName: t.toolName,
        displayName: t.displayName,
        description: t.description,
        isEnabled: t.isEnabled,
        inputSchema: t.inputSchema as Record<string, unknown>,
        config: t.config as Record<string, unknown> | null,
        sortOrder: t.sortOrder,
        createdAt: t.createdAt.toISOString(),
    }));
}

export type AdminToolRow = Awaited<ReturnType<typeof listarToolsIAAdmin>>[number];

export async function crearToolIAAdmin(data: {
    toolName: string; displayName: string; description: string; inputSchema: Record<string, unknown>;
}) {
    const admin = await requireAdmin();
    const tool = await prisma.aIToolConfig.create({ data });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "create_ai_tool", entity: "ai_tool", entityId: tool.id },
    });
    return { success: true };
}

export async function actualizarToolIAAdmin(id: string, data: {
    displayName?: string; description?: string; isEnabled?: boolean; inputSchema?: Record<string, unknown>; sortOrder?: number;
}) {
    const admin = await requireAdmin();
    await prisma.aIToolConfig.update({ where: { id }, data });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "update_ai_tool", entity: "ai_tool", entityId: id },
    });
    return { success: true };
}

export async function eliminarToolIAAdmin(id: string) {
    const admin = await requireAdmin();
    await prisma.aIToolConfig.delete({ where: { id } });
    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "delete_ai_tool", entity: "ai_tool", entityId: id },
    });
    return { success: true };
}

// ─── System Prompt ───

export async function obtenerSystemPromptAdmin() {
    await requireAdmin();
    const config = await prisma.systemConfig.findFirst({ where: { key: "ai_system_prompt" } });
    return {
        prompt: (config?.value as { prompt?: string })?.prompt ?? "",
        updatedAt: config?.updatedAt?.toISOString() ?? null,
    };
}

export async function guardarSystemPromptAdmin(prompt: string) {
    const admin = await requireAdmin();

    await prisma.systemConfig.upsert({
        where: { key: "ai_system_prompt" },
        update: { value: { prompt } },
        create: { key: "ai_system_prompt", value: { prompt } },
    });

    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "update_system_prompt", entity: "system_config", entityId: "ai_system_prompt" },
    });

    return { success: true };
}

// ─── Prompt Guard Config ───

export async function obtenerPromptGuardConfigAdmin() {
    await requireAdmin();
    const config = await prisma.systemConfig.findFirst({ where: { key: "prompt_guard_config" } });
    const value = config?.value as Record<string, unknown> | null;

    return {
        enabled: (value?.enabled as boolean) ?? true,
        maxMessageLength: (value?.maxMessageLength as number) ?? 2000,
        blockedPatternsCount: 30, // from prompt-guard.ts BLOCKED_PATTERNS
        suspiciousPatternsCount: 15, // from prompt-guard.ts SUSPICIOUS_PATTERNS
        updatedAt: config?.updatedAt?.toISOString() ?? null,
    };
}

export async function guardarPromptGuardConfigAdmin(data: { enabled: boolean; maxMessageLength: number }) {
    const admin = await requireAdmin();
    const validated = promptGuardConfigSchema.parse(data);

    await prisma.systemConfig.upsert({
        where: { key: "prompt_guard_config" },
        update: { value: validated },
        create: { key: "prompt_guard_config", value: validated },
    });

    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "update_prompt_guard", entity: "system_config", entityId: "prompt_guard_config" },
    });

    return { success: true };
}

// ─── Keyword Groups ───

export async function obtenerKeywordGroupsAdmin() {
    await requireAdmin();
    const config = await prisma.systemConfig.findFirst({ where: { key: "keyword_groups" } });
    return ((config?.value as { groups?: Array<{ name: string; keywords: string[] }> })?.groups) ?? [];
}

export async function guardarKeywordGroupsAdmin(groups: Array<{ name: string; keywords: string[] }>) {
    const admin = await requireAdmin();

    await prisma.systemConfig.upsert({
        where: { key: "keyword_groups" },
        update: { value: { groups } },
        create: { key: "keyword_groups", value: { groups } },
    });

    await prisma.auditLog.create({
        data: { actorId: admin.userId, actorType: "admin", action: "update_keyword_groups", entity: "system_config", entityId: "keyword_groups" },
    });

    return { success: true };
}

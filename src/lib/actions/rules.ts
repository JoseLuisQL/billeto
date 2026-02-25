"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireWorkspaceAccess } from "@/lib/security/access";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { SYSTEM_CATEGORY_OWNER_ID } from "@/lib/categories-defaults";

// ─── Types ───────────────────────────────────────────

export type RuleCondition = {
    id: string;
    field: "description" | "amount" | "account" | "category" | "type" | "currency" | "origin" | "originNumber" | "name";
    operator: "contains" | "equals" | "startsWith" | "endsWith" | "regex";
    value: string;
    caseSensitive?: boolean;
};

export type RuleAction = {
    id: string;
    type: "setCategory" | "setAccount" | "modifyDescription" | "addToGoal" | "addTags" | "doNothing";
    categoryId?: string;
    accountId?: string;
    goalId?: string;
    value?: string;
    tags?: string[];
    modifyType?: "append" | "replace" | "prepend";
    amountType?: "percentage" | "fixed";
    amountValue?: number;
};

export type RuleData = {
    name: string;
    conditions: RuleCondition[];
    actions: RuleAction[];
    priority?: number;
    status?: "active" | "paused";
};

// ─── Transaction Context & Rule Result Types ─────────

/**
 * Context object representing the transaction being evaluated.
 * Pass as much info as available; missing fields simply won't match field-specific conditions.
 */
export type TransactionContext = {
    description: string;
    amount?: number;
    accountId?: string;
    accountName?: string;
    categoryId?: string;
    categoryName?: string;
    type?: string;        // "income" | "expense"
    currency?: string;
    origin?: string;      // source field
    originNumber?: string;
    name?: string;        // payee name
};

/**
 * Aggregated result of all matching rules.
 */
export type RuleResult = {
    categoryId?: string;
    accountId?: string;
    goalContributions: { goalId: string; amountType: "percentage" | "fixed"; amountValue: number }[];
    tags: string[];
    descriptionModification?: { type: "append" | "replace" | "prepend"; value: string };
    matchedRuleIds: string[];
};

// ─── Helpers ─────────────────────────────────────────

function toAuditJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value));
}

async function obtenerWorkspace(minRole: "owner" | "admin" | "member" = "member") {
    return requireWorkspaceAccess(minRole);
}

function isRateLimitError(e: unknown): e is Error & { message: string } {
    return e instanceof Error && e.message.includes("rate");
}

/**
 * Normalize legacy single-object conditions/actions to array format.
 */
function normalizeConditions(raw: unknown): RuleCondition[] {
    if (Array.isArray(raw)) return raw as RuleCondition[];
    if (raw && typeof raw === "object" && "operator" in raw) {
        const obj = raw as Record<string, unknown>;
        return [{
            id: crypto.randomUUID(),
            field: (obj.field as RuleCondition["field"]) || "description",
            operator: (obj.operator as RuleCondition["operator"]) || "contains",
            value: String(obj.value || ""),
            caseSensitive: false,
        }];
    }
    return [];
}

function normalizeActions(raw: unknown): RuleAction[] {
    if (Array.isArray(raw)) return raw as RuleAction[];
    if (raw && typeof raw === "object" && "type" in raw) {
        const obj = raw as Record<string, unknown>;
        return [{
            id: crypto.randomUUID(),
            type: (obj.type as RuleAction["type"]) || "setCategory",
            categoryId: obj.categoryId as string | undefined,
            accountId: obj.accountId as string | undefined,
            goalId: obj.goalId as string | undefined,
            value: obj.value as string | undefined,
        }];
    }
    return [];
}

// ─── Server Actions ──────────────────────────────────

/**
 * Estadísticas para KPI cards.
 */
export async function obtenerEstadisticasReglas() {
    try {
        const { workspace } = await obtenerWorkspace();
        const [total, activas] = await Promise.all([
            prisma.rule.count({
                where: { workspaceId: workspace.id, deletedAt: null },
            }),
            prisma.rule.count({
                where: { workspaceId: workspace.id, deletedAt: null, status: "active" },
            }),
        ]);
        return { total, activas };
    } catch {
        return { total: 0, activas: 0 };
    }
}

/**
 * Listar todas las reglas activas del workspace.
 */
export async function listarReglas() {
    try {
        const { workspace } = await obtenerWorkspace();

        const reglas = await prisma.rule.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        });

        return {
            reglas: reglas.map((r) => ({
                id: r.id,
                name: r.name,
                conditions: normalizeConditions(r.conditions),
                actions: normalizeActions(r.actions),
                status: r.status as "active" | "paused",
                priority: r.priority,
                createdAt: r.createdAt.toISOString(),
            })),
        };
    } catch {
        return { reglas: [] };
    }
}

/**
 * Crear una nueva regla de auto-categorización.
 */
export async function crearRegla(data: RuleData) {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "rules:create:user",
            key: userId,
            limit: 15,
            windowMs: 60_000,
        });

        if (!data.name?.trim()) {
            return { ok: false, error: "El nombre es obligatorio." };
        }

        const regla = await prisma.rule.create({
            data: {
                workspaceId: workspace.id,
                name: data.name.trim(),
                conditions: data.conditions as unknown as Prisma.InputJsonValue,
                actions: data.actions as unknown as Prisma.InputJsonValue,
                priority: data.priority ?? 1,
                status: data.status || "active",
            },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "rule.create",
                entity: "Rule",
                entityId: regla.id,
                after: toAuditJson({ name: data.name, conditions: data.conditions, actions: data.actions }),
            },
        });

        revalidatePath("/transactions/rules");
        return {
            ok: true,
            regla: {
                id: regla.id,
                name: regla.name,
                conditions: normalizeConditions(regla.conditions),
                actions: normalizeActions(regla.actions),
                status: regla.status,
                priority: regla.priority,
                createdAt: regla.createdAt.toISOString(),
            },
        };
    } catch (err: unknown) {
        if (isRateLimitError(err)) return { ok: false, error: err.message };
        console.error("[crearRegla] Error:", err);
        return { ok: false, error: "Error al crear regla." };
    }
}

/**
 * Actualizar una regla existente.
 */
export async function actualizarRegla(id: string, data: Partial<RuleData>) {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "rules:update:user",
            key: userId,
            limit: 30,
            windowMs: 60_000,
        });

        const reglaExistente = await prisma.rule.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!reglaExistente) return { ok: false, error: "Regla no encontrada." };

        const updateData: Record<string, unknown> = {};

        if (data.name !== undefined) updateData.name = data.name.trim();
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.status !== undefined) {
            if (data.status !== "active" && data.status !== "paused") {
                return { ok: false, error: "Estado inválido. Usa active o paused." };
            }
            updateData.status = data.status;
        }
        if (data.conditions !== undefined) {
            updateData.conditions = data.conditions as unknown as Prisma.InputJsonValue;
        }
        if (data.actions !== undefined) {
            updateData.actions = data.actions as unknown as Prisma.InputJsonValue;
        }

        await prisma.rule.updateMany({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            data: updateData,
        });

        const regla = await prisma.rule.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!regla) return { ok: false, error: "Regla no encontrada tras actualizar." };

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "rule.update",
                entity: "Rule",
                entityId: id,
                before: toAuditJson({ name: reglaExistente.name }),
                after: toAuditJson(updateData),
            },
        });

        revalidatePath("/transactions/rules");
        return {
            ok: true,
            regla: {
                id: regla.id,
                name: regla.name,
                conditions: normalizeConditions(regla.conditions),
                actions: normalizeActions(regla.actions),
                status: regla.status,
                priority: regla.priority,
                createdAt: regla.createdAt.toISOString(),
            },
        };
    } catch (err: unknown) {
        if (isRateLimitError(err)) return { ok: false, error: err.message };
        return { ok: false, error: "Error al actualizar regla." };
    }
}

/**
 * Eliminar una regla (soft delete).
 */
export async function eliminarRegla(id: string) {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "rules:delete:user",
            key: userId,
            limit: 10,
            windowMs: 60_000,
        });

        const regla = await prisma.rule.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!regla) return { ok: false, error: "Regla no encontrada." };

        await prisma.rule.updateMany({
            where: { id, workspaceId: workspace.id, deletedAt: null },
            data: { deletedAt: new Date(), deletedBy: userId },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "rule.delete",
                entity: "Rule",
                entityId: id,
            },
        });

        revalidatePath("/transactions/rules");
        return { ok: true };
    } catch (err: unknown) {
        if (isRateLimitError(err)) return { ok: false, error: err.message };
        return { ok: false, error: "Error al eliminar regla." };
    }
}

/**
 * Duplicar una regla existente.
 */
export async function duplicarRegla(id: string) {
    try {
        const { userId, workspace } = await obtenerWorkspace("member");
        enforceRateLimit({
            bucket: "rules:create:user",
            key: userId,
            limit: 15,
            windowMs: 60_000,
        });

        const original = await prisma.rule.findFirst({
            where: { id, workspaceId: workspace.id, deletedAt: null },
        });

        if (!original) return { ok: false, error: "Regla no encontrada." };

        const duplicada = await prisma.rule.create({
            data: {
                workspaceId: workspace.id,
                name: `Copia de ${original.name}`,
                conditions: original.conditions as Prisma.InputJsonValue,
                actions: original.actions as Prisma.InputJsonValue,
                priority: original.priority,
                status: "paused",
            },
        });

        await prisma.auditLog.create({
            data: {
                workspaceId: workspace.id,
                actorId: userId,
                action: "rule.duplicate",
                entity: "Rule",
                entityId: duplicada.id,
                after: toAuditJson({ originalId: id, name: duplicada.name }),
            },
        });

        revalidatePath("/transactions/rules");
        return {
            ok: true,
            regla: {
                id: duplicada.id,
                name: duplicada.name,
                conditions: normalizeConditions(duplicada.conditions),
                actions: normalizeActions(duplicada.actions),
                status: duplicada.status,
                priority: duplicada.priority,
                createdAt: duplicada.createdAt.toISOString(),
            },
        };
    } catch (err: unknown) {
        if (isRateLimitError(err)) return { ok: false, error: err.message };
        return { ok: false, error: "Error al duplicar regla." };
    }
}

/**
 * Probar condiciones contra una descripción de prueba.
 * Retorna las reglas que coinciden.
 */
export async function probarReglas(testDescription: string) {
    try {
        const { workspace } = await obtenerWorkspace();

        const reglas = await prisma.rule.findMany({
            where: {
                workspaceId: workspace.id,
                status: "active",
                deletedAt: null,
            },
            orderBy: { priority: "desc" },
        });

        const resultados: {
            ruleId: string;
            ruleName: string;
            matched: boolean;
            matchedConditions: string[];
            actions: RuleAction[];
        }[] = [];

        const ctx: TransactionContext = { description: testDescription };

        for (const regla of reglas) {
            const conditions = normalizeConditions(regla.conditions);
            const actions = normalizeActions(regla.actions);

            const matchedConditions: string[] = [];
            let allMatch = true;

            for (const cond of conditions) {
                if (evaluateConditionFull(cond, ctx)) {
                    matchedConditions.push(cond.id);
                } else {
                    allMatch = false;
                }
            }

            if (conditions.length === 0) allMatch = false;

            resultados.push({
                ruleId: regla.id,
                ruleName: regla.name,
                matched: allMatch,
                matchedConditions,
                actions: allMatch ? actions : [],
            });
        }

        return { ok: true, resultados };
    } catch {
        return { ok: false, resultados: [], error: "Error al probar reglas." };
    }
}

// ─── Rule Engine ─────────────────────────────────────

/**
 * Compare two string values using the specified operator.
 */
function compareStrings(
    fieldValue: string,
    condValue: string,
    operator: RuleCondition["operator"],
    caseSensitive: boolean,
    rawCondValue: string
): boolean {
    let fv = fieldValue;
    let cv = condValue;

    if (!caseSensitive) {
        fv = fv.toLowerCase();
        cv = cv.toLowerCase();
    }

    switch (operator) {
        case "contains":
            return fv.includes(cv);
        case "equals":
            return fv === cv;
        case "startsWith":
            return fv.startsWith(cv);
        case "endsWith":
            return fv.endsWith(cv);
        case "regex":
            try {
                const flags = caseSensitive ? "" : "i";
                return new RegExp(rawCondValue, flags).test(fieldValue);
            } catch {
                return false;
            }
        default:
            return false;
    }
}

/**
 * Compare a numeric field value against a condition.
 * For numbers, "equals" checks numeric equality, "contains" is treated as equals.
 * "startsWith"/"endsWith" check the string representation.
 */
function compareNumbers(
    fieldValue: number,
    condValue: string,
    operator: RuleCondition["operator"]
): boolean {
    const numCondValue = parseFloat(condValue);

    switch (operator) {
        case "equals":
        case "contains":
            return !isNaN(numCondValue) && fieldValue === numCondValue;
        case "startsWith":
            return String(fieldValue).startsWith(condValue);
        case "endsWith":
            return String(fieldValue).endsWith(condValue);
        case "regex":
            try {
                return new RegExp(condValue).test(String(fieldValue));
            } catch {
                return false;
            }
        default:
            return false;
    }
}

/**
 * Evaluate a single condition against full transaction context.
 * Supports all field types: description, amount, account, category, type, currency, origin, originNumber, name.
 */
function evaluateConditionFull(cond: RuleCondition, ctx: TransactionContext): boolean {
    if (!cond.value) return false;
    const caseSensitive = cond.caseSensitive ?? false;

    switch (cond.field) {
        case "description":
            return compareStrings(ctx.description, cond.value, cond.operator, caseSensitive, cond.value);

        case "amount": {
            if (ctx.amount === undefined || ctx.amount === null) return false;
            return compareNumbers(ctx.amount, cond.value, cond.operator);
        }

        case "account": {
            const val = ctx.accountName || ctx.accountId || "";
            if (!val) return false;
            return compareStrings(val, cond.value, cond.operator, caseSensitive, cond.value);
        }

        case "category": {
            const val = ctx.categoryName || ctx.categoryId || "";
            if (!val) return false;
            return compareStrings(val, cond.value, cond.operator, caseSensitive, cond.value);
        }

        case "type": {
            const val = ctx.type || "";
            if (!val) return false;
            return compareStrings(val, cond.value, cond.operator, caseSensitive, cond.value);
        }

        case "currency": {
            const val = ctx.currency || "";
            if (!val) return false;
            return compareStrings(val, cond.value, cond.operator, caseSensitive, cond.value);
        }

        case "origin": {
            const val = ctx.origin || "";
            if (!val) return false;
            return compareStrings(val, cond.value, cond.operator, caseSensitive, cond.value);
        }

        case "originNumber": {
            const val = ctx.originNumber || "";
            if (!val) return false;
            return compareStrings(val, cond.value, cond.operator, caseSensitive, cond.value);
        }

        case "name": {
            const val = ctx.name || "";
            if (!val) return false;
            return compareStrings(val, cond.value, cond.operator, caseSensitive, cond.value);
        }

        default:
            return false;
    }
}

/**
 * Legacy evaluateCondition — only for description field (backward compat).
 */
function evaluateCondition(cond: RuleCondition, description: string): boolean {
    return evaluateConditionFull(cond, { description });
}

/**
 * Full rule engine: evaluates ALL rules and returns aggregated RuleResult.
 * Processes all matching rules in priority order, collecting all effects.
 * First-wins for categoryId/accountId; accumulates for goals/tags.
 */
export async function aplicarReglasCompleto(
    ctx: TransactionContext,
    ownerUserId?: string
): Promise<RuleResult> {
    const result: RuleResult = {
        goalContributions: [],
        tags: [],
        matchedRuleIds: [],
    };

    try {
        const { workspace } = await obtenerWorkspace();

        const reglas = await prisma.rule.findMany({
            where: {
                workspaceId: workspace.id,
                status: "active",
                deletedAt: null,
            },
            orderBy: { priority: "desc" },
        });

        for (const regla of reglas) {
            const conditions = normalizeConditions(regla.conditions);
            const actions = normalizeActions(regla.actions);

            if (conditions.length === 0) continue;

            // All conditions must match (AND logic)
            const allMatch = conditions.every((cond) => evaluateConditionFull(cond, ctx));
            if (!allMatch) continue;

            result.matchedRuleIds.push(regla.id);

            // Process each action
            for (const action of actions) {
                switch (action.type) {
                    case "setCategory":
                        // First-wins: only set if not already set
                        if (!result.categoryId && action.categoryId) {
                            // Verify category exists and is accessible
                            const category = await prisma.category.findFirst({
                                where: {
                                    id: action.categoryId,
                                    workspaceId: workspace.id,
                                    deletedAt: null,
                                    OR: ownerUserId
                                        ? [
                                            { ownerUserId: SYSTEM_CATEGORY_OWNER_ID },
                                            { ownerUserId },
                                        ]
                                        : [{ ownerUserId: SYSTEM_CATEGORY_OWNER_ID }],
                                },
                                select: { id: true },
                            });
                            if (category) {
                                result.categoryId = category.id;
                            }
                        }
                        break;

                    case "setAccount":
                        // First-wins: only set if not already set
                        if (!result.accountId && action.accountId) {
                            const account = await prisma.account.findFirst({
                                where: {
                                    id: action.accountId,
                                    workspaceId: workspace.id,
                                    deletedAt: null,
                                },
                                select: { id: true },
                            });
                            if (account) {
                                result.accountId = account.id;
                            }
                        }
                        break;

                    case "addToGoal":
                        if (action.goalId) {
                            // Verify goal exists and is active
                            const goal = await prisma.goal.findFirst({
                                where: {
                                    id: action.goalId,
                                    workspaceId: workspace.id,
                                    status: "active",
                                },
                                select: { id: true },
                            });
                            if (goal) {
                                result.goalContributions.push({
                                    goalId: goal.id,
                                    amountType: action.amountType || "percentage",
                                    amountValue: action.amountValue ?? 100,
                                });
                            }
                        }
                        break;

                    case "addTags":
                        if (action.tags && action.tags.length > 0) {
                            // Accumulate unique tags
                            for (const tag of action.tags) {
                                if (!result.tags.includes(tag)) {
                                    result.tags.push(tag);
                                }
                            }
                        }
                        break;

                    case "modifyDescription":
                        // First-wins: only set if not already set
                        if (!result.descriptionModification && action.value?.trim()) {
                            result.descriptionModification = {
                                type: action.modifyType || "replace",
                                value: action.value.trim(),
                            };
                        }
                        break;

                    case "doNothing":
                        // Intentionally no-op
                        break;
                }
            }
        }
    } catch (err) {
        console.error("[aplicarReglasCompleto] Error:", err);
    }

    return result;
}

/**
 * Apply description modification from rule result.
 */
export async function applyDescriptionModification(
    originalDescription: string,
    mod: NonNullable<RuleResult["descriptionModification"]>
): Promise<string> {
    switch (mod.type) {
        case "replace":
            return mod.value;
        case "prepend":
            return `${mod.value} ${originalDescription}`;
        case "append":
            return `${originalDescription} ${mod.value}`;
        default:
            return originalDescription;
    }
}

/**
 * Backward-compatible wrapper: returns categoryId only.
 * Used by callers that haven't been upgraded yet.
 */
export async function aplicarReglas(description: string, ownerUserId?: string): Promise<string | null> {
    const result = await aplicarReglasCompleto({ description }, ownerUserId);
    return result.categoryId || null;
}

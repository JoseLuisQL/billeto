"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// ─── Helpers ───────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");
    return session.user;
}

async function getUserWorkspace(userId: string) {
    const membership = await prisma.membership.findFirst({
        where: { userId },
        include: { workspace: true },
    });
    if (!membership?.workspace) throw new Error("Workspace no encontrado");
    return membership.workspace;
}

// ─── Get Onboarding Status ─────────────────────────────────────────────

/**
 * Check if the current user needs onboarding.
 * Returns { needsOnboarding: true } if workspace.onboardingCompleted is false.
 */
export async function getOnboardingStatus() {
    try {
        const user = await getAuthenticatedUser();
        const workspace = await getUserWorkspace(user.id!);

        return {
            needsOnboarding: !workspace.onboardingCompleted,
            userName: user.name || null,
        };
    } catch {
        return { needsOnboarding: false, userName: null };
    }
}

// ─── Complete Onboarding ───────────────────────────────────────────────

export type OnboardingData = {
    displayName: string;
    countryCode: string;
    currencyCode: string;
    avatar: string | null;
    surveyAnswers: {
        painPoint: string;
        currentMethod: string;
        complications: string;
        mainGoal: string;
        financialCompanion: string;
    };
};

/**
 * Complete the onboarding process.
 * Updates user profile (name, avatar, country) and workspace settings
 * (country, baseCurrency, onboardingCompleted, onboardingAnswers).
 */
export async function completeOnboarding(data: OnboardingData) {
    try {
        const sessionUser = await getAuthenticatedUser();
        const userId = sessionUser.id!;
        const workspace = await getUserWorkspace(userId);

        // 1. Update user profile
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.displayName,
                avatar: data.avatar,
                country: data.countryCode,
            },
        });

        // 2. Update workspace settings
        await prisma.workspace.update({
            where: { id: workspace.id },
            data: {
                country: data.countryCode,
                baseCurrency: data.currencyCode,
                onboardingCompleted: true,
                onboardingAnswers: data.surveyAnswers,
            },
        });

        // 3. Audit log (best effort — don't fail onboarding if this breaks)
        try {
            await prisma.auditLog.create({
                data: {
                    workspaceId: workspace.id,
                    actorId: userId,
                    actorType: "user",
                    action: "complete_onboarding",
                    entity: "workspace",
                    entityId: workspace.id,
                    after: {
                        displayName: data.displayName,
                        countryCode: data.countryCode,
                        currencyCode: data.currencyCode,
                        avatar: data.avatar,
                    },
                },
            });
        } catch (auditErr) {
            console.warn("Audit log failed (non-critical):", auditErr);
        }

        revalidatePath("/dashboard");
        revalidatePath("/profile");

        return { success: true };
    } catch (error) {
        console.error("Error completing onboarding:", error);
        return { error: "Error al completar el onboarding. Intentá de nuevo." };
    }
}

// ─── Generate WhatsApp Code ────────────────────────────────────────────

/**
 * Generate a unique WhatsApp integration code for the workspace.
 * Format: BILLETO-XXXXX (5-char alphanumeric).
 */
export async function generateWhatsAppCode() {
    try {
        const sessionUser = await getAuthenticatedUser();
        const workspace = await getUserWorkspace(sessionUser.id!);

        // Check if integration already exists
        const existing = await prisma.integration.findFirst({
            where: {
                workspaceId: workspace.id,
                type: "whatsapp",
                deletedAt: null,
            },
        });

        if (existing?.config && typeof existing.config === "object") {
            const config = existing.config as Record<string, unknown>;
            if (config.code) {
                return { code: config.code as string };
            }
        }

        // Generate code
        const code = `BILLETO-${crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5)}`;

        await prisma.integration.create({
            data: {
                workspaceId: workspace.id,
                type: "whatsapp",
                status: "pending",
                config: { code },
            },
        });

        return { code };
    } catch (error) {
        console.error("Error generating WhatsApp code:", error);
        return { code: `BILLETO-${crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5)}` };
    }
}

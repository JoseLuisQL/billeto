"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";
import { ensureDefaultCategoriesForWorkspace } from "@/lib/categories-defaults";
import { headers } from "next/headers";

/**
 * Server Actions para autenticación.
 * Estas acciones se ejecutan en el servidor y manejan
 * el registro de usuarios y la creación de workspaces.
 */


/**
 * Registrar un nuevo usuario.
 * Crea el usuario, un workspace personal, la membresía como owner,
 * las categorías predeterminadas, una cuenta de efectivo por defecto
 * y una suscripción Free.
 *
 * @param formData - Datos del formulario de registro
 * @returns Resultado de la operación con mensaje de éxito o error
 */
export async function registrarUsuario(formData: FormData) {
    try {
        const nameRaw = formData.get("name") as string;
        const emailRaw = formData.get("email") as string;
        const emailKey = (emailRaw || "").toLowerCase().trim();
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        // Sanitizar nombre: trim, remover tags HTML, limitar longitud
        const name = (nameRaw || "").trim().replace(/<[^>]*>/g, "").slice(0, 100);

        // Rate limit por email
        enforceRateLimit({
            bucket: "auth:register:email",
            key: emailKey || "anon",
            limit: 6,
            windowMs: 60_000,
        });

        // Rate limit por IP
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        enforceRateLimit({
            bucket: "auth:register:ip",
            key: ip,
            limit: 15,
            windowMs: 60_000,
        });

        const email = emailKey;

        // Validaciones básicas
        if (!name || !email || !password) {
            return { error: "Todos los campos son obligatorios." };
        }

        if (password.length < 8) {
            return { error: "La contraseña debe tener al menos 8 caracteres." };
        }

        // Política de contraseña: mayúscula + minúscula + número
        if (!/[A-Z]/.test(password)) {
            return { error: "La contraseña debe incluir al menos una mayúscula." };
        }
        if (!/[a-z]/.test(password)) {
            return { error: "La contraseña debe incluir al menos una minúscula." };
        }
        if (!/[0-9]/.test(password)) {
            return { error: "La contraseña debe incluir al menos un número." };
        }

        // Validar confirmación de contraseña
        if (confirmPassword !== undefined && confirmPassword !== null && password !== confirmPassword) {
            return { error: "Las contraseñas no coinciden." };
        }

        // Verificar si el email ya existe — mensaje genérico para evitar enumeración
        const usuarioExistente = await prisma.user.findUnique({
            where: { email },
        });

        if (usuarioExistente) {
            return { error: "No se pudo crear la cuenta. Verificá los datos e intentá de nuevo." };
        }

        // Hashear la contraseña con bcrypt (12 rondas de salt)
        const passwordHash = await bcrypt.hash(password, 12);

        // Crear usuario, workspace y datos iniciales en una transacción
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Crear usuario
            const usuario = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                },
            });

            // 2. Crear workspace personal
            const workspace = await tx.workspace.create({
                data: {
                    name: `${name}'s Finanzas`,
                    baseCurrency: "PEN",
                    country: "PE",
                },
            });

            // 3. Crear membresía como owner
            await tx.membership.create({
                data: {
                    userId: usuario.id,
                    workspaceId: workspace.id,
                    role: "owner",
                },
            });

            // 4. Crear categorias predeterminadas del sistema
            await ensureDefaultCategoriesForWorkspace(tx, workspace.id);

            // 5. Crear suscripcion Free por defecto
            await tx.subscription.create({
                data: {
                    workspaceId: workspace.id,
                    planTier: "free",
                    status: "active",
                },
            });

            // 6. Crear cuenta de efectivo por defecto
            await tx.account.create({
                data: {
                    workspaceId: workspace.id,
                    name: "Efectivo",
                    normalizedName: "efectivo",
                    type: "cash",
                    currency: "PEN",
                    initialBalance: 0,
                    currentBalance: 0,
                    isFavorite: true,
                    favoriteRank: 1,
                },
            });

            // 7. Registrar en auditoria
            await tx.auditLog.create({
                data: {
                    workspaceId: workspace.id,
                    actorId: usuario.id,
                    actorType: "user",
                    action: "create",
                    entity: "user",
                    entityId: usuario.id,
                    after: { email, name },
                },
            });

            return usuario;
        });

        // Iniciar sesión automáticamente después del registro
        await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        return { success: true, userId: resultado.id };
    } catch (error) {
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        console.error("Error al registrar usuario:", error);
        return { error: "Error interno del servidor. Intentá de nuevo." };
    }
}

/**
 * Iniciar sesión con credenciales.
 *
 * @param formData - Datos del formulario de login
 * @returns Resultado con éxito o error
 */
export async function iniciarSesion(formData: FormData) {
    try {
        const emailRaw = formData.get("email") as string;
        const email = (emailRaw || "").toLowerCase().trim();
        const password = formData.get("password") as string;

        enforceRateLimit({
            bucket: "auth:login:email",
            key: email || "anon",
            limit: 10,
            windowMs: 60_000,
        });

        if (!email || !password) {
            return { error: "Email y contraseña son obligatorios." };
        }

        await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        return { success: true };
    } catch (error: unknown) {
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        if (error instanceof Error && error.message === "ACCOUNT_SCHEDULED_FOR_DELETION") {
            return { error: "Esta cuenta está programada para eliminación. Si querés recuperarla, contactá soporte." };
        }
        if (error instanceof Error && "type" in error && (error as Error & { type?: string }).type === "CredentialsSignin") {
            return { error: "Email o contraseña incorrectos." };
        }
        return { error: "Error al iniciar sesión. Intentá de nuevo." };
    }
}

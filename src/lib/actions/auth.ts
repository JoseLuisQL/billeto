"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";

/**
 * Server Actions para autenticación.
 * Estas acciones se ejecutan en el servidor y manejan
 * el registro de usuarios y la creación de workspaces.
 */

// Categorías predeterminadas para nuevos workspaces
const CATEGORIAS_SEED = [
    { name: "Alimentación", icon: "🍔", color: "#F59E0B", type: "expense" },
    { name: "Transporte", icon: "🚗", color: "#3B82F6", type: "expense" },
    { name: "Entretenimiento", icon: "🎬", color: "#8B5CF6", type: "expense" },
    { name: "Salud", icon: "🏥", color: "#EF4444", type: "expense" },
    { name: "Educación", icon: "📚", color: "#06B6D4", type: "expense" },
    { name: "Servicios", icon: "💡", color: "#F97316", type: "expense" },
    { name: "Compras", icon: "🛍️", color: "#EC4899", type: "expense" },
    { name: "Vivienda", icon: "🏠", color: "#14B8A6", type: "expense" },
    { name: "Sueldo", icon: "💰", color: "#22C55E", type: "income" },
    { name: "Freelance", icon: "💻", color: "#6366F1", type: "income" },
    { name: "Inversiones", icon: "📈", color: "#84CC16", type: "income" },
    { name: "Otros ingresos", icon: "💵", color: "#A3E635", type: "income" },
    { name: "Sin categoría", icon: "❓", color: "#71717A", type: "both" },
];

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
        const name = formData.get("name") as string;
        const emailRaw = formData.get("email") as string;
        const emailKey = (emailRaw || "").toLowerCase().trim();
        enforceRateLimit({
            bucket: "auth:register:email",
            key: emailKey || "anon",
            limit: 6,
            windowMs: 60_000,
        });
        const email = emailKey;
        const password = formData.get("password") as string;

        // Validaciones básicas
        if (!name || !email || !password) {
            return { error: "Todos los campos son obligatorios." };
        }

        if (password.length < 8) {
            return { error: "La contraseña debe tener al menos 8 caracteres." };
        }

        // Verificar si el email ya existe
        const usuarioExistente = await prisma.user.findUnique({
            where: { email },
        });

        if (usuarioExistente) {
            return { error: "Ya existe una cuenta con este email." };
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

            // 4. Crear categorías predeterminadas
            await tx.category.createMany({
                data: CATEGORIAS_SEED.map((cat) => ({
                    workspaceId: workspace.id,
                    name: cat.name,
                    normalizedName: cat.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
                    icon: cat.icon,
                    color: cat.color,
                    type: cat.type,
                })),
            });

            // 5. Crear cuenta de efectivo por defecto
            await tx.account.create({
                data: {
                    workspaceId: workspace.id,
                    name: "Efectivo",
                    normalizedName: "efectivo",
                    type: "cash",
                    currency: "PEN",
                    initialBalance: 0,
                    currentBalance: 0,
                },
            });

            // 6. Crear suscripción Free por defecto
            await tx.subscription.create({
                data: {
                    workspaceId: workspace.id,
                    planTier: "free",
                    status: "active",
                },
            });

            // 7. Registrar en auditoría
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
        if (error instanceof Error && "type" in error && (error as Error & { type?: string }).type === "CredentialsSignin") {
            return { error: "Email o contraseña incorrectos." };
        }
        return { error: "Error al iniciar sesión. Intentá de nuevo." };
    }
}

"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";
import { headers } from "next/headers";

/**
 * Solicitar restablecimiento de contraseña.
 * Genera un token único, lo guarda en la BD, y envía un email.
 * Siempre devuelve un mensaje genérico para evitar enumeración de usuarios.
 */
export async function solicitarResetPassword(formData: FormData) {
    try {
        const emailRaw = formData.get("email") as string;
        const email = (emailRaw || "").toLowerCase().trim();

        if (!email) {
            return { error: "El email es obligatorio." };
        }

        // Rate limit por IP
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        enforceRateLimit({
            bucket: "auth:reset:ip",
            key: ip,
            limit: 5,
            windowMs: 60_000 * 15, // 5 intentos cada 15 minutos
        });

        // Rate limit por email
        enforceRateLimit({
            bucket: "auth:reset:email",
            key: email,
            limit: 3,
            windowMs: 60_000 * 15, // 3 por email cada 15 min
        });

        // Buscar usuario — si no existe, devolver éxito genérico (anti-enumeración)
        const user = await prisma.user.findUnique({ where: { email } });

        if (user && user.passwordHash) {
            // Eliminar tokens previos de este email
            await prisma.passwordResetToken.deleteMany({ where: { email } });

            // Generar token seguro
            const token = crypto.randomBytes(32).toString("hex");
            const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

            // Guardar token
            await prisma.passwordResetToken.create({
                data: {
                    email,
                    token,
                    expires,
                },
            });

            // Enviar email
            await sendPasswordResetEmail(email, token);
        }

        // Siempre devolver éxito (anti-enumeración)
        return {
            success: true,
            message: "Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.",
        };
    } catch (error) {
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        console.error("Error en solicitud de reset:", error);
        return { error: "Error al procesar la solicitud. Intentá de nuevo." };
    }
}

/**
 * Verificar si un token de reset es válido.
 */
export async function verificarTokenReset(token: string) {
    try {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken) {
            return { valid: false, error: "El enlace no es válido." };
        }

        if (resetToken.expires < new Date()) {
            // Limpiar token expirado
            await prisma.passwordResetToken.delete({ where: { token } });
            return { valid: false, error: "El enlace ha expirado. Solicitá uno nuevo." };
        }

        return { valid: true, email: resetToken.email };
    } catch (error) {
        console.error("Error verificando token:", error);
        return { valid: false, error: "Error al verificar el enlace." };
    }
}

/**
 * Restablecer la contraseña usando un token válido.
 */
export async function restablecerPassword(formData: FormData) {
    try {
        const token = formData.get("token") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (!token || !password) {
            return { error: "Datos incompletos." };
        }

        // Validar política de contraseña
        if (password.length < 8) {
            return { error: "La contraseña debe tener al menos 8 caracteres." };
        }
        if (!/[A-Z]/.test(password)) {
            return { error: "La contraseña debe incluir al menos una mayúscula." };
        }
        if (!/[a-z]/.test(password)) {
            return { error: "La contraseña debe incluir al menos una minúscula." };
        }
        if (!/[0-9]/.test(password)) {
            return { error: "La contraseña debe incluir al menos un número." };
        }

        if (password !== confirmPassword) {
            return { error: "Las contraseñas no coinciden." };
        }

        // Verificar token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken) {
            return { error: "El enlace no es válido." };
        }

        if (resetToken.expires < new Date()) {
            await prisma.passwordResetToken.delete({ where: { token } });
            return { error: "El enlace ha expirado. Solicitá uno nuevo." };
        }

        // Hashear nueva contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        // Actualizar contraseña del usuario
        await prisma.user.update({
            where: { email: resetToken.email },
            data: { passwordHash },
        });

        // Eliminar todos los tokens de este email
        await prisma.passwordResetToken.deleteMany({
            where: { email: resetToken.email },
        });

        return { success: true };
    } catch (error) {
        console.error("Error restableciendo contraseña:", error);
        return { error: "Error al restablecer la contraseña. Intentá de nuevo." };
    }
}

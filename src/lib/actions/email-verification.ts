"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmailVerificationEmail } from "@/lib/email";
import { enforceRateLimit, isRateLimitError } from "@/lib/security/rate-limit";
import { headers } from "next/headers";

/**
 * Enviar email de verificación al usuario.
 * Crea un token en VerificationToken y envía email.
 */
export async function enviarEmailVerificacion(email: string) {
    try {
        // Rate limit por IP
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        enforceRateLimit({
            bucket: "auth:verify:ip",
            key: ip,
            limit: 5,
            windowMs: 60_000 * 15,
        });

        // Rate limit por email
        enforceRateLimit({
            bucket: "auth:verify:email",
            key: email,
            limit: 3,
            windowMs: 60_000 * 15,
        });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { success: true }; // Anti-enumeración
        }

        // Si ya está verificado, no hacer nada
        if (user.emailVerified) {
            return { success: true, alreadyVerified: true };
        }

        // Eliminar tokens previos
        await prisma.verificationToken.deleteMany({
            where: { identifier: email },
        });

        // Generar token
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires,
            },
        });

        // Enviar email
        await sendEmailVerificationEmail(email, token);

        return { success: true };
    } catch (error) {
        if (isRateLimitError(error)) {
            return { error: error.message };
        }
        console.error("Error enviando verificación:", error);
        return { error: "Error al enviar el email de verificación." };
    }
}

/**
 * Verificar email con token.
 */
export async function verificarEmail(token: string) {
    try {
        // Buscar token
        const verificationToken = await prisma.verificationToken.findFirst({
            where: { token },
        });

        if (!verificationToken) {
            return { error: "El enlace de verificación no es válido." };
        }

        if (verificationToken.expires < new Date()) {
            // Limpiar token expirado
            await prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: verificationToken.identifier,
                        token: verificationToken.token,
                    },
                },
            });
            return { error: "El enlace ha expirado. Solicitá uno nuevo." };
        }

        // Marcar email como verificado
        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        });

        // Eliminar token
        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: verificationToken.identifier,
                    token: verificationToken.token,
                },
            },
        });

        return { success: true, email: verificationToken.identifier };
    } catch (error) {
        console.error("Error verificando email:", error);
        return { error: "Error al verificar el email." };
    }
}

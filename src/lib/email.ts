"use server";

import nodemailer from "nodemailer";

/**
 * Transporter SMTP configurado con Hostinger.
 * Host: smtp.hostinger.com, Port: 465, SSL
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, // SSL
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM_EMAIL = process.env.EMAIL_FROM || "Billeto <noreply@billeto.app>";

/**
 * Enviar email de restablecimiento de contraseña.
 */
export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    // Si no hay credenciales SMTP configuradas (desarrollo), loguear URL
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("[EMAIL] No SMTP credentials configured. Reset URL:", resetUrl);
        return { success: true };
    }

    try {
        await transporter.sendMail({
            from: FROM_EMAIL,
            to: email,
            subject: "Restablecé tu contraseña — Billeto",
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background-color:#18181b;border-radius:12px;border:1px solid rgba(255,255,255,0.1);padding:40px;">
                    <tr>
                        <td align="center" style="padding-bottom:24px;">
                            <span style="font-size:28px;font-weight:bold;color:#D3FF0A;">B</span>
                            <span style="font-size:28px;font-weight:bold;color:#ffffff;">illeto</span>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom:16px;">
                            <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:600;">
                                Restablecé tu contraseña
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom:24px;color:#a1a1aa;font-size:14px;line-height:1.6;">
                            Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
                            Hacé clic en el botón de abajo para crear una nueva contraseña.
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom:24px;">
                            <a href="${resetUrl}" 
                               style="display:inline-block;background-color:#D3FF0A;color:#000000;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none;">
                                Restablecer contraseña
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="color:#71717a;font-size:12px;line-height:1.5;border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
                            Este enlace expira en <strong style="color:#a1a1aa;">1 hora</strong>. Si no solicitaste este cambio, podés ignorar este email.
                        </td>
                    </tr>
                </table>
                <p style="color:#52525b;font-size:11px;margin-top:20px;">
                    © ${new Date().getFullYear()} Billeto. Todos los derechos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error("Error sending password reset email:", error);
        return { error: "No se pudo enviar el email." };
    }
}

/**
 * Enviar email de verificación de cuenta.
 */
export async function sendEmailVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("[EMAIL] No SMTP credentials configured. Verify URL:", verifyUrl);
        return { success: true };
    }

    try {
        await transporter.sendMail({
            from: FROM_EMAIL,
            to: email,
            subject: "Verificá tu email — Billeto",
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background-color:#18181b;border-radius:12px;border:1px solid rgba(255,255,255,0.1);padding:40px;">
                    <tr>
                        <td align="center" style="padding-bottom:24px;">
                            <span style="font-size:28px;font-weight:bold;color:#D3FF0A;">B</span>
                            <span style="font-size:28px;font-weight:bold;color:#ffffff;">illeto</span>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom:16px;">
                            <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:600;">
                                ¡Bienvenido a Billeto!
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom:24px;color:#a1a1aa;font-size:14px;line-height:1.6;">
                            Estás a un paso de tomar el control de tus finanzas. 
                            Hacé clic en el botón de abajo para verificar tu email y activar tu cuenta.
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom:24px;">
                            <a href="${verifyUrl}" 
                               style="display:inline-block;background-color:#D3FF0A;color:#000000;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none;">
                                Verificar mi email
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="color:#71717a;font-size:12px;line-height:1.5;border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
                            Este enlace expira en <strong style="color:#a1a1aa;">24 horas</strong>. Si no creaste una cuenta en Billeto, podés ignorar este email.
                        </td>
                    </tr>
                </table>
                <p style="color:#52525b;font-size:11px;margin-top:20px;">
                    © ${new Date().getFullYear()} Billeto. Todos los derechos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error("Error sending verification email:", error);
        return { error: "No se pudo enviar el email." };
    }
}

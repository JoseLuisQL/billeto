import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { consumeRateLimit } from "@/lib/security/rate-limit";

/**
 * Middleware de Next.js para proteger rutas privadas.
 * Redirige a /login si el usuario no tiene sesión activa.
 *
 * En Edge Runtime validamos el JWT con getToken (NextAuth)
 * en lugar de confiar únicamente en la presencia de cookie.
 */
export default async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (pathname === "/api/ai/chat" && req.method === "POST") {
        const rate = consumeRateLimit({
            bucket: "api:ai-chat:ip",
            key: ip,
            limit: 30,
            windowMs: 60_000,
        });

        if (!rate.allowed) {
            return NextResponse.json(
                { error: "rate_limited", message: "Demasiadas solicitudes al chat. Intentá de nuevo en unos segundos." },
                { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
            );
        }
    }

    if (pathname.startsWith("/api/auth") && req.method === "POST") {
        const rate = consumeRateLimit({
            bucket: "api:auth:ip",
            key: ip,
            limit: 20,
            windowMs: 60_000,
        });

        if (!rate.allowed) {
            return NextResponse.json(
                { error: "rate_limited", message: "Demasiados intentos de autenticación. Esperá un momento." },
                { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
            );
        }
    }

    // Rutas públicas que no requieren autenticación
    const rutasPublicas = [
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/product",
        "/pricing",
        "/manifesto",
        "/blog",
        "/faq",
        "/contact",
        "/privacy",
        "/terms",
        "/security",
        "/api/auth",
        "/api/cron",
    ];

    // Verificar si la ruta actual es pública
    const esRutaPublica = rutasPublicas.some(
        (ruta) => pathname === ruta || pathname.startsWith(ruta + "/")
    );

    // Si es ruta pública, permitir acceso
    if (esRutaPublica) {
        return NextResponse.next();
    }

    // Validar JWT de sesión (firma/exp) en middleware
    const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production",
    });

    if (!token?.sub) {
        const urlLogin = new URL("/login", req.url);
        urlLogin.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(urlLogin);
    }

    return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
    matcher: [
        // Ejecutar en todas las rutas excepto archivos estáticos
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

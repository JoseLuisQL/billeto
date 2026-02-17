import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";

/**
 * Middleware de Next.js para proteger rutas privadas.
 * Redirige a /login si el usuario no tiene sesión activa.
 * 
 * NOTA: No importamos NextAuth auth() directamente porque
 * el middleware corre en Edge Runtime y auth() requiere Node.js
 * (crypto, bcrypt, prisma). En su lugar, verificamos la cookie
 * de sesión JWT de NextAuth.
 */
export default function middleware(req: NextRequest) {
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
    ];

    // Verificar si la ruta actual es pública
    const esRutaPublica = rutasPublicas.some(
        (ruta) => pathname === ruta || pathname.startsWith(ruta + "/")
    );

    // Si es ruta pública, permitir acceso
    if (esRutaPublica) {
        return NextResponse.next();
    }

    // Verificar cookie de sesión de NextAuth (JWT strategy)
    // NextAuth usa "authjs.session-token" como nombre de cookie
    const sessionToken =
        req.cookies.get("authjs.session-token")?.value ||
        req.cookies.get("__Secure-authjs.session-token")?.value;

    // Si no hay token de sesión, redirigir a login
    if (!sessionToken) {
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

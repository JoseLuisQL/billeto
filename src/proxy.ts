import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

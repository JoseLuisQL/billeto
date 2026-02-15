import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Middleware de Next.js para proteger rutas privadas.
 * Redirige a /login si el usuario no tiene sesión activa.
 * Las rutas públicas (landing, auth, API) no requieren autenticación.
 */
export default auth((req) => {
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

    // Si es ruta pública, permitir acceso sin autenticación
    if (esRutaPublica) {
        return NextResponse.next();
    }

    // Si no hay sesión y la ruta es privada, redirigir a login
    if (!req.auth) {
        const urlLogin = new URL("/login", req.url);
        urlLogin.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(urlLogin);
    }

    return NextResponse.next();
});

// Configurar en qué rutas se ejecuta el middleware
export const config = {
    matcher: [
        // Ejecutar en todas las rutas excepto archivos estáticos y API internas
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

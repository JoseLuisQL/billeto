import NextAuth from "next-auth";

/**
 * Extensión de tipos de NextAuth para incluir el ID del usuario
 * en la sesión y el token JWT.
 * Esto permite acceder a session.user.id de forma type-safe.
 */
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }
}

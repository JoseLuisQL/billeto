import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Configuración principal de NextAuth v5.
 * Proveedores: Credentials (email/password) y Google OAuth.
 * Adapter: Prisma para persistir sesiones y cuentas en la BD.
 * Estrategia: JWT para sesiones sin estado (serverless friendly).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        newUser: "/register",
    },
    providers: [
        // Proveedor de credenciales (email + password)
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                // Validar que se recibieron las credenciales
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                // Buscar usuario por email
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                // Si no existe o no tiene password (registrado con OAuth)
                if (!user || !user.passwordHash) {
                    return null;
                }

                // Verificar contraseña
                const passwordValida = await bcrypt.compare(password, user.passwordHash);
                if (!passwordValida) {
                    return null;
                }

                // Retornar datos del usuario para la sesión
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
        // Proveedor de Google OAuth (configurar en .env)
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        /**
         * Callback JWT: enriquecer el token con datos adicionales
         * Se ejecuta cada vez que se crea o actualiza un JWT
         */
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        /**
         * Callback de sesión: exponer datos del token en la sesión del cliente
         * Permite acceder a session.user.id en componentes
         */
        async session({ session, token }) {
            if (token?.id) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
});

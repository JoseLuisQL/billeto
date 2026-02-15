export const dynamic = "force-dynamic";

import { handlers } from "@/lib/auth";

/**
 * Manejadores de rutas de autenticación de NextAuth.
 * Expone GET y POST en /api/auth/* para:
 * - Login (credentials, OAuth)
 * - Logout
 * - Callbacks de OAuth
 * - CSRF token
 *
 * Marcado como force-dynamic para evitar errores de SSG
 * cuando Prisma intenta conectar a la BD en build time.
 */
export const { GET, POST } = handlers;

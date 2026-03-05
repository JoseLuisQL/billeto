"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Guard de acceso para el panel admin.
 * Verifica que el usuario autenticado tiene `isAdmin = true`.
 * Lanza error si no es admin → se puede usar en server actions y server components.
 */
export async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("No autenticado");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, name: true, email: true },
    });

    if (!user?.isAdmin) {
        throw new Error("Acceso denegado: se requieren permisos de administrador");
    }

    return {
        userId: session.user.id,
        name: user.name,
        email: user.email,
    };
}

/**
 * Verifica si el usuario actual es admin sin lanzar error.
 * Útil para componentes condicionales.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
    try {
        const session = await auth();
        if (!session?.user?.id) return false;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true },
        });

        return user?.isAdmin ?? false;
    } catch {
        return false;
    }
}

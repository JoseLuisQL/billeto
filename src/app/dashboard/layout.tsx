import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { SessionProvider } from "next-auth/react";

/**
 * Layout del dashboard (área privada).
 * Incluye sidebar fijo y un área de contenido principal.
 * La protección de rutas se maneja vía middleware.
 * No hace queries a la BD en build time.
 */
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <div className="flex min-h-screen">
                {/* Sidebar de navegación */}
                <DashboardClientLayout>
                    {children}
                </DashboardClientLayout>
            </div>
        </SessionProvider>
    );
}

/**
 * Wrapper client-side que obtiene la sesión y renderiza el layout.
 */
function DashboardClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
        </>
    );
}

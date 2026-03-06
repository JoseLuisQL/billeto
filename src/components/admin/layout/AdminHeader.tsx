"use client";

import { usePathname } from "next/navigation";
import { CalendarDays, Menu, Search } from "lucide-react";
import {
    adminIconButtonClass,
    adminTextButtonClass,
} from "@/components/admin/shared/admin-ui";

interface AdminHeaderProps {
    onToggleSidebar?: () => void;
}

const routeTitles: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/users": "Gestión de Usuarios",
    "/admin/workspaces": "Gestión de Workspaces",
    "/admin/transactions": "Transacciones",
    "/admin/subscriptions": "Suscripciones",
    "/admin/audit": "Auditoría",
    "/admin/analytics": "Analytics Globales",
    "/admin/ai": "Inteligencia Artificial",
    "/admin/content": "Gestión de Contenido",
    "/admin/content/categories": "Categorías del Sistema",
    "/admin/content/popular-subscriptions": "Suscripciones Populares",
    "/admin/content/goal-templates": "Plantillas de Metas",
    "/admin/content/currencies": "Monedas",
    "/admin/settings": "Configuración",
    "/admin/security": "Seguridad",
};

function getBreadcrumbs(pathname: string) {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [];

    let path = "";
    for (const part of parts) {
        path += `/${part}`;
        const title = routeTitles[path];
        if (title) {
            crumbs.push({ label: title, href: path });
        } else {
            crumbs.push({
                label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
                href: path,
            });
        }
    }

    return crumbs;
}

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
    const pathname = usePathname();
    const crumbs = getBreadcrumbs(pathname);
    const pageTitle = routeTitles[pathname] || crumbs[crumbs.length - 1]?.label || "Admin";
    const formattedDate = new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date());

    return (
        <header className="sticky top-0 z-30 border-b border-[color:var(--admin-border)] bg-[color:var(--admin-bg)]/88 backdrop-blur-xl">
            <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label="Abrir navegación lateral"
                    className={`${adminIconButtonClass} lg:hidden`}
                >
                    <Menu className="h-5 w-5" />
                </button>

                <nav className="hidden items-center gap-2 text-sm sm:flex">
                    {crumbs.map((crumb, i) => (
                        <span key={crumb.href} className="flex items-center gap-2">
                            {i > 0 && <span className="text-[color:var(--admin-text-subtle)]">/</span>}
                            <span className={i === crumbs.length - 1 ? "font-medium text-[color:var(--admin-text)]" : "text-[color:var(--admin-text-subtle)]"}>
                                {crumb.label}
                            </span>
                        </span>
                    ))}
                </nav>

                <h1 className="text-sm font-medium text-[color:var(--admin-text)] sm:hidden">{pageTitle}</h1>

                <div className="ml-auto flex items-center gap-2">
                    <div className="hidden items-center gap-2 rounded-full border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-3 py-1.5 text-xs text-[color:var(--admin-text-muted)] xl:flex">
                        <CalendarDays className="h-3.5 w-3.5 text-[color:var(--admin-accent)]" />
                        {formattedDate}
                    </div>
                    <div
                        aria-label="Búsqueda global próximamente"
                        className={`${adminTextButtonClass} hidden sm:flex`}
                    >
                        <Search className="h-4 w-4" />
                        <span>Búsqueda global próximamente</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

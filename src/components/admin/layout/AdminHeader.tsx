"use client";

import { usePathname } from "next/navigation";
import { CalendarDays, Menu, Search } from "lucide-react";

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
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060b14]/75 backdrop-blur-xl">
            <div className="mx-auto flex h-[72px] w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-zinc-100 lg:hidden"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <nav className="hidden items-center gap-2 text-sm sm:flex">
                    {crumbs.map((crumb, i) => (
                        <span key={crumb.href} className="flex items-center gap-2">
                            {i > 0 && <span className="text-zinc-600">/</span>}
                            <span className={i === crumbs.length - 1 ? "font-medium text-zinc-100" : "text-zinc-500"}>
                                {crumb.label}
                            </span>
                        </span>
                    ))}
                </nav>

                <h1 className="text-sm font-medium text-zinc-100 sm:hidden">{pageTitle}</h1>

                <div className="ml-auto flex items-center gap-2">
                    <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 xl:flex">
                        <CalendarDays className="h-3.5 w-3.5 text-cyan-200" />
                        {formattedDate}
                    </div>
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-200"
                    >
                        <Search className="h-4 w-4" />
                        <span className="hidden sm:inline">Buscar...</span>
                        <kbd className="hidden rounded border border-white/10 bg-[#111a2a] px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline">
                            ⌘K
                        </kbd>
                    </button>
                </div>
            </div>
        </header>
    );
}

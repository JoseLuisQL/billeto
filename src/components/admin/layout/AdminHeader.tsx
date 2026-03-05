"use client";

import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";

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
    "/admin/analytics/growth": "Analytics — Growth",
    "/admin/analytics/usage": "Analytics — Usage",
    "/admin/analytics/financial": "Analytics — Financial",
    "/admin/analytics/ai": "Analytics — IA",
    "/admin/ai": "Inteligencia Artificial",
    "/admin/ai/providers": "Proveedores de IA",
    "/admin/ai/prompt": "System Prompt",
    "/admin/ai/tools": "Tools del Agente",
    "/admin/ai/security": "Prompt Guard",
    "/admin/ai/keywords": "Keywords",
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

    return (
        <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center gap-4 border-b border-white/5 bg-[#09090b]/80 px-6 backdrop-blur-xl">
            {/* Mobile menu toggle */}
            <button
                type="button"
                onClick={onToggleSidebar}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 lg:hidden"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden items-center gap-1.5 text-sm text-zinc-500 sm:flex">
                {crumbs.map((crumb, i) => (
                    <span key={crumb.href} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-zinc-700">/</span>}
                        {i === crumbs.length - 1 ? (
                            <span className="font-medium text-zinc-100">{crumb.label}</span>
                        ) : (
                            <span className="text-zinc-500">{crumb.label}</span>
                        )}
                    </span>
                ))}
            </nav>

            {/* Mobile title */}
            <h1 className="text-sm font-medium text-zinc-100 sm:hidden">{pageTitle}</h1>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search (placeholder) */}
            <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:border-white/10 hover:text-zinc-300"
            >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Buscar...</span>
                <kbd className="hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline">
                    ⌘K
                </kbd>
            </button>
        </header>
    );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    PieChart,
    Tags,
    Target,
    Settings,
    LogOut,
    CreditCard,
    Bot,
} from "lucide-react";
import { signOut } from "next-auth/react";

/**
 * Sidebar de navegación del dashboard.
 * Diseño vertical fijo con iconos, nombre de usuario y navegación.
 * Sigue la estética Dark Neon del resto de la aplicación.
 */

interface SidebarProps {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/transactions", label: "Transacciones", icon: Receipt },
    { href: "/dashboard/accounts", label: "Cuentas", icon: Wallet },
    { href: "/dashboard/categories", label: "Categorías", icon: Tags },
    { href: "/dashboard/budgets", label: "Presupuestos", icon: PieChart },
    { href: "/dashboard/goals", label: "Metas", icon: Target },
    { href: "/dashboard/billing", label: "Facturación", icon: CreditCard },
    { href: "/dashboard/ai", label: "Asistente IA", icon: Bot },
];

const menuSecundario = [
    { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export function DashboardSidebar({ user }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="fixed top-0 left-0 h-screen w-64 bg-zinc-900 border-r border-white/10 flex flex-col z-40">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-white/10">
                <Link href="/dashboard" className="text-xl font-bold tracking-tighter text-white">
                    BILLETO
                </Link>
            </div>

            {/* Navegación principal */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive
                                    ? "bg-lime-400/10 text-lime-400 font-medium"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}

                {/* Separador */}
                <div className="border-t border-white/10 my-3" />

                {menuSecundario.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive
                                    ? "bg-lime-400/10 text-lime-400 font-medium"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Perfil del usuario + Logout */}
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-lime-400/10 flex items-center justify-center text-lime-400 text-sm font-bold">
                        {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-all w-full"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}

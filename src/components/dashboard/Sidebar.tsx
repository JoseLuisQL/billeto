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
  Zap,
  RefreshCw,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { BilletoIcon, BilletoLogo } from "@/components/ui/logo";

interface SidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
}

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transacciones", icon: Receipt },
  { href: "/dashboard/accounts", label: "Cuentas", icon: Wallet },
  { href: "/dashboard/categories", label: "Categorías", icon: Tags },
  { href: "/dashboard/rules", label: "Reglas", icon: Zap },
  { href: "/dashboard/recurring", label: "Recurrentes", icon: RefreshCw },
  { href: "/dashboard/budgets", label: "Presupuestos", icon: PieChart },
  { href: "/dashboard/goals", label: "Metas", icon: Target },
  { href: "/dashboard/billing", label: "Facturación", icon: CreditCard },
  { href: "/dashboard/ai", label: "Asistente IA", icon: Bot },
];

const menuSecundario = [{ href: "/dashboard/settings", label: "Configuración", icon: Settings }];

export function DashboardSidebar({
  user,
  collapsed = false,
  className = "",
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`flex h-screen flex-col border-r border-white/10 bg-zinc-900 ${className}`}>
      <div className={`flex h-16 items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "px-6"}`}>
        <Link href="/dashboard" onClick={onNavigate}>
          {collapsed ? <BilletoIcon className="size-8" /> : <BilletoLogo />}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-lg py-2.5 text-sm transition-all ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${isActive
                ? "bg-lime-400/10 font-medium text-lime-400"
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-white/10" />

        {menuSecundario.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-lg py-2.5 text-sm transition-all ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${isActive
                ? "bg-lime-400/10 font-medium text-lime-400"
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className={`mb-3 flex items-center ${collapsed ? "justify-center" : "gap-3 px-2"}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-400/10 text-sm font-bold text-lime-400">
            {user.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title={collapsed ? "Cerrar sesión" : undefined}
          className={`flex w-full items-center rounded-lg py-2 text-sm text-muted-foreground transition-all hover:bg-red-400/5 hover:text-red-400 ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}

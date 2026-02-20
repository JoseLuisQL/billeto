"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  ChevronDown,
  CircleHelp,
  Copy,
  FileUp,
  Goal,
  HandCoins,
  LayoutDashboard,
  Link2,
  LogOut,
  PiggyBank,
  Settings2,
  Sparkles,
  Users,
  Wallet,
  Workflow,
  Zap,
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

type NavItem = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  disabled?: boolean;
  badge?: string;
  exact?: boolean;
  children?: NavItem[];
};

const navItems: NavItem[] = [
  { id: "assistant", label: "Asistente", icon: Bot, href: "/dashboard/ai" },
  { id: "panel", label: "Panel", icon: LayoutDashboard, href: "/dashboard", exact: true },
  {
    id: "transactions",
    label: "Transacciones",
    icon: Zap,
    href: "/dashboard/transactions",
    children: [
      { id: "rules", label: "Reglas", icon: Workflow, href: "/dashboard/rules" },
      { id: "recurring", label: "Recurrentes", icon: Sparkles, href: "/dashboard/recurring" },
      { id: "extracts", label: "Importar extractos", icon: FileUp, disabled: true },
    ],
  },
  { id: "accounts", label: "Cuentas", icon: Wallet, href: "/dashboard/accounts" },
  { id: "budgets", label: "Presupuestos", icon: PiggyBank, disabled: true },
  { id: "goals", label: "Metas", icon: Goal, disabled: true },
  { id: "groups", label: "Grupos", icon: Users, disabled: true, badge: "Pronto" },
  {
    id: "tools",
    label: "Herramientas",
    icon: Settings2,
    disabled: true,
    children: [
      { id: "whatsapp", label: "Whatsapp", icon: Link2, disabled: true },
      { id: "caslaq", label: "Caslaq", icon: Link2, disabled: true },
      { id: "vaquitas", label: "Vaquitas", icon: HandCoins, disabled: true },
      { id: "integrations", label: "Integraciones", icon: Workflow, disabled: true },
    ],
  },
];

function matchesPath(item: NavItem, pathname: string): boolean {
  if (!item.href) return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isItemActive(item: NavItem, pathname: string): boolean {
  if (matchesPath(item, pathname)) return true;
  return item.children?.some((child: NavItem) => isItemActive(child, pathname)) ?? false;
}

function getInitialExpandedState(pathname: string): Record<string, boolean> {
  const state: Record<string, boolean> = {};

  const walk = (items: NavItem[]) => {
    items.forEach((item) => {
      if (item.children?.length) {
        state[item.id] = item.children.some((child) => isItemActive(child, pathname));
        walk(item.children);
      }
    });
  };

  walk(navItems);
  return state;
}

export function DashboardSidebar({
  user,
  collapsed = false,
  className = "",
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => getInitialExpandedState(pathname));

  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/invitar?ref=${user.id}` : "";

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getIsOpen = (item: NavItem): boolean => {
    if (!item.children?.length) return false;
    const autoOpenFromRoute = item.children.some((child) => isItemActive(child, pathname));
    if (typeof expanded[item.id] === "boolean") {
      return expanded[item.id] || autoOpenFromRoute;
    }
    return autoOpenFromRoute;
  };

  const renderItem = (item: NavItem, level = 0) => {
    const Icon = item.icon;
    const active = isItemActive(item, pathname);
    const hasChildren = Boolean(item.children?.length);
    const isChild = level > 0;
    const itemClass = `${collapsed ? "justify-center px-2" : `gap-3 ${isChild ? "px-7" : "px-3"}`} flex items-center rounded-lg py-2 text-sm transition-all`;
    const rowBaseClass = `${itemClass} ${active ? "bg-lime-400/10 font-medium text-lime-300" : item.disabled ? "text-zinc-500" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"}`;
    const isOpen = hasChildren ? getIsOpen(item) : false;

    return (
      <div key={`${item.id}-${level}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-1"}`}>
          {item.href && !item.disabled ? (
            <Link
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`${rowBaseClass} ${hasChildren && !collapsed ? "flex-1" : "w-full"}`}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="ml-auto rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                      {item.badge}
                    </span>
                  ) : null}
                </>
              )}
            </Link>
          ) : (
            <div
              aria-disabled="true"
              title={collapsed ? item.label : undefined}
              className={`${rowBaseClass} ${hasChildren && !collapsed ? "flex-1" : "w-full"} ${collapsed ? "" : "justify-start"}`}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="ml-auto rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      {item.badge}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          )}

          {!collapsed && hasChildren && (
            <button
              type="button"
              onClick={() => toggleExpanded(item.id)}
              aria-label={`Desplegar ${item.label}`}
              aria-expanded={isOpen}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} />
            </button>
          )}
        </div>

        {!collapsed && hasChildren && isOpen && (
          <div className="mt-0.5 space-y-0.5">{item.children?.map((child) => renderItem(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <aside className={`flex h-screen flex-col border-r border-white/10 bg-zinc-950 ${className}`}>
      <div className={`flex h-16 items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "px-5"}`}>
        <Link href="/dashboard" onClick={onNavigate}>
          {collapsed ? <BilletoIcon className="size-8" /> : <BilletoLogo />}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">{navItems.map((item) => renderItem(item))}</nav>

      <div className="border-t border-white/10 p-3">
        {!collapsed && (
          <div className="mb-3 rounded-xl border border-white/10 bg-zinc-900/70 p-3">
            <p className="text-sm font-medium text-zinc-100">Invita amigos</p>
            <p className="mt-1 text-xs text-zinc-400">Comparte tu enlace y gana beneficios cuando tus amigos se unan.</p>
            <button
              type="button"
              onClick={copyInviteLink}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-500/20 px-3 py-2 text-xs font-medium text-lime-300 transition-colors hover:bg-lime-500/30"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Enlace copiado" : "Copiar enlace"}
            </button>
          </div>
        )}

        <div className="mb-2 space-y-1">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className={`flex w-full items-center rounded-lg py-2 text-sm text-zinc-400 ${collapsed ? "justify-center px-2" : "gap-3 px-3 text-left"}`}
            title={collapsed ? "Ayuda" : undefined}
          >
            <CircleHelp className="h-4 w-4" />
            {!collapsed && "Ayuda"}
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className={`flex w-full items-center rounded-lg py-2 text-sm text-zinc-400 ${collapsed ? "justify-center px-2" : "gap-3 px-3 text-left"}`}
            title={collapsed ? "Novedades" : undefined}
          >
            <Bell className="h-4 w-4" />
            {!collapsed && "Novedades"}
          </button>
        </div>

        <div className={`mb-2 flex items-center border-t border-white/10 pt-3 ${collapsed ? "justify-center" : "gap-3 px-2"}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-400/10 text-sm font-bold text-lime-300">
            {user.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-100">{user.name}</p>
              <p className="truncate text-xs text-zinc-400">{user.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title={collapsed ? "Cerrar sesión" : undefined}
          className={`flex w-full items-center rounded-lg py-2 text-sm text-zinc-400 transition-all hover:bg-red-400/5 hover:text-red-300 ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}

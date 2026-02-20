"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  CreditCard,
  FileUp,
  Goal,
  HandCoins,
  Languages,
  LayoutDashboard,
  Link2,
  LogOut,
  MoreVertical,
  PiggyBank,
  Settings,
  Settings2,
  Sparkles,
  User,
  Users,
  Wallet,
  Workflow,
  Zap,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { BilletoIcon, BilletoLogo } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

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
  { id: "assistant", label: "Asistente", icon: Bot, href: "/assistant" },
  { id: "panel", label: "Panel", icon: LayoutDashboard, href: "/dashboard", exact: true },
  {
    id: "transactions",
    label: "Transacciones",
    icon: Zap,
    href: "/transactions",
    children: [
      { id: "rules", label: "Reglas", icon: Workflow, href: "/transactions/rules" },
      { id: "recurring", label: "Recurrentes", icon: Sparkles, href: "/transactions/recurring-transactions" },
      { id: "extracts", label: "Importar extractos", icon: FileUp, disabled: true },
    ],
  },
  { id: "accounts", label: "Cuentas", icon: Wallet, href: "/accounts" },
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
    const isOpen = hasChildren ? getIsOpen(item) : false;

    // Estilos de estado deshabilitado
    const disabledState = item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

    // Estilos de estado activo premium
    const activeState = active
      ? "bg-lime-500/10 font-medium text-lime-400 shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.02)]"
      : `text-zinc-400 transition-colors ${!item.disabled ? "hover:bg-white/5 hover:text-zinc-100" : ""}`;

    // Espaciado dinámico optimizado
    const itemClass = `${collapsed ? "justify-center px-2" : `gap-3 ${isChild ? "px-3" : "px-3"}`} flex items-center rounded-lg py-2.5 text-sm transition-all duration-200 relative group`;

    const rowBaseClass = `${itemClass} ${activeState} ${disabledState}`;

    // Fix UX: hacer toda la fila clicable para abrir menús sin enlace
    const handleRowClick = (e: React.MouseEvent) => {
      if (item.disabled) {
        e.preventDefault();
        return;
      }
      if (hasChildren && !item.href) {
        e.preventDefault();
        toggleExpanded(item.id);
      } else if (onNavigate) {
        onNavigate();
      }
    };

    const renderContent = () => (
      <>
        {/* Indicador de activo a la izquierda, estilo neón sutil */}
        {!collapsed && active && !isChild && (
          <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-md bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)]" />
        )}
        <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]" : "text-zinc-400 group-hover:text-zinc-300 transition-colors"}`} />
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className="ml-auto rounded-md border border-lime-500/20 bg-lime-500/10 px-1.5 py-[2px] text-[9px] font-semibold tracking-wider uppercase text-lime-400">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronDown
                className={`ml-auto h-4 w-4 text-zinc-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-zinc-300" : ""}`}
                onClick={(e) => {
                  if (item.href) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!item.disabled) toggleExpanded(item.id);
                  }
                }}
              />
            )}
          </>
        )}
      </>
    );

    return (
      <div key={`${item.id}-${level}`} className="mb-1">
        <div className={`flex items-center ${collapsed ? "justify-center" : ""}`}>
          {item.href ? (
            <Link
              href={item.disabled ? "#" : item.href}
              onClick={handleRowClick}
              title={collapsed ? item.label : undefined}
              className={`${rowBaseClass} w-full`}
              aria-disabled={item.disabled}
            >
              {renderContent()}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleRowClick}
              disabled={item.disabled}
              title={collapsed ? item.label : undefined}
              className={`${rowBaseClass} w-full text-left`}
              aria-expanded={isOpen}
            >
              {renderContent()}
            </button>
          )}
        </div>

        {/* Submenús con animación suave y línea vertical de conexión elegante */}
        {!collapsed && hasChildren && (
          <div
            className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"}`}
          >
            <div className="overflow-hidden">
              <div className="ml-5 space-y-0.5 border-l border-white/5 pl-2 relative before:absolute before:inset-y-0 before:-left-px before:w-px before:bg-gradient-to-b before:from-lime-500/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity">
                {item.children?.map((child) => renderItem(child, level + 1))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`flex h-screen flex-col border-r border-white/5 bg-[#09090b] ${className}`}>
      {/* Header un poco un más estilizado */}
      <div className={`flex h-[68px] shrink-0 items-center border-b border-white/5 ${collapsed ? "justify-center px-2" : "px-6"}`}>
        <Link href="/dashboard" onClick={onNavigate} className="transition-transform hover:scale-[1.02] flex items-center">
          {collapsed ? <BilletoIcon className="size-8 drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]" /> : <BilletoLogo />}
        </Link>
      </div>

      {/* Navegación con barras de desplazamiento personalizadas ocultas per funcionales */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
        {navItems.map((item) => renderItem(item))}
      </nav>

      {/* pb-8 previene colisiones con el overlay de Next.js u otros widgets de debug en la esquina inferior */}
      <div className="border-t border-white/5 p-4 pb-8">
        {!collapsed && (
          <div className="group relative mb-4 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-[#09090b] p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-lime-500/20 hover:shadow-lime-500/5">
            {/* Efecto hover Glassmorphism */}
            <div className="absolute inset-0 bg-gradient-to-tr from-lime-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-lime-400 drop-shadow-[0_0_5px_rgba(163,230,53,0.4)]" />
                <p className="text-sm font-semibold text-zinc-100 tracking-tight">Invita amigos</p>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-zinc-400">Comparte tu enlace y gana beneficios únicos cuando tus amigos se unan.</p>
              <button
                type="button"
                onClick={copyInviteLink}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-lime-500/10 px-3 py-2 text-xs font-medium text-lime-400 transition-all hover:bg-lime-500/20 hover:text-lime-300 hover:shadow-[0_0_10px_rgba(163,230,53,0.1)]"
              >
                {copied ? <Zap className="h-3.5 w-3.5 fill-lime-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Enlace copiado!" : "Copiar enlace"}
              </button>
            </div>
          </div>
        )}

        <div className="mb-3 space-y-0.5">
          <button
            type="button"
            className={`flex w-full items-center rounded-lg py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 ${collapsed ? "justify-center px-2" : "gap-3 px-3 text-left"}`}
            title={collapsed ? "Ayuda" : undefined}
          >
            <CircleHelp className="h-[18px] w-[18px]" />
            {!collapsed && "Ayuda"}
          </button>
          <button
            type="button"
            className={`flex w-full items-center rounded-lg py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 ${collapsed ? "justify-center px-2" : "gap-3 px-3 text-left"}`}
            title={collapsed ? "Novedades" : undefined}
          >
            <Bell className="h-[18px] w-[18px]" />
            {!collapsed && "Novedades"}
          </button>
        </div>

        {/* Menú de Perfil de Usuario Premium (Dropdown) */}
        <div className={`mt-2 border-t border-white/5 pt-3 ${collapsed ? "flex justify-center" : ""}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex w-full items-center rounded-xl p-2 text-sm transition-all hover:bg-white/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-lime-500/50 ${collapsed ? "justify-center" : "gap-3 text-left"}`}
                title={collapsed ? "Perfil" : undefined}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-lime-500/20 bg-lime-500/10 text-sm font-bold text-lime-400 shadow-[inset_0_0_10px_rgba(163,230,53,0.1)]">
                  {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{user.name}</p>
                      <p className="truncate text-xs text-zinc-500">{user.email}</p>
                    </div>
                    <MoreVertical className="h-4 w-4 shrink-0 text-zinc-500" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={collapsed ? "right" : "top"}
              align={collapsed ? "end" : "start"}
              sideOffset={8}
              className="w-56 min-w-56 bg-[#18181b] border-white/10 p-1 shadow-2xl rounded-xl"
            >
              <DropdownMenuLabel className="font-normal p-2 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-500 text-sm font-bold text-white">
                    {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium text-zinc-100 leading-none">{user.name}</p>
                    <p className="text-xs text-zinc-400 leading-none truncate">{user.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5 mx-1" />
              <DropdownMenuGroup className="p-1">
                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 focus:text-zinc-100 py-2 rounded-lg text-zinc-300">
                  <User className="h-[18px] w-[18px]" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 focus:text-zinc-100 py-2 rounded-lg text-zinc-300">
                  <CreditCard className="h-[18px] w-[18px]" />
                  <span>Facturación</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 focus:text-zinc-100 py-2 rounded-lg text-zinc-300">
                  <Settings className="h-[18px] w-[18px]" />
                  <span>Configuración</span>
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer gap-3 focus:bg-white/5 data-[state=open]:bg-white/5 focus:text-zinc-100 py-2 rounded-lg text-zinc-300 outline-none">
                    <div className="flex items-center gap-3 flex-1">
                      <Languages className="h-[18px] w-[18px]" />
                      <span>Idioma</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium">ES ES</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-[#18181b] border-white/10 p-1 shadow-2xl rounded-xl w-40" sideOffset={8}>
                    {[
                      { id: "ES", label: "Español", active: true },
                      { id: "US", label: "English" },
                      { id: "DE", label: "Deutsch" },
                      { id: "FR", label: "Français" },
                      { id: "IT", label: "Italiano" },
                      { id: "PT", label: "Português" },
                    ].map((lang) => (
                      <DropdownMenuItem key={lang.id} className="cursor-pointer gap-3 flex items-center justify-between focus:bg-white/5 focus:text-zinc-100 py-2 px-2 rounded-lg text-zinc-300">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-zinc-400 w-4 tracking-wider">{lang.id}</span>
                          <span>{lang.label}</span>
                        </div>
                        {lang.active && <Check className="h-3.5 w-3.5 text-zinc-100" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-white/5 mx-1" />
              <DropdownMenuItem
                className="cursor-pointer gap-3 focus:bg-white/5 focus:text-zinc-100 text-zinc-300 py-2 rounded-lg m-1 outline-none"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-[18px] w-[18px]" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}

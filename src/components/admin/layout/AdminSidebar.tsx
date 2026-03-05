"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Bot,
    ChevronDown,
    CreditCard,
    FileText,
    Globe,
    LayoutDashboard,
    LogOut,
    MoreVertical,
    Settings,
    Shield,
    TrendingUp,
    Users,
    Building2,
    Zap,
    Brain,
    Key,
    MessageSquare,
    Wrench,
    ShieldAlert,
    Tags,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { BilletoIcon, BilletoLogo } from "@/components/ui/logo";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminSidebarProps {
    admin: {
        name?: string | null;
        email?: string | null;
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
    exact?: boolean;
    children?: NavItem[];
};

const adminNavItems: NavItem[] = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard, href: "/admin", exact: true },
    { id: "users", label: "Usuarios", icon: Users, href: "/admin/users" },
    { id: "workspaces", label: "Workspaces", icon: Building2, href: "/admin/workspaces" },
    { id: "transactions", label: "Transacciones", icon: Zap, href: "/admin/transactions" },
    { id: "subscriptions", label: "Suscripciones", icon: CreditCard, href: "/admin/subscriptions" },
    { id: "audit", label: "Auditoría", icon: FileText, href: "/admin/audit" },
    {
        id: "analytics",
        label: "Analytics",
        icon: BarChart3,
        children: [
            { id: "growth", label: "Growth", icon: TrendingUp, href: "/admin/analytics/growth" },
            { id: "usage", label: "Usage", icon: BarChart3, href: "/admin/analytics/usage" },
            { id: "financial", label: "Financial", icon: Globe, href: "/admin/analytics/financial" },
            { id: "ai-analytics", label: "IA", icon: Bot, href: "/admin/analytics/ai" },
        ],
    },
    {
        id: "ai",
        label: "Inteligencia Artificial",
        icon: Brain,
        children: [
            { id: "providers", label: "Proveedores", icon: Key, href: "/admin/ai/providers" },
            { id: "prompt", label: "System Prompt", icon: MessageSquare, href: "/admin/ai/prompt" },
            { id: "tools", label: "Tools", icon: Wrench, href: "/admin/ai/tools" },
            { id: "ai-security", label: "Prompt Guard", icon: ShieldAlert, href: "/admin/ai/security" },
            { id: "keywords", label: "Keywords", icon: Tags, href: "/admin/ai/keywords" },
        ],
    },
    {
        id: "content",
        label: "Contenido",
        icon: FileText,
        children: [
            { id: "categories", label: "Categorías", icon: Tags, href: "/admin/content/categories" },
            { id: "popular-subs", label: "Suscripciones", icon: CreditCard, href: "/admin/content/popular-subscriptions" },
            { id: "goal-templates", label: "Plantillas", icon: FileText, href: "/admin/content/goal-templates" },
            { id: "currencies", label: "Monedas", icon: Globe, href: "/admin/content/currencies" },
        ],
    },
    { id: "settings", label: "Configuración", icon: Settings, href: "/admin/settings" },
    { id: "security", label: "Seguridad", icon: Shield, href: "/admin/security" },
];

function matchesPath(item: NavItem, pathname: string): boolean {
    if (!item.href) return false;
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isItemActive(item: NavItem, pathname: string): boolean {
    if (matchesPath(item, pathname)) return true;
    return item.children?.some((child) => isItemActive(child, pathname)) ?? false;
}

export function AdminSidebar({ admin, collapsed = false, className = "", onNavigate }: AdminSidebarProps) {
    const pathname = usePathname();
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        const state: Record<string, boolean> = {};
        adminNavItems.forEach((item) => {
            if (item.children?.length) {
                state[item.id] = item.children.some((child) => isItemActive(child, pathname));
            }
        });
        return state;
    });

    const toggleExpanded = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const getIsOpen = (item: NavItem): boolean => {
        if (!item.children?.length) return false;
        const autoOpen = item.children.some((child) => isItemActive(child, pathname));
        return expanded[item.id] ?? autoOpen;
    };

    const renderItem = (item: NavItem, level = 0) => {
        const Icon = item.icon;
        const active = isItemActive(item, pathname);
        const hasChildren = Boolean(item.children?.length);
        const isOpen = hasChildren ? getIsOpen(item) : false;

        const activeClass = active
            ? "bg-indigo-500/10 font-medium text-indigo-400 shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.02)]"
            : "text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100";

        const itemClass = `${collapsed ? "justify-center px-2" : `gap-3 ${level > 0 ? "px-3" : "px-3"}`} flex items-center rounded-lg py-2 text-sm transition-all duration-200 relative group cursor-pointer`;

        const handleClick = (e: React.MouseEvent) => {
            if (hasChildren && !item.href) {
                e.preventDefault();
                toggleExpanded(item.id);
            } else if (onNavigate) {
                onNavigate();
            }
        };

        const content = (
            <>
                {!collapsed && active && level === 0 && (
                    <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-md bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                )}
                <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "text-zinc-400 group-hover:text-zinc-300"}`} />
                {!collapsed && (
                    <>
                        <span className="truncate">{item.label}</span>
                        {hasChildren && (
                            <ChevronDown
                                className={`ml-auto h-4 w-4 text-zinc-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-zinc-300" : ""}`}
                                onClick={(e) => {
                                    if (item.href) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleExpanded(item.id);
                                    }
                                }}
                            />
                        )}
                    </>
                )}
            </>
        );

        return (
            <div key={`${item.id}-${level}`} className="mb-0.5">
                {item.href ? (
                    <Link href={item.href} onClick={handleClick} className={`${itemClass} ${activeClass} w-full`}>
                        {content}
                    </Link>
                ) : (
                    <button type="button" onClick={handleClick} className={`${itemClass} ${activeClass} w-full text-left`}>
                        {content}
                    </button>
                )}
                {!collapsed && hasChildren && (
                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-0.5" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                            <div className="ml-5 space-y-0.5 border-l border-white/5 pl-2">
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
            {/* Header */}
            <div className={`flex h-[68px] shrink-0 items-center border-b border-white/5 ${collapsed ? "justify-center px-2" : "px-6"}`}>
                <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
                    {collapsed ? (
                        <BilletoIcon className="size-8 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
                    ) : (
                        <>
                            <BilletoLogo />
                            <span className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-indigo-400">
                                Admin
                            </span>
                        </>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800">
                {adminNavItems.map((item) => renderItem(item))}
            </nav>

            {/* User section */}
            <div className="border-t border-white/5 p-3">
                {/* Link back to client dashboard */}
                <Link
                    href="/dashboard"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 mb-2"
                >
                    <LayoutDashboard className="h-[18px] w-[18px]" />
                    {!collapsed && "Ir al Dashboard"}
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center gap-3 rounded-xl p-2 text-sm text-left transition-all hover:bg-white/5 focus-visible:outline-hidden">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 text-sm font-bold text-indigo-400">
                                {admin.name?.charAt(0)?.toUpperCase() ?? "A"}
                            </div>
                            {!collapsed && (
                                <>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-zinc-100">{admin.name}</p>
                                        <p className="truncate text-xs text-zinc-500">{admin.email}</p>
                                    </div>
                                    <MoreVertical className="h-4 w-4 shrink-0 text-zinc-500" />
                                </>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56 bg-[#18181b] border-white/10 p-1 shadow-2xl rounded-xl">
                        <DropdownMenuLabel className="font-normal p-2">
                            <p className="text-sm font-medium text-zinc-100">{admin.name}</p>
                            <p className="text-xs text-zinc-400">{admin.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem asChild className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300">
                            <Link href="/dashboard">
                                <LayoutDashboard className="h-[18px] w-[18px]" />
                                <span>Dashboard Cliente</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem
                            className="cursor-pointer gap-3 focus:bg-white/5 text-zinc-300 py-2 rounded-lg"
                            onClick={() => signOut({ callbackUrl: "/" })}
                        >
                            <LogOut className="h-[18px] w-[18px]" />
                            <span>Cerrar sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}

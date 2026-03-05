"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Bot,
    Building2,
    ChevronDown,
    CreditCard,
    FileText,
    Globe,
    LayoutDashboard,
    LogOut,
    MoreVertical,
    Settings,
    Shield,
    Tags,
    Users,
    Zap,
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

type NavSection = {
    id: string;
    label: string;
    items: NavItem[];
};

const adminNavSections: NavSection[] = [
    {
        id: "overview",
        label: "Visión General",
        items: [
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin", exact: true },
            { id: "analytics", label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
        ],
    },
    {
        id: "operations",
        label: "Operaciones",
        items: [
            { id: "users", label: "Usuarios", icon: Users, href: "/admin/users" },
            { id: "workspaces", label: "Workspaces", icon: Building2, href: "/admin/workspaces" },
            { id: "transactions", label: "Transacciones", icon: Zap, href: "/admin/transactions" },
            { id: "subscriptions", label: "Suscripciones", icon: CreditCard, href: "/admin/subscriptions" },
            { id: "audit", label: "Auditoría", icon: FileText, href: "/admin/audit" },
            { id: "security", label: "Seguridad", icon: Shield, href: "/admin/security" },
        ],
    },
    {
        id: "platform",
        label: "Plataforma",
        items: [
            { id: "ai", label: "Inteligencia Artificial", icon: Bot, href: "/admin/ai" },
            {
                id: "content",
                label: "Contenido",
                icon: FileText,
                href: "/admin/content",
                children: [
                    { id: "categories", label: "Categorías", icon: Tags, href: "/admin/content/categories" },
                    { id: "popular-subscriptions", label: "Suscripciones", icon: CreditCard, href: "/admin/content/popular-subscriptions" },
                    { id: "goal-templates", label: "Plantillas", icon: FileText, href: "/admin/content/goal-templates" },
                    { id: "currencies", label: "Monedas", icon: Globe, href: "/admin/content/currencies" },
                ],
            },
            { id: "settings", label: "Configuración", icon: Settings, href: "/admin/settings" },
        ],
    },
];

const navItems = adminNavSections.flatMap((section) => section.items);

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
        navItems.forEach((item) => {
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

        const itemClass = `${collapsed ? "justify-center px-2.5" : `gap-3 ${level > 0 ? "px-3" : "px-3.5"}`} group relative flex w-full items-center rounded-xl py-2.5 text-sm transition-all duration-200`;
        const activeClass = active
            ? "border border-cyan-400/25 bg-cyan-400/10 text-cyan-100 shadow-[0_12px_32px_-24px_rgba(34,211,238,0.9)]"
            : "border border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-100";

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
                {active && level === 0 && !collapsed && (
                    <div className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-cyan-300" />
                )}
                <Icon className={`h-[17px] w-[17px] shrink-0 ${active ? "text-cyan-200" : "text-zinc-500 group-hover:text-zinc-300"}`} />
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
            <div key={`${item.id}-${level}`} className="mb-1">
                {item.href ? (
                    <Link href={item.href} onClick={handleClick} className={`${itemClass} ${activeClass}`}>
                        {content}
                    </Link>
                ) : (
                    <button type="button" onClick={handleClick} className={`${itemClass} ${activeClass} text-left`}>
                        {content}
                    </button>
                )}
                {!collapsed && hasChildren && (
                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                            <div className="ml-5 space-y-1 border-l border-white/10 pl-2.5">
                                {item.children?.map((child) => renderItem(child, level + 1))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className={`flex h-full flex-col border-r border-white/10 bg-[#070d18]/85 backdrop-blur-xl ${className}`}>
            <div className={`flex h-[72px] shrink-0 items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "px-6"}`}>
                <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
                    {collapsed ? (
                        <BilletoIcon className="size-8 text-cyan-300" />
                    ) : (
                        <>
                            <BilletoLogo />
                            <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase text-cyan-100">
                                Panel
                            </span>
                        </>
                    )}
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto p-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700/50">
                {adminNavSections.map((section) => (
                    <div key={section.id} className="mb-4">
                        {!collapsed && (
                            <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] uppercase text-zinc-500">
                                {section.label}
                            </p>
                        )}
                        <div>{section.items.map((item) => renderItem(item))}</div>
                    </div>
                ))}
            </nav>

            <div className="border-t border-white/10 p-3.5">
                <Link
                    href="/dashboard"
                    onClick={onNavigate}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-100"
                >
                    <LayoutDashboard className="h-[17px] w-[17px]" />
                    {!collapsed && "Ir al Dashboard"}
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left text-sm transition-all hover:border-white/10 hover:bg-white/[0.04] focus-visible:outline-hidden">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/12 text-sm font-semibold text-cyan-100">
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
                    <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56 rounded-xl border-white/10 bg-[#0e1625] p-1 shadow-2xl">
                        <DropdownMenuLabel className="p-2 font-normal">
                            <p className="text-sm font-medium text-zinc-100">{admin.name}</p>
                            <p className="text-xs text-zinc-400">{admin.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg py-2 text-zinc-300 focus:bg-white/[0.06]">
                            <Link href="/dashboard">
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Dashboard Cliente</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            className="cursor-pointer gap-3 rounded-lg py-2 text-zinc-300 focus:bg-white/[0.06]"
                            onClick={() => signOut({ callbackUrl: "/" })}
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Cerrar sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}

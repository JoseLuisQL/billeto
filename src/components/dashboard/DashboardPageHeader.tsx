"use client";

import Link from "next/link";
import { Menu, PanelLeftClose, PanelLeftOpen, ChevronRight } from "lucide-react";

interface DashboardPageHeaderProps {
  title: string;
  breadcrumb: string[];
  isSidebarHidden: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
}

export function DashboardPageHeader({
  title,
  breadcrumb,
  isSidebarHidden,
  onToggleSidebar,
  onOpenMobileMenu,
}: DashboardPageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onOpenMobileMenu}
          className="inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-zinc-300 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </button>

        <button
          onClick={onToggleSidebar}
          className="hidden items-center justify-center rounded-lg border border-white/10 p-2 text-zinc-300 hover:bg-white/5 hover:text-white lg:inline-flex"
          aria-label={isSidebarHidden ? "Mostrar menú" : "Ocultar menú"}
          title={isSidebarHidden ? "Mostrar menú" : "Ocultar menú"}
        >
          {isSidebarHidden ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1 overflow-hidden">
          {breadcrumb.length === 1 ? (
            <div className="truncate text-sm font-medium text-white">{title}</div>
          ) : (
            <nav className="flex items-center gap-1 overflow-hidden whitespace-nowrap text-sm text-zinc-300">
              <Link href="/dashboard" className="shrink-0 hover:text-zinc-100 transition-colors">
                Dashboard
              </Link>
              {breadcrumb.slice(1).map((item, index) => {
                const isLast = index === breadcrumb.slice(1).length - 1;
                return (
                  <span key={item} className="inline-flex min-w-0 items-center gap-1">
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    <span className={`${isLast ? "text-white font-medium" : "text-zinc-400"} truncate`}>
                      {item}
                    </span>
                  </span>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

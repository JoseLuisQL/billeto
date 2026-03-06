"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface AdminShellProps {
    admin: {
        name?: string | null;
        email?: string | null;
    };
    children: React.ReactNode;
}

export function AdminShell({ admin, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-theme relative flex min-h-dvh overflow-hidden bg-[color:var(--admin-bg)] text-[color:var(--admin-text)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_right,rgba(159,186,219,0.16),transparent_48%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/6" />
      </div>

      <div className="relative z-10 hidden w-[292px] shrink-0 xl:w-[312px] lg:block">
        <AdminSidebar admin={admin} />
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Cerrar navegación lateral"
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[292px] lg:hidden">
            <AdminSidebar admin={admin} onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <AdminHeader onToggleSidebar={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:pt-6">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

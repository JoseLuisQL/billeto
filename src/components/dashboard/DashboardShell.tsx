"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

const SIDEBAR_STATE_KEY = "billeto.sidebar.hidden";

const routeMeta: Record<string, { title: string; breadcrumb: string[] }> = {
  "/dashboard": { title: "Dashboard", breadcrumb: ["Dashboard"] },
  "/transactions": { title: "Transacciones", breadcrumb: ["Dashboard", "Transacciones"] },
  "/accounts": { title: "Cuentas", breadcrumb: ["Dashboard", "Cuentas"] },
  "/categories": { title: "Categorías", breadcrumb: ["Dashboard", "Categorías"] },
  "/transactions/rules": { title: "Reglas", breadcrumb: ["Dashboard", "Reglas"] },
  "/transactions/recurring-transactions": { title: "Recurrentes", breadcrumb: ["Dashboard", "Recurrentes"] },
  "/assistant": { title: "Asistente IA", breadcrumb: ["Dashboard", "Asistente IA"] },
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarHidden, setSidebarHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_STATE_KEY) === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, sidebarHidden ? "1" : "0");
  }, [sidebarHidden]);

  const meta = useMemo(() => {
    const direct = routeMeta[pathname];
    if (direct) return direct;

    const parts = pathname.split("/").filter(Boolean);
    const section = parts[parts.length - 1] || "dashboard";
    const label = section.charAt(0).toUpperCase() + section.slice(1).replace("-", " ");
    return { title: label, breadcrumb: ["Dashboard", label] };
  }, [pathname]);

  if (!session?.user) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {!sidebarHidden && (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
          <DashboardSidebar
            user={{
              id: session.user.id ?? "",
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }}
          />
        </aside>
      )}

      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900 lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg border border-white/10 bg-zinc-900/80 p-2 text-zinc-300 hover:bg-white/5 hover:text-white"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </button>
            <DashboardSidebar
              user={{
                id: session.user.id ?? "",
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
              }}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      <div className={`min-h-screen transition-all duration-200 ${sidebarHidden ? "lg:pl-0" : "lg:pl-64"}`}>
        <DashboardPageHeader
          title={meta.title}
          breadcrumb={meta.breadcrumb}
          isSidebarHidden={sidebarHidden}
          onToggleSidebar={() => setSidebarHidden((v) => !v)}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <div className="mx-auto w-full max-w-[1240px]">{children}</div>
      </div>
    </div>
  );
}

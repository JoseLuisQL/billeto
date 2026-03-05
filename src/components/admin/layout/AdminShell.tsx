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
        <div className="flex h-screen overflow-hidden bg-[#09090b]">
            {/* Desktop sidebar */}
            <div className="hidden w-[260px] shrink-0 lg:block">
                <AdminSidebar admin={admin} />
            </div>

            {/* Mobile sidebar overlay */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden">
                        <AdminSidebar admin={admin} onNavigate={() => setMobileOpen(false)} />
                    </div>
                </>
            )}

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <AdminHeader onToggleSidebar={() => setMobileOpen(!mobileOpen)} />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

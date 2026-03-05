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
        <div className="relative flex h-dvh overflow-hidden bg-[#060b14] text-zinc-100">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-36 -top-40 h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="absolute right-0 top-1/3 h-[24rem] w-[24rem] rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:34px_34px] opacity-[0.08]" />
            </div>

            {/* Desktop sidebar */}
            <div className="relative z-10 hidden w-[280px] shrink-0 lg:block xl:w-[300px]">
                <AdminSidebar admin={admin} />
            </div>

            {/* Mobile sidebar overlay */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden">
                        <AdminSidebar admin={admin} onNavigate={() => setMobileOpen(false)} />
                    </div>
                </>
            )}

            {/* Main content */}
            <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
                <AdminHeader onToggleSidebar={() => setMobileOpen(!mobileOpen)} />
                <main className="flex-1 overflow-y-auto px-4 pb-6 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
                    <div className="mx-auto w-full max-w-[1400px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

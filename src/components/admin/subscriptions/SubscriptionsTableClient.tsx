"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    MoreHorizontal,
    XCircle,
    ArrowUpCircle,
    ArrowDownCircle,
    Ban,
    RotateCcw,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import type { AdminSubscriptionRow } from "@/lib/actions/admin/subscriptions";
import {
    cambiarPlanAdmin,
    cancelarSuscripcionAdmin,
    reactivarSuscripcionAdmin,
} from "@/lib/actions/admin/subscriptions";

interface Props {
    subscriptions: AdminSubscriptionRow[];
}

export function SubscriptionsTableClient({ subscriptions }: Props) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [actionError, setActionError] = useState<string | null>(null);

    const runAction = (fn: () => Promise<unknown>) => {
        setActionError(null);
        startTransition(async () => {
            try {
                await fn();
                router.refresh();
            } catch (e) {
                setActionError(e instanceof Error ? e.message : "Error desconocido");
            }
        });
    };

    const columns = [
        {
            id: "workspace",
            header: "Workspace",
            sortable: true,
            accessorFn: (row: AdminSubscriptionRow) => row.workspaceName,
            cell: (row: AdminSubscriptionRow) => (
                <Link href={`/admin/workspaces/${row.workspaceId}`} className="font-medium text-zinc-200 hover:text-cyan-400 transition-colors">
                    {row.workspaceName}
                </Link>
            ),
        },
        {
            id: "owner",
            header: "Owner",
            sortable: true,
            accessorFn: (row: AdminSubscriptionRow) => row.ownerName,
            cell: (row: AdminSubscriptionRow) => (
                <div>
                    <p className="text-sm text-zinc-300">{row.ownerName}</p>
                    <p className="text-xs text-zinc-500 truncate max-w-[160px]">{row.ownerEmail}</p>
                </div>
            ),
        },
        {
            id: "plan",
            header: "Plan",
            sortable: true,
            accessorFn: (row: AdminSubscriptionRow) => row.planTier,
            cell: (row: AdminSubscriptionRow) => (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${row.planTier === "premium"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : row.planTier === "pro"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                    }`}>
                    {row.planTier}
                </span>
            ),
        },
        {
            id: "status",
            header: "Estado",
            sortable: true,
            accessorFn: (row: AdminSubscriptionRow) => row.status,
            cell: (row: AdminSubscriptionRow) => (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${row.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : row.status === "cancelled"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                    {row.status}
                </span>
            ),
        },
        {
            id: "provider",
            header: "Provider",
            sortable: true,
            accessorFn: (row: AdminSubscriptionRow) => row.paymentProvider ?? "—",
            cell: (row: AdminSubscriptionRow) => <span className="text-zinc-500 text-xs">{row.paymentProvider ?? "Sin provider"}</span>,
        },
        {
            id: "createdAt",
            header: "Creado",
            sortable: true,
            accessorFn: (row: AdminSubscriptionRow) => row.createdAt,
            cell: (row: AdminSubscriptionRow) => (
                <span className="text-zinc-500 text-xs whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
            ),
        },
    ];

    return (
        <div>
            {actionError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {actionError}
                    <button type="button" onClick={() => setActionError(null)} className="ml-auto text-rose-400/60 hover:text-rose-400">
                        <XCircle className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            <AdminDataTable
                data={subscriptions}
                columns={columns}
                pageSize={12}
                searchPlaceholder="Buscar por workspace o owner..."
                searchField={(row) => `${row.workspaceName} ${row.ownerName} ${row.ownerEmail}`}
                emptyMessage="No hay suscripciones"
                actions={(row) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" disabled={pending} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 disabled:opacity-50">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={5} className="w-48 bg-[#18181b] border-white/10 p-1 rounded-xl shadow-2xl">
                            {/* Upgrade/Downgrade */}
                            {row.planTier !== "premium" && (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-amber-400" onClick={() => runAction(() => cambiarPlanAdmin(row.id, row.planTier === "free" ? "pro" : "premium"))}>
                                    <ArrowUpCircle className="h-4 w-4" /> Upgrade a {row.planTier === "free" ? "Pro" : "Premium"}
                                </DropdownMenuItem>
                            )}
                            {row.planTier !== "free" && (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300" onClick={() => runAction(() => cambiarPlanAdmin(row.id, row.planTier === "premium" ? "pro" : "free"))}>
                                    <ArrowDownCircle className="h-4 w-4" /> Downgrade a {row.planTier === "premium" ? "Pro" : "Free"}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-white/5" />
                            {row.status === "active" ? (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-rose-400" onClick={() => runAction(() => cancelarSuscripcionAdmin(row.id))}>
                                    <Ban className="h-4 w-4" /> Cancelar
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-emerald-400" onClick={() => runAction(() => reactivarSuscripcionAdmin(row.id))}>
                                    <RotateCcw className="h-4 w-4" /> Reactivar
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            />
        </div>
    );
}


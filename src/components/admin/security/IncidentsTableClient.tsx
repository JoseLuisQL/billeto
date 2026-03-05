"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, CheckCircle, RotateCcw, XCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import type { AdminIncidentRow } from "@/lib/actions/admin/security";
import { resolverIncidenteAdmin, reabrirIncidenteAdmin } from "@/lib/actions/admin/security";

export function IncidentsTableClient({ incidents }: { incidents: AdminIncidentRow[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const run = (fn: () => Promise<unknown>) => {
        setError(null);
        startTransition(async () => {
            try { await fn(); router.refresh(); }
            catch (e) { setError(e instanceof Error ? e.message : "Error"); }
        });
    };

    const severityColors: Record<string, string> = {
        critical: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        low: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    };

    const columns = [
        {
            id: "severity",
            header: "Sev.",
            sortable: true,
            accessorFn: (row: AdminIncidentRow) => row.severity,
            cell: (row: AdminIncidentRow) => (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${severityColors[row.severity] ?? severityColors.low}`}>
                    {row.severity}
                </span>
            ),
            className: "w-20",
        },
        {
            id: "type",
            header: "Tipo",
            sortable: true,
            accessorFn: (row: AdminIncidentRow) => row.type,
            cell: (row: AdminIncidentRow) => <span className="text-zinc-400 text-xs font-mono">{row.type}</span>,
        },
        {
            id: "title",
            header: "Título",
            sortable: true,
            accessorFn: (row: AdminIncidentRow) => row.title,
            cell: (row: AdminIncidentRow) => (
                <div>
                    <p className="font-medium text-zinc-200 text-sm truncate max-w-[250px]">{row.title}</p>
                    {row.description && <p className="text-xs text-zinc-500 truncate max-w-[250px]">{row.description}</p>}
                </div>
            ),
        },
        {
            id: "status",
            header: "Estado",
            sortable: true,
            accessorFn: (row: AdminIncidentRow) => row.status,
            cell: (row: AdminIncidentRow) => (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${row.status === "resolved"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                    {row.status}
                </span>
            ),
        },
        {
            id: "createdAt",
            header: "Fecha",
            sortable: true,
            accessorFn: (row: AdminIncidentRow) => row.createdAt,
            cell: (row: AdminIncidentRow) => (
                <span className="text-zinc-500 text-xs whitespace-nowrap font-mono">
                    {new Date(row.createdAt).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
            ),
        },
    ];

    return (
        <div>
            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">
                    <XCircle className="h-4 w-4 shrink-0" />{error}
                    <button type="button" onClick={() => setError(null)} className="ml-auto"><XCircle className="h-3.5 w-3.5" /></button>
                </div>
            )}
            <AdminDataTable
                data={incidents}
                columns={columns}
                pageSize={15}
                searchPlaceholder="Buscar incidente..."
                searchField={(row) => `${row.title} ${row.type} ${row.severity} ${row.description ?? ""}`}
                emptyMessage="No hay incidentes registrados"
                actions={(row) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" disabled={pending} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-300 disabled:opacity-50">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={5} className="w-44 bg-[#18181b] border-white/10 p-1 rounded-xl shadow-2xl">
                            {row.status === "open" ? (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-emerald-400" onClick={() => run(() => resolverIncidenteAdmin(row.id))}>
                                    <CheckCircle className="h-4 w-4" /> Resolver
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-amber-400" onClick={() => run(() => reabrirIncidenteAdmin(row.id))}>
                                    <RotateCcw className="h-4 w-4" /> Reabrir
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            />
        </div>
    );
}

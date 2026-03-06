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
import {
    getAdminBadgeClasses,
    getIncidentSeverityLabel,
    getIncidentSeverityTone,
    getIncidentStatusLabel,
} from "@/components/admin/shared/admin-ui";
import type { AdminIncidentRow } from "@/lib/actions/admin/security";
import { resolverIncidenteAdmin, reabrirIncidenteAdmin } from "@/lib/actions/admin/security";

export function IncidentsTableClient({ incidents }: { incidents: AdminIncidentRow[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const run = (fn: () => Promise<unknown>, confirmMessage?: string) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
            return;
        }
        setError(null);
        startTransition(async () => {
            try { await fn(); router.refresh(); }
            catch (e) { setError(e instanceof Error ? e.message : "Error"); }
        });
    };

    const columns = [
        {
            id: "severity",
            header: "Sev.",
            sortable: true,
            accessorFn: (row: AdminIncidentRow) => row.severity,
            cell: (row: AdminIncidentRow) => (
                <span className={getAdminBadgeClasses(getIncidentSeverityTone(row.severity))}>
                    {getIncidentSeverityLabel(row.severity)}
                </span>
            ),
            className: "w-20",
        },
        {
            id: "type",
            header: "Tipo",
            sortable: true,
            accessorFn: (row: AdminIncidentRow) => row.type,
            cell: (row: AdminIncidentRow) => <span className="text-xs font-mono text-[color:var(--admin-text-subtle)]">{row.type}</span>,
        },
        {
            id: "title",
            header: "Título",
            sortable: true,
            accessorFn: (row: AdminIncidentRow) => row.title,
            cell: (row: AdminIncidentRow) => (
                <div>
                    <p className="max-w-[250px] truncate text-sm font-medium text-[color:var(--admin-text)]">{row.title}</p>
                    {row.description && <p className="max-w-[250px] truncate text-xs text-[color:var(--admin-text-subtle)]">{row.description}</p>}
                </div>
            ),
        },
        {
            id: "status",
            header: "Estado",
            sortable: true,
            accessorFn: (row: AdminIncidentRow) => row.status,
            cell: (row: AdminIncidentRow) => (
                <span className={getAdminBadgeClasses(row.status === "resolved" ? "success" : "danger")}>
                    {getIncidentStatusLabel(row.status)}
                </span>
            ),
        },
        {
            id: "createdAt",
            header: "Fecha",
            sortable: true,
            accessorFn: (row: AdminIncidentRow) => row.createdAt,
            cell: (row: AdminIncidentRow) => (
                <span className="text-xs whitespace-nowrap font-mono text-[color:var(--admin-text-subtle)]">
                    {new Date(row.createdAt).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
            ),
        },
    ];

    return (
        <div>
            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-[color:var(--admin-danger-soft)] bg-[color:var(--admin-danger-soft)] px-4 py-2.5 text-sm text-[color:var(--admin-danger)]">
                    <XCircle className="h-4 w-4 shrink-0" />{error}
                    <button type="button" onClick={() => setError(null)} className="ml-auto text-[color:var(--admin-danger)]/70 transition-colors hover:text-[color:var(--admin-danger)]"><XCircle className="h-3.5 w-3.5" /></button>
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
                            <button type="button" disabled={pending} aria-label={`Abrir acciones para incidente ${row.title}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--admin-text-subtle)] transition-colors hover:bg-white/5 hover:text-[color:var(--admin-text)] disabled:opacity-50">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={5} className="w-44 bg-[#18181b] border-white/10 p-1 rounded-xl shadow-2xl">
                            {row.status === "open" ? (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-emerald-400" onClick={() => run(() => resolverIncidenteAdmin(row.id), `¿Marcar el incidente "${row.title}" como resuelto?`)}>
                                    <CheckCircle className="h-4 w-4" /> Resolver
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-amber-400" onClick={() => run(() => reabrirIncidenteAdmin(row.id), `¿Reabrir el incidente "${row.title}"?`)}>
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

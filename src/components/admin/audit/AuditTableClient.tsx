"use client";

import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import type { AdminAuditLogRow } from "@/lib/actions/admin/audit";

export function AuditTableClient({ logs }: { logs: AdminAuditLogRow[] }) {
    const columns = [
        {
            id: "createdAt",
            header: "Fecha",
            sortable: true,
            accessorFn: (row: AdminAuditLogRow) => row.createdAt,
            cell: (row: AdminAuditLogRow) => (
                <span className="text-zinc-500 text-xs whitespace-nowrap font-mono">
                    {new Date(row.createdAt).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
            ),
        },
        {
            id: "actor",
            header: "Actor",
            sortable: true,
            accessorFn: (row: AdminAuditLogRow) => row.actorName,
            cell: (row: AdminAuditLogRow) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-200 text-sm">{row.actorName}</span>
                    <span className={`rounded px-1.5 py-0 text-[10px] font-semibold uppercase ${row.actorType === "admin"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                        }`}>
                        {row.actorType}
                    </span>
                </div>
            ),
        },
        {
            id: "action",
            header: "Acción",
            sortable: true,
            accessorFn: (row: AdminAuditLogRow) => row.action,
            cell: (row: AdminAuditLogRow) => (
                <span className="inline-flex rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400 font-mono">
                    {row.action}
                </span>
            ),
        },
        {
            id: "entity",
            header: "Entidad",
            sortable: true,
            accessorFn: (row: AdminAuditLogRow) => row.entity,
            cell: (row: AdminAuditLogRow) => (
                <div>
                    <span className="text-sm text-zinc-300">{row.entity}</span>
                    {row.entityId && <span className="ml-1 text-xs text-zinc-600 font-mono">{row.entityId.slice(0, 8)}…</span>}
                </div>
            ),
        },
        {
            id: "workspace",
            header: "Workspace",
            sortable: true,
            accessorFn: (row: AdminAuditLogRow) => row.workspaceName ?? "",
            cell: (row: AdminAuditLogRow) => <span className="text-zinc-500 text-xs">{row.workspaceName ?? "—"}</span>,
        },
        {
            id: "changes",
            header: "Cambios",
            cell: (row: AdminAuditLogRow) => {
                if (!row.before && !row.after) return <span className="text-zinc-600 text-xs">—</span>;
                return (
                    <div className="max-w-[200px] truncate text-xs text-zinc-500 font-mono">
                        {row.before && <span className="text-rose-400/60">-{JSON.stringify(row.before).slice(0, 50)}</span>}
                        {row.after && <span className="text-emerald-400/60 ml-1">+{JSON.stringify(row.after).slice(0, 50)}</span>}
                    </div>
                );
            },
        },
    ];

    return (
        <AdminDataTable
            data={logs}
            columns={columns}
            pageSize={20}
            searchPlaceholder="Buscar por actor, acción o entidad..."
            searchField={(row) => `${row.actorName} ${row.action} ${row.entity} ${row.workspaceName ?? ""}`}
            emptyMessage="No hay logs registrados"
        />
    );
}

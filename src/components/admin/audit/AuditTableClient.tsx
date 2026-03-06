"use client";

import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import { getAdminBadgeClasses } from "@/components/admin/shared/admin-ui";
import type { AdminAuditLogRow } from "@/lib/actions/admin/audit";
import { summarizeAdminPreview } from "@/lib/admin-redaction";

export function AuditTableClient({ logs }: { logs: AdminAuditLogRow[] }) {
    const columns = [
        {
            id: "createdAt",
            header: "Fecha",
            sortable: true,
            accessorFn: (row: AdminAuditLogRow) => row.createdAt,
            cell: (row: AdminAuditLogRow) => (
                <span className="text-xs whitespace-nowrap font-mono text-[color:var(--admin-text-subtle)]">
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
                    <span className="text-sm font-medium text-[color:var(--admin-text)]">{row.actorName}</span>
                    <span className={getAdminBadgeClasses(row.actorType === "admin" ? "warning" : "neutral")}>
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
                <span className={`${getAdminBadgeClasses("accent")} font-mono`}>
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
                    <span className="text-sm text-[color:var(--admin-text-muted)]">{row.entity}</span>
                    {row.entityId && <span className="ml-1 font-mono text-xs text-[color:var(--admin-text-subtle)]">{row.entityId.slice(0, 8)}…</span>}
                </div>
            ),
        },
        {
            id: "workspace",
            header: "Workspace",
            sortable: true,
            accessorFn: (row: AdminAuditLogRow) => row.workspaceName ?? "",
            cell: (row: AdminAuditLogRow) => <span className="text-xs text-[color:var(--admin-text-subtle)]">{row.workspaceName ?? "—"}</span>,
        },
        {
            id: "changes",
            header: "Cambios",
            cell: (row: AdminAuditLogRow) => {
                if (!row.before && !row.after) return <span className="text-xs text-[color:var(--admin-text-subtle)]">—</span>;
                return (
                    <div className="max-w-[240px] text-xs font-mono text-[color:var(--admin-text-subtle)]">
                        {row.before && <span className="block truncate">Antes: {summarizeAdminPreview(row.before)}</span>}
                        {row.after && <span className="mt-1 block truncate">Después: {summarizeAdminPreview(row.after)}</span>}
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


"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    MoreHorizontal,
    Eye,
    Trash2,
    RotateCcw,
    XCircle,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import {
    getAdminBadgeClasses,
    getPlanLabel,
    getPlanTone,
} from "@/components/admin/shared/admin-ui";
import type { AdminWorkspaceRow } from "@/lib/actions/admin/workspaces";
import {
    eliminarWorkspaceAdmin,
    restaurarWorkspaceAdmin,
} from "@/lib/actions/admin/workspaces";

interface Props {
    workspaces: AdminWorkspaceRow[];
}

export function WorkspacesTableClient({ workspaces }: Props) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [actionError, setActionError] = useState<string | null>(null);

    const runAction = (fn: () => Promise<unknown>, confirmMessage?: string) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
            return;
        }
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
            id: "name",
            header: "Workspace",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.name,
            cell: (row: AdminWorkspaceRow) => (
                <Link href={`/admin/workspaces/${row.id}`} className="font-medium text-[color:var(--admin-text)] transition-colors hover:text-[color:var(--admin-accent-strong)]">
                    {row.name}
                </Link>
            ),
        },
        {
            id: "owner",
            header: "Owner",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.ownerName,
            cell: (row: AdminWorkspaceRow) => (
                <div>
                    <p className="text-sm text-[color:var(--admin-text-muted)]">{row.ownerName}</p>
                    <p className="max-w-[160px] truncate text-xs text-[color:var(--admin-text-subtle)]">{row.ownerEmail}</p>
                </div>
            ),
        },
        {
            id: "currency",
            header: "Moneda",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.currency,
            cell: (row: AdminWorkspaceRow) => (
                <span className="text-[color:var(--admin-text-muted)]">{row.currency} {row.country ? `(${row.country})` : ""}</span>
            ),
        },
        {
            id: "members",
            header: "Miembros",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.members,
            cell: (row: AdminWorkspaceRow) => <span className="text-[color:var(--admin-text-muted)]">{row.members}</span>,
        },
        {
            id: "transactions",
            header: "Txns",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.transactions,
            cell: (row: AdminWorkspaceRow) => <span className="text-[color:var(--admin-text-muted)]">{row.transactions}</span>,
        },
        {
            id: "plan",
            header: "Plan",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.plan,
            cell: (row: AdminWorkspaceRow) => (
                <span className={getAdminBadgeClasses(getPlanTone(row.plan))}>
                    {getPlanLabel(row.plan)}
                </span>
            ),
        },
        {
            id: "status",
            header: "Estado",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.deletedAt ? "eliminado" : "activo",
            cell: (row: AdminWorkspaceRow) => (
                <span className={getAdminBadgeClasses(row.deletedAt ? "danger" : "success")}>
                    {row.deletedAt ? "Eliminado" : "Activo"}
                </span>
            ),
        },
        {
            id: "createdAt",
            header: "Creado",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.createdAt,
            cell: (row: AdminWorkspaceRow) => (
                <span className="text-xs whitespace-nowrap text-[color:var(--admin-text-subtle)]">
                    {new Date(row.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
            ),
        },
    ];

    return (
        <div>
            {actionError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-[color:var(--admin-danger-soft)] bg-[color:var(--admin-danger-soft)] px-4 py-2.5 text-sm text-[color:var(--admin-danger)]">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {actionError}
                    <button type="button" onClick={() => setActionError(null)} className="ml-auto text-[color:var(--admin-danger)]/70 transition-colors hover:text-[color:var(--admin-danger)]">
                        <XCircle className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            <AdminDataTable
                data={workspaces}
                columns={columns}
                pageSize={12}
                searchPlaceholder="Buscar por nombre o owner..."
                searchField={(row) => `${row.name} ${row.ownerName} ${row.ownerEmail}`}
                emptyMessage="No hay workspaces"
                actions={(row) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                disabled={pending}
                                aria-label={`Abrir acciones para ${row.name}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--admin-text-subtle)] transition-colors hover:bg-white/5 hover:text-[color:var(--admin-text)] disabled:opacity-50"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={5} className="w-48 bg-[#18181b] border-white/10 p-1 rounded-xl shadow-2xl">
                            <DropdownMenuItem asChild className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300">
                                <Link href={`/admin/workspaces/${row.id}`}>
                                    <Eye className="h-4 w-4" /> Ver detalle
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            {row.deletedAt ? (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-emerald-400" onClick={() => runAction(() => restaurarWorkspaceAdmin(row.id), `¿Restaurar el workspace ${row.name}?`)}>
                                    <RotateCcw className="h-4 w-4" /> Restaurar
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-rose-400" onClick={() => runAction(() => eliminarWorkspaceAdmin(row.id), `¿Marcar ${row.name} como eliminado?`)}>
                                    <Trash2 className="h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            />
        </div>
    );
}


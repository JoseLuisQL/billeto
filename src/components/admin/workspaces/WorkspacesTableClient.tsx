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
            id: "name",
            header: "Workspace",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.name,
            cell: (row: AdminWorkspaceRow) => (
                <Link href={`/admin/workspaces/${row.id}`} className="font-medium text-zinc-200 hover:text-indigo-400 transition-colors">
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
                    <p className="text-sm text-zinc-300">{row.ownerName}</p>
                    <p className="text-xs text-zinc-500 truncate max-w-[160px]">{row.ownerEmail}</p>
                </div>
            ),
        },
        {
            id: "currency",
            header: "Moneda",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.currency,
            cell: (row: AdminWorkspaceRow) => (
                <span className="text-zinc-400">{row.currency} {row.country ? `(${row.country})` : ""}</span>
            ),
        },
        {
            id: "members",
            header: "Miembros",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.members,
            cell: (row: AdminWorkspaceRow) => <span className="text-zinc-400">{row.members}</span>,
        },
        {
            id: "transactions",
            header: "Txns",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.transactions,
            cell: (row: AdminWorkspaceRow) => <span className="text-zinc-400">{row.transactions}</span>,
        },
        {
            id: "plan",
            header: "Plan",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.plan,
            cell: (row: AdminWorkspaceRow) => (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${row.plan === "premium"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : row.plan === "pro"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                    }`}>
                    {row.plan}
                </span>
            ),
        },
        {
            id: "status",
            header: "Estado",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.deletedAt ? "eliminado" : "activo",
            cell: (row: AdminWorkspaceRow) => (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${row.deletedAt
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                    {row.deletedAt ? "eliminado" : "activo"}
                </span>
            ),
        },
        {
            id: "createdAt",
            header: "Creado",
            sortable: true,
            accessorFn: (row: AdminWorkspaceRow) => row.createdAt,
            cell: (row: AdminWorkspaceRow) => (
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
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 disabled:opacity-50"
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
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-emerald-400" onClick={() => runAction(() => restaurarWorkspaceAdmin(row.id))}>
                                    <RotateCcw className="h-4 w-4" /> Restaurar
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-rose-400" onClick={() => runAction(() => eliminarWorkspaceAdmin(row.id))}>
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

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    MoreHorizontal,
    Trash2,
    RotateCcw,
    XCircle,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import type { AdminTransactionRow } from "@/lib/actions/admin/transactions";
import {
    eliminarTransaccionAdmin,
    restaurarTransaccionAdmin,
} from "@/lib/actions/admin/transactions";

interface Props {
    transactions: AdminTransactionRow[];
}

export function TransactionsTableClient({ transactions }: Props) {
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
            id: "date",
            header: "Fecha",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.date,
            cell: (row: AdminTransactionRow) => (
                <span className="text-zinc-400 text-xs whitespace-nowrap">
                    {new Date(row.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
            ),
        },
        {
            id: "description",
            header: "Descripción",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.description,
            cell: (row: AdminTransactionRow) => (
                <div>
                    <p className="text-sm font-medium text-zinc-200 truncate max-w-[200px]">{row.description}</p>
                    <p className="text-xs text-zinc-500">{row.category}</p>
                </div>
            ),
        },
        {
            id: "amount",
            header: "Monto",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.amountBase,
            cell: (row: AdminTransactionRow) => (
                <div>
                    <span className={`font-mono font-medium ${row.type === "income" ? "text-emerald-400" : row.type === "expense" ? "text-rose-400" : "text-blue-400"}`}>
                        {row.type === "income" ? "+" : row.type === "expense" ? "-" : "↔"}{row.amount.toFixed(2)}
                    </span>
                    <span className="ml-1 text-xs text-zinc-500">{row.currency}</span>
                </div>
            ),
        },
        {
            id: "type",
            header: "Tipo",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.type,
            cell: (row: AdminTransactionRow) => (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${row.type === "income"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : row.type === "expense"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                    {row.type}
                </span>
            ),
        },
        {
            id: "workspace",
            header: "Workspace",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.workspace,
            cell: (row: AdminTransactionRow) => (
                <Link href={`/admin/workspaces/${row.workspaceId}`} className="text-zinc-400 text-xs hover:text-cyan-400 transition-colors truncate max-w-[120px] block">
                    {row.workspace}
                </Link>
            ),
        },
        {
            id: "account",
            header: "Cuenta",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.account,
            cell: (row: AdminTransactionRow) => <span className="text-zinc-400 text-xs">{row.account}</span>,
        },
        {
            id: "status",
            header: "Estado",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.deletedAt ? "eliminada" : "activa",
            cell: (row: AdminTransactionRow) => (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${row.deletedAt
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                    {row.deletedAt ? "eliminada" : "activa"}
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
                data={transactions}
                columns={columns}
                pageSize={15}
                searchPlaceholder="Buscar por descripción o workspace..."
                searchField={(row) => `${row.description} ${row.workspace} ${row.category}`}
                emptyMessage="No hay transacciones"
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
                        <DropdownMenuContent align="end" sideOffset={5} className="w-44 bg-[#18181b] border-white/10 p-1 rounded-xl shadow-2xl">
                            {row.deletedAt ? (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-emerald-400" onClick={() => runAction(() => restaurarTransaccionAdmin(row.id))}>
                                    <RotateCcw className="h-4 w-4" /> Restaurar
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-rose-400" onClick={() => runAction(() => eliminarTransaccionAdmin(row.id))}>
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


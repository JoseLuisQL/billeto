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
import {
    getAdminBadgeClasses,
    getTransactionTypeLabel,
    getTransactionTypeTone,
} from "@/components/admin/shared/admin-ui";
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
            id: "date",
            header: "Fecha",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.date,
            cell: (row: AdminTransactionRow) => (
                <span className="text-xs whitespace-nowrap text-[color:var(--admin-text-subtle)]">
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
                    <p className="max-w-[200px] truncate text-sm font-medium text-[color:var(--admin-text)]">{row.description}</p>
                    <p className="text-xs text-[color:var(--admin-text-subtle)]">{row.category}</p>
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
                    <span className={`font-mono font-medium ${row.type === "income" ? "text-[color:var(--admin-success)]" : row.type === "expense" ? "text-[color:var(--admin-danger)]" : "text-[color:var(--admin-info)]"}`}>
                        {row.type === "income" ? "+" : row.type === "expense" ? "-" : "↔"}{row.amount.toFixed(2)}
                    </span>
                    <span className="ml-1 text-xs text-[color:var(--admin-text-subtle)]">{row.currency}</span>
                </div>
            ),
        },
        {
            id: "type",
            header: "Tipo",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.type,
            cell: (row: AdminTransactionRow) => (
                <span className={getAdminBadgeClasses(getTransactionTypeTone(row.type))}>
                    {getTransactionTypeLabel(row.type)}
                </span>
            ),
        },
        {
            id: "workspace",
            header: "Workspace",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.workspace,
            cell: (row: AdminTransactionRow) => (
                <Link href={`/admin/workspaces/${row.workspaceId}`} className="block max-w-[120px] truncate text-xs text-[color:var(--admin-text-muted)] transition-colors hover:text-[color:var(--admin-accent-strong)]">
                    {row.workspace}
                </Link>
            ),
        },
        {
            id: "account",
            header: "Cuenta",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.account,
            cell: (row: AdminTransactionRow) => <span className="text-xs text-[color:var(--admin-text-muted)]">{row.account}</span>,
        },
        {
            id: "status",
            header: "Estado",
            sortable: true,
            accessorFn: (row: AdminTransactionRow) => row.deletedAt ? "eliminada" : "activa",
            cell: (row: AdminTransactionRow) => (
                <span className={getAdminBadgeClasses(row.deletedAt ? "danger" : "success")}>
                    {row.deletedAt ? "Eliminada" : "Activa"}
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
                                aria-label={`Abrir acciones para transacción ${row.description}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--admin-text-subtle)] transition-colors hover:bg-white/5 hover:text-[color:var(--admin-text)] disabled:opacity-50"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={5} className="w-44 bg-[#18181b] border-white/10 p-1 rounded-xl shadow-2xl">
                            {row.deletedAt ? (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-emerald-400" onClick={() => runAction(() => restaurarTransaccionAdmin(row.id), `¿Restaurar la transacción "${row.description}"?`)}>
                                    <RotateCcw className="h-4 w-4" /> Restaurar
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-rose-400" onClick={() => runAction(() => eliminarTransaccionAdmin(row.id), `¿Marcar como eliminada la transacción "${row.description}"?`)}>
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


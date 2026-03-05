"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, ToggleLeft, ToggleRight, XCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import type { AdminPopularSubRow } from "@/lib/actions/admin/content";
import {
    actualizarPopularSubscriptionAdmin,
    eliminarPopularSubscriptionAdmin,
} from "@/lib/actions/admin/content";

export function PopularSubsTableClient({ subs }: { subs: AdminPopularSubRow[] }) {
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

    const columns = [
        {
            id: "icon",
            header: "",
            cell: (row: AdminPopularSubRow) => <span className="text-lg">{row.icon ?? "🔔"}</span>,
            className: "w-10",
        },
        {
            id: "name",
            header: "Nombre",
            sortable: true,
            accessorFn: (row: AdminPopularSubRow) => row.name,
            cell: (row: AdminPopularSubRow) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-200">{row.name}</span>
                    {!row.isActive && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">Inactivo</span>
                    )}
                </div>
            ),
        },
        {
            id: "price",
            header: "Precio",
            sortable: true,
            accessorFn: (row: AdminPopularSubRow) => row.price,
            cell: (row: AdminPopularSubRow) => (
                <span className="font-mono text-zinc-300">{row.price.toFixed(2)} <span className="text-xs text-zinc-500">{row.currency}</span></span>
            ),
        },
        {
            id: "category",
            header: "Categoría",
            sortable: true,
            accessorFn: (row: AdminPopularSubRow) => row.category,
            cell: (row: AdminPopularSubRow) => <span className="text-zinc-400">{row.category}</span>,
        },
        {
            id: "frequency",
            header: "Frecuencia",
            sortable: true,
            accessorFn: (row: AdminPopularSubRow) => row.frequency,
            cell: (row: AdminPopularSubRow) => (
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{row.frequency}</span>
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
                data={subs}
                columns={columns}
                pageSize={15}
                searchPlaceholder="Buscar suscripción..."
                searchField={(row) => `${row.name} ${row.category}`}
                emptyMessage="No hay suscripciones populares"
                actions={(row) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" disabled={pending} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-300 disabled:opacity-50">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={5} className="w-44 bg-[#18181b] border-white/10 p-1 rounded-xl shadow-2xl">
                            <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300"
                                onClick={() => run(() => actualizarPopularSubscriptionAdmin(row.id, { isActive: !row.isActive }))}>
                                {row.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                                {row.isActive ? "Desactivar" : "Activar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-rose-400"
                                onClick={() => run(() => eliminarPopularSubscriptionAdmin(row.id))}>
                                <Trash2 className="h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            />
        </div>
    );
}

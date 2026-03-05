"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, ToggleLeft, ToggleRight, XCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import type { AdminToolRow } from "@/lib/actions/admin/ai";
import { actualizarToolIAAdmin, eliminarToolIAAdmin } from "@/lib/actions/admin/ai";

export function ToolsTableClient({ tools }: { tools: AdminToolRow[] }) {
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
            id: "displayName",
            header: "Nombre",
            sortable: true,
            accessorFn: (row: AdminToolRow) => row.displayName,
            cell: (row: AdminToolRow) => (
                <div>
                    <span className="font-medium text-zinc-200">{row.displayName}</span>
                    {!row.isEnabled && <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">Deshabilitado</span>}
                </div>
            ),
        },
        {
            id: "toolName",
            header: "ID",
            sortable: true,
            accessorFn: (row: AdminToolRow) => row.toolName,
            cell: (row: AdminToolRow) => <span className="text-zinc-400 font-mono text-xs">{row.toolName}</span>,
        },
        {
            id: "description",
            header: "Descripción",
            cell: (row: AdminToolRow) => <span className="text-zinc-500 text-xs block truncate max-w-[250px]">{row.description}</span>,
        },
        {
            id: "schema",
            header: "Schema",
            cell: (row: AdminToolRow) => {
                const paramCount = Object.keys((row.inputSchema as Record<string, unknown>)?.properties ?? {}).length;
                return <span className="text-zinc-500 text-xs">{paramCount} params</span>;
            },
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
                data={tools}
                columns={columns}
                pageSize={10}
                searchPlaceholder="Buscar tool..."
                searchField={(row) => `${row.displayName} ${row.toolName} ${row.description}`}
                emptyMessage="No hay tools configurados"
                actions={(row) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" disabled={pending} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-300 disabled:opacity-50">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={5} className="w-44 bg-[#18181b] border-white/10 p-1 rounded-xl shadow-2xl">
                            <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300"
                                onClick={() => run(() => actualizarToolIAAdmin(row.id, { isEnabled: !row.isEnabled }))}>
                                {row.isEnabled ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                                {row.isEnabled ? "Deshabilitar" : "Habilitar"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-rose-400"
                                onClick={() => run(() => eliminarToolIAAdmin(row.id))}>
                                <Trash2 className="h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            />
        </div>
    );
}

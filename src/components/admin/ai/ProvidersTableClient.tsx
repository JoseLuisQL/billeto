"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    MoreHorizontal,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Star,
    XCircle,
    Key,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import type { AdminProviderRow } from "@/lib/actions/admin/ai";
import { actualizarProveedorIAAdmin, eliminarProveedorIAAdmin } from "@/lib/actions/admin/ai";

export function ProvidersTableClient({ providers }: { providers: AdminProviderRow[] }) {
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

    const providerColors: Record<string, string> = {
        google: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        openai: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        anthropic: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        openrouter: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        custom: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    };

    const columns = [
        {
            id: "name",
            header: "Proveedor",
            sortable: true,
            accessorFn: (row: AdminProviderRow) => row.name,
            cell: (row: AdminProviderRow) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-200">{row.name}</span>
                    {row.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0 text-[10px] font-semibold text-amber-400">
                            <Star className="h-2.5 w-2.5" /> DEFAULT
                        </span>
                    )}
                    {!row.isActive && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">Inactivo</span>
                    )}
                </div>
            ),
        },
        {
            id: "type",
            header: "Tipo",
            sortable: true,
            accessorFn: (row: AdminProviderRow) => row.providerType,
            cell: (row: AdminProviderRow) => (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${providerColors[row.providerType] ?? providerColors.custom}`}>
                    {row.providerType}
                </span>
            ),
        },
        {
            id: "model",
            header: "Modelo",
            sortable: true,
            accessorFn: (row: AdminProviderRow) => row.modelId,
            cell: (row: AdminProviderRow) => <span className="text-zinc-300 font-mono text-xs">{row.modelId}</span>,
        },
        {
            id: "apiKey",
            header: "API Key",
            cell: (row: AdminProviderRow) => (
                <div className="flex items-center gap-1.5">
                    <Key className={`h-3.5 w-3.5 ${row.hasApiKey ? "text-emerald-400" : "text-zinc-600"}`} />
                    <span className="text-xs text-zinc-500 font-mono">{row.apiKey ?? "No configurada"}</span>
                </div>
            ),
        },
        {
            id: "params",
            header: "Params",
            cell: (row: AdminProviderRow) => (
                <span className="text-xs text-zinc-500">
                    {row.maxTokens} tok · {row.temperature} temp
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
                data={providers}
                columns={columns}
                pageSize={10}
                searchPlaceholder="Buscar proveedor..."
                searchField={(row) => `${row.name} ${row.providerType} ${row.modelId}`}
                emptyMessage="No hay proveedores configurados"
                actions={(row) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" disabled={pending} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-300 disabled:opacity-50">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={5} className="w-48 bg-[#18181b] border-white/10 p-1 rounded-xl shadow-2xl">
                            <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300"
                                onClick={() => run(() => actualizarProveedorIAAdmin(row.id, { isActive: !row.isActive }))}>
                                {row.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                                {row.isActive ? "Desactivar" : "Activar"}
                            </DropdownMenuItem>
                            {!row.isDefault && (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-amber-400"
                                    onClick={() => run(() => actualizarProveedorIAAdmin(row.id, { isDefault: true }))}>
                                    <Star className="h-4 w-4" /> Set como default
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-rose-400"
                                onClick={() => run(() => eliminarProveedorIAAdmin(row.id))}>
                                <Trash2 className="h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            />
        </div>
    );
}

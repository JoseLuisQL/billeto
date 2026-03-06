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
import {
    getAdminBadgeClasses,
    getPlanTone,
} from "@/components/admin/shared/admin-ui";
import type { AdminProviderRow } from "@/lib/actions/admin/ai";
import { actualizarProveedorIAAdmin, eliminarProveedorIAAdmin } from "@/lib/actions/admin/ai";

export function ProvidersTableClient({ providers }: { providers: AdminProviderRow[] }) {
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
            id: "name",
            header: "Proveedor",
            sortable: true,
            accessorFn: (row: AdminProviderRow) => row.name,
            cell: (row: AdminProviderRow) => (
                    <div className="flex items-center gap-2">
                    <span className="font-medium text-[color:var(--admin-text)]">{row.name}</span>
                    {row.isDefault && (
                        <span className={getAdminBadgeClasses("warning")}>
                            <Star className="h-2.5 w-2.5" /> DEFAULT
                        </span>
                    )}
                    {!row.isActive && (
                        <span className={getAdminBadgeClasses("neutral")}>Inactivo</span>
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
                <span className={getAdminBadgeClasses(getPlanTone(row.providerType === "anthropic" ? "premium" : row.providerType === "openai" ? "pro" : "free"))}>
                    {row.providerType}
                </span>
            ),
        },
        {
            id: "model",
            header: "Modelo",
            sortable: true,
            accessorFn: (row: AdminProviderRow) => row.modelId,
            cell: (row: AdminProviderRow) => <span className="font-mono text-xs text-[color:var(--admin-text-muted)]">{row.modelId}</span>,
        },
        {
            id: "apiKey",
            header: "Clave",
            cell: (row: AdminProviderRow) => (
                <div className="flex items-center gap-1.5">
                    <Key className={`h-3.5 w-3.5 ${row.hasApiKey ? "text-[color:var(--admin-success)]" : "text-[color:var(--admin-text-subtle)]"}`} />
                    <span className="text-xs font-medium text-[color:var(--admin-text-subtle)]">{row.hasApiKey ? "Configurada" : "No configurada"}</span>
                </div>
            ),
        },
        {
            id: "params",
            header: "Params",
            cell: (row: AdminProviderRow) => (
                <span className="text-xs text-[color:var(--admin-text-subtle)]">
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
                                onClick={() => run(() => actualizarProveedorIAAdmin(row.id, { isActive: !row.isActive }), `${row.isActive ? "Desactivar" : "Activar"} el proveedor "${row.name}"?`)}>
                                {row.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                                {row.isActive ? "Desactivar" : "Activar"}
                            </DropdownMenuItem>
                            {!row.isDefault && (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-amber-400"
                                    onClick={() => run(() => actualizarProveedorIAAdmin(row.id, { isDefault: true }), `¿Marcar "${row.name}" como proveedor por defecto?`)}>
                                    <Star className="h-4 w-4" /> Set como default
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-rose-400"
                                onClick={() => run(() => eliminarProveedorIAAdmin(row.id), `¿Eliminar el proveedor "${row.name}"?`)}>
                                <Trash2 className="h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            />
        </div>
    );
}

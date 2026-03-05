"use client";

import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import type { AdminCategoryRow } from "@/lib/actions/admin/content";

export function CategoriesTableClient({ categories }: { categories: AdminCategoryRow[] }) {
    const columns = [
        {
            id: "icon",
            header: "",
            cell: (row: AdminCategoryRow) => (
                <span className="text-lg">{row.icon ?? "📁"}</span>
            ),
            className: "w-10",
        },
        {
            id: "name",
            header: "Nombre",
            sortable: true,
            accessorFn: (row: AdminCategoryRow) => row.name,
            cell: (row: AdminCategoryRow) => <span className="font-medium text-zinc-200">{row.name}</span>,
        },
        {
            id: "type",
            header: "Tipo",
            sortable: true,
            accessorFn: (row: AdminCategoryRow) => row.type,
            cell: (row: AdminCategoryRow) => (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${row.type === "income"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                    {row.type}
                </span>
            ),
        },
        {
            id: "color",
            header: "Color",
            cell: (row: AdminCategoryRow) => (
                row.color ? (
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border border-white/10" style={{ backgroundColor: row.color }} />
                        <span className="text-xs text-zinc-500 font-mono">{row.color}</span>
                    </div>
                ) : <span className="text-xs text-zinc-600">—</span>
            ),
        },
        {
            id: "workspaces",
            header: "Workspaces",
            sortable: true,
            accessorFn: (row: AdminCategoryRow) => row.workspaceCount,
            cell: (row: AdminCategoryRow) => <span className="text-zinc-400">{row.workspaceCount}</span>,
        },
    ];

    return (
        <AdminDataTable
            data={categories}
            columns={columns}
            pageSize={20}
            searchPlaceholder="Buscar categoría..."
            searchField={(row) => row.name}
            emptyMessage="No hay categorías del sistema"
        />
    );
}

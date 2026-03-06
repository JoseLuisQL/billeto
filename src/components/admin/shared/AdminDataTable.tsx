"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    X,
} from "lucide-react";
import {
    adminIconButtonClass,
    adminInputClass,
    adminPanelClass,
} from "@/components/admin/shared/admin-ui";

interface Column<T> {
    id: string;
    header: string;
    accessorFn?: (row: T) => unknown;
    cell?: (row: T) => React.ReactNode;
    sortable?: boolean;
    filterable?: boolean;
    className?: string;
}

interface AdminDataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pageSize?: number;
    searchPlaceholder?: string;
    searchField?: (row: T) => string;
    emptyMessage?: string;
    actions?: (row: T) => React.ReactNode;
}

type SortDir = "asc" | "desc" | null;

export function AdminDataTable<T extends { id?: string }>({
    data,
    columns,
    pageSize = 10,
    searchPlaceholder = "Buscar...",
    searchField,
    emptyMessage = "No hay datos",
    actions,
}: AdminDataTableProps<T>) {
    const [search, setSearch] = useState("");
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);
    const [page, setPage] = useState(0);
    const deferredSearch = useDeferredValue(search);

    const filtered = useMemo(() => {
        if (!deferredSearch || !searchField) return data;
        const q = deferredSearch.toLowerCase();
        return data.filter((row) => searchField(row).toLowerCase().includes(q));
    }, [data, deferredSearch, searchField]);

    const sorted = useMemo(() => {
        if (!sortCol || !sortDir) return filtered;
        const col = columns.find((c) => c.id === sortCol);
        if (!col?.accessorFn) return filtered;
        return [...filtered].sort((a, b) => {
            const va = col.accessorFn!(a);
            const vb = col.accessorFn!(b);
            if (va == null && vb == null) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;
            if (typeof va === "string" && typeof vb === "string") {
                return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            }
            return sortDir === "asc"
                ? (va as number) - (vb as number)
                : (vb as number) - (va as number);
        });
    }, [filtered, sortCol, sortDir, columns]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const safeP = Math.min(page, totalPages - 1);
    const paged = sorted.slice(safeP * pageSize, (safeP + 1) * pageSize);

    const toggleSort = (colId: string) => {
        if (sortCol === colId) {
            if (sortDir === "asc") setSortDir("desc");
            else if (sortDir === "desc") {
                setSortCol(null);
                setSortDir(null);
            }
        } else {
            setSortCol(colId);
            setSortDir("asc");
        }
        setPage(0);
    };

    return (
        <div className="space-y-4">
            {searchField && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--admin-text-subtle)]" />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            placeholder={searchPlaceholder}
                            aria-label={searchPlaceholder}
                            className={`${adminInputClass} py-2.5 pl-9 pr-8`}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Limpiar búsqueda"
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[color:var(--admin-text-subtle)] transition-colors hover:text-[color:var(--admin-text)]"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <p className="text-xs uppercase tracking-[0.1em] text-[color:var(--admin-text-subtle)]">
                        {sorted.length} registro{sorted.length === 1 ? "" : "s"}
                    </p>
                </div>
            )}

            <div className={`${adminPanelClass} overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="min-w-[760px] w-full text-sm">
                        <thead className="bg-[color:var(--admin-surface-muted)]">
                            <tr className="border-b border-[color:var(--admin-border)]">
                                {columns.map((col) => (
                                    <th
                                        key={col.id}
                                        scope="col"
                                        aria-sort={
                                            sortCol === col.id
                                                ? sortDir === "asc"
                                                    ? "ascending"
                                                    : "descending"
                                                : "none"
                                        }
                                        className={`px-4 py-3.5 text-left text-[11px] font-medium tracking-[0.1em] uppercase text-[color:var(--admin-text-subtle)] ${col.className ?? ""}`}
                                    >
                                        {col.sortable ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleSort(col.id)}
                                                className="flex items-center gap-1.5 transition-colors hover:text-[color:var(--admin-text)] focus-visible:outline-none"
                                            >
                                                {col.header}
                                                {sortCol === col.id ? (
                                                    sortDir === "asc" ? (
                                                        <ChevronUp className="h-3.5 w-3.5 text-[color:var(--admin-accent)]" />
                                                    ) : (
                                                        <ChevronDown className="h-3.5 w-3.5 text-[color:var(--admin-accent)]" />
                                                    )
                                                ) : (
                                                    <ChevronsUpDown className="h-3.5 w-3.5 text-[color:var(--admin-text-subtle)]" />
                                                )}
                                            </button>
                                        ) : (
                                            col.header
                                        )}
                                    </th>
                                ))}
                                {actions && <th scope="col" className="px-4 py-3.5 text-right text-[11px] font-medium tracking-[0.1em] uppercase text-[color:var(--admin-text-subtle)]">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[color:var(--admin-border)]">
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-14 text-center text-sm text-[color:var(--admin-text-subtle)]">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                paged.map((row, i) => (
                                    <tr key={(row as { id?: string }).id ?? i} className="transition-colors hover:bg-white/[0.03]">
                                        {columns.map((col) => (
                                            <td key={col.id} className={`px-4 py-3.5 ${col.className ?? ""}`}>
                                                {col.cell ? col.cell(row) : String(col.accessorFn?.(row) ?? "")}
                                            </td>
                                        ))}
                                        {actions && <td className="px-4 py-3.5 text-right">{actions(row)}</td>}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex flex-col gap-3 text-sm text-[color:var(--admin-text-subtle)] sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        {sorted.length} resultado{sorted.length !== 1 ? "s" : ""} · Página {safeP + 1} de {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <PagBtn disabled={safeP === 0} onClick={() => setPage(0)}>
                            <ChevronsLeft className="h-4 w-4" />
                        </PagBtn>
                        <PagBtn disabled={safeP === 0} onClick={() => setPage(safeP - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </PagBtn>
                        <PagBtn disabled={safeP >= totalPages - 1} onClick={() => setPage(safeP + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </PagBtn>
                        <PagBtn disabled={safeP >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>
                            <ChevronsRight className="h-4 w-4" />
                        </PagBtn>
                    </div>
                </div>
            )}
        </div>
    );
}

function PagBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`${adminIconButtonClass} h-8 w-8 disabled:pointer-events-none disabled:opacity-30`}
        >
            {children}
        </button>
    );
}

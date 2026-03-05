"use client";

import { useState, useMemo } from "react";
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

    const filtered = useMemo(() => {
        if (!search || !searchField) return data;
        const q = search.toLowerCase();
        return data.filter((row) => searchField(row).toLowerCase().includes(q));
    }, [data, search, searchField]);

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
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            placeholder={searchPlaceholder}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-8 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none transition-all focus:border-cyan-400/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-cyan-400/20"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-500 hover:text-zinc-300"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                        {sorted.length} registro{sorted.length === 1 ? "" : "s"}
                    </p>
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/80 shadow-[0_24px_44px_-32px_rgba(15,23,42,0.85)] backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[760px] w-full text-sm">
                        <thead className="bg-white/[0.03]">
                            <tr className="border-b border-white/10">
                                {columns.map((col) => (
                                    <th
                                        key={col.id}
                                        className={`px-4 py-3.5 text-left text-[11px] font-semibold tracking-[0.14em] uppercase text-zinc-500 ${col.className ?? ""}`}
                                    >
                                        {col.sortable ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleSort(col.id)}
                                                className="flex items-center gap-1.5 transition-colors hover:text-zinc-300"
                                            >
                                                {col.header}
                                                {sortCol === col.id ? (
                                                    sortDir === "asc" ? (
                                                        <ChevronUp className="h-3.5 w-3.5 text-cyan-200" />
                                                    ) : (
                                                        <ChevronDown className="h-3.5 w-3.5 text-cyan-200" />
                                                    )
                                                ) : (
                                                    <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-600" />
                                                )}
                                            </button>
                                        ) : (
                                            col.header
                                        )}
                                    </th>
                                ))}
                                {actions && <th className="px-4 py-3.5 text-right text-[11px] font-semibold tracking-[0.14em] uppercase text-zinc-500">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-14 text-center text-sm text-zinc-500">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                paged.map((row, i) => (
                                    <tr key={(row as { id?: string }).id ?? i} className="transition-colors hover:bg-white/[0.04]">
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
                <div className="flex flex-col gap-3 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-30"
        >
            {children}
        </button>
    );
}

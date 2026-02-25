"use client";

import { useState, useRef, useEffect } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreVertical,
    Pencil,
    XCircle,
    Trash2,
    Table2,
    Plus,
} from "lucide-react";

type RecurrenteItem = {
    id: string;
    name: string;
    description?: string | null;
    amount: number;
    currency: string;
    type: string;
    frequency: string;
    dayOfMonth?: number | null;
    status: string;
    categoryName?: string | null;
    categoryIcon?: string | null;
    nextRunAt: string;
    executionCount: number;
};

interface RecurringTableProps {
    recurrentes: RecurrenteItem[];
    onEdit: (rec: RecurrenteItem) => void;
    onTogglePause: (rec: RecurrenteItem) => void;
    onDelete: (id: string) => void;
    onNew: () => void;
}

const ITEMS_PER_PAGE = 10;

const frecuenciaLabels: Record<string, string> = {
    daily: "Diaria",
    weekly: "Semanal",
    biweekly: "Quincenal",
    monthly: "Mensual",
    yearly: "Anual",
};

// Generate a consistent color from name
function getColorFromName(name: string): string {
    const colors = [
        "#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#f59e0b",
        "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export function RecurringTable({ recurrentes, onEdit, onTogglePause, onDelete, onNew }: RecurringTableProps) {
    const [pagina, setPagina] = useState(1);
    const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);

    const totalPages = Math.max(1, Math.ceil(recurrentes.length / ITEMS_PER_PAGE));
    const paginados = recurrentes.slice((pagina - 1) * ITEMS_PER_PAGE, pagina * ITEMS_PER_PAGE);

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuAbierto(null);
            }
        }
        if (menuAbierto) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [menuAbierto]);

    function formatFecha(iso: string) {
        const d = new Date(iso);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    function toggleRowSelection(id: string) {
        if (id === "all") {
            if (selectedRows.length === paginados.length) {
                setSelectedRows([]);
            } else {
                setSelectedRows(paginados.map((r) => r.id));
            }
        } else {
            if (selectedRows.includes(id)) {
                setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
            } else {
                setSelectedRows([...selectedRows, id]);
            }
        }
    }

    return (
        <div className="rounded-xl border border-white/5 bg-zinc-900/30 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-300">Tabla</span>
                </div>
                <button
                    onClick={onNew}
                    className="flex items-center gap-1.5 bg-[#D3FF0A] text-black px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#bde609] transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Nueva Recurrente
                </button>
            </div>

            {/* Table */}
            {recurrentes.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-800/50">
                        <Table2 className="w-6 h-6 text-zinc-600" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">No tienes transacciones recurrentes</p>
                    <p className="text-xs text-zinc-600 text-center max-w-xs">
                        Crea una transacción recurrente para comenzar a automatizar tus pagos.
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 text-xs text-zinc-500 uppercase tracking-wider">
                                    <th className="px-4 py-2.5 w-10 text-center">
                                        <div
                                            onClick={() => toggleRowSelection("all")}
                                            className={`w-4 h-4 rounded border cursor-pointer mx-auto flex items-center justify-center transition-colors ${selectedRows.length === paginados.length && paginados.length > 0
                                                    ? "bg-white/10 border-white/30"
                                                    : "border-white/10 hover:border-white/20"
                                                }`}
                                        >
                                            {selectedRows.length === paginados.length && paginados.length > 0 && (
                                                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M2 6l3 3 5-5" />
                                                </svg>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-4 py-2.5 text-left font-medium">Descripción</th>
                                    <th className="px-4 py-2.5 text-left font-medium">Categoría</th>
                                    <th className="px-4 py-2.5 text-right font-medium">Monto</th>
                                    <th className="px-4 py-2.5 text-center font-medium">Frecuencia</th>
                                    <th className="px-4 py-2.5 text-center font-medium">Fecha de cobro</th>
                                    <th className="px-4 py-2.5 text-center font-medium">Ejecutada</th>
                                    <th className="px-4 py-2.5 text-right font-medium w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginados.map((rec) => {
                                    const isVencida = rec.status === "active" && new Date(rec.nextRunAt) <= new Date();
                                    const isSelected = selectedRows.includes(rec.id);
                                    const color = getColorFromName(rec.name);

                                    return (
                                        <tr
                                            key={rec.id}
                                            className={`border-b border-white/5 group transition-colors ${isSelected ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="px-4 py-3 text-center">
                                                <div
                                                    onClick={() => toggleRowSelection(rec.id)}
                                                    className={`w-4 h-4 rounded border cursor-pointer mx-auto flex items-center justify-center transition-all ${isSelected
                                                            ? "bg-white/10 border-white/30"
                                                            : "border-transparent group-hover:border-white/10"
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M2 6l3 3 5-5" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Descripción: icon badge + name */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                                                        style={{
                                                            backgroundColor: `${color}20`,
                                                            color: color,
                                                            border: `1px solid ${color}30`,
                                                        }}
                                                    >
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                                        {rec.name}
                                                    </div>
                                                    <span className="text-sm text-zinc-200 font-medium">{rec.name}</span>
                                                </div>
                                            </td>

                                            {/* Categoría */}
                                            <td className="px-4 py-3">
                                                {rec.categoryName ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-xs text-zinc-300">
                                                        {rec.categoryIcon && (
                                                            <span className="text-[11px]">{rec.categoryIcon}</span>
                                                        )}
                                                        {rec.categoryName}
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-600">—</span>
                                                )}
                                            </td>

                                            {/* Monto */}
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <span className={`text-sm font-medium ${rec.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                                                    {rec.type === "income" ? "" : "-"}
                                                    {rec.amount.toFixed(2).replace(".", ",")}
                                                </span>
                                                {" "}
                                                <span className="text-xs text-zinc-500">{rec.currency.replace("USD", "US$").replace("PEN", "S/.")}</span>
                                            </td>

                                            {/* Frecuencia */}
                                            <td className="px-4 py-3 text-center text-sm text-zinc-400">
                                                {frecuenciaLabels[rec.frequency] || rec.frequency}
                                            </td>

                                            {/* Fecha de cobro */}
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${isVencida
                                                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                                            : "bg-white/5 text-zinc-300 border border-white/5"
                                                        }`}
                                                >
                                                    {formatFecha(rec.nextRunAt)}
                                                </span>
                                            </td>

                                            {/* Ejecutada */}
                                            <td className="px-4 py-3 text-center text-sm text-zinc-400">
                                                {rec.executionCount} {rec.executionCount === 1 ? "vez" : "veces"}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right relative">
                                                <button
                                                    onClick={() =>
                                                        setMenuAbierto(menuAbierto === rec.id ? null : rec.id)
                                                    }
                                                    className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                {menuAbierto === rec.id && (
                                                    <div
                                                        ref={menuRef}
                                                        className="absolute right-4 top-12 z-30 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl min-w-[200px] py-1.5 backdrop-blur-xl"
                                                    >
                                                        {/* Pausar/Reanudar with toggle */}
                                                        <button
                                                            onClick={() => {
                                                                onTogglePause(rec);
                                                                setMenuAbierto(null);
                                                            }}
                                                            className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                                                        >
                                                            <span>Pausar</span>
                                                            <div
                                                                className={`w-8 h-[18px] rounded-full flex items-center px-[2px] transition-all ${rec.status === "active"
                                                                        ? "bg-emerald-500"
                                                                        : "bg-zinc-600"
                                                                    }`}
                                                            >
                                                                <div
                                                                    className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${rec.status === "active" ? "translate-x-3" : "translate-x-0"
                                                                        }`}
                                                                />
                                                            </div>
                                                        </button>

                                                        {/* Editar */}
                                                        <button
                                                            onClick={() => {
                                                                onEdit(rec);
                                                                setMenuAbierto(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                                                            Editar
                                                        </button>

                                                        {/* Cancelar suscripción */}
                                                        <button
                                                            onClick={() => {
                                                                onTogglePause(rec);
                                                                setMenuAbierto(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                                                            Cancelar suscripción
                                                        </button>

                                                        <div className="my-1 border-t border-white/5" />

                                                        {/* Eliminar */}
                                                        <button
                                                            onClick={() => {
                                                                onDelete(rec.id);
                                                                setMenuAbierto(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                        <span className="text-xs text-zinc-500">
                            {recurrentes.length} transacciones
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPagina(1)}
                                disabled={pagina === 1}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPagina(Math.max(1, pagina - 1))}
                                disabled={pagina === 1}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-zinc-500 px-2 tabular-nums">
                                Página {pagina} de {totalPages}
                            </span>
                            <button
                                onClick={() => setPagina(Math.min(totalPages, pagina + 1))}
                                disabled={pagina === totalPages}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPagina(totalPages)}
                                disabled={pagina === totalPages}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

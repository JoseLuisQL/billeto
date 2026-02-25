"use client";

import { useEffect, useState, useRef } from "react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { obtenerEstadisticasRecurrentes } from "@/lib/actions/recurring";
import { ChevronDown, Check } from "lucide-react";

type ChartItem = { name: string; value: number; fill: string };

const filterOptions = ["Todos", "Gastos", "Ingresos"] as const;

export function RecurringCategoryChart() {
    const [datos, setDatos] = useState<ChartItem[]>([]);
    const [total, setTotal] = useState(0);
    const [moneda, setMoneda] = useState("PEN");
    const [cargando, setCargando] = useState(true);
    const [filtro, setFiltro] = useState<string>("Todos");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    async function cargarDatos(tipo: string) {
        const res = await obtenerEstadisticasRecurrentes(tipo);
        setDatos(res.datos);
        setTotal(res.totalMensual);
        setMoneda(res.moneda);
        setCargando(false);
    }

    useEffect(() => {
        cargarDatos(filtro);
    }, [filtro]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (cargando) {
        return <div className="h-56 animate-pulse rounded-xl bg-zinc-900/40 border border-white/5" />;
    }

    const maxVal = Math.max(...datos.map((d) => d.value), 1);

    return (
        <div className="rounded-xl border border-white/5 bg-zinc-900/30 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-zinc-200">
                        Gastos por categoría
                    </h3>
                    <span className="text-sm text-zinc-500">
                        {moneda} {total.toFixed(2)}/mes
                    </span>
                </div>
                {/* Dropdown filter */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg border border-white/10 px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-800/60 transition-all"
                    >
                        <span className="w-1.5 h-1.5 rounded-full" style={{
                            backgroundColor: filtro === "Gastos" ? "#f87171" : filtro === "Ingresos" ? "#34d399" : "#D3FF0A"
                        }} />
                        {filtro}
                        <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                    </button>
                    {showDropdown && (
                        <div className="absolute right-0 top-9 z-20 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[140px] backdrop-blur-sm">
                            {filterOptions.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        setFiltro(opt);
                                        setCargando(true);
                                        setShowDropdown(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${filtro === opt
                                            ? "text-white bg-white/5"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{
                                            backgroundColor: opt === "Gastos" ? "#f87171" : opt === "Ingresos" ? "#34d399" : "#D3FF0A"
                                        }} />
                                        {opt}
                                    </span>
                                    {filtro === opt && <Check className="w-3 h-3 text-[#D3FF0A]" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            {datos.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-zinc-600">
                    No hay suscripciones activas para mostrar
                </div>
            ) : (
                <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datos} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#71717a", fontSize: 10 }}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={40}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#71717a", fontSize: 10 }}
                                tickFormatter={(v) => `${moneda} ${v}`}
                                width={65}
                                domain={[0, Math.ceil(maxVal * 1.15)]}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#18181b",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    color: "#f4f4f5",
                                }}
                                formatter={(value: number) => [`${moneda} ${value.toFixed(2)}`, "Monto"]}
                                labelStyle={{ color: "#a1a1aa" }}
                                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                {datos.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill || "#6366f1"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

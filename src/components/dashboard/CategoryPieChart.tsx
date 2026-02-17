"use client";

import { useState, useEffect } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { obtenerDistribucionCategorias } from "@/lib/actions/charts";

/**
 * Gráfico de dona con distribución de gastos por categoría.
 */
type PieItem = { name: string; value: number; fill: string };

export function CategoryPieChart() {
    const [datos, setDatos] = useState<PieItem[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        obtenerDistribucionCategorias().then((res) => {
            setDatos(res.datos);
            setCargando(false);
        });
    }, []);

    if (cargando) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-sm">Cargando...</div>
            </div>
        );
    }

    if (datos.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm">
                <p>Sin gastos este mes</p>
                <p className="text-xs mt-1">Los gastos se mostrarán acá por categoría</p>
            </div>
        );
    }

    const total = datos.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="flex flex-col gap-4">
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={datos}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                    >
                        {datos.map((entry, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#18181B",
                            border: "1px solid #27272A",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: "#FAFAFA",
                        }}
                        formatter={(value: number | undefined) => [`S/ ${(value ?? 0).toFixed(2)}`, "Monto"]}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Leyenda personalizada */}
            <div className="space-y-2 px-2">
                {datos.slice(0, 6).map((cat, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cat.fill }}
                            />
                            <span className="text-zinc-400 truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-white font-medium">S/ {cat.value.toFixed(0)}</span>
                            <span className="text-zinc-600 w-10 text-right">
                                {total > 0 ? Math.round((cat.value / total) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

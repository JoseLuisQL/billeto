"use client";

import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { obtenerActividadMensual } from "@/lib/actions/charts";

/**
 * Gráfico de barras de actividad diaria del mes actual.
 * Muestra ingresos vs gastos por día.
 */
export function ActivityChart() {
    const [datos, setDatos] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        obtenerActividadMensual().then((res) => {
            setDatos(res.datos);
            setCargando(false);
        });
    }, []);

    if (cargando) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-sm">Cargando gráfico...</div>
            </div>
        );
    }

    if (datos.length === 0 || datos.every((d) => d.ingresos === 0 && d.gastos === 0)) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm">
                <p>Sin datos para mostrar</p>
                <p className="text-xs mt-1">Registrá transacciones para ver la actividad</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={datos} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis
                    dataKey="dia"
                    tick={{ fill: "#71717A", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "#27272A" }}
                    interval="preserveStartEnd"
                />
                <YAxis
                    tick={{ fill: "#71717A", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#18181B",
                        border: "1px solid #27272A",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#FAFAFA",
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Legend
                    wrapperStyle={{ fontSize: "11px", color: "#A1A1AA" }}
                    iconType="circle"
                    iconSize={8}
                />
                <Bar
                    dataKey="ingresos"
                    name="Ingresos"
                    fill="#22C55E"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={12}
                />
                <Bar
                    dataKey="gastos"
                    name="Gastos"
                    fill="#F43F5E"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={12}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

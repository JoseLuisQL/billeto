"use client";

import { useState, useEffect } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { obtenerTendenciaBalance } from "@/lib/actions/charts";

/**
 * Gráfico de área con la tendencia de balance de los últimos 6 meses.
 */
type BalanceTrendItem = { mes: string; balance: number };

export function BalanceTrendChart() {
    const [datos, setDatos] = useState<BalanceTrendItem[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        obtenerTendenciaBalance().then((res) => {
            setDatos(res.datos);
            setCargando(false);
        });
    }, []);

    if (cargando) {
        return (
            <div className="h-48 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-sm">Cargando...</div>
            </div>
        );
    }

    if (datos.length === 0) {
        return (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm">
                <p>Sin historial de balance</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={datos} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D3FF0A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#D3FF0A" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis
                    dataKey="mes"
                    tick={{ fill: "#71717A", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#27272A" }}
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
                    formatter={(value: number | undefined) => [`S/ ${(value ?? 0).toFixed(2)}`, "Balance"]}
                />
                <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#D3FF0A"
                    strokeWidth={2}
                    fill="url(#balanceGradient)"
                    dot={{ fill: "#D3FF0A", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, stroke: "#D3FF0A", strokeWidth: 2, fill: "#18181B" }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

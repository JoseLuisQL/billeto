"use client";

import { useEffect, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { obtenerDistribucionCategorias } from "@/lib/actions/charts";

type PieItem = { name: string; value: number; fill: string };

export function CategoryPieChart({ from, to }: { from?: string; to?: string }) {
  const [datos, setDatos] = useState<PieItem[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerDistribucionCategorias({ from, to }).then((res) => {
      setDatos(res.datos);
      setCargando(false);
    });
  }, [from, to]);

  if (cargando) {
    return <div className="h-72 animate-pulse rounded-lg bg-zinc-800/40" />;
  }

  if (datos.length === 0) {
    return <div className="flex h-72 items-center justify-center text-sm text-zinc-500">Sin gastos del mes</div>;
  }

  const total = datos.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-4">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={96}
              cornerRadius={7}
              paddingAngle={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111217",
                border: "1px solid #2A2B34",
                borderRadius: "10px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#f4f4f5" }}
              itemStyle={{ color: "#f4f4f5" }}
              formatter={(value: number | undefined) => [`S/ ${(value ?? 0).toFixed(2)}`, "Monto"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {datos.slice(0, 5).map((cat) => (
          <div key={cat.name} className="flex items-center justify-between text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.fill }} />
              <span className="truncate text-zinc-300">{cat.name}</span>
            </div>
            <span className="text-zinc-500">{total > 0 ? Math.round((cat.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

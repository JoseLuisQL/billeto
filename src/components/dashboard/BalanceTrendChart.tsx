"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { obtenerPanelBalanceSeries } from "@/lib/actions/charts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MetricType = "balance" | "income" | "expense";

type Point = {
  mes: string;
  balance: number;
  income: number;
  expense: number;
};

interface BalanceTrendChartProps {
  moneda: string;
  from?: string;
  to?: string;
}

const metricLabel: Record<MetricType, string> = {
  balance: "Balance",
  income: "Ingresos",
  expense: "Gastos",
};

const metricColor: Record<Exclude<MetricType, "balance">, string> = {
  income: "#22c55e",
  expense: "#ef4444",
};

export function BalanceTrendChart({ moneda, from, to }: BalanceTrendChartProps) {
  const [metric, setMetric] = useState<MetricType>("balance");
  const [cargando, setCargando] = useState(true);
  const [points, setPoints] = useState<Point[]>([]);
  const [totals, setTotals] = useState({ balance: 0, income: 0, expense: 0 });
  const [previous, setPrevious] = useState({ balance: 0, income: 0, expense: 0 });

  useEffect(() => {
    obtenerPanelBalanceSeries({ from, to }).then((res) => {
      setPoints(res.points);
      setTotals(res.totals);
      setPrevious(res.previous);
      setCargando(false);
    });
  }, [from, to]);

  const chartData = useMemo(() => {
    const mesesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();

    const expected = Array.from({ length: 12 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
      return `${mesesLabels[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    });

    const pointsMap = new Map(points.map((p) => [p.mes, p]));

    return expected.map((label) => {
      const p = pointsMap.get(label);
      return {
        mes: label,
        mesCorto: label.split(" ")[0],
        balance: Math.abs(p?.balance ?? 0),
        income: Math.abs(p?.income ?? 0),
        expense: Math.abs(p?.expense ?? 0),
      };
    });
  }, [points]);

  const currentValue = totals[metric];
  const prevValue = previous[metric];
  const delta = currentValue - prevValue;
  const pct = prevValue !== 0 ? (delta / Math.abs(prevValue)) * 100 : 0;

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda || "PEN",
      maximumFractionDigits: 0,
    }).format(n);

  const showValue =
    metric === "expense"
      ? `-${formatMoney(Math.abs(currentValue))}`
      : metric === "balance"
        ? formatMoney(currentValue)
        : formatMoney(Math.abs(currentValue));

  const activeColor =
    metric === "balance"
      ? currentValue >= 0
        ? "#22c55e"
        : "#ef4444"
      : metricColor[metric];

  const isPositive = pct >= 0;

  if (cargando) {
    return <div className="h-56 animate-pulse rounded-lg bg-zinc-800/40" />;
  }

  if (chartData.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-zinc-500">Sin historial</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700/80">
            {metricLabel[metric]}
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 border-white/10 bg-zinc-900 text-zinc-200">
            <DropdownMenuItem className="hover:bg-zinc-800" onClick={() => setMetric("balance")}>Balance</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-zinc-800" onClick={() => setMetric("income")}>Ingresos</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-zinc-800" onClick={() => setMetric("expense")}>Gastos</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <p
          className="text-4xl font-semibold tracking-tight"
          style={{ color: activeColor }}
        >
          {showValue}
          <span className="ml-2 text-base text-zinc-400">{moneda}</span>
        </p>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${isPositive ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {Math.abs(pct).toFixed(1)}%
        </span>
      </div>

      <p className="text-xs text-zinc-500">vs periodo anterior equivalente</p>

      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={chartData} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#2A2B34" strokeDasharray="3 3" />
          <XAxis dataKey="mesCorto" tick={{ fill: "#8b8d97", fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              backgroundColor: "#111217",
              border: "1px solid #2A2B34",
              borderRadius: "10px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#f4f4f5" }}
            itemStyle={{ color: "#f4f4f5" }}
            formatter={(value) => [
              new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda || "PEN" }).format(Number(value) || 0),
              metricLabel[metric],
            ]}
          />
          <ReferenceLine
            y={Math.abs(currentValue)}
            stroke={activeColor}
            strokeDasharray="6 6"
            strokeOpacity={0.7}
            label={{
              value: Math.round(Math.abs(currentValue)),
              position: "left",
              fill: "#111217",
              fontSize: 11,
            }}
          />
          <Bar dataKey={metric} radius={[8, 8, 2, 2]} maxBarSize={36}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={index === chartData.length - 1 ? activeColor : "#2b2d35"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartStyle,
} from "@/components/ui/chart";
import { obtenerDistribucionCategorias } from "@/lib/actions/charts";
import { cn } from "@/lib/utils";

type PieItem = { name: string; value: number; fill: string };

export function CategoryPieChart({ from, to }: { from?: string; to?: string }) {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [datos, setDatos] = useState<PieItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  useEffect(() => {
    setCargando(true);
    obtenerDistribucionCategorias({ from, to, type: activeTab }).then((res) => {
      // Ensure we have colors for chart config
      const datosConColor = res.datos.map((d, i) => ({
        ...d,
        fill: d.fill || `hsl(var(--chart-${(i % 5) + 1}))`,
      }));
      setDatos(datosConColor);
      setCargando(false);
    });
  }, [from, to, activeTab]);

  const total = datos.reduce((acc, curr) => acc + curr.value, 0);

  // Transform data for the chart
  const chartData = datos.map((item) => ({
    category: item.name,
    amount: item.value,
    fill: item.fill,
  }));

  // Create dynamic config
  const chartConfig = {
    amount: {
      label: "Monto",
    },
    ...datos.reduce(
      (acc, item) => ({
        ...acc,
        [item.name]: {
          label: item.name,
          color: item.fill,
        },
      }),
      {}
    ),
  } satisfies ChartConfig;

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <Card className="flex flex-col border-zinc-800 bg-zinc-900/50">
      <CardHeader className="items-start pb-2 space-y-4">
        <div className="flex w-full items-center justify-between">
          <CardTitle className="text-base font-normal text-zinc-100">Distribución por categoría</CardTitle>
          <div className="h-6 w-6 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center">
            <span className="text-[10px] text-zinc-400">¥</span>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex items-center space-x-1 rounded-lg bg-zinc-950/50 p-1">
          <button
            onClick={() => setActiveTab("expense")}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              activeTab === "expense"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Gastos
          </button>
          <button
            onClick={() => setActiveTab("income")}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              activeTab === "income"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Ingresos
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        {cargando ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-zinc-400" />
          </div>
        ) : datos.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center text-sm text-zinc-500">
            <p>No hay datos para este período</p>
          </div>
        ) : (
          <>
            <div className="mx-auto aspect-square max-h-[300px] relative">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-full w-full [&_.recharts-text]:fill-zinc-400"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={60}
                    strokeWidth={5}
                    activeIndex={activeIndex}
                    activeShape={({
                      cx,
                      cy,
                      innerRadius,
                      outerRadius,
                      startAngle,
                      endAngle,
                      fill,
                    }: any) => (
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius + 10}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                      />
                    )}
                    onMouseEnter={onPieEnter}
                  />
                </PieChart>
              </ChartContainer>
            </div>

            <div className="mt-4 flex flex-col items-center justify-center gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{total}</span>
                <span className="text-sm font-medium text-zinc-500">PEN</span>
              </div>
              <p className="text-xs text-zinc-500">
                Total {activeTab === "expense" ? "gastos" : "ingresos"}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {datos.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center gap-2 rounded-full bg-zinc-900/50 px-3 py-1 transition-colors hover:bg-zinc-800/50">
                  <div
                    className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                    style={{ backgroundColor: item.fill, boxShadow: `0 0 10px ${item.fill}40` }}
                  />
                  <span className="text-sm font-medium text-zinc-200">{item.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

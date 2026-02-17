"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Goal, ArrowUpRight } from "lucide-react";
import { obtenerResumenDashboard } from "@/lib/actions/transactions";
import { BalanceTrendChart } from "@/components/dashboard/BalanceTrendChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { FlowByCategoryChart } from "@/components/dashboard/FlowByCategoryChart";
import { DateRangePicker, type DateRange } from "@/components/dashboard/DateRangePicker";
import { StreakHeatmap } from "@/components/dashboard/StreakHeatmap";

type DashboardCuenta = {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
};

type DashboardTx = {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  source?: string;
  account?: string;
  category?: { icon?: string | null; name?: string; color?: string | null } | null;
};

type DashboardResumen = {
  balanceTotal: number;
  ingresosMes: number;
  gastosMes: number;
  totalTransacciones: number;
  moneda: string;
  streak: {
    days: { date: string; count: number }[];
    maxStreak: number;
    totalInWindow: number;
  };
  cuentas: DashboardCuenta[];
  ultimasTransacciones: DashboardTx[];
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const [rangoFechas, setRangoFechas] = useState<DateRange>({ from: inicioMes, to: hoy });
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      obtenerResumenDashboard({
        from: rangoFechas.from.toISOString(),
        to: rangoFechas.to.toISOString(),
      }).then((data) => {
        setResumen(data);
        setCargando(false);
      });
    }
  }, [status, rangoFechas]);

  const handleApplyRange = (range: DateRange) => {
    setCargando(true);
    setRangoFechas(range);
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (!session?.user) {
    return null;
  }

  const moneda = resumen?.moneda || "PEN";
  const formatearMoneda = (monto: number) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda,
      maximumFractionDigits: 0,
    }).format(monto);

  return (
    <main className="space-y-4 p-4 sm:p-6 lg:p-8">
      <DateRangePicker value={rangoFechas} onApply={handleApplyRange} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="xl:col-span-8 rounded-xl border border-white/10 bg-zinc-900/40 p-4">
          <BalanceTrendChart
            moneda={moneda}
            from={rangoFechas.from.toISOString()}
            to={rangoFechas.to.toISOString()}
          />
        </article>

        <article className="xl:col-span-4 rounded-xl border border-white/10 bg-zinc-900/40 p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-medium text-zinc-100">Últimas transacciones</h3>
            <ArrowUpRight className="h-4 w-4 text-zinc-400" />
          </div>

          <div className="px-4 py-3">
            {cargando ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-11 animate-pulse rounded-md bg-zinc-800/60" />
                ))}
              </div>
            ) : (resumen?.ultimasTransacciones?.length ?? 0) === 0 ? (
              <p className="text-sm text-zinc-500">Sin movimientos recientes.</p>
            ) : (
              <div className="space-y-4">
                {resumen?.ultimasTransacciones?.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="grid grid-cols-[1fr_auto] gap-x-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-zinc-100">{tx.description}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500">
                        <span>{tx.category?.icon || "📋"}</span>
                        <span>{tx.category?.name || tx.account || "General"}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-semibold ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.type === "income" ? "+" : "-"}
                        {Math.abs(Math.round(tx.amount))} <span className="text-xs text-zinc-400">{moneda}</span>
                      </p>
                      <p className="mt-0.5 text-xs lowercase text-zinc-600">{(tx.source || "web").toLowerCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <article className="lg:col-span-5 rounded-xl border border-white/10 bg-zinc-900/40 p-4">
          <h3 className="mb-2 text-sm font-medium text-zinc-100">Racha</h3>
          <StreakHeatmap
            days={resumen?.streak?.days ?? []}
            maxStreak={resumen?.streak?.maxStreak ?? 0}
            totalInWindow={resumen?.streak?.totalInWindow ?? 0}
          />
        </article>

        <article className="lg:col-span-7 rounded-xl border border-white/10 bg-zinc-900/40 p-4">
          <h3 className="mb-2 text-sm font-medium text-zinc-100">Metas</h3>
          <div className="flex h-[120px] flex-col items-center justify-center gap-3 rounded-lg border border-white/5 bg-zinc-900/30">
            <Goal className="h-5 w-5 text-emerald-400" />
            <p className="text-center text-sm text-zinc-400">Crea metas para seguir tu progreso y alcanzar lo que te propones.</p>
            <button className="rounded-md bg-lime-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-lime-300">+ Crear meta</button>
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
        <h3 className="mb-3 text-sm font-medium text-zinc-100">Flujo por categoría</h3>
        <FlowByCategoryChart from={rangoFechas.from.toISOString()} to={rangoFechas.to.toISOString()} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-100">Distribución por categoría</h3>
          <CategoryPieChart from={rangoFechas.from.toISOString()} to={rangoFechas.to.toISOString()} />
        </article>

        <article className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-100">Cuentas</h3>
          {(resumen?.cuentas?.length ?? 0) === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-zinc-500">Sin cuentas</div>
          ) : (
            <div className="space-y-2">
              {resumen?.cuentas?.map((cuenta) => (
                <div key={cuenta.id} className="flex items-center justify-between rounded-md border border-white/5 bg-zinc-900/30 px-3 py-2">
                  <div>
                    <p className="text-sm text-zinc-100">{cuenta.name}</p>
                    <p className="text-xs capitalize text-zinc-500">{cuenta.type}</p>
                  </div>
                  <p className="text-sm font-medium text-zinc-100">{formatearMoneda(cuenta.currentBalance)}</p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

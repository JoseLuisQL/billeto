import { Suspense } from "react";
import {
    BarChart3,
    Users,
    Building2,
    Zap,
    Wallet,
    Target,
    PiggyBank,
    TrendingUp,
    Globe,
} from "lucide-react";
import { AdminKPICard } from "@/components/admin/shared/AdminKPICard";
import {
    obtenerAnalyticsGlobalesAdmin,
    obtenerDistribucionTransaccionesAdmin,
    obtenerTopCategoriasAdmin,
    obtenerTopPaisesAdmin,
} from "@/lib/actions/admin/analytics";

export default async function AdminAnalyticsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Analytics Globales</h1>
                    <p className="mt-1 text-sm text-zinc-500">Métricas de crecimiento y uso de la plataforma</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                    <BarChart3 className="h-5 w-5 text-indigo-400" />
                </div>
            </div>

            <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[120px] animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />)}</div>}>
                <KPISection />
            </Suspense>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Suspense fallback={<CardSkeleton />}>
                    <TransactionTypeSection />
                </Suspense>
                <Suspense fallback={<CardSkeleton />}>
                    <TopCategoriesSection />
                </Suspense>
                <Suspense fallback={<CardSkeleton />}>
                    <TopCountriesSection />
                </Suspense>
            </div>
        </div>
    );
}

async function KPISection() {
    const data = await obtenerAnalyticsGlobalesAdmin();

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <AdminKPICard title="Usuarios" value={data.users.total.toLocaleString()} icon={Users} variant="default" trend={data.users.growth} subtitle={`+${data.users.last30} últimos 30d`} />
            <AdminKPICard title="Workspaces" value={data.workspaces.total.toLocaleString()} icon={Building2} variant="default" trend={data.workspaces.growth} subtitle={`+${data.workspaces.last30} últimos 30d`} />
            <AdminKPICard title="Transacciones" value={data.transactions.total.toLocaleString()} icon={Zap} variant="success" trend={data.transactions.growth} subtitle={`+${data.transactions.last30} últimos 30d`} />
            <AdminKPICard title="Cuentas" value={data.accounts.toLocaleString()} icon={Wallet} variant="default" />
            <AdminKPICard title="Metas" value={data.goals.toLocaleString()} icon={Target} variant="warning" />
            <AdminKPICard title="Presupuestos" value={data.budgets.toLocaleString()} icon={PiggyBank} variant="default" />
        </div>
    );
}

async function TransactionTypeSection() {
    const dist = await obtenerDistribucionTransaccionesAdmin();

    const typeLabels: Record<string, { label: string; color: string }> = {
        expense: { label: "Gastos", color: "bg-rose-500" },
        income: { label: "Ingresos", color: "bg-emerald-500" },
        transfer: { label: "Transferencias", color: "bg-blue-500" },
    };

    const totalCount = dist.reduce((s, d) => s + d.count, 0);

    return (
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-100">
                <TrendingUp className="h-4 w-4 text-zinc-500" /> Distribución por Tipo
            </h3>

            {/* Progress bar */}
            <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-zinc-800">
                {dist.map((d) => {
                    const pct = totalCount > 0 ? (d.count / totalCount) * 100 : 0;
                    const meta = typeLabels[d.type] ?? { color: "bg-zinc-600" };
                    return (
                        <div key={d.type} className={`${meta.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    );
                })}
            </div>

            <div className="space-y-3">
                {dist.map((d) => {
                    const meta = typeLabels[d.type] ?? { label: d.type, color: "bg-zinc-600" };
                    const pct = totalCount > 0 ? ((d.count / totalCount) * 100).toFixed(1) : "0";
                    return (
                        <div key={d.type} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full ${meta.color}`} />
                                <span className="text-zinc-300">{meta.label}</span>
                            </div>
                            <span className="text-zinc-400">{d.count.toLocaleString()} <span className="text-xs text-zinc-600">({pct}%)</span></span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

async function TopCategoriesSection() {
    const cats = await obtenerTopCategoriasAdmin();
    const maxCount = cats.length > 0 ? cats[0].count : 1;

    return (
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50 p-5">
            <h3 className="mb-4 text-base font-semibold text-zinc-100">Top Categorías</h3>
            <div className="space-y-2.5">
                {cats.map((c, i) => (
                    <div key={c.name + i} className="flex items-center gap-3">
                        <span className="text-base shrink-0 w-6">{c.icon}</span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-300 truncate">{c.name}</span>
                                <span className="text-zinc-500 text-xs shrink-0 ml-2">{c.count}</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-zinc-800">
                                <div
                                    className="h-full rounded-full bg-indigo-500/60 transition-all duration-500"
                                    style={{ width: `${(c.count / maxCount) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                {cats.length === 0 && <p className="text-sm text-zinc-600 text-center py-4">Sin datos</p>}
            </div>
        </div>
    );
}

async function TopCountriesSection() {
    const countries = await obtenerTopPaisesAdmin();
    const maxCount = countries.length > 0 ? countries[0].count : 1;

    return (
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-100">
                <Globe className="h-4 w-4 text-zinc-500" /> Top Países
            </h3>
            <div className="space-y-2.5">
                {countries.map((c) => (
                    <div key={c.country} className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-300">{c.country}</span>
                                <span className="text-zinc-500 text-xs">{c.count} usuarios</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-zinc-800">
                                <div
                                    className="h-full rounded-full bg-emerald-500/60 transition-all duration-500"
                                    style={{ width: `${(c.count / maxCount) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                {countries.length === 0 && <p className="text-sm text-zinc-600 text-center py-4">Sin datos</p>}
            </div>
        </div>
    );
}

function CardSkeleton() {
    return <div className="h-72 animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />;
}

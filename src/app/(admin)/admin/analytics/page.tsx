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
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { adminPanelClass } from "@/components/admin/shared/admin-ui";
import {
    obtenerAnalyticsGlobalesAdmin,
    obtenerDistribucionTransaccionesAdmin,
    obtenerTopCategoriasAdmin,
    obtenerTopPaisesAdmin,
} from "@/lib/actions/admin/analytics";

export default async function AdminAnalyticsPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Analytics Globales"
                description="Métricas de crecimiento, adopción y salud de la plataforma."
                icon={BarChart3}
            />

            <Suspense fallback={<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[118px] animate-pulse rounded-2xl border border-white/10 bg-[#0b1220]/80" />)}</div>}>
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
        <div className={`${adminPanelClass} p-5`}>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[color:var(--admin-text)]">
                <TrendingUp className="h-4 w-4 text-[color:var(--admin-text-subtle)]" /> Distribución por Tipo
            </h3>

            {/* Progress bar */}
            <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-[color:var(--admin-surface-muted)]">
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
                                <span className="text-[color:var(--admin-text-muted)]">{meta.label}</span>
                            </div>
                            <span className="text-[color:var(--admin-text-muted)]">{d.count.toLocaleString()} <span className="text-xs text-[color:var(--admin-text-subtle)]">({pct}%)</span></span>
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
        <div className={`${adminPanelClass} p-5`}>
            <h3 className="mb-4 text-base font-semibold text-[color:var(--admin-text)]">Top Categorías</h3>
            <div className="space-y-2.5">
                {cats.map((c, i) => (
                    <div key={c.name + i} className="flex items-center gap-3">
                        <span className="text-base shrink-0 w-6">{c.icon}</span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="truncate text-[color:var(--admin-text-muted)]">{c.name}</span>
                                <span className="ml-2 shrink-0 text-xs text-[color:var(--admin-text-subtle)]">{c.count}</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-[color:var(--admin-surface-muted)]">
                                <div
                                    className="h-full rounded-full bg-[color:var(--admin-accent)] transition-all duration-500"
                                    style={{ width: `${(c.count / maxCount) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                {cats.length === 0 && <p className="py-4 text-center text-sm text-[color:var(--admin-text-subtle)]">Sin datos</p>}
            </div>
        </div>
    );
}

async function TopCountriesSection() {
    const countries = await obtenerTopPaisesAdmin();
    const maxCount = countries.length > 0 ? countries[0].count : 1;

    return (
        <div className={`${adminPanelClass} p-5`}>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[color:var(--admin-text)]">
                <Globe className="h-4 w-4 text-[color:var(--admin-text-subtle)]" /> Top Países
            </h3>
            <div className="space-y-2.5">
                {countries.map((c) => (
                    <div key={c.country} className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[color:var(--admin-text-muted)]">{c.country}</span>
                                <span className="text-xs text-[color:var(--admin-text-subtle)]">{c.count} usuarios</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-[color:var(--admin-surface-muted)]">
                                <div
                                    className="h-full rounded-full bg-[color:var(--admin-success)] transition-all duration-500"
                                    style={{ width: `${(c.count / maxCount) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                {countries.length === 0 && <p className="py-4 text-center text-sm text-[color:var(--admin-text-subtle)]">Sin datos</p>}
            </div>
        </div>
    );
}

function CardSkeleton() {
    return <div className="h-72 animate-pulse rounded-2xl border border-white/10 bg-[#0b1220]/80" />;
}

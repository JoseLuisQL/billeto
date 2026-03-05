import { Suspense } from "react";
import {
    Users,
    UserPlus,
    Building2,
    Zap,
    Activity,
    Percent,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { AdminKPICard } from "@/components/admin/shared/AdminKPICard";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import {
    obtenerKPIsAdmin,
    obtenerUltimosUsuarios,
    obtenerUltimasTransacciones,
} from "@/lib/actions/admin/dashboard";

export default async function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            <AdminPageHeader
                title="Dashboard"
                description="Vista ejecutiva de la operación completa de Billeto."
                icon={Activity}
            />

            <Suspense fallback={<KPISkeleton />}>
                <KPISection />
            </Suspense>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Suspense fallback={<TableSkeleton title="Últimos usuarios" />}>
                    <LatestUsersSection />
                </Suspense>
                <Suspense fallback={<TableSkeleton title="Últimas transacciones" />}>
                    <LatestTransactionsSection />
                </Suspense>
            </div>
        </div>
    );
}

async function KPISection() {
    const kpis = await obtenerKPIsAdmin();

    const freePlan = kpis.planDistribution["free"] ?? 0;
    const proPlan = kpis.planDistribution["pro"] ?? 0;
    const premiumPlan = kpis.planDistribution["premium"] ?? 0;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AdminKPICard
                title="Usuarios Totales"
                value={kpis.totalUsers.toLocaleString()}
                icon={Users}
                variant="default"
            />
            <AdminKPICard
                title="Nuevos (7 días)"
                value={kpis.newUsersWeek.toLocaleString()}
                icon={UserPlus}
                variant="success"
                subtitle={`${kpis.totalUsers > 0 ? ((kpis.newUsersWeek / kpis.totalUsers) * 100).toFixed(1) : 0}% del total`}
            />
            <AdminKPICard
                title="Workspaces Activos"
                value={kpis.totalWorkspaces.toLocaleString()}
                icon={Building2}
                variant="default"
            />
            <AdminKPICard
                title="Transacciones Hoy"
                value={kpis.transactionsToday.toLocaleString()}
                icon={Zap}
                variant="warning"
                subtitle={`${kpis.totalTransactions.toLocaleString()} total`}
            />
            <AdminKPICard
                title="Retención (30d)"
                value={`${kpis.retentionRate}%`}
                icon={Percent}
                variant={kpis.retentionRate >= 50 ? "success" : "danger"}
            />
            <AdminKPICard
                title="Plan Distribution"
                value={`${freePlan} / ${proPlan} / ${premiumPlan}`}
                icon={Activity}
                variant="default"
                subtitle="Free / Pro / Premium"
            />
        </div>
    );
}

async function LatestUsersSection() {
    const users = await obtenerUltimosUsuarios(8);

    return (
        <div className="rounded-2xl border border-white/10 bg-[#0b1220]/80 p-5 shadow-[0_24px_44px_-32px_rgba(15,23,42,0.85)]">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-zinc-100">Últimos usuarios</h2>
                <Link href="/admin/users" className="flex items-center gap-1 text-xs font-semibold text-cyan-200 transition-colors hover:text-cyan-100">
                    Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5 text-left text-xs text-zinc-500">
                            <th className="pb-3 font-medium">Usuario</th>
                            <th className="pb-3 font-medium">Email</th>
                            <th className="pb-3 font-medium">Plan</th>
                            <th className="pb-3 font-medium">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map((u) => (
                            <tr key={u.id} className="group transition-colors hover:bg-white/[0.02]">
                                <td className="py-3 pr-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/12 text-xs font-semibold text-cyan-100">
                                            {u.avatar ? (
                                                <img src={u.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                                            ) : (
                                                u.name?.charAt(0)?.toUpperCase() ?? "U"
                                            )}
                                        </div>
                                        <span className="font-medium text-zinc-200 truncate max-w-[140px]">{u.name || "Sin nombre"}</span>
                                    </div>
                                </td>
                                <td className="py-3 pr-4 text-zinc-400 truncate max-w-[180px]">{u.email}</td>
                                <td className="py-3 pr-4">
                                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${u.plan === "premium"
                                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                            : u.plan === "pro"
                                                ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                                                : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                                        }`}>
                                        {u.plan}
                                    </span>
                                </td>
                                <td className="py-3 text-zinc-500 text-xs whitespace-nowrap">
                                    {new Date(u.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

async function LatestTransactionsSection() {
    const txs = await obtenerUltimasTransacciones(8);

    return (
        <div className="rounded-2xl border border-white/10 bg-[#0b1220]/80 p-5 shadow-[0_24px_44px_-32px_rgba(15,23,42,0.85)]">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-zinc-100">Últimas transacciones</h2>
                <Link href="/admin/transactions" className="flex items-center gap-1 text-xs font-semibold text-cyan-200 transition-colors hover:text-cyan-100">
                    Ver todas <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5 text-left text-xs text-zinc-500">
                            <th className="pb-3 font-medium">Descripción</th>
                            <th className="pb-3 font-medium">Monto</th>
                            <th className="pb-3 font-medium">Workspace</th>
                            <th className="pb-3 font-medium">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {txs.map((t) => (
                            <tr key={t.id} className="group transition-colors hover:bg-white/[0.02]">
                                <td className="py-3 pr-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-zinc-200 truncate max-w-[160px]">{t.description}</span>
                                        <span className="text-xs text-zinc-500">{t.category}</span>
                                    </div>
                                </td>
                                <td className="py-3 pr-4">
                                    <span className={`font-mono font-medium ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                                        {t.type === "income" ? "+" : "-"}{t.amount.toFixed(2)}
                                    </span>
                                    <span className="ml-1 text-xs text-zinc-500">{t.currency}</span>
                                </td>
                                <td className="py-3 pr-4 text-zinc-400 truncate max-w-[120px] text-xs">{t.workspace}</td>
                                <td className="py-3 text-zinc-500 text-xs whitespace-nowrap">
                                    {new Date(t.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function KPISkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[150px] animate-pulse rounded-2xl border border-white/10 bg-[#0b1220]/80" />
            ))}
        </div>
    );
}

function TableSkeleton({ title }: { title: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#0b1220]/80 p-5">
            <h2 className="mb-4 text-base font-semibold text-zinc-100">{title}</h2>
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.05]" />
                ))}
            </div>
        </div>
    );
}

import { Suspense } from "react";
import { Shield, Activity, Calendar, FileText } from "lucide-react";
import { AdminKPICard } from "@/components/admin/shared/AdminKPICard";
import { AuditTableClient } from "@/components/admin/audit/AuditTableClient";
import {
    listarAuditLogsAdmin,
    obtenerEstadisticasAuditAdmin,
} from "@/lib/actions/admin/audit";

export default async function AdminAuditPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Auditoría y Logs</h1>
                    <p className="mt-1 text-sm text-zinc-500">Registro de todas las acciones administrativas</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                    <Shield className="h-5 w-5 text-indigo-400" />
                </div>
            </div>

            <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[100px] animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />)}</div>}>
                <StatsSection />
            </Suspense>

            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />}>
                <TableSection />
            </Suspense>
        </div>
    );
}

async function StatsSection() {
    const stats = await obtenerEstadisticasAuditAdmin();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <AdminKPICard title="Total de Logs" value={stats.total.toLocaleString()} icon={FileText} variant="default" />
                <AdminKPICard title="Hoy" value={stats.todayCount.toLocaleString()} icon={Activity} variant="success" />
                <AdminKPICard title="Esta Semana" value={stats.weekCount.toLocaleString()} icon={Calendar} variant="default" />
            </div>

            {stats.topActions.length > 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50 p-5">
                    <h3 className="mb-3 text-sm font-semibold text-zinc-300">Acciones Más Frecuentes</h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.topActions.map((a) => (
                            <span key={a.action} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-zinc-800/50 px-3 py-1.5 text-xs">
                                <span className="font-medium text-zinc-300">{a.action}</span>
                                <span className="rounded-md bg-indigo-500/10 px-1.5 py-0 text-[10px] font-semibold text-indigo-400">{a.count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

async function TableSection() {
    const logs = await listarAuditLogsAdmin();
    return <AuditTableClient logs={logs} />;
}

import { Suspense } from "react";
import { Shield, Activity, Calendar, FileText } from "lucide-react";
import { AdminKPICard } from "@/components/admin/shared/AdminKPICard";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AuditTableClient } from "@/components/admin/audit/AuditTableClient";
import {
    listarAuditLogsAdmin,
    obtenerEstadisticasAuditAdmin,
} from "@/lib/actions/admin/audit";

export default async function AdminAuditPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Auditoría y Logs"
                description="Registro forense de acciones administrativas y cambios críticos."
                icon={Shield}
            />

            <Suspense fallback={<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[118px] animate-pulse rounded-2xl border border-white/10 bg-[#0b1220]/80" />)}</div>}>
                <StatsSection />
            </Suspense>

            <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-[#0b1220]/80" />}>
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
                <div className="rounded-2xl border border-white/10 bg-[#0b1220]/80 p-5">
                    <h3 className="mb-3 text-sm font-semibold text-zinc-300">Acciones Más Frecuentes</h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.topActions.map((a) => (
                            <span key={a.action} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs">
                                <span className="font-medium text-zinc-300">{a.action}</span>
                                <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0 text-[10px] font-semibold text-cyan-300">{a.count}</span>
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

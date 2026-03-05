import { Suspense } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle, AlertOctagon } from "lucide-react";
import { AdminKPICard } from "@/components/admin/shared/AdminKPICard";
import { IncidentsTableClient } from "@/components/admin/security/IncidentsTableClient";
import {
    listarIncidentesAdmin,
    obtenerEstadisticasSecurityAdmin,
} from "@/lib/actions/admin/security";

export default async function AdminSecurityPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Seguridad e Incidentes</h1>
                    <p className="mt-1 text-sm text-zinc-500">Monitoreo de incidentes y amenazas de seguridad</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10">
                    <ShieldAlert className="h-5 w-5 text-rose-400" />
                </div>
            </div>

            <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[100px] animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />)}</div>}>
                <StatsSection />
            </Suspense>

            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />}>
                <TableSection />
            </Suspense>
        </div>
    );
}

async function StatsSection() {
    const stats = await obtenerEstadisticasSecurityAdmin();

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            <AdminKPICard title="Total" value={stats.total} icon={ShieldAlert} variant="default" />
            <AdminKPICard title="Abiertos" value={stats.open} icon={XCircle} variant="danger" />
            <AdminKPICard title="Resueltos" value={stats.resolved} icon={CheckCircle} variant="success" />
            <AdminKPICard title="Críticos" value={stats.critical} icon={AlertOctagon} variant="danger" />
            <AdminKPICard title="Altos" value={stats.high} icon={AlertTriangle} variant="warning" />
            <AdminKPICard title="Medios" value={stats.medium} icon={AlertTriangle} variant="default" />
            <AdminKPICard title="Bajos" value={stats.low} icon={ShieldAlert} variant="default" />
        </div>
    );
}

async function TableSection() {
    const incidents = await listarIncidentesAdmin();
    return <IncidentsTableClient incidents={incidents} />;
}

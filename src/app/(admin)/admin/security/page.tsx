import { Suspense } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle, AlertOctagon } from "lucide-react";
import { AdminKPICard } from "@/components/admin/shared/AdminKPICard";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { IncidentsTableClient } from "@/components/admin/security/IncidentsTableClient";
import {
    listarIncidentesAdmin,
    obtenerEstadisticasSecurityAdmin,
} from "@/lib/actions/admin/security";

export default async function AdminSecurityPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Seguridad e Incidentes"
                description="Monitoreo de alertas, severidad y tiempo de resolución."
                icon={ShieldAlert}
                tone="danger"
            />

            <Suspense fallback={<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[118px] animate-pulse rounded-2xl border border-white/10 bg-[#0b1220]/80" />)}</div>}>
                <StatsSection />
            </Suspense>

            <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-[#0b1220]/80" />}>
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

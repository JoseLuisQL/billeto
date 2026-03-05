import { Suspense } from "react";
import { Zap, Activity, Calendar, Trash2 } from "lucide-react";
import { AdminKPICard } from "@/components/admin/shared/AdminKPICard";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { TransactionsTableClient } from "@/components/admin/transactions/TransactionsTableClient";
import {
    listarTransaccionesAdmin,
    obtenerEstadisticasTransaccionesAdmin,
} from "@/lib/actions/admin/transactions";

export default async function AdminTransactionsPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Gestión de Transacciones"
                description="Visibilidad y moderación de todos los movimientos financieros."
                icon={Zap}
                tone="warning"
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
    const stats = await obtenerEstadisticasTransaccionesAdmin();

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <AdminKPICard title="Total Activas" value={stats.total.toLocaleString()} icon={Activity} variant="default" />
            <AdminKPICard title="Hoy" value={stats.today.toLocaleString()} icon={Zap} variant="success" />
            <AdminKPICard title="Esta Semana" value={stats.thisWeek.toLocaleString()} icon={Calendar} variant="default" />
            <AdminKPICard title="Eliminadas" value={stats.deleted.toLocaleString()} icon={Trash2} variant="danger" />
        </div>
    );
}

async function TableSection() {
    const transactions = await listarTransaccionesAdmin();

    return <TransactionsTableClient transactions={transactions} />;
}

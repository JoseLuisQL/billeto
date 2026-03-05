import { Suspense } from "react";
import { Zap, Activity, Calendar, Trash2 } from "lucide-react";
import { AdminKPICard } from "@/components/admin/shared/AdminKPICard";
import { TransactionsTableClient } from "@/components/admin/transactions/TransactionsTableClient";
import {
    listarTransaccionesAdmin,
    obtenerEstadisticasTransaccionesAdmin,
} from "@/lib/actions/admin/transactions";

export default async function AdminTransactionsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Gestión de Transacciones</h1>
                    <p className="mt-1 text-sm text-zinc-500">Visibilidad y moderación de todas las transacciones</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                    <Zap className="h-5 w-5 text-indigo-400" />
                </div>
            </div>

            {/* Stats */}
            <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[100px] animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />)}</div>}>
                <StatsSection />
            </Suspense>

            {/* Table */}
            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />}>
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

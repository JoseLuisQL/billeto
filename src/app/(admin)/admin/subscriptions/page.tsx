import { Suspense } from "react";
import { CreditCard, CheckCircle, XCircle, Crown } from "lucide-react";
import { AdminKPICard } from "@/components/admin/shared/AdminKPICard";
import { SubscriptionsTableClient } from "@/components/admin/subscriptions/SubscriptionsTableClient";
import {
    listarSuscripcionesAdmin,
    obtenerMetricasRevenueAdmin,
} from "@/lib/actions/admin/subscriptions";

export default async function AdminSubscriptionsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Gestión de Suscripciones</h1>
                    <p className="mt-1 text-sm text-zinc-500">Control de planes y monetización</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                    <CreditCard className="h-5 w-5 text-indigo-400" />
                </div>
            </div>

            <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[100px] animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />)}</div>}>
                <MetricsSection />
            </Suspense>

            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />}>
                <TableSection />
            </Suspense>
        </div>
    );
}

async function MetricsSection() {
    const metrics = await obtenerMetricasRevenueAdmin();

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <AdminKPICard title="Activas" value={metrics.totalActive} icon={CheckCircle} variant="success" />
            <AdminKPICard title="Canceladas" value={metrics.totalCancelled} icon={XCircle} variant="danger" />
            <AdminKPICard title="Free" value={metrics.freeCount} icon={CreditCard} variant="default" />
            <AdminKPICard title="Pro" value={metrics.proCount} icon={CreditCard} variant="default" />
            <AdminKPICard title="Premium" value={metrics.premiumCount} icon={Crown} variant="warning" />
        </div>
    );
}

async function TableSection() {
    const subscriptions = await listarSuscripcionesAdmin();
    return <SubscriptionsTableClient subscriptions={subscriptions} />;
}

import { Suspense } from "react";
import { CreditCard, CheckCircle, XCircle, Crown } from "lucide-react";
import { AdminKPICard } from "@/components/admin/shared/AdminKPICard";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { SubscriptionsTableClient } from "@/components/admin/subscriptions/SubscriptionsTableClient";
import {
    listarSuscripcionesAdmin,
    obtenerMetricasRevenueAdmin,
} from "@/lib/actions/admin/subscriptions";

export default async function AdminSubscriptionsPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Gestión de Suscripciones"
                description="Control de planes activos, cancelaciones y upgrades."
                icon={CreditCard}
            />

            <Suspense fallback={<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[118px] animate-pulse rounded-2xl border border-white/10 bg-[#0b1220]/80" />)}</div>}>
                <MetricsSection />
            </Suspense>

            <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-[#0b1220]/80" />}>
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

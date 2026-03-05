import { Suspense } from "react";
import { Settings, Flag, Wrench, Database } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FeatureFlagsClient } from "@/components/admin/settings/FeatureFlagsClient";
import { MaintenanceModeClient } from "@/components/admin/settings/MaintenanceModeClient";
import {
    obtenerFeatureFlagsAdmin,
    obtenerMaintenanceModeAdmin,
    obtenerSystemConfigAdmin,
} from "@/lib/actions/admin/settings";

export default async function AdminSettingsPage() {
    return (
        <div className="space-y-8">
            <AdminPageHeader
                title="Configuración del Sistema"
                description="Feature flags, mantenimiento y parámetros globales de operación."
                icon={Settings}
            />

            <Section icon={Wrench} title="Mantenimiento">
                <Suspense fallback={<SectionSkeleton />}>
                    <MaintenanceSection />
                </Suspense>
            </Section>

            <Section icon={Flag} title="Feature Flags">
                <Suspense fallback={<SectionSkeleton />}>
                    <FlagsSection />
                </Suspense>
            </Section>

            <Section icon={Database} title="Configuración Almacenada">
                <Suspense fallback={<SectionSkeleton />}>
                    <ConfigSection />
                </Suspense>
            </Section>
        </div>
    );
}

async function MaintenanceSection() {
    const data = await obtenerMaintenanceModeAdmin();
    return <MaintenanceModeClient initialData={data} />;
}

async function FlagsSection() {
    const flags = await obtenerFeatureFlagsAdmin();
    return <FeatureFlagsClient initialFlags={flags} />;
}

async function ConfigSection() {
    const configs = await obtenerSystemConfigAdmin();

    return (
        <div className="rounded-2xl border border-white/10 bg-[#0b1220]/80">
            {configs.length === 0 ? (
                <p className="p-6 text-center text-sm text-zinc-600">No hay configuraciones almacenadas</p>
            ) : (
                <div className="divide-y divide-white/10">
                    {configs.map((c) => (
                        <div key={c.id} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-sm font-medium text-zinc-200">{c.key}</span>
                                <span className="text-xs text-zinc-600">
                                    {new Date(c.updatedAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                            <div className="rounded-lg bg-zinc-950/50 px-3 py-2 text-xs text-zinc-400 font-mono overflow-x-auto max-h-[80px] overflow-y-auto">
                                {JSON.stringify(c.value, null, 2).slice(0, 300)}
                                {JSON.stringify(c.value, null, 2).length > 300 && "…"}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Section({ icon: Icon, title, children }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-400/10 text-cyan-100">
                    <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function SectionSkeleton() {
    return <div className="h-48 animate-pulse rounded-2xl border border-white/10 bg-[#0b1220]/80" />;
}

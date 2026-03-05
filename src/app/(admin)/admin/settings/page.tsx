import { Suspense } from "react";
import { Settings, Flag, Wrench, Database } from "lucide-react";
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Configuración del Sistema</h1>
                    <p className="mt-1 text-sm text-zinc-500">Feature flags, modo mantenimiento y configuración general</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                    <Settings className="h-5 w-5 text-indigo-400" />
                </div>
            </div>

            {/* Maintenance Mode */}
            <Section icon={Wrench} title="Mantenimiento">
                <Suspense fallback={<SectionSkeleton />}>
                    <MaintenanceSection />
                </Suspense>
            </Section>

            {/* Feature Flags */}
            <Section icon={Flag} title="Feature Flags">
                <Suspense fallback={<SectionSkeleton />}>
                    <FlagsSection />
                </Suspense>
            </Section>

            {/* System Config Overview */}
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
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50">
            {configs.length === 0 ? (
                <p className="p-6 text-center text-sm text-zinc-600">No hay configuraciones almacenadas</p>
            ) : (
                <div className="divide-y divide-white/5">
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
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-zinc-500" />
                <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
            </div>
            {children}
        </div>
    );
}

function SectionSkeleton() {
    return <div className="h-48 animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />;
}

import { Suspense } from "react";
import { Settings, Flag, Wrench, Database } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FeatureFlagsClient } from "@/components/admin/settings/FeatureFlagsClient";
import { MaintenanceModeClient } from "@/components/admin/settings/MaintenanceModeClient";
import {
    adminPanelClass,
    adminSectionHeaderClass,
    getAdminIconBadgeClasses,
} from "@/components/admin/shared/admin-ui";
import {
    formatAdminPreview,
    shouldFullyRedactConfig,
} from "@/lib/admin-redaction";
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
        <div className={adminPanelClass}>
            {configs.length === 0 ? (
                <p className="p-6 text-center text-sm text-[color:var(--admin-text-subtle)]">No hay configuraciones almacenadas</p>
            ) : (
                <div className="divide-y divide-[color:var(--admin-border)]">
                    {configs.map((c) => (
                        <div key={c.id} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-sm font-medium text-[color:var(--admin-text)]">{c.key}</span>
                                <span className="text-xs text-[color:var(--admin-text-subtle)]">
                                    {new Date(c.updatedAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                            <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-3 py-2 text-xs text-[color:var(--admin-text-muted)] font-mono overflow-x-auto max-h-[96px] overflow-y-auto">
                                {shouldFullyRedactConfig(c.key)
                                    ? "Contenido oculto por seguridad"
                                    : formatAdminPreview(c.value, "Sin valor")}
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
            <div className={adminSectionHeaderClass}>
                <div className={getAdminIconBadgeClasses("accent")}>
                    <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold text-[color:var(--admin-text)]">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function SectionSkeleton() {
    return <div className={`${adminPanelClass} h-48 animate-pulse`} />;
}

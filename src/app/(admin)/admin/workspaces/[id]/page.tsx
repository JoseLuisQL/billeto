import { notFound } from "next/navigation";
import Link from "next/link";
import {
    Building2,
    Globe,
    Calendar,
    Users,
    CreditCard,
    Wallet,
    Target,
    Repeat,
    Tags,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import {
    adminPanelClass,
    getAdminBadgeClasses,
} from "@/components/admin/shared/admin-ui";
import { obtenerDetalleWorkspaceAdmin } from "@/lib/actions/admin/workspaces";

export default async function AdminWorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let ws;
    try {
        ws = await obtenerDetalleWorkspaceAdmin(id);
    } catch {
        notFound();
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title={ws.name}
                description={`Workspace · ${ws.currency} · ${ws.country ?? "Sin país"}`}
                icon={Building2}
                backHref="/admin/workspaces"
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Stat icon={CreditCard} label="Transacciones" value={ws.counts.transactions} />
                <Stat icon={Wallet} label="Cuentas" value={ws.accounts.length} />
                <Stat icon={Users} label="Miembros" value={ws.members.length} />
                <Stat icon={Tags} label="Categorías" value={ws.counts.categories} />
                <Stat icon={Target} label="Metas" value={ws.counts.goals} />
                <Stat icon={Repeat} label="Recurrentes" value={ws.counts.recurring} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className={`${adminPanelClass} p-5`}>
                    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[color:var(--admin-text)]">
                        <Users className="h-4 w-4 text-[color:var(--admin-text-subtle)]" /> Miembros
                    </h2>
                    <div className="divide-y divide-[color:var(--admin-border)]">
                        {ws.members.map((m) => (
                            <div key={m.id} className="flex items-center justify-between py-3 px-1">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--admin-accent-soft)] bg-[color:var(--admin-accent-soft)] text-xs font-semibold text-[color:var(--admin-accent-strong)]">
                                        {m.avatar ? (
                                            <img src={m.avatar} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            m.name?.charAt(0)?.toUpperCase() ?? "U"
                                        )}
                                    </div>
                                    <div>
                                        <Link href={`/admin/users/${m.id}`} className="text-sm font-medium text-[color:var(--admin-text)] transition-colors hover:text-[color:var(--admin-accent-strong)]">
                                            {m.name || "Sin nombre"}
                                        </Link>
                                        <p className="text-xs text-[color:var(--admin-text-subtle)]">{m.email}</p>
                                    </div>
                                </div>
                                <span className={getAdminBadgeClasses("neutral")}>{m.role}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`${adminPanelClass} p-5`}>
                    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[color:var(--admin-text)]">
                        <Wallet className="h-4 w-4 text-[color:var(--admin-text-subtle)]" /> Cuentas
                    </h2>
                    {ws.accounts.length === 0 ? (
                        <p className="py-4 text-center text-sm text-[color:var(--admin-text-subtle)]">Sin cuentas</p>
                    ) : (
                        <div className="divide-y divide-[color:var(--admin-border)]">
                            {ws.accounts.map((a) => (
                                <div key={a.id} className="flex items-center justify-between py-3 px-1">
                                    <div>
                                        <p className="text-sm font-medium text-[color:var(--admin-text)]">{a.name}</p>
                                        <p className="text-xs capitalize text-[color:var(--admin-text-subtle)]">{a.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-mono font-medium text-[color:var(--admin-text)]">{a.balance.toFixed(2)}</p>
                                        <p className="text-xs text-[color:var(--admin-text-subtle)]">{a.currency}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`${adminPanelClass} p-5`}>
                    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[color:var(--admin-text)]">
                        <Building2 className="h-4 w-4 text-[color:var(--admin-text-subtle)]" /> Información
                    </h2>
                    <dl className="space-y-3">
                        <InfoRow icon={Globe} label="País" value={ws.country ?? "—"} />
                        <InfoRow icon={CreditCard} label="Moneda" value={ws.currency} />
                        <InfoRow icon={Calendar} label="Creado" value={new Date(ws.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })} />
                        <InfoRow icon={Target} label="Onboarding" value={ws.onboardingCompleted ? "Completado" : "Pendiente"} />
                        <InfoRow icon={CreditCard} label="Plan" value={ws.plan.toUpperCase()} />
                        <InfoRow icon={Building2} label="Estado" value={ws.deletedAt ? `Eliminado ${new Date(ws.deletedAt).toLocaleDateString("es-PE")}` : "Activo"} />
                    </dl>
                </div>
            </div>
        </div>
    );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
    return (
        <div className={`${adminPanelClass} p-4 text-center`}>
            <Icon className="mx-auto h-4 w-4 text-[color:var(--admin-text-subtle)]" />
            <p className="mt-2 text-lg font-bold text-[color:var(--admin-text)]">{value}</p>
            <p className="text-xs text-[color:var(--admin-text-subtle)]">{label}</p>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <Icon className="h-4 w-4 shrink-0 text-[color:var(--admin-text-subtle)]" />
            <span className="w-24 shrink-0 text-[color:var(--admin-text-subtle)]">{label}</span>
            <span className="text-[color:var(--admin-text-muted)]">{value}</span>
        </div>
    );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Mail,
    ShieldCheck,
    Globe,
    Calendar,
    Crown,
    Building2,
    Activity,
    Clock,
} from "lucide-react";
import { obtenerDetalleUsuarioAdmin } from "@/lib/actions/admin/users";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let user;
    try {
        user = await obtenerDetalleUsuarioAdmin(id);
    } catch {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/users"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 text-xl font-bold text-indigo-400 overflow-hidden">
                        {user.avatar ? (
                            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                            user.name?.charAt(0)?.toUpperCase() ?? "U"
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{user.name || "Sin nombre"}</h1>
                            {user.isAdmin && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
                                    <Crown className="h-3 w-3" /> Admin
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-500">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCard icon={Mail} label="Email verificado" value={user.emailVerified ? "Sí" : "No"} color={user.emailVerified ? "emerald" : "amber"} />
                <InfoCard icon={Globe} label="País" value={user.country ?? "No especificado"} color="default" />
                <InfoCard icon={Calendar} label="Registrado" value={new Date(user.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })} color="default" />
                <InfoCard icon={ShieldCheck} label="Estado" value={user.scheduledForDeletionAt ? "Eliminación programada" : "Activo"} color={user.scheduledForDeletionAt ? "rose" : "emerald"} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Workspaces */}
                <Section title="Workspaces" icon={Building2} count={user.workspaces.length}>
                    {user.workspaces.length === 0 ? (
                        <EmptyState text="Sin workspaces" />
                    ) : (
                        <div className="divide-y divide-white/5">
                            {user.workspaces.map((ws) => (
                                <div key={ws.id} className="flex items-center justify-between py-3 px-1">
                                    <div>
                                        <Link href={`/admin/workspaces/${ws.id}`} className="font-medium text-zinc-200 hover:text-indigo-400 transition-colors">
                                            {ws.name}
                                        </Link>
                                        <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500">
                                            <span>{ws.role}</span>
                                            <span>·</span>
                                            <span>{ws.transactions} txns</span>
                                            <span>·</span>
                                            <span>{ws.accounts} cuentas</span>
                                            <span>·</span>
                                            <span>{ws.members} miembros</span>
                                        </div>
                                    </div>
                                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ws.plan === "premium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                            : ws.plan === "pro" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                                : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                                        }`}>
                                        {ws.plan}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* Recent Activity */}
                <Section title="Actividad Reciente" icon={Activity} count={user.recentActivity.length}>
                    {user.recentActivity.length === 0 ? (
                        <EmptyState text="Sin actividad registrada" />
                    ) : (
                        <div className="divide-y divide-white/5">
                            {user.recentActivity.map((log) => (
                                <div key={log.id} className="flex items-center gap-3 py-2.5 px-1">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                                        <Activity className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-zinc-300 truncate">
                                            <span className="font-medium">{log.action}</span>
                                            <span className="text-zinc-500"> en </span>
                                            <span className="text-zinc-400">{log.entity}</span>
                                        </p>
                                        <p className="text-xs text-zinc-600">
                                            {new Date(log.createdAt).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* Sessions */}
                <Section title="Sesiones Activas" icon={Clock} count={user.sessions.length}>
                    {user.sessions.length === 0 ? (
                        <EmptyState text="Sin sesiones activas" />
                    ) : (
                        <div className="divide-y divide-white/5">
                            {user.sessions.map((s) => (
                                <div key={s.id} className="flex items-center justify-between py-2.5 px-1">
                                    <span className="text-sm text-zinc-400 font-mono truncate max-w-[200px]">{s.id}</span>
                                    <span className="text-xs text-zinc-500">
                                        Expira: {new Date(s.expires).toLocaleDateString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            </div>
        </div>
    );
}

function InfoCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
    const colors: Record<string, string> = {
        default: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    };
    const style = colors[color] ?? colors.default;
    return (
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50 p-4">
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${style}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="text-sm font-medium text-zinc-200">{value}</p>
                </div>
            </div>
        </div>
    );
}

function Section({ title, icon: Icon, count, children }: { title: string; icon: React.ComponentType<{ className?: string }>; count: number; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50 p-5">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="h-4 w-4 text-zinc-500" />
                <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
                <span className="ml-auto rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{count}</span>
            </div>
            {children}
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return <p className="py-4 text-center text-sm text-zinc-600">{text}</p>;
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    MoreHorizontal,
    Eye,
    ShieldCheck,
    ShieldOff,
    UserX,
    UserCheck,
    Mail,
    Trash2,
    XCircle,
    Crown,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import {
    getAdminBadgeClasses,
    getPlanLabel,
    getPlanTone,
} from "@/components/admin/shared/admin-ui";
import type { AdminUserRow } from "@/lib/actions/admin/users";
import {
    verificarEmailAdmin,
    suspenderUsuarioAdmin,
    reactivarUsuarioAdmin,
    promoverAdminAdmin,
    revocarAdminAdmin,
    eliminarUsuarioAdmin,
    cancelarEliminacionAdmin,
} from "@/lib/actions/admin/users";

interface UsersTableClientProps {
    users: AdminUserRow[];
}

export function UsersTableClient({ users }: UsersTableClientProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [actionError, setActionError] = useState<string | null>(null);

    const runAction = (fn: () => Promise<unknown>, confirmMessage?: string) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
            return;
        }
        setActionError(null);
        startTransition(async () => {
            try {
                await fn();
                router.refresh();
            } catch (e) {
                setActionError(e instanceof Error ? e.message : "Error desconocido");
            }
        });
    };

    const columns = [
        {
            id: "name",
            header: "Usuario",
            sortable: true,
            accessorFn: (row: AdminUserRow) => row.name ?? "",
            cell: (row: AdminUserRow) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--admin-accent-soft)] bg-[color:var(--admin-accent-soft)] text-xs font-bold text-[color:var(--admin-accent-strong)]">
                        {row.avatar ? (
                            <img src={row.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                            row.name?.charAt(0)?.toUpperCase() ?? "U"
                        )}
                    </div>
                    <div>
                        <Link href={`/admin/users/${row.id}`} className="font-medium text-[color:var(--admin-text)] transition-colors hover:text-[color:var(--admin-accent-strong)]">
                            {row.name || "Sin nombre"}
                        </Link>
                        {row.isAdmin && (
                            <span className={`ml-2 ${getAdminBadgeClasses("warning")}`}>Admin</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            id: "email",
            header: "Email",
            sortable: true,
            accessorFn: (row: AdminUserRow) => row.email,
            cell: (row: AdminUserRow) => (
                <div className="flex items-center gap-2">
                    <span className="max-w-[200px] truncate text-[color:var(--admin-text-muted)]">{row.email}</span>
                    {row.emailVerified ? (
                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[color:var(--admin-success-soft)] text-[color:var(--admin-success)]" title="Verificado">
                            <ShieldCheck className="h-3 w-3" />
                        </span>
                    ) : (
                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[color:var(--admin-warning-soft)] text-[color:var(--admin-warning)]" title="No verificado">
                            <Mail className="h-3 w-3" />
                        </span>
                    )}
                </div>
            ),
        },
        {
            id: "plan",
            header: "Plan",
            sortable: true,
            accessorFn: (row: AdminUserRow) => row.plan,
            cell: (row: AdminUserRow) => (
                <span className={getAdminBadgeClasses(getPlanTone(row.plan))}>
                    {getPlanLabel(row.plan)}
                </span>
            ),
        },
        {
            id: "country",
            header: "País",
            sortable: true,
            accessorFn: (row: AdminUserRow) => row.country ?? "—",
            cell: (row: AdminUserRow) => <span className="text-[color:var(--admin-text-muted)]">{row.country ?? "—"}</span>,
        },
        {
            id: "status",
            header: "Estado",
            sortable: true,
            accessorFn: (row: AdminUserRow) => row.status,
            cell: (row: AdminUserRow) => (
                <span className={getAdminBadgeClasses(row.status === "activo" ? "success" : "danger")}>
                    {row.status}
                </span>
            ),
        },
        {
            id: "createdAt",
            header: "Registro",
            sortable: true,
            accessorFn: (row: AdminUserRow) => row.createdAt,
            cell: (row: AdminUserRow) => (
                <span className="text-xs whitespace-nowrap text-[color:var(--admin-text-subtle)]">
                    {new Date(row.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
            ),
        },
    ];

    return (
        <div>
            {actionError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-[color:var(--admin-danger-soft)] bg-[color:var(--admin-danger-soft)] px-4 py-2.5 text-sm text-[color:var(--admin-danger)]">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {actionError}
                    <button type="button" onClick={() => setActionError(null)} className="ml-auto text-[color:var(--admin-danger)]/70 transition-colors hover:text-[color:var(--admin-danger)]">
                        <XCircle className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            <AdminDataTable
                data={users}
                columns={columns}
                pageSize={12}
                searchPlaceholder="Buscar por nombre o email..."
                searchField={(row) => `${row.name ?? ""} ${row.email}`}
                emptyMessage="No hay usuarios registrados"
                actions={(row) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                disabled={pending}
                                aria-label={`Abrir acciones para ${row.name || row.email}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--admin-text-subtle)] transition-colors hover:bg-white/5 hover:text-[color:var(--admin-text)] disabled:opacity-50"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={5} className="w-52 bg-[#18181b] border-white/10 p-1 rounded-xl shadow-2xl">
                            <DropdownMenuItem asChild className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300">
                                <Link href={`/admin/users/${row.id}`}>
                                    <Eye className="h-4 w-4" /> Ver detalle
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            {!row.emailVerified && (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300" onClick={() => runAction(() => verificarEmailAdmin(row.id), `¿Verificar manualmente el email de ${row.email}?`)}>
                                    <Mail className="h-4 w-4" /> Verificar email
                                </DropdownMenuItem>
                            )}
                            {row.status === "activo" ? (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300" onClick={() => runAction(() => suspenderUsuarioAdmin(row.id), `¿Programar la suspensión de ${row.email} para eliminación en 30 días?`)}>
                                    <UserX className="h-4 w-4" /> Suspender
                                </DropdownMenuItem>
                            ) : (
                                <>
                                    <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300" onClick={() => runAction(() => reactivarUsuarioAdmin(row.id), `¿Reactivar a ${row.email}?`)}>
                                        <UserCheck className="h-4 w-4" /> Reactivar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300" onClick={() => runAction(() => cancelarEliminacionAdmin(row.id), `¿Cancelar la eliminación programada de ${row.email}?`)}>
                                        <XCircle className="h-4 w-4" /> Cancelar eliminación
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator className="bg-white/5" />
                            {row.isAdmin ? (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-amber-400" onClick={() => runAction(() => revocarAdminAdmin(row.id), `¿Revocar permisos de administrador a ${row.email}?`)}>
                                    <ShieldOff className="h-4 w-4" /> Revocar admin
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300" onClick={() => runAction(() => promoverAdminAdmin(row.id), `¿Promover a ${row.email} como administrador?`)}>
                                    <Crown className="h-4 w-4" /> Promover a admin
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-rose-400" onClick={() => runAction(() => eliminarUsuarioAdmin(row.id), `¿Eliminar definitivamente a ${row.email}? Esta acción no se puede deshacer.`)}>
                                <Trash2 className="h-4 w-4" /> Eliminar usuario
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            />
        </div>
    );
}


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

    const runAction = (fn: () => Promise<unknown>) => {
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-xs font-bold text-cyan-400 overflow-hidden">
                        {row.avatar ? (
                            <img src={row.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                            row.name?.charAt(0)?.toUpperCase() ?? "U"
                        )}
                    </div>
                    <div>
                        <Link href={`/admin/users/${row.id}`} className="font-medium text-zinc-200 hover:text-cyan-400 transition-colors">
                            {row.name || "Sin nombre"}
                        </Link>
                        {row.isAdmin && (
                            <span className="ml-2 inline-flex rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0 text-[10px] font-semibold text-amber-400">ADMIN</span>
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
                    <span className="text-zinc-400 truncate max-w-[200px]">{row.email}</span>
                    {row.emailVerified ? (
                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400" title="Verificado">
                            <ShieldCheck className="h-3 w-3" />
                        </span>
                    ) : (
                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400" title="No verificado">
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
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${row.plan === "premium"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : row.plan === "pro"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                    }`}>
                    {row.plan}
                </span>
            ),
        },
        {
            id: "country",
            header: "País",
            sortable: true,
            accessorFn: (row: AdminUserRow) => row.country ?? "—",
            cell: (row: AdminUserRow) => <span className="text-zinc-400">{row.country ?? "—"}</span>,
        },
        {
            id: "status",
            header: "Estado",
            sortable: true,
            accessorFn: (row: AdminUserRow) => row.status,
            cell: (row: AdminUserRow) => (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${row.status === "activo"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
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
                <span className="text-zinc-500 text-xs whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
            ),
        },
    ];

    return (
        <div>
            {actionError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {actionError}
                    <button type="button" onClick={() => setActionError(null)} className="ml-auto text-rose-400/60 hover:text-rose-400">
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
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 disabled:opacity-50"
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
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300" onClick={() => runAction(() => verificarEmailAdmin(row.id))}>
                                    <Mail className="h-4 w-4" /> Verificar email
                                </DropdownMenuItem>
                            )}
                            {row.status === "activo" ? (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300" onClick={() => runAction(() => suspenderUsuarioAdmin(row.id))}>
                                    <UserX className="h-4 w-4" /> Suspender
                                </DropdownMenuItem>
                            ) : (
                                <>
                                    <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300" onClick={() => runAction(() => reactivarUsuarioAdmin(row.id))}>
                                        <UserCheck className="h-4 w-4" /> Reactivar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300" onClick={() => runAction(() => cancelarEliminacionAdmin(row.id))}>
                                        <XCircle className="h-4 w-4" /> Cancelar eliminación
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator className="bg-white/5" />
                            {row.isAdmin ? (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-amber-400" onClick={() => runAction(() => revocarAdminAdmin(row.id))}>
                                    <ShieldOff className="h-4 w-4" /> Revocar admin
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-zinc-300" onClick={() => runAction(() => promoverAdminAdmin(row.id))}>
                                    <Crown className="h-4 w-4" /> Promover a admin
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="cursor-pointer gap-3 focus:bg-white/5 py-2 rounded-lg text-rose-400" onClick={() => runAction(() => eliminarUsuarioAdmin(row.id))}>
                                <Trash2 className="h-4 w-4" /> Eliminar usuario
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            />
        </div>
    );
}


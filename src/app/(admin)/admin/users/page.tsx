import { listarUsuariosAdmin } from "@/lib/actions/admin/users";
import { UsersTableClient } from "@/components/admin/users/UsersTableClient";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
    const users = await listarUsuariosAdmin();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Gestión de Usuarios</h1>
                    <p className="mt-1 text-sm text-zinc-500">{users.length} usuarios registrados</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                    <Users className="h-5 w-5 text-indigo-400" />
                </div>
            </div>

            <UsersTableClient users={users} />
        </div>
    );
}

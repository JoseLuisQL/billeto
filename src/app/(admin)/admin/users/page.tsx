import { listarUsuariosAdmin } from "@/lib/actions/admin/users";
import { UsersTableClient } from "@/components/admin/users/UsersTableClient";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
    const users = await listarUsuariosAdmin();

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Gestión de Usuarios"
                description="Control de cuentas, verificación, roles y estado de acceso."
                meta={`${users.length} usuarios registrados`}
                icon={Users}
            />

            <UsersTableClient users={users} />
        </div>
    );
}

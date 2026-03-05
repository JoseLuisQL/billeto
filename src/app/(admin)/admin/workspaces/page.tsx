import { listarWorkspacesAdmin } from "@/lib/actions/admin/workspaces";
import { WorkspacesTableClient } from "@/components/admin/workspaces/WorkspacesTableClient";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Building2 } from "lucide-react";

export default async function AdminWorkspacesPage() {
    const workspaces = await listarWorkspacesAdmin();

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Gestión de Workspaces"
                description="Administración de espacios, miembros, planes y estado operativo."
                meta={`${workspaces.length} workspaces en el sistema`}
                icon={Building2}
            />

            <WorkspacesTableClient workspaces={workspaces} />
        </div>
    );
}

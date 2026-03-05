import { listarWorkspacesAdmin } from "@/lib/actions/admin/workspaces";
import { WorkspacesTableClient } from "@/components/admin/workspaces/WorkspacesTableClient";
import { Building2 } from "lucide-react";

export default async function AdminWorkspacesPage() {
    const workspaces = await listarWorkspacesAdmin();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Gestión de Workspaces</h1>
                    <p className="mt-1 text-sm text-zinc-500">{workspaces.length} workspaces en el sistema</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                    <Building2 className="h-5 w-5 text-indigo-400" />
                </div>
            </div>

            <WorkspacesTableClient workspaces={workspaces} />
        </div>
    );
}

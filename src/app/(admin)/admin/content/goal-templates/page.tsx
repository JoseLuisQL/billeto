import { Target } from "lucide-react";
import { listarGoalTemplatesAdmin } from "@/lib/actions/admin/content";
import { GoalTemplatesTableClient } from "@/components/admin/content/GoalTemplatesTableClient";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

export default async function AdminGoalTemplatesPage() {
    const templates = await listarGoalTemplatesAdmin();

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Plantillas de Metas"
                description="Plantillas predefinidas para objetivos financieros."
                meta={`${templates.length} plantillas configuradas`}
                icon={Target}
                tone="warning"
                backHref="/admin/content"
            />

            <GoalTemplatesTableClient templates={templates} />
        </div>
    );
}

import { CreditCard } from "lucide-react";
import { listarPopularSubscriptionsAdmin } from "@/lib/actions/admin/content";
import { PopularSubsTableClient } from "@/components/admin/content/PopularSubsTableClient";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

export default async function AdminPopularSubsPage() {
    const subs = await listarPopularSubscriptionsAdmin();

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Suscripciones Populares"
                description="Plantillas de servicios recurrentes para bootstrap de usuarios."
                meta={`${subs.length} suscripciones configuradas`}
                icon={CreditCard}
                tone="success"
                backHref="/admin/content"
            />

            <PopularSubsTableClient subs={subs} />
        </div>
    );
}

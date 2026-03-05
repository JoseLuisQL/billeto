import { Tags } from "lucide-react";
import { listarCategoriasGlobalesAdmin } from "@/lib/actions/admin/content";
import { CategoriesTableClient } from "@/components/admin/content/CategoriesTableClient";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

export default async function AdminCategoriesPage() {
    const categories = await listarCategoriasGlobalesAdmin();

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Categorías del Sistema"
                description="Categorías base que se provisionan al crear un workspace."
                meta={`${categories.length} categorías default en uso`}
                icon={Tags}
                backHref="/admin/content"
            />

            <CategoriesTableClient categories={categories} />
        </div>
    );
}

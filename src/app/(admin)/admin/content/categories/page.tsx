import Link from "next/link";
import { ArrowLeft, Tags } from "lucide-react";
import { listarCategoriasGlobalesAdmin } from "@/lib/actions/admin/content";
import { CategoriesTableClient } from "@/components/admin/content/CategoriesTableClient";

export default async function AdminCategoriesPage() {
    const categories = await listarCategoriasGlobalesAdmin();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/content" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Categorías del Sistema</h1>
                    <p className="mt-1 text-sm text-zinc-500">{categories.length} categorías default en uso</p>
                </div>
                <div className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                    <Tags className="h-5 w-5 text-indigo-400" />
                </div>
            </div>

            <CategoriesTableClient categories={categories} />
        </div>
    );
}

import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { listarGoalTemplatesAdmin } from "@/lib/actions/admin/content";
import { GoalTemplatesTableClient } from "@/components/admin/content/GoalTemplatesTableClient";

export default async function AdminGoalTemplatesPage() {
    const templates = await listarGoalTemplatesAdmin();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/content" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Plantillas de Metas</h1>
                    <p className="mt-1 text-sm text-zinc-500">{templates.length} plantillas configuradas</p>
                </div>
                <div className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
                    <Target className="h-5 w-5 text-amber-400" />
                </div>
            </div>

            <GoalTemplatesTableClient templates={templates} />
        </div>
    );
}

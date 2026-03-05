import Link from "next/link";
import { FileText, Tags, CreditCard, Target, Globe } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

const contentSections = [
    {
        title: "Categorías del Sistema",
        description: "Categorías default que se crean con cada workspace nuevo",
        icon: Tags,
        href: "/admin/content/categories",
        color: "indigo",
    },
    {
        title: "Suscripciones Populares",
        description: "Netflix, Spotify, etc. — plantillas de suscripciones recurrentes",
        icon: CreditCard,
        href: "/admin/content/popular-subscriptions",
        color: "emerald",
    },
    {
        title: "Plantillas de Metas",
        description: "Plantillas predefinidas para metas financieras",
        icon: Target,
        href: "/admin/content/goal-templates",
        color: "amber",
    },
    {
        title: "Países y Monedas",
        description: "Configuración de monedas y países soportados",
        icon: Globe,
        href: "/admin/content/currencies",
        color: "blue",
    },
];

const colorMap: Record<string, { icon: string; border: string; bg: string }> = {
    indigo: { icon: "text-cyan-200", border: "border-cyan-400/30", bg: "bg-cyan-500/12" },
    emerald: { icon: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10" },
    amber: { icon: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10" },
    blue: { icon: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10" },
};

export default function AdminContentPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Gestión de Contenido"
                description="Catálogos base de la plataforma y plantillas globales."
                icon={FileText}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {contentSections.map((section) => {
                    const Icon = section.icon;
                    const c = colorMap[section.color];
                    return (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/80 p-6 shadow-[0_20px_36px_-28px_rgba(15,23,42,0.85)] transition-all duration-300 hover:border-white/20"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="relative z-10 flex items-start gap-4">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${c.border} ${c.bg}`}>
                                    <Icon className={`h-6 w-6 ${c.icon}`} />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors">{section.title}</h3>
                                    <p className="mt-1 text-sm text-zinc-500">{section.description}</p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

import Link from "next/link";
import { FileText, Tags, CreditCard, Target, Globe } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import {
    adminLinkClass,
    adminPanelClass,
    getAdminIconBadgeClasses,
    type AdminTone,
} from "@/components/admin/shared/admin-ui";

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

const colorMap: Record<string, AdminTone> = {
    indigo: "accent",
    emerald: "success",
    amber: "warning",
    blue: "info",
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
                            className={`${adminPanelClass} group relative overflow-hidden p-6 transition-all duration-300 hover:border-[color:var(--admin-border-strong)]`}
                        >
                            <div className="relative z-10 flex items-start gap-4">
                                <div className={`${getAdminIconBadgeClasses(c)} h-12 w-12`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-[color:var(--admin-text)] transition-colors group-hover:text-white">{section.title}</h3>
                                    <p className="mt-1 text-sm text-[color:var(--admin-text-muted)]">{section.description}</p>
                                    <span className={`mt-3 inline-flex text-xs font-medium ${adminLinkClass}`}>Abrir módulo</span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

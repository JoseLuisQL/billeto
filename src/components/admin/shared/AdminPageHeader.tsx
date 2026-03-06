import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    adminIconButtonClass,
    getAdminIconBadgeClasses,
    type AdminTone,
} from "@/components/admin/shared/admin-ui";

type Tone = "default" | "success" | "warning" | "danger" | "info";

interface AdminPageHeaderProps {
    title: string;
    description: string;
    icon: LucideIcon;
    meta?: string;
    tone?: Tone;
    backHref?: string;
    action?: ReactNode;
}

const toneMap: Record<Tone, AdminTone> = {
    default: "accent",
    success: "success",
    warning: "warning",
    danger: "danger",
    info: "info",
};

export function AdminPageHeader({
    title,
    description,
    icon: Icon,
    meta,
    tone = "default",
    backHref,
    action,
}: AdminPageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
                {backHref && (
                    <Link
                        href={backHref}
                        aria-label="Volver a la vista anterior"
                        className={adminIconButtonClass}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                )}
                <div className={cn(getAdminIconBadgeClasses(toneMap[tone]), "h-11 w-11")}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--admin-text)]">{title}</h1>
                    <p className="mt-1 text-sm text-[color:var(--admin-text-muted)]">{description}</p>
                    {meta && <p className="mt-1 text-xs font-medium tracking-[0.08em] uppercase text-[color:var(--admin-text-subtle)]">{meta}</p>}
                </div>
            </div>
            {action && <div className="sm:pt-1">{action}</div>}
        </div>
    );
}

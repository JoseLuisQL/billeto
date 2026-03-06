import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ComponentType } from "react";
import {
    adminPanelClass,
    getAdminBadgeClasses,
    getAdminIconBadgeClasses,
    type AdminTone,
} from "@/components/admin/shared/admin-ui";

interface AdminKPICardProps {
    title: string;
    value: string | number;
    icon: ComponentType<{ className?: string }>;
    trend?: number;
    subtitle?: string;
    variant?: "default" | "success" | "warning" | "danger";
}

const variantTone: Record<NonNullable<AdminKPICardProps["variant"]>, AdminTone> = {
    default: "accent",
    success: "success",
    warning: "warning",
    danger: "danger",
};

export function AdminKPICard({
    title,
    value,
    icon: Icon,
    trend,
    subtitle,
    variant = "default",
}: AdminKPICardProps) {
    const tone = variantTone[variant];

    return (
        <article className={`${adminPanelClass} group relative overflow-hidden p-5 transition-[border-color,transform] duration-200 hover:border-[color:var(--admin-border-strong)]`}>
            <div className="relative z-10">
                <div className="flex items-start justify-between gap-2">
                    <div className={getAdminIconBadgeClasses(tone)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {typeof trend === "number" && (
                        <div className={getAdminBadgeClasses(trend > 0 ? "success" : trend < 0 ? "danger" : "neutral")}>
                            {trend > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : trend < 0 ? (
                                <TrendingDown className="h-3 w-3" />
                            ) : (
                                <Minus className="h-3 w-3" />
                            )}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-xs font-medium tracking-[0.08em] uppercase text-[color:var(--admin-text-subtle)]">{title}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--admin-text)]">{value}</p>
                    {subtitle && <p className="mt-1 text-xs text-[color:var(--admin-text-muted)]">{subtitle}</p>}
                </div>
            </div>
        </article>
    );
}

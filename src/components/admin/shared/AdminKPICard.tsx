import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ComponentType } from "react";

interface AdminKPICardProps {
    title: string;
    value: string | number;
    icon: ComponentType<{ className?: string }>;
    trend?: number;
    subtitle?: string;
    variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles = {
    default: {
        icon: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        glow: "shadow-indigo-500/5",
    },
    success: {
        icon: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        glow: "shadow-emerald-500/5",
    },
    warning: {
        icon: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        glow: "shadow-amber-500/5",
    },
    danger: {
        icon: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        glow: "shadow-rose-500/5",
    },
};

export function AdminKPICard({
    title,
    value,
    icon: Icon,
    trend,
    subtitle,
    variant = "default",
}: AdminKPICardProps) {
    const styles = variantStyles[variant];

    return (
        <div className={`group relative overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/50 p-5 transition-all duration-300 hover:border-white/10 hover:shadow-lg ${styles.glow}`}>
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10">
                <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${styles.icon}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {typeof trend === "number" && (
                        <div className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${trend > 0
                                ? "bg-emerald-500/10 text-emerald-400"
                                : trend < 0
                                    ? "bg-rose-500/10 text-rose-400"
                                    : "bg-zinc-500/10 text-zinc-400"
                            }`}>
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
                    <p className="text-2xl font-bold tracking-tight text-zinc-100">{value}</p>
                    <p className="mt-1 text-sm text-zinc-500">{title}</p>
                    {subtitle && <p className="mt-0.5 text-xs text-zinc-600">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}

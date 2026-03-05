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
        icon: "text-cyan-100 bg-cyan-400/12 border-cyan-300/30",
        line: "from-cyan-300/50",
    },
    success: {
        icon: "text-emerald-100 bg-emerald-400/12 border-emerald-300/30",
        line: "from-emerald-300/50",
    },
    warning: {
        icon: "text-amber-100 bg-amber-400/12 border-amber-300/30",
        line: "from-amber-300/50",
    },
    danger: {
        icon: "text-rose-100 bg-rose-400/12 border-rose-300/30",
        line: "from-rose-300/50",
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
        <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/80 p-5 shadow-[0_24px_40px_-32px_rgba(15,23,42,0.85)] transition-colors duration-300 hover:border-white/20">
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${styles.line} to-transparent`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_48%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10">
                <div className="flex items-start justify-between gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${styles.icon}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {typeof trend === "number" && (
                        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${trend > 0
                                ? "bg-emerald-400/15 text-emerald-200"
                                : trend < 0
                                    ? "bg-rose-400/15 text-rose-200"
                                    : "bg-zinc-400/15 text-zinc-300"
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
                    <p className="text-xs font-semibold tracking-[0.16em] uppercase text-zinc-500">{title}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">{value}</p>
                    {subtitle && <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>}
                </div>
            </div>
        </article>
    );
}

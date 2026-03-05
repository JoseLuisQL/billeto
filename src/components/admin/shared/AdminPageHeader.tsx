import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

const toneStyles: Record<Tone, string> = {
    default: "border-cyan-300/30 bg-cyan-400/12 text-cyan-100",
    success: "border-emerald-300/30 bg-emerald-400/12 text-emerald-100",
    warning: "border-amber-300/30 bg-amber-400/12 text-amber-100",
    danger: "border-rose-300/30 bg-rose-400/12 text-rose-100",
    info: "border-blue-300/30 bg-blue-400/12 text-blue-100",
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
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-100"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                )}
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", toneStyles[tone])}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{title}</h1>
                    <p className="mt-1 text-sm text-zinc-400">{description}</p>
                    {meta && <p className="mt-1 text-xs font-semibold tracking-[0.14em] uppercase text-zinc-500">{meta}</p>}
                </div>
            </div>
            {action && <div className="sm:pt-1">{action}</div>}
        </div>
    );
}

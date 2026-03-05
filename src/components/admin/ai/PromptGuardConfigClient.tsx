"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, XCircle, Shield, AlertTriangle } from "lucide-react";
import { guardarPromptGuardConfigAdmin } from "@/lib/actions/admin/ai";

interface Props {
    config: {
        enabled: boolean;
        maxMessageLength: number;
        blockedPatternsCount: number;
        suspiciousPatternsCount: number;
    };
}

export function PromptGuardConfigClient({ config }: Props) {
    const router = useRouter();
    const [enabled, setEnabled] = useState(config.enabled);
    const [maxLen, setMaxLen] = useState(config.maxMessageLength);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const handleSave = () => {
        setError(null);
        setSaved(false);
        startTransition(async () => {
            try {
                await guardarPromptGuardConfigAdmin({ enabled, maxMessageLength: maxLen });
                setSaved(true);
                router.refresh();
                setTimeout(() => setSaved(false), 3000);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Error al guardar");
            }
        });
    };

    return (
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50 p-5 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10">
                        <Shield className="h-5 w-5 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-zinc-100">Prompt Guard</h3>
                        <p className="text-xs text-zinc-500">Protección contra inyección de prompts</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:opacity-40"
                >
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? "Guardado" : "Guardar"}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                    <XCircle className="h-4 w-4 shrink-0" />{error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Enable/Disable toggle */}
                <div className="rounded-lg border border-white/[0.06] bg-zinc-950/30 p-4">
                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <p className="text-sm font-medium text-zinc-200">Habilitado</p>
                            <p className="text-xs text-zinc-500">Activar/desactivar la protección</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEnabled(!enabled)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-zinc-700"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </label>
                </div>

                {/* Max message length */}
                <div className="rounded-lg border border-white/[0.06] bg-zinc-950/30 p-4">
                    <label className="block">
                        <p className="text-sm font-medium text-zinc-200 mb-1">Máx. caracteres</p>
                        <input
                            type="number"
                            value={maxLen}
                            onChange={(e) => setMaxLen(Number(e.target.value))}
                            min={100}
                            max={10000}
                            className="w-full rounded-lg border border-white/[0.06] bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 font-mono outline-none focus:border-indigo-500/40"
                        />
                    </label>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-zinc-950/30 p-3">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                    <div>
                        <p className="text-lg font-bold text-zinc-100">{config.blockedPatternsCount}</p>
                        <p className="text-xs text-zinc-500">Patrones bloqueados</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-zinc-950/30 p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                        <p className="text-lg font-bold text-zinc-100">{config.suspiciousPatternsCount}</p>
                        <p className="text-xs text-zinc-500">Patrones sospechosos</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, XCircle, AlertTriangle } from "lucide-react";
import { guardarMaintenanceModeAdmin } from "@/lib/actions/admin/settings";

interface Props {
    initialData: {
        enabled: boolean;
        message: string;
        allowAdmins: boolean;
        estimatedEnd: string | null;
    };
}

export function MaintenanceModeClient({ initialData }: Props) {
    const router = useRouter();
    const [data, setData] = useState(initialData);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const update = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => {
        setData((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        setError(null);
        setSaved(false);
        startTransition(async () => {
            try {
                await guardarMaintenanceModeAdmin(data);
                setSaved(true);
                router.refresh();
                setTimeout(() => setSaved(false), 3000);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Error al guardar");
            }
        });
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${data.enabled ? "border-amber-500/30 bg-amber-500/10" : "border-white/[0.06] bg-[#111a2a]/70"}`}>
                        <AlertTriangle className={`h-5 w-5 ${data.enabled ? "text-amber-400" : "text-zinc-500"}`} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-zinc-100">Modo Mantenimiento</h3>
                        <p className="text-xs text-zinc-500">Mientras esté activo, los usuarios no podrán acceder al sistema</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-500 disabled:opacity-40"
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

            {data.enabled && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="font-medium">¡ATENCIÓN! El modo mantenimiento está ACTIVO. Los usuarios no pueden acceder al sistema.</span>
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-[#0b1220]/80 p-5 space-y-4">
                {/* Enable toggle */}
                <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-zinc-950/30 p-4">
                    <div>
                        <p className="text-sm font-medium text-zinc-200">Activar Mantenimiento</p>
                        <p className="text-xs text-zinc-500">Los usuarios verán la página de mantenimiento</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => update("enabled", !data.enabled)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${data.enabled ? "bg-amber-500" : "bg-zinc-700"}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${data.enabled ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                </div>

                {/* Message */}
                <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1">Mensaje de mantenimiento</label>
                    <textarea
                        value={data.message}
                        onChange={(e) => update("message", e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-white/[0.06] bg-zinc-950/50 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-cyan-500/40 resize-y"
                        placeholder="Mensaje que verán los usuarios..."
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Allow admins */}
                    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-zinc-950/30 p-4">
                        <div>
                            <p className="text-sm font-medium text-zinc-200">Permitir admins</p>
                            <p className="text-xs text-zinc-500">Los admins pueden acceder durante mantenimiento</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => update("allowAdmins", !data.allowAdmins)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${data.allowAdmins ? "bg-emerald-500" : "bg-zinc-700"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${data.allowAdmins ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>

                    {/* Estimated end */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-200 mb-1">Fin estimado</label>
                        <input
                            type="datetime-local"
                            value={data.estimatedEnd ?? ""}
                            onChange={(e) => update("estimatedEnd", e.target.value || null)}
                            className="w-full rounded-lg border border-white/[0.06] bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-cyan-500/40 [color-scheme:dark]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}



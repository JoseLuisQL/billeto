"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, XCircle, Plus, Minus } from "lucide-react";
import { guardarFeatureFlagsAdmin } from "@/lib/actions/admin/settings";

const DEFAULT_FLAGS: Record<string, { label: string; description: string }> = {
    ai_chat_enabled: { label: "Chat IA", description: "Habilitar el asistente de IA para los usuarios" },
    ai_auto_categorize: { label: "Auto-categorización IA", description: "Categorizar transacciones automáticamente con IA" },
    recurring_transactions: { label: "Transacciones Recurrentes", description: "Permitir la creación de transacciones recurrentes" },
    budgets: { label: "Presupuestos", description: "Módulo de presupuestos mensuales" },
    goals: { label: "Metas Financieras", description: "Módulo de metas de ahorro" },
    multi_currency: { label: "Multi-moneda", description: "Soporte para múltiples monedas y conversión FX" },
    csv_import: { label: "Importación CSV", description: "Importar transacciones desde archivos CSV" },
    email_reports: { label: "Reportes por Email", description: "Envío de reportes financieros por correo" },
    dark_mode: { label: "Modo Oscuro", description: "Tema oscuro para la interfaz" },
    notifications: { label: "Notificaciones", description: "Notificaciones push y alertas" },
};

export function FeatureFlagsClient({ initialFlags }: { initialFlags: Record<string, boolean> }) {
    const router = useRouter();
    const [flags, setFlags] = useState<Record<string, boolean>>(() => {
        const merged = { ...initialFlags };
        for (const key of Object.keys(DEFAULT_FLAGS)) {
            if (merged[key] === undefined) merged[key] = true;
        }
        return merged;
    });
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();
    const [newFlagKey, setNewFlagKey] = useState("");

    const toggle = (key: string) => {
        setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
        setSaved(false);
    };

    const addFlag = () => {
        const key = newFlagKey.trim().toLowerCase().replace(/\s+/g, "_");
        if (!key || flags[key] !== undefined) return;
        setFlags((prev) => ({ ...prev, [key]: false }));
        setNewFlagKey("");
    };

    const removeFlag = (key: string) => {
        setFlags((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleSave = () => {
        setError(null);
        setSaved(false);
        startTransition(async () => {
            try {
                await guardarFeatureFlagsAdmin(flags);
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
                <div>
                    <h3 className="text-base font-semibold text-zinc-100">Feature Flags</h3>
                    <p className="text-xs text-zinc-500">Activar o desactivar funcionalidades del sistema</p>
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

            <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-[#0b1220]/80">
                {Object.entries(flags).map(([key, enabled]) => {
                    const meta = DEFAULT_FLAGS[key];
                    return (
                        <div key={key} className="flex items-center justify-between px-5 py-4">
                            <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-zinc-200">{meta?.label ?? key}</p>
                                    {!meta && (
                                        <button type="button" onClick={() => removeFlag(key)} className="text-zinc-600 hover:text-rose-400 transition-colors">
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500">{meta?.description ?? `Flag personalizado: ${key}`}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggle(key)}
                                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-zinc-700"}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Add custom flag */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={newFlagKey}
                    onChange={(e) => setNewFlagKey(e.target.value)}
                    placeholder="nuevo_flag_key"
                    className="flex-1 rounded-lg border border-white/[0.06] bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200 font-mono placeholder:text-zinc-600 outline-none focus:border-cyan-500/40"
                    onKeyDown={(e) => e.key === "Enter" && addFlag()}
                />
                <button
                    type="button"
                    onClick={addFlag}
                    disabled={!newFlagKey.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-[#111a2a]/70 px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200 disabled:opacity-30 transition-colors"
                >
                    <Plus className="h-4 w-4" /> Agregar flag
                </button>
            </div>
        </div>
    );
}



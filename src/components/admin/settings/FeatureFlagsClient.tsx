"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, XCircle, Plus, Minus } from "lucide-react";
import { guardarFeatureFlagsAdmin } from "@/lib/actions/admin/settings";
import { AdminSwitch } from "@/components/admin/shared/AdminSwitch";
import {
    adminInputClass,
    adminPanelClass,
    adminPrimaryButtonClass,
} from "@/components/admin/shared/admin-ui";

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
                    <h3 className="text-base font-semibold text-[color:var(--admin-text)]">Feature Flags</h3>
                    <p className="text-xs text-[color:var(--admin-text-subtle)]">Activar o desactivar funcionalidades del sistema</p>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={pending}
                    className={adminPrimaryButtonClass}
                >
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? "Guardado" : "Guardar"}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-xl border border-[color:var(--admin-danger-soft)] bg-[color:var(--admin-danger-soft)] px-3 py-2 text-sm text-[color:var(--admin-danger)]">
                    <XCircle className="h-4 w-4 shrink-0" />{error}
                </div>
            )}

            <div className={`divide-y divide-[color:var(--admin-border)] ${adminPanelClass}`}>
                {Object.entries(flags).map(([key, enabled]) => {
                    const meta = DEFAULT_FLAGS[key];
                    return (
                        <div key={key} className="flex items-center justify-between px-5 py-4">
                            <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-[color:var(--admin-text)]">{meta?.label ?? key}</p>
                                    {!meta && (
                                        <button type="button" onClick={() => removeFlag(key)} className="text-[color:var(--admin-text-subtle)] transition-colors hover:text-[color:var(--admin-danger)]">
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-[color:var(--admin-text-subtle)]">{meta?.description ?? `Flag personalizado: ${key}`}</p>
                            </div>
                            <AdminSwitch checked={enabled} label={`Cambiar estado de ${meta?.label ?? key}`} onClick={() => toggle(key)} />
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
                    className={`${adminInputClass} flex-1 font-mono`}
                    onKeyDown={(e) => e.key === "Enter" && addFlag()}
                />
                <button
                    type="button"
                    onClick={addFlag}
                    disabled={!newFlagKey.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-3 py-2 text-sm text-[color:var(--admin-text-muted)] transition-colors hover:border-[color:var(--admin-border-strong)] hover:bg-[color:var(--admin-surface)] hover:text-[color:var(--admin-text)] disabled:opacity-30"
                >
                    <Plus className="h-4 w-4" /> Agregar flag
                </button>
            </div>
        </div>
    );
}



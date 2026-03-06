"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, XCircle, Shield, AlertTriangle } from "lucide-react";
import { guardarPromptGuardConfigAdmin } from "@/lib/actions/admin/ai";
import { AdminSwitch } from "@/components/admin/shared/AdminSwitch";
import {
    adminInputClass,
    adminPanelClass,
    adminPrimaryButtonClass,
} from "@/components/admin/shared/admin-ui";

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
        <div className={`${adminPanelClass} space-y-5 p-5`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--admin-danger-soft)] bg-[color:var(--admin-danger-soft)]">
                        <Shield className="h-5 w-5 text-[color:var(--admin-danger)]" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[color:var(--admin-text)]">Prompt Guard</h3>
                        <p className="text-xs text-[color:var(--admin-text-subtle)]">Protección contra inyección de prompts</p>
                    </div>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Enable/Disable toggle */}
                <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[color:var(--admin-text)]">Habilitado</p>
                            <p className="text-xs text-[color:var(--admin-text-subtle)]">Activar o desactivar la protección</p>
                        </div>
                        <AdminSwitch checked={enabled} label="Activar prompt guard" onClick={() => setEnabled(!enabled)} />
                    </div>
                </div>

                {/* Max message length */}
                <div className="rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-4">
                    <label className="block">
                        <p className="mb-1 text-sm font-medium text-[color:var(--admin-text)]">Máx. caracteres</p>
                        <input
                            type="number"
                            value={maxLen}
                            onChange={(e) => setMaxLen(Number(e.target.value))}
                            min={100}
                            max={10000}
                            className={`${adminInputClass} font-mono`}
                        />
                    </label>
                    <p className="mt-2 text-xs text-[color:var(--admin-text-subtle)]">Rango permitido: 100 a 10,000 caracteres por mensaje.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-[color:var(--admin-danger)]" />
                    <div>
                        <p className="text-lg font-bold text-[color:var(--admin-text)]">{config.blockedPatternsCount}</p>
                        <p className="text-xs text-[color:var(--admin-text-subtle)]">Patrones bloqueados</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-[color:var(--admin-warning)]" />
                    <div>
                        <p className="text-lg font-bold text-[color:var(--admin-text)]">{config.suspiciousPatternsCount}</p>
                        <p className="text-xs text-[color:var(--admin-text-subtle)]">Patrones sospechosos</p>
                    </div>
                </div>
            </div>
        </div>
    );
}



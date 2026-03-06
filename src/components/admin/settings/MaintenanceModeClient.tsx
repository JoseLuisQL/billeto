"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, XCircle, AlertTriangle } from "lucide-react";
import { guardarMaintenanceModeAdmin } from "@/lib/actions/admin/settings";
import { AdminSwitch } from "@/components/admin/shared/AdminSwitch";
import {
    adminInputClass,
    adminPanelClass,
    adminPrimaryButtonClass,
} from "@/components/admin/shared/admin-ui";

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
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${data.enabled ? "border-[color:var(--admin-warning-soft)] bg-[color:var(--admin-warning-soft)]" : "border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)]"}`}>
                        <AlertTriangle className={`h-5 w-5 ${data.enabled ? "text-[color:var(--admin-warning)]" : "text-[color:var(--admin-text-subtle)]"}`} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[color:var(--admin-text)]">Modo Mantenimiento</h3>
                        <p className="text-xs text-[color:var(--admin-text-subtle)]">Mientras esté activo, los usuarios no podrán acceder al sistema</p>
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

            {data.enabled && (
                <div className="flex items-center gap-2 rounded-xl border border-[color:var(--admin-warning-soft)] bg-[color:var(--admin-warning-soft)] px-4 py-3 text-sm text-[color:var(--admin-warning)]">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="font-medium">¡ATENCIÓN! El modo mantenimiento está ACTIVO. Los usuarios no pueden acceder al sistema.</span>
                </div>
            )}

            <div className={`${adminPanelClass} space-y-4 p-5`}>
                {/* Enable toggle */}
                <div className="flex items-center justify-between rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-4">
                    <div>
                        <p className="text-sm font-medium text-[color:var(--admin-text)]">Activar Mantenimiento</p>
                        <p className="text-xs text-[color:var(--admin-text-subtle)]">Los usuarios verán la página de mantenimiento</p>
                    </div>
                    <AdminSwitch checked={data.enabled} label="Activar modo mantenimiento" onClick={() => update("enabled", !data.enabled)} />
                </div>

                {/* Message */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-[color:var(--admin-text)]">Mensaje de mantenimiento</label>
                    <textarea
                        value={data.message}
                        onChange={(e) => update("message", e.target.value)}
                        rows={3}
                        className={`${adminInputClass} resize-y p-3`}
                        placeholder="Mensaje que verán los usuarios..."
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Allow admins */}
                    <div className="flex items-center justify-between rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] p-4">
                        <div>
                            <p className="text-sm font-medium text-[color:var(--admin-text)]">Permitir admins</p>
                            <p className="text-xs text-[color:var(--admin-text-subtle)]">Los admins pueden acceder durante mantenimiento</p>
                        </div>
                        <AdminSwitch checked={data.allowAdmins} label="Permitir acceso a administradores" onClick={() => update("allowAdmins", !data.allowAdmins)} />
                    </div>

                    {/* Estimated end */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[color:var(--admin-text)]">Fin estimado</label>
                        <input
                            type="datetime-local"
                            value={data.estimatedEnd ?? ""}
                            onChange={(e) => update("estimatedEnd", e.target.value || null)}
                            className={`${adminInputClass} [color-scheme:dark]`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}



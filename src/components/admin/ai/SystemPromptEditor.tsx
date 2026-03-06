"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, XCircle } from "lucide-react";
import { guardarSystemPromptAdmin } from "@/lib/actions/admin/ai";
import {
    adminInputClass,
    adminPanelClass,
    adminPrimaryButtonClass,
} from "@/components/admin/shared/admin-ui";

export function SystemPromptEditor({ initialPrompt, updatedAt }: { initialPrompt: string; updatedAt: string | null }) {
    const router = useRouter();
    const [prompt, setPrompt] = useState(initialPrompt);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const handleSave = () => {
        setError(null);
        setSaved(false);
        startTransition(async () => {
            try {
                await guardarSystemPromptAdmin(prompt);
                setSaved(true);
                router.refresh();
                setTimeout(() => setSaved(false), 3000);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Error al guardar");
            }
        });
    };

    return (
        <div className={`${adminPanelClass} space-y-4 p-5`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-[color:var(--admin-text)]">System Prompt</h3>
                    <p className="mt-0.5 text-xs text-[color:var(--admin-text-subtle)]">
                        Instrucciones base para el asistente de IA de Billeto
                        {updatedAt && <span className="ml-2">· Última edición: {new Date(updatedAt).toLocaleDateString("es-PE")}</span>}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={pending || prompt === initialPrompt}
                    className={adminPrimaryButtonClass}
                >
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? "Guardado" : pending ? "Guardando..." : "Guardar"}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-xl border border-[color:var(--admin-danger-soft)] bg-[color:var(--admin-danger-soft)] px-3 py-2 text-sm text-[color:var(--admin-danger)]">
                    <XCircle className="h-4 w-4 shrink-0" />{error}
                </div>
            )}

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={16}
                className={`${adminInputClass} resize-y p-4 font-mono leading-relaxed`}
                placeholder="Escribe el system prompt del asistente de IA aquí..."
            />

            <div className="flex items-center justify-between text-xs text-[color:var(--admin-text-subtle)]">
                <span>{prompt.length} caracteres</span>
                <span className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${prompt !== initialPrompt ? "bg-[color:var(--admin-warning)]" : "bg-[color:var(--admin-success)]"}`} />
                    {prompt !== initialPrompt ? "Sin guardar" : "Guardado"}
                </span>
            </div>
        </div>
    );
}



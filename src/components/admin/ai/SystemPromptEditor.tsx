"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, XCircle } from "lucide-react";
import { guardarSystemPromptAdmin } from "@/lib/actions/admin/ai";

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
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-zinc-100">System Prompt</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Instrucciones base para el asistente de IA de Billeto
                        {updatedAt && <span className="ml-2">· Última edición: {new Date(updatedAt).toLocaleDateString("es-PE")}</span>}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={pending || prompt === initialPrompt}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none"
                >
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? "Guardado" : pending ? "Guardando..." : "Guardar"}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                    <XCircle className="h-4 w-4 shrink-0" />{error}
                </div>
            )}

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={16}
                className="w-full rounded-lg border border-white/[0.06] bg-zinc-950/50 p-4 text-sm leading-relaxed text-zinc-200 font-mono placeholder:text-zinc-600 outline-none transition-colors focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 resize-y"
                placeholder="Escribe el system prompt del asistente de IA aquí..."
            />

            <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>{prompt.length} caracteres</span>
                <span className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${prompt !== initialPrompt ? "bg-amber-400" : "bg-emerald-400"}`} />
                    {prompt !== initialPrompt ? "Sin guardar" : "Guardado"}
                </span>
            </div>
        </div>
    );
}

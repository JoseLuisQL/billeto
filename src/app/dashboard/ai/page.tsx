"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Send, Bot, User, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { useRef, useEffect, useState, useMemo } from "react";
import { useToast } from "@/components/ui/toast";

/**
 * Página del Asistente IA — Chat con tool-calling.
 * Usa Vercel AI SDK v6 useChat hook para streaming.
 */

const quickSuggestions = [
    "¿Cuánto gasté este mes?",
    "Registra un gasto de S/30 en almuerzo",
    "¿Cuáles son mis cuentas y balances?",
    "¿En qué categoría gasté más?",
    "Mostrame mis últimos 5 gastos",
    "¿Cuál fue mi balance del mes pasado?",
];

export default function AIAssistantPage() {
    const { toast } = useToast();
    const transport = useMemo(() => new TextStreamChatTransport({ api: "/api/ai/chat" }), []);
    const { messages, sendMessage, status } = useChat({ transport });
    const [inputValue, setInputValue] = useState("");
    const [lastPrompt, setLastPrompt] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isLoading = status === "streaming" || status === "submitted";

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const submitPrompt = async (text: string) => {
        if (!text.trim() || isLoading) return;
        try {
            setLastPrompt(text);
            await sendMessage({ text });
        } catch {
            toast({
                title: "No se pudo enviar el mensaje",
                description: "Hubo un problema temporal con el chat. Probá nuevamente.",
                variant: "error",
            });
        }
    };

    useEffect(() => {
        if (status === "error") {
            toast({
                title: "El chat se interrumpió",
                description: "Reintentá el último mensaje o escribí uno nuevo.",
                variant: "error",
            });
        }
    }, [status, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        const text = inputValue.trim();
        setInputValue("");
        await submitPrompt(text);
    };

    const handleQuickAction = async (text: string) => {
        setInputValue("");
        await submitPrompt(text);
    };

    const handleRetry = async () => {
        if (!lastPrompt || isLoading) return;
        await submitPrompt(lastPrompt);
    };

    return (
        <div className="flex min-h-screen bg-zinc-950">
            <DashboardSidebar user={{ id: "", name: "Usuario", email: "" }} />
            <main className="flex-1 ml-64 flex flex-col h-screen">
                {/* Header */}
                <div className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-sm px-8 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-zinc-950" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-white">Asistente Billeto</h1>
                        <p className="text-xs text-muted-foreground">
                            IA financiera con herramientas xMCP
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="w-3 h-3 text-lime-400" />
                        Gemini 2.0 Flash
                        {lastPrompt && (
                            <button
                                onClick={handleRetry}
                                disabled={isLoading}
                                className="ml-2 inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] hover:bg-white/5 disabled:opacity-50"
                            >
                                <RotateCcw className="w-3 h-3" /> Reintentar
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                    {status === "error" && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            El chat se interrumpió inesperadamente. Podés reintentar el último mensaje.
                        </div>
                    )}
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-400/20 to-emerald-500/20 border border-lime-400/20 flex items-center justify-center mb-6">
                                <Bot className="w-8 h-8 text-lime-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-2">¡Hola! Soy Billeto</h2>
                            <p className="text-muted-foreground text-sm mb-8 text-center max-w-md">
                                Tu asistente financiero con IA. Puedo registrar gastos, consultar balances, analizar tus finanzas y más.
                            </p>
                            <div className="grid grid-cols-2 gap-3 max-w-lg">
                                {quickSuggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleQuickAction(s)}
                                        className="text-left text-sm px-4 py-3 rounded-xl border border-white/10 bg-zinc-900/50 text-muted-foreground hover:text-white hover:border-lime-400/30 hover:bg-lime-400/5 transition-all"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-emerald-500 flex-shrink-0 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-zinc-950" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-lime-400/10 text-lime-100 border border-lime-400/20"
                                        : "bg-zinc-800/60 text-zinc-200 border border-white/5"
                                        }`}
                                >
                                    {/* Render parts if present */}
                                    {msg.parts?.map((part: { type: string; text?: string; toolInvocation?: { toolName: string; state: string; result?: unknown } }, idx: number) => {
                                        if (part.type === "text") {
                                            return (
                                                <div key={idx} className="whitespace-pre-wrap">
                                                    {part.text}
                                                </div>
                                            );
                                        }
                                        if (part.type === "tool-invocation" && part.toolInvocation) {
                                            return (
                                                <div
                                                    key={idx}
                                                    className="my-2 rounded-lg bg-zinc-900/80 border border-white/10 p-3 text-xs"
                                                >
                                                    <div className="flex items-center gap-2 mb-1 text-lime-400">
                                                        <Sparkles className="w-3 h-3" />
                                                        <span className="font-medium">
                                                            {part.toolInvocation.toolName}
                                                        </span>
                                                        {part.toolInvocation.state === "result" ? (
                                                            <span className="text-emerald-400 ml-auto">✓</span>
                                                        ) : (
                                                            <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                                                        )}
                                                    </div>
                                                    {part.toolInvocation.state === "result" && (
                                                        <pre className="text-zinc-400 mt-1 overflow-x-auto">
                                                            {typeof part.toolInvocation.result === "string"
                                                                ? part.toolInvocation.result
                                                                : JSON.stringify(part.toolInvocation.result, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-lg bg-zinc-700 flex-shrink-0 flex items-center justify-center">
                                        <User className="w-4 h-4 text-zinc-300" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {isLoading && messages.length > 0 && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-emerald-500 flex-shrink-0 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-zinc-950" />
                            </div>
                            <div className="rounded-2xl px-4 py-3 bg-zinc-800/60 border border-white/5">
                                <Loader2 className="w-4 h-4 animate-spin text-lime-400" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-white/10 bg-zinc-900/50 backdrop-blur-sm px-8 py-4">
                    <form
                        id="chat-form"
                        onSubmit={handleSubmit}
                        className="flex items-center gap-3 max-w-3xl mx-auto"
                    >
                        <input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Escribe tu mensaje... ej: 'Gasté 50 en café'"
                            className="flex-1 bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-lime-400/30 focus:border-lime-400/30 transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            className="p-3 rounded-xl bg-lime-400 text-zinc-950 hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                        Billeto puede cometer errores. Verificá las transacciones creadas.
                    </p>
                </div>
            </main>
        </div>
    );
}

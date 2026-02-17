"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, Loader2, Sparkles, Plus, CheckCircle2, Copy } from "lucide-react";
import Link from "next/link";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/components/ui/toast";

const STORAGE_KEY = "billeto-chat-messages";

function loadStoredMessages(): UIMessage[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveMessages(messages: UIMessage[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch { /* quota exceeded */ }
}

const quickSuggestions = [
    "¿Cuánto gasté este mes?",
    "Analiza mis gastos por categoría",
    "Registra un gasto de S/30 en almuerzo",
    "¿Cuáles son mis cuentas y balances?",
];

type SummaryCard = {
    title?: string;
    id?: string;
    amount?: string;
    description?: string;
    category?: string;
    account?: string;
    date?: string;
    transactionType?: string;
};

type ToolResult = {
    success?: boolean;
    summaryCard?: SummaryCard;
    [key: string]: unknown;
};

function TransactionCard({ card }: { card: SummaryCard }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = [
            card.title || "Transaccion Registrada",
            card.id ? `ID: ${card.id}` : "",
            card.amount ? `Monto: ${card.amount}` : "",
            card.description ? `Descripcion: ${card.description}` : "",
            card.category ? `Categoria: ${card.category}` : "",
            card.account ? `Cuenta: ${card.account}` : "",
            card.date ? `Fecha: ${card.date}` : "",
            card.transactionType ? `Tipo: ${card.transactionType}` : "",
        ].filter(Boolean).join("\n");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80">
            <div className="space-y-1.5 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {card.title || "Transaccion Registrada"}
                </div>
                {card.id && (
                    <div className="text-zinc-400">
                        <span className="text-amber-400/80">&#9889;</span> ID: {card.id.slice(-6)}
                    </div>
                )}
                {card.amount && (
                    <div className="text-zinc-400">
                        <span className="text-amber-400/80">&#128176;</span> Monto: <span className="text-zinc-200">{card.amount}</span>
                    </div>
                )}
                {card.description && (
                    <div className="text-zinc-400">
                        <span className="text-amber-400/80">&#128221;</span> Descripcion: <span className="text-zinc-200">{card.description}</span>
                    </div>
                )}
                {card.category && (
                    <div className="text-zinc-400">
                        <span className="text-amber-400/80">&#127991;&#65039;</span> Categoria: <span className="text-zinc-200">{card.category}</span>
                    </div>
                )}
                {card.account && (
                    <div className="text-zinc-400">
                        <span className="text-amber-400/80">&#127974;</span> Cuenta: <span className="text-zinc-200">{card.account}</span>
                    </div>
                )}
                {card.date && (
                    <div className="text-zinc-400">
                        <span className="text-amber-400/80">&#128197;</span> Fecha: <span className="text-zinc-200">{card.date}</span>
                    </div>
                )}
                {card.transactionType && (
                    <div className="text-zinc-400">
                        <span className="text-amber-400/80">&#128203;</span> Tipo: <span className="text-zinc-200">{card.transactionType}</span>
                    </div>
                )}
            </div>
            <div className="border-t border-white/5 px-4 py-2 flex items-center justify-between">
                <Link
                    href="/dashboard/transactions"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-400/20"
                >
                    <Sparkles className="h-3 w-3" />
                    Transaccion Registrada
                </Link>
                <button
                    onClick={handleCopy}
                    className="p-1 text-zinc-600 transition-colors hover:text-zinc-400"
                    title="Copiar"
                >
                    <Copy className="h-3.5 w-3.5" />
                    {copied && <span className="ml-1 text-xs text-emerald-400">Copiado</span>}
                </button>
            </div>
        </div>
    );
}

function renderToolResult(result: unknown) {
    if (!result || typeof result !== "object") return null;
    const r = result as ToolResult;

    if (r.success && r.summaryCard) {
        return <TransactionCard card={r.summaryCard} />;
    }

    return null;
}

export default function AIAssistantPage() {
    const { toast } = useToast();
    const [storedMessages] = useState<UIMessage[]>(() => loadStoredMessages());
    const transport = useMemo(() => new DefaultChatTransport({ api: "/api/ai/chat" }), []);
    const { messages, sendMessage, setMessages, status } = useChat({
        transport,
        messages: storedMessages,
    });
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const isLoading = status === "streaming" || status === "submitted";

    useEffect(() => {
        if (messages.length > 0) saveMessages(messages);
    }, [messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleClearChat = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setMessages([]);
        setInputValue("");
    }, [setMessages]);

    const submitPrompt = async (text: string) => {
        if (!text.trim() || isLoading) return;
        try {
            await sendMessage({ text });
        } catch {
            toast({
                title: "No se pudo enviar el mensaje",
                description: "Hubo un problema temporal con el chat. Proba nuevamente.",
                variant: "error",
            });
        }
    };

    useEffect(() => {
        if (status === "error") {
            toast({
                title: "El chat se interrumpio",
                description: "Reintenta el ultimo mensaje o escribe uno nuevo.",
                variant: "error",
            });
        }
    }, [status, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        const text = inputValue.trim();
        setInputValue("");
        if (inputRef.current) inputRef.current.style.height = "auto";
        await submitPrompt(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        const el = e.target;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 160) + "px";
    };

    const handleQuickAction = async (text: string) => {
        setInputValue("");
        await submitPrompt(text);
    };

    return (
        <main className="flex h-[calc(100vh-3.5rem)] flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-4">
                        <h2 className="mb-6 text-xl font-medium text-zinc-400">
                            Bienvenido a <span className="font-semibold text-lime-400">Billeto</span>
                        </h2>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {quickSuggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickAction(s)}
                                    className="rounded-full border border-white/10 bg-zinc-800/60 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-200"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-lime-400/15">
                                        <Bot className="h-3.5 w-3.5 text-lime-400" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                        msg.role === "user"
                                            ? "bg-zinc-800 text-zinc-100"
                                            : "text-zinc-300"
                                    }`}
                                >
                                    {(() => {
                                        const parts = (msg.parts || []) as Array<{ type: string; text?: string; state?: string; output?: unknown; toolName?: string; toolCallId?: string }>;
                                        const hasSuccessCard = parts.some((p) => {
                                            const isTool = p.type.startsWith("tool-") || p.type === "dynamic-tool";
                                            if (!isTool || p.state !== "output-available" || !p.output) return false;
                                            const r = p.output as ToolResult;
                                            return r.success && r.summaryCard;
                                        });

                                        return parts.map((p, idx) => {
                                            if (p.type === "text" && p.text?.trim()) {
                                                if (hasSuccessCard) return null;
                                                return (
                                                    <div key={idx} className="whitespace-pre-wrap">
                                                        {p.text}
                                                    </div>
                                                );
                                            }

                                            const isToolPart = p.type.startsWith("tool-") || p.type === "dynamic-tool";
                                            if (isToolPart) {
                                                const toolName = p.type === "dynamic-tool"
                                                    ? (p.toolName || "tool")
                                                    : p.type.slice(5);

                                                if (p.state === "output-available" && p.output) {
                                                    const card = renderToolResult(p.output);
                                                    if (card) return <div key={idx} className="relative">{card}</div>;

                                                    return (
                                                        <div key={idx} className="my-2 flex items-center gap-2 rounded-lg border border-white/5 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-500">
                                                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                                            <span>{toolName}</span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={idx} className="my-2 flex items-center gap-2 rounded-lg border border-white/5 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-500">
                                                        <Loader2 className="h-3 w-3 animate-spin text-lime-400" />
                                                        <span>{toolName}</span>
                                                    </div>
                                                );
                                            }

                                            return null;
                                        });
                                    })()}
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length - 1]?.role === "user" && (
                            <div className="flex gap-3">
                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-lime-400/15">
                                    <Bot className="h-3.5 w-3.5 text-lime-400" />
                                </div>
                                <div className="py-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="px-4 pb-4 pt-2">
                <div className="relative mx-auto max-w-3xl">
                    <form onSubmit={handleSubmit}>
                        <div className="relative rounded-2xl border border-white/10 bg-zinc-800/50">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={handleTextareaInput}
                                onKeyDown={handleKeyDown}
                                placeholder="Pregunta sobre tus finanzas... (ej: ¿Cuanto gaste este mes?)"
                                rows={1}
                                disabled={isLoading}
                                className="w-full resize-none bg-transparent px-4 py-3.5 pr-24 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50"
                            />
                            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                                {messages.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearChat}
                                        disabled={isLoading}
                                        title="Nueva conversacion"
                                        className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/5 hover:text-zinc-400 disabled:opacity-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={isLoading || !inputValue.trim()}
                                    className="rounded-lg bg-lime-400/90 p-1.5 text-zinc-950 transition-colors hover:bg-lime-400 disabled:opacity-30 disabled:hover:bg-lime-400/90"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}

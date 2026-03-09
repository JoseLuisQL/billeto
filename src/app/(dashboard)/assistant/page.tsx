"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
    Send,
    Bot,
    Loader2,
    Sparkles,
    Plus,
    CheckCircle2,
    Copy,
    ShieldAlert,
    Paperclip,
    FileText,
    Image as ImageIcon,
    X,
    Download,
} from "lucide-react";
import Link from "next/link";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import {
    ASSISTANT_DOCUMENT_MAX_FILE_SIZE_BYTES,
    ASSISTANT_DOCUMENT_SUPPORTED_MIME_TYPES,
} from "@/lib/assistant-documents-config";

const STORAGE_KEY = "billeto-chat-messages";
type AssistantDataParts = {
    transaction_summary: SummaryCard;
};
type AssistantMessage = UIMessage<unknown, AssistantDataParts>;

function loadStoredMessages(): AssistantMessage[] {
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

function saveMessages(messages: AssistantMessage[]) {
    try {
        const compacted = messages.map((message) => ({
            ...message,
            parts: ((message.parts || []) as Array<{ type: string; text?: string; filename?: string; mediaType?: string }>).map((part) => {
                if (part.type !== "file") return part;
                return {
                    type: "text",
                    text: `[Archivo procesado: ${part.filename || "adjunto"}${part.mediaType ? ` · ${part.mediaType}` : ""}]`,
                };
            }),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compacted));
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

type AttachmentPreview = {
    id: string;
    file: File;
    previewUrl: string;
};

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildFileList(files: File[]) {
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    return transfer.files;
}

function extractFirstSupportedFile(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    return files.find((file) => isDocumentMimeType(file.type)) || null;
}

function isDocumentMimeType(mimeType: string) {
    return ASSISTANT_DOCUMENT_SUPPORTED_MIME_TYPES.includes(
        mimeType as (typeof ASSISTANT_DOCUMENT_SUPPORTED_MIME_TYPES)[number]
    );
}

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
                    href="/transactions"
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

const SECURITY_BLOCK_MARKER = "Solo puedo ayudarte con tus finanzas en Billeto";

function isSecurityBlockedMessage(text: string): boolean {
    return text.includes(SECURITY_BLOCK_MARKER);
}

function SecurityAlertCard() {
    return (
        <div className="my-2 overflow-hidden rounded-xl border border-amber-500/30 bg-amber-950/20">
            <div className="space-y-2 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-amber-400">
                    <ShieldAlert className="h-4 w-4" />
                    Por motivos de seguridad
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                    Este tipo de solicitud ha sido bloqueada por nuestro sistema de seguridad.
                    Solo puedo ayudarte con tus finanzas en Billeto: registrar gastos, consultar balances y analizar tus movimientos.
                </p>
            </div>
        </div>
    );
}

function FilePartCard({ filename, mediaType, url }: { filename?: string; mediaType?: string; url?: string }) {
    const isImage = (mediaType || "").startsWith("image/");

    return (
        <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            {isImage && url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={filename || "Adjunto"} className="max-h-56 w-full object-cover" />
            ) : null}
            <div className="flex items-center gap-3 px-4 py-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isImage ? "bg-lime-400/10 text-lime-300" : "bg-sky-400/10 text-sky-300"}`}>
                    {isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-100">{filename || "Archivo adjunto"}</div>
                    <div className="truncate text-xs text-zinc-500">{mediaType || "Archivo"}</div>
                </div>
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
    const [storedMessages] = useState<AssistantMessage[]>(() => loadStoredMessages());
    const transport = useMemo(() => new DefaultChatTransport({ api: "/api/ai/chat" }), []);
    const { messages, sendMessage, setMessages, status } = useChat<AssistantMessage>({
        transport,
        messages: storedMessages,
    });
    const [inputValue, setInputValue] = useState("");
    const [pendingFiles, setPendingFiles] = useState<AttachmentPreview[]>([]);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragDepthRef = useRef(0);
    const isLoading = status === "streaming" || status === "submitted";

    useEffect(() => {
        if (messages.length > 0) saveMessages(messages);
    }, [messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        return () => {
            pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        };
    }, [pendingFiles]);

    useEffect(() => {
        if (status !== "ready") return;

        setMessages((current) => {
            let changed = false;
            const compacted = current.map((message) => {
                const parts = (message.parts || []) as Array<{ type: string; text?: string; filename?: string; mediaType?: string }>;
                if (!parts.some((part) => part.type === "file")) return message;
                changed = true;
                return {
                    ...message,
                    parts: parts.map((part) => {
                        if (part.type !== "file") return part;
                        return {
                            type: "text",
                            text: `[Archivo procesado: ${part.filename || "adjunto"}${part.mediaType ? ` · ${part.mediaType}` : ""}]`,
                        };
                    }),
                };
            });

            return changed ? (compacted as AssistantMessage[]) : current;
        });
    }, [setMessages, status]);

    const handleClearChat = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setMessages([]);
        setInputValue("");
        setPendingFiles((current) => {
            current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
            return [];
        });
    }, [setMessages]);

    const submitPrompt = async (text: string) => {
        const files = pendingFiles.map((item) => item.file);
        if ((!text.trim() && files.length === 0) || isLoading) return;
        try {
            const fileList = files.length > 0 ? buildFileList(files) : undefined;
            await sendMessage(
                text.trim()
                    ? { text: text.trim(), files: fileList }
                    : { files: fileList! }
            );
            setPendingFiles((current) => {
                current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                return [];
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
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
        if ((!inputValue.trim() && pendingFiles.length === 0) || isLoading) return;
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

    const removePendingFile = (id: string) => {
        setPendingFiles((current) => {
            const next = current.filter((item) => item.id !== id);
            const removed = current.find((item) => item.id === id);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            return next;
        });
    };

    const notifySingleFileLimit = useCallback(() => {
        toast({
            title: "Se usará un solo archivo",
            description: "Por ahora el asistente analiza un comprobante por envío. Tomé el primero válido.",
            variant: "info",
        });
    }, [toast]);

    const notifyUnsupportedFiles = useCallback(() => {
        toast({
            title: "No encontré un archivo compatible",
            description: "Usa un PDF, JPG, PNG o WEBP.",
            variant: "error",
        });
    }, [toast]);

    const attachFile = useCallback((file: File | null, source: "picker" | "paste" | "drop") => {
        if (!file) return;

        if (!isDocumentMimeType(file.type)) {
            toast({
                title: "Tipo de archivo no soportado",
                description: source === "paste" ? "Pega una imagen o arrastra/sube un PDF, JPG, PNG o WEBP." : "Sube un PDF, JPG, PNG o WEBP.",
                variant: "error",
            });
            return;
        }

        if (file.size > ASSISTANT_DOCUMENT_MAX_FILE_SIZE_BYTES) {
            toast({
                title: "Archivo demasiado grande",
                description: `El archivo supera ${(ASSISTANT_DOCUMENT_MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB.`,
                variant: "error",
            });
            return;
        }

        setPendingFiles((current) => {
            current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
            return [{
                id: crypto.randomUUID(),
                file,
                previewUrl: URL.createObjectURL(file),
            }];
        });
        setIsDraggingFile(false);
    }, [toast]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        attachFile(extractFirstSupportedFile(e.target.files || []), "picker");
        e.target.value = "";
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const files = e.clipboardData.files;
        if (!files || files.length === 0) return;

        if (files.length > 1) {
            notifySingleFileLimit();
        }

        const file = extractFirstSupportedFile(files);
        if (!file) {
            notifyUnsupportedFiles();
            return;
        }

        e.preventDefault();
        attachFile(file, "paste");
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        dragDepthRef.current += 1;
        setIsDraggingFile(true);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setIsDraggingFile(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) {
            setIsDraggingFile(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
        e.preventDefault();
        dragDepthRef.current = 0;
        setIsDraggingFile(false);
        if (e.dataTransfer.files.length > 1) {
            notifySingleFileLimit();
        }

        const file = extractFirstSupportedFile(e.dataTransfer.files);
        if (!file) {
            notifyUnsupportedFiles();
            return;
        }

        attachFile(file, "drop");
    };

    return (
        <main className="flex h-[calc(100vh-3.5rem)] flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-4">
                        <h2 className="mb-3 text-xl font-medium text-zinc-400">
                            Bienvenido a <span className="font-semibold text-lime-400">Billeto</span>
                        </h2>
                        <p className="mb-6 max-w-xl text-center text-sm leading-relaxed text-zinc-500">
                            Puedes chatear con tus finanzas o subir un ticket, factura o comprobante en PDF o imagen para que el asistente lo analice y lo registre.
                        </p>
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
                                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                                            ? "bg-zinc-800 text-zinc-100"
                                            : "text-zinc-300"
                                        }`}
                                >
                                    {(() => {
                                        const parts = (msg.parts || []) as Array<{
                                            type: string;
                                            text?: string;
                                            state?: string;
                                            output?: unknown;
                                            toolName?: string;
                                            toolCallId?: string;
                                            url?: string;
                                            mediaType?: string;
                                            filename?: string;
                                            data?: unknown;
                                        }>;
                                        const hasSuccessCard = parts.some((p) => {
                                            const isTool = p.type.startsWith("tool-") || p.type === "dynamic-tool";
                                            if (!isTool || p.state !== "output-available" || !p.output) return false;
                                            const r = p.output as ToolResult;
                                            return r.success && r.summaryCard;
                                        });

                                        return parts.map((p, idx) => {
                                            if (p.type === "text" && p.text?.trim()) {
                                                if (hasSuccessCard) return null;
                                                if (isSecurityBlockedMessage(p.text)) {
                                                    return <SecurityAlertCard key={idx} />;
                                                }
                                                return (
                                                    <div key={idx} className="whitespace-pre-wrap">
                                                        {p.text}
                                                    </div>
                                                );
                                            }

                                            if (p.type === "file") {
                                                return (
                                                    <FilePartCard
                                                        key={idx}
                                                        filename={p.filename}
                                                        mediaType={p.mediaType}
                                                        url={p.url}
                                                    />
                                                );
                                            }

                                            if (p.type === "data-transaction_summary" && "data" in p && p.data) {
                                                return <TransactionCard key={idx} card={p.data as SummaryCard} />;
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
                        <div
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative min-h-[118px] overflow-hidden rounded-[28px] border bg-[radial-gradient(circle_at_top_left,rgba(163,230,53,0.14),transparent_32%),linear-gradient(180deg,rgba(39,39,42,0.92),rgba(24,24,27,0.96))] shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition-all duration-200 ${
                                isDraggingFile
                                    ? "min-h-[220px] border-lime-300/70 shadow-[0_22px_80px_rgba(163,230,53,0.16)]"
                                    : "border-white/10"
                            }`}
                        >
                            {isDraggingFile && (
                                <div className="absolute inset-0 z-10 p-3 sm:p-4">
                                    <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-lime-300/35 bg-[radial-gradient(circle_at_top,rgba(163,230,53,0.16),rgba(9,9,11,0.82)_52%),linear-gradient(135deg,rgba(24,24,27,0.94),rgba(9,9,11,0.96))] px-4 py-5 backdrop-blur-sm sm:px-8">
                                        <div className="flex w-full max-w-[620px] flex-col items-center gap-4 text-center">
                                            <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] border border-lime-300/20 bg-lime-300/10 text-lime-300 shadow-[0_14px_38px_rgba(163,230,53,0.16)]">
                                                <Download className="h-7 w-7 rotate-180" />
                                                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(163,230,53,0.8)]" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-[clamp(1.05rem,1.6vw,1.45rem)] font-semibold tracking-tight text-zinc-50">
                                                    Suelta tu comprobante aquí
                                                </div>
                                                <div className="mx-auto max-w-[34rem] text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
                                                    Arrastra una imagen o un PDF al compositor para analizarlo de inmediato. También puedes pegar capturas con <span className="font-medium text-zinc-200">Ctrl+V</span>.
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200">PDF, JPG, PNG, WEBP</span>
                                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200">1 archivo por envío</span>
                                                <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-xs font-medium text-lime-200">hasta {(ASSISTANT_DOCUMENT_MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {pendingFiles.length > 0 && (
                                <div className="border-b border-white/10 px-4 py-3">
                                    {pendingFiles.map((item) => {
                                        const isImage = item.file.type.startsWith("image/");
                                        return (
                                            <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                                                <div className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl ${isImage ? "bg-lime-400/10 text-lime-300" : "bg-sky-400/10 text-sky-300"}`}>
                                                    {isImage ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <FileText className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-medium text-zinc-100">{item.file.name}</div>
                                                    <div className="truncate text-xs text-zinc-500">
                                                        {item.file.type || "Archivo"} · {formatBytes(item.file.size)}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removePendingFile(item.id)}
                                                    className="rounded-xl border border-white/10 p-2 text-zinc-500 transition-colors hover:border-white/20 hover:text-zinc-200"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="relative">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={handleTextareaInput}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                placeholder="Pregunta sobre tus finanzas o acompaña el archivo con contexto..."
                                rows={1}
                                disabled={isLoading}
                                className="w-full resize-none bg-transparent px-4 py-4 pr-32 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50"
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleFileInput}
                            />
                            <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
                                    >
                                        <Paperclip className="h-3.5 w-3.5" />
                                        Adjuntar PDF o imagen
                                    </button>
                                    <span className="hidden sm:inline">Pega imágenes con Ctrl+V o arrastra aquí</span>
                                    <span className="hidden lg:inline">· 1 archivo por envío · max {(ASSISTANT_DOCUMENT_MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB</span>
                                </div>
                                <div className="flex items-center gap-1.5">
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
                                    disabled={isLoading || (!inputValue.trim() && pendingFiles.length === 0)}
                                    className="rounded-lg bg-lime-400/90 p-1.5 text-zinc-950 transition-colors hover:bg-lime-400 disabled:opacity-30 disabled:hover:bg-lime-400/90"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}

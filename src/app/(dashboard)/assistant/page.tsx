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
    AtSign,
    Coins,
    Search,
    Tags,
    Wallet,
    PiggyBank,
    ArrowRightLeft,
    ChevronLeft,
    Check,
} from "lucide-react";
import Link from "next/link";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/ui/toast";
import {
    ASSISTANT_DOCUMENT_MAX_FILE_SIZE_BYTES,
    ASSISTANT_DOCUMENT_SUPPORTED_MIME_TYPES,
} from "@/lib/assistant-documents-config";
import { listarCategorias } from "@/lib/actions/categories";
import { listarCuentas } from "@/lib/actions/accounts";
import { listarPresupuestos } from "@/lib/actions/budgets";
import { listarTransacciones } from "@/lib/actions/transactions";
import { obtenerPerfil } from "@/lib/actions/profile";
import { currencies, type Currency } from "@/lib/currencies";
import type {
    AssistantDataParts,
    AssistantMessageMetadata,
    ChatSuggestion,
    DocumentReviewCard,
    TransactionSummaryCard,
} from "@/types/assistant-chat";

const STORAGE_KEY = "billeto-chat-messages";
type AssistantMessage = UIMessage<AssistantMessageMetadata, AssistantDataParts>;

function loadStoredMessages(): AssistantMessage[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.map((message) => ({
            ...message,
            parts: Array.isArray(message.parts)
                ? message.parts.map((part: Record<string, unknown>) => {
                    if (part.type !== "data-transaction_summary" || typeof part.data !== "object" || !part.data) {
                        return part;
                    }

                    const data = part.data as Record<string, unknown>;
                    const id = typeof data.id === "string" ? data.id : undefined;
                    const displayId = typeof data.displayId === "string" ? data.displayId : undefined;
                    const normalizedVisibleId =
                        displayId ||
                        (id && /^\d+$/.test(id) ? id : undefined);

                    return {
                        ...part,
                        data: {
                            ...data,
                            id: normalizedVisibleId,
                            displayId: normalizedVisibleId,
                        },
                    };
                })
                : [],
        }));
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

type SummaryCard = TransactionSummaryCard;

type ToolResult = {
    success?: boolean;
    summaryCard?: SummaryCard;
    transaction?: {
        displayId?: string | number;
        id?: string;
    };
    needs_confirmation?: boolean;
    message?: string;
    options?: string[];
    [key: string]: unknown;
};

type AttachmentPreview = {
    id: string;
    file: File;
    previewUrl: string;
};

type CategoryResource = {
    id: string;
    name: string;
    icon?: string | null;
    type?: string;
};

type AccountResource = {
    id: string;
    name: string;
    currency?: string;
    icon?: string | null;
};

type BudgetResource = {
    id: string;
    name: string;
    currency?: string;
};

type TransactionResource = {
    id: string;
    description: string;
    type?: string;
    date?: string;
};

type PaletteMode = "entities" | "currency" | null;
type EntitySection = "root" | "categories" | "accounts" | "budgets" | "transactions";

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

function getVisibleTransactionId(card: SummaryCard) {
    const displayId = typeof card.displayId === "string" && /^\d+$/.test(card.displayId) ? card.displayId : null;
    if (displayId) return displayId;

    const id = typeof card.id === "string" && /^\d+$/.test(card.id) ? card.id : null;
    return id;
}

function extractFirstSupportedFile(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    return files.find((file) => isDocumentMimeType(file.type)) || null;
}

function normalizeSearch(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function insertTextAtEnd(current: string, value: string) {
    const trimmed = current.trim();
    return trimmed.length === 0 ? `${value} ` : `${trimmed} ${value} `;
}

function isDocumentMimeType(mimeType: string) {
    return ASSISTANT_DOCUMENT_SUPPORTED_MIME_TYPES.includes(
        mimeType as (typeof ASSISTANT_DOCUMENT_SUPPORTED_MIME_TYPES)[number]
    );
}

function TransactionCard({ card }: { card: SummaryCard }) {
    const [copied, setCopied] = useState(false);
    const visibleId = getVisibleTransactionId(card);

    const handleCopy = () => {
        const text = [
            card.title || "Transaccion Registrada",
            visibleId ? `ID: ${visibleId}` : "",
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
                {visibleId && (
                    <div className="text-zinc-400">
                        <span className="text-amber-400/80">&#9889;</span> ID: {visibleId}
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

function cleanAssistantLine(value: string) {
    return value
        .replace(/^[-*•]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .trim();
}

function AssistantTextBlock({ text }: { text: string }) {
    const lines = text
        .split("\n")
        .map((line) => line.replace(/\r/g, ""))
        .filter((line) => line.trim().length > 0);

    const bulletLines = lines.filter((line) => /^[-*•]\s+/.test(line.trim()) || /^\d+\.\s+/.test(line.trim()));
    const hasList = bulletLines.length > 0;

    if (!hasList) {
        return <div className="whitespace-pre-wrap">{cleanAssistantLine(text)}</div>;
    }

    return (
        <div className="space-y-3">
            {lines
                .filter((line) => !/^[-*•]\s+/.test(line.trim()) && !/^\d+\.\s+/.test(line.trim()))
                .map((line, index) => (
                    <div key={`p-${index}`} className="leading-relaxed text-zinc-200">
                        {cleanAssistantLine(line)}
                    </div>
                ))}
            <div className="space-y-2">
                {bulletLines.map((line, index) => (
                    <div key={`b-${index}`} className="flex items-start gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-lime-300/80" />
                        <span className="flex-1 leading-relaxed text-zinc-200">{cleanAssistantLine(line)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AssistantLoadingState({ mode = "chat" }: { mode?: "chat" | "document" }) {
    const title = mode === "document" ? "Analizando comprobante" : "Preparando respuesta";
    const subtitle = mode === "document"
        ? "Extrayendo monto, fecha y categoría"
        : "Revisando tu contexto financiero";

    return (
        <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-lime-300/15 bg-lime-400/12 shadow-[0_10px_24px_rgba(163,230,53,0.12)]">
                <Bot className="h-3.5 w-3.5 text-lime-400" />
            </div>
            <div className="overflow-hidden rounded-xl border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,22,0.88),rgba(9,9,12,0.82))] shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-lime-300/12 bg-lime-300/10">
                        <div className="absolute inset-0 rounded-2xl bg-lime-300/8 animate-ping" />
                        <Loader2 className="relative h-4.5 w-4.5 animate-spin text-lime-300" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-100">{title}</div>
                        <div className="mt-0.5 text-xs text-zinc-500">{subtitle}</div>
                    </div>
                </div>
                <div className="border-t border-white/6 px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((dot) => (
                            <span
                                key={dot}
                                className="h-1.5 w-1.5 rounded-full bg-lime-300/80 animate-pulse"
                                style={{ animationDelay: `${dot * 180}ms` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SuggestionButtons({
    suggestions,
    onSelect,
}: {
    suggestions: ChatSuggestion[];
    onSelect: (prompt: string) => void;
}) {
    return (
        <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((item) => (
                <button
                    key={`${item.label}-${item.prompt}`}
                    type="button"
                    onClick={() => onSelect(item.prompt)}
                    className={`inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                        item.tone === "primary"
                            ? "border-lime-300/30 bg-lime-300/12 text-lime-100 hover:bg-lime-300/18"
                            : item.tone === "danger"
                                ? "border-rose-300/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/16"
                                : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                    }`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

function DocumentReviewPanel({
    review,
    onSelectSuggestion,
}: {
    review: DocumentReviewCard;
    onSelectSuggestion: (prompt: string) => void;
}) {
    const fieldIconMap: Record<string, string> = {
        monto: "💰",
        descripcion: "📝",
        categoria: "🏷️",
        comercio: "🏪",
        fecha: "📅",
        duplicado: "⚠️",
        confianza: "📊",
    };

    return (
        <div className={`my-2 overflow-hidden rounded-xl border ${
            review.tone === "warning"
                ? "border-amber-400/20 bg-zinc-900/82"
                : "border-white/10 bg-zinc-900/82"
        }`}>
            <div className="space-y-1.5 px-4 py-3 text-sm">
                <div className={`flex items-center gap-2 text-base font-medium ${
                    review.tone === "warning" ? "text-amber-300" : "text-emerald-400"
                }`}>
                    <CheckCircle2 className="h-4 w-4" />
                    {review.title}
                </div>
                {review.subtitle ? (
                    <div className="text-zinc-400">{review.subtitle}</div>
                ) : null}
                {review.fields.map((field) => (
                    <div key={field.label} className="text-zinc-400">
                        <span className="mr-2">{fieldIconMap[field.label.toLowerCase()] || "•"}</span>
                        {field.label}: <span className="text-zinc-100">{field.value}</span>
                    </div>
                ))}
            </div>
            {review.suggestions?.length ? (
                <div className="flex items-center justify-between border-t border-white/5 px-4 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {review.suggestions.map((item) => (
                            <button
                                key={`${item.label}-${item.prompt}`}
                                type="button"
                                onClick={() => onSelectSuggestion(item.prompt)}
                                className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                    item.tone === "primary"
                                        ? "bg-lime-400/12 text-lime-200 hover:bg-lime-400/18"
                                        : item.tone === "danger"
                                            ? "bg-rose-400/10 text-rose-200 hover:bg-rose-400/16"
                                            : "bg-white/5 text-zinc-200 hover:bg-white/10"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function renderToolResult(result: unknown) {
    if (!result || typeof result !== "object") return null;
    const r = result as ToolResult;

    if (r.success && r.summaryCard) {
        const mergedCard: SummaryCard = {
            ...r.summaryCard,
            displayId:
                r.summaryCard.displayId ||
                (typeof r.transaction?.displayId === "number"
                    ? String(r.transaction.displayId)
                    : r.transaction?.displayId),
            id:
                r.summaryCard.id ||
                (typeof r.transaction?.displayId === "number"
                    ? String(r.transaction.displayId)
                    : undefined),
        };

        return <TransactionCard card={mergedCard} />;
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
    const [draggedFileKind, setDraggedFileKind] = useState<"pdf" | "image" | "file">("file");
    const [paletteMode, setPaletteMode] = useState<PaletteMode>(null);
    const [entitySection, setEntitySection] = useState<EntitySection>("root");
    const [paletteQuery, setPaletteQuery] = useState("");
    const [paletteLoading, setPaletteLoading] = useState(false);
    const [paletteResourcesLoaded, setPaletteResourcesLoaded] = useState(false);
    const [categoriesResource, setCategoriesResource] = useState<CategoryResource[]>([]);
    const [accountsResource, setAccountsResource] = useState<AccountResource[]>([]);
    const [budgetsResource, setBudgetsResource] = useState<BudgetResource[]>([]);
    const [transactionsResource, setTransactionsResource] = useState<TransactionResource[]>([]);
    const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<AssistantMessageMetadata["selectedCategory"]>(null);
    const [selectedAccount, setSelectedAccount] = useState<AssistantMessageMetadata["selectedAccount"]>(null);
    const [selectedBudget, setSelectedBudget] = useState<AssistantMessageMetadata["selectedBudget"]>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<AssistantMessageMetadata["selectedTransaction"]>(null);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const composerRef = useRef<HTMLDivElement>(null);
    const dragDepthRef = useRef(0);
    const isLoading = status === "streaming" || status === "submitted";

    useEffect(() => {
        if (messages.length > 0) saveMessages(messages);
    }, [messages]);

    useEffect(() => {
        let isMounted = true;

        obtenerPerfil().then((result) => {
            if (!isMounted || !("workspace" in result) || !result.workspace?.baseCurrency) return;
            const nextCurrency = currencies.find((item) => item.code === result.workspace?.baseCurrency) || null;
            setDefaultCurrency(nextCurrency);
            setSelectedCurrency((current) => current ?? nextCurrency);
        }).catch(() => {
            // best effort only
        });

        return () => {
            isMounted = false;
        };
    }, []);

    const loadPaletteResources = useCallback(async () => {
        if (paletteLoading) return;
        setPaletteLoading(true);
        try {
            const [categoriesResult, accountsResult, budgetsResult, transactionsResult] = await Promise.all([
                listarCategorias(),
                listarCuentas(),
                listarPresupuestos(),
                listarTransacciones({ page: 1, pageSize: 15 }),
            ]);

            setCategoriesResource(((categoriesResult.categorias || []) as Array<{ id: string; name: string; icon?: string | null; type?: string }>));
            setAccountsResource(((accountsResult.cuentas || []) as Array<{ id: string; name: string; currency?: string; icon?: string | null }>));
            setBudgetsResource(((budgetsResult.presupuestos || []) as Array<{ id: string; name: string; currency?: string }>));
            setTransactionsResource(((transactionsResult.transacciones || []) as Array<{ id: string; description: string; type?: string; date?: string }>));
            setPaletteResourcesLoaded(true);
        } catch {
            toast({
                title: "No pude cargar los atajos",
                description: "Intenta abrir el selector nuevamente.",
                variant: "error",
            });
        } finally {
            setPaletteLoading(false);
        }
    }, [paletteLoading, toast]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (paletteMode && !paletteResourcesLoaded && paletteMode === "entities") {
            void loadPaletteResources();
        }
    }, [loadPaletteResources, paletteMode, paletteResourcesLoaded]);

    useEffect(() => {
        return () => {
            pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        };
    }, [pendingFiles]);

    useEffect(() => {
        if (!paletteMode) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (!composerRef.current) return;
            if (composerRef.current.contains(event.target as Node)) return;
            setPaletteMode(null);
            setEntitySection("root");
            setPaletteQuery("");
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setPaletteMode(null);
            setEntitySection("root");
            setPaletteQuery("");
        };

        window.addEventListener("mousedown", handlePointerDown);
        window.addEventListener("keydown", handleEscape);
        return () => {
            window.removeEventListener("mousedown", handlePointerDown);
            window.removeEventListener("keydown", handleEscape);
        };
    }, [paletteMode]);

    const handleClearChat = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setMessages([]);
        setInputValue("");
        setSelectedCategory(null);
        setSelectedAccount(null);
        setSelectedBudget(null);
        setSelectedTransaction(null);
        setSelectedCurrency(defaultCurrency);
        setPendingFiles((current) => {
            current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
            return [];
        });
    }, [defaultCurrency, setMessages]);

    const submitPrompt = async (text: string) => {
        const files = pendingFiles.map((item) => item.file);
        if ((!text.trim() && files.length === 0) || isLoading) return;
        try {
            const fileList = files.length > 0 ? buildFileList(files) : undefined;
            await sendMessage(
                text.trim()
                    ? { text: text.trim(), files: fileList, metadata: messageMetadata }
                    : { files: fileList!, metadata: messageMetadata }
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

    const handleSuggestionAction = async (prompt: string) => {
        setInputValue("");
        await submitPrompt(prompt);
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

    useEffect(() => {
        if (typeof window === "undefined") return;

        const getDraggedKind = (dataTransfer: DataTransfer | null) => {
            if (!dataTransfer) return "file" as const;
            const firstType =
                Array.from(dataTransfer.items || []).find((item) => item.kind === "file")?.type ||
                dataTransfer.files?.[0]?.type ||
                "";

            if (firstType === "application/pdf") return "pdf" as const;
            if (firstType.startsWith("image/")) return "image" as const;
            return "file" as const;
        };

        const hasFiles = (dataTransfer: DataTransfer | null) =>
            Boolean(dataTransfer?.types && Array.from(dataTransfer.types).includes("Files"));

        const onDragEnter = (event: DragEvent) => {
            if (!hasFiles(event.dataTransfer)) return;
            event.preventDefault();
            dragDepthRef.current += 1;
            setDraggedFileKind(getDraggedKind(event.dataTransfer));
            setIsDraggingFile(true);
        };

        const onDragOver = (event: DragEvent) => {
            if (!hasFiles(event.dataTransfer)) return;
            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "copy";
            }
            setDraggedFileKind(getDraggedKind(event.dataTransfer));
            setIsDraggingFile(true);
        };

        const onDragLeave = (event: DragEvent) => {
            if (!hasFiles(event.dataTransfer)) return;
            event.preventDefault();

            const leftViewport =
                event.clientX <= 0 ||
                event.clientY <= 0 ||
                event.clientX >= window.innerWidth ||
                event.clientY >= window.innerHeight;

            dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
            if (dragDepthRef.current === 0 || leftViewport) {
                dragDepthRef.current = 0;
                setIsDraggingFile(false);
            }
        };

        const onDrop = (event: DragEvent) => {
            if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;
            event.preventDefault();
            dragDepthRef.current = 0;
            setIsDraggingFile(false);

            if (event.dataTransfer.files.length > 1) {
                notifySingleFileLimit();
            }

            const file = extractFirstSupportedFile(event.dataTransfer.files);
            if (!file) {
                notifyUnsupportedFiles();
                return;
            }

            attachFile(file, "drop");
        };

        const onWindowBlur = () => {
            dragDepthRef.current = 0;
            setIsDraggingFile(false);
        };

        window.addEventListener("dragenter", onDragEnter);
        window.addEventListener("dragover", onDragOver);
        window.addEventListener("dragleave", onDragLeave);
        window.addEventListener("drop", onDrop);
        window.addEventListener("blur", onWindowBlur);

        return () => {
            window.removeEventListener("dragenter", onDragEnter);
            window.removeEventListener("dragover", onDragOver);
            window.removeEventListener("dragleave", onDragLeave);
            window.removeEventListener("drop", onDrop);
            window.removeEventListener("blur", onWindowBlur);
        };
    }, [attachFile, notifySingleFileLimit, notifyUnsupportedFiles]);

    const messageMetadata = useMemo<AssistantMessageMetadata>(() => ({
        preferredCurrencyCode: selectedCurrency && selectedCurrency.code !== "NONE" ? selectedCurrency.code : null,
        selectedCategory,
        selectedAccount,
        selectedBudget,
        selectedTransaction,
    }), [selectedAccount, selectedBudget, selectedCategory, selectedCurrency, selectedTransaction]);

    const groupedCurrencies = useMemo(() => {
        const query = normalizeSearch(paletteQuery);
        const filtered = currencies.filter((currency) => {
            if (!query) return true;
            return (
                normalizeSearch(currency.code).includes(query) ||
                normalizeSearch(currency.name).includes(query) ||
                normalizeSearch(currency.region).includes(query)
            );
        });

        const groups = new Map<string, Currency[]>();
        filtered.forEach((currency) => {
            const bucket = groups.get(currency.region) || [];
            bucket.push(currency);
            groups.set(currency.region, bucket);
        });
        return Array.from(groups.entries());
    }, [paletteQuery]);

    const filteredCategories = useMemo(() => {
        const query = normalizeSearch(paletteQuery);
        return categoriesResource.filter((item) => !query || normalizeSearch(item.name).includes(query));
    }, [categoriesResource, paletteQuery]);

    const filteredAccounts = useMemo(() => {
        const query = normalizeSearch(paletteQuery);
        return accountsResource.filter((item) => !query || normalizeSearch(`${item.name} ${item.currency || ""}`).includes(query));
    }, [accountsResource, paletteQuery]);

    const filteredBudgets = useMemo(() => {
        const query = normalizeSearch(paletteQuery);
        return budgetsResource.filter((item) => !query || normalizeSearch(item.name).includes(query));
    }, [budgetsResource, paletteQuery]);

    const filteredTransactions = useMemo(() => {
        const query = normalizeSearch(paletteQuery);
        return transactionsResource.filter((item) => !query || normalizeSearch(`${item.description} ${item.type || ""}`).includes(query));
    }, [paletteQuery, transactionsResource]);

    const rootMatches = useMemo(() => {
        const query = normalizeSearch(paletteQuery);
        if (!query) return [];

        return [
            ...filteredCategories.slice(0, 5).map((item) => ({ kind: "category" as const, id: item.id, label: item.name, icon: item.icon || "🏷️" })),
            ...filteredAccounts.slice(0, 5).map((item) => ({ kind: "account" as const, id: item.id, label: item.name, icon: item.icon || "🏦" })),
            ...filteredBudgets.slice(0, 5).map((item) => ({ kind: "budget" as const, id: item.id, label: item.name, icon: "🐷" })),
            ...filteredTransactions.slice(0, 5).map((item) => ({ kind: "transaction" as const, id: item.id, label: item.description, icon: item.type === "income" ? "↗" : "↙" })),
        ].filter((item) => normalizeSearch(item.label).includes(query));
    }, [filteredAccounts, filteredBudgets, filteredCategories, filteredTransactions, paletteQuery]);

    const closePalette = useCallback(() => {
        setPaletteMode(null);
        setEntitySection("root");
        setPaletteQuery("");
    }, []);

    const openEntityPalette = useCallback(() => {
        setPaletteMode((current) => current === "entities" ? null : "entities");
        setEntitySection("root");
        setPaletteQuery("");
        if (!paletteResourcesLoaded) {
            void loadPaletteResources();
        }
    }, [loadPaletteResources, paletteResourcesLoaded]);

    const openCurrencyPalette = useCallback(() => {
        setPaletteMode((current) => current === "currency" ? null : "currency");
        setEntitySection("root");
        setPaletteQuery("");
    }, []);

    const applyInsertedText = useCallback((value: string) => {
        setInputValue((current) => insertTextAtEnd(current, value));
        requestAnimationFrame(() => inputRef.current?.focus());
    }, []);

    const selectCategory = useCallback((item: CategoryResource) => {
        setSelectedCategory({ id: item.id, name: item.name, icon: item.icon });
        applyInsertedText(`${item.icon ? `${item.icon} ` : ""}${item.name}`);
        closePalette();
    }, [applyInsertedText, closePalette]);

    const selectAccount = useCallback((item: AccountResource) => {
        setSelectedAccount({ id: item.id, name: item.name, currency: item.currency, icon: item.icon });
        applyInsertedText(item.name);
        closePalette();
    }, [applyInsertedText, closePalette]);

    const selectBudget = useCallback((item: BudgetResource) => {
        setSelectedBudget({ id: item.id, name: item.name });
        applyInsertedText(item.name);
        closePalette();
    }, [applyInsertedText, closePalette]);

    const selectTransaction = useCallback((item: TransactionResource) => {
        setSelectedTransaction({ id: item.id, description: item.description, type: item.type });
        applyInsertedText(item.description);
        closePalette();
    }, [applyInsertedText, closePalette]);

    const selectCurrency = useCallback((currency: Currency) => {
        setSelectedCurrency(currency.code === "NONE" ? null : currency);
        closePalette();
        requestAnimationFrame(() => inputRef.current?.focus());
    }, [closePalette]);

    return (
        <main className="flex h-[calc(100vh-3.5rem)] flex-col">
            {typeof document !== "undefined" && isDraggingFile && createPortal(
                <div className="fixed inset-0 z-[250] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),rgba(7,7,9,0.86)_24%,rgba(4,4,6,0.97)_72%)] backdrop-blur-md">
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:36px_36px] opacity-40" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_46%)]" />
                    <div className="absolute inset-0 flex items-center justify-center px-6">
                        <div className="w-full max-w-4xl">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative h-28 w-28 sm:h-32 sm:w-32">
                                    <div className="absolute left-0 top-5 flex h-16 w-16 rotate-[-16deg] items-center justify-center rounded-[22px] bg-[#dfe4ff] text-slate-800 shadow-[0_22px_60px_rgba(0,0,0,0.2)] sm:h-20 sm:w-20">
                                        <Paperclip className="h-7 w-7 sm:h-8 sm:w-8" />
                                    </div>
                                    <div className="absolute right-0 top-3 flex h-16 w-16 rotate-[15deg] items-center justify-center rounded-[22px] bg-[#b7c2ff] text-slate-900 shadow-[0_22px_60px_rgba(0,0,0,0.2)] sm:h-20 sm:w-20">
                                        {draggedFileKind === "pdf" ? <FileText className="h-7 w-7 sm:h-8 sm:w-8" /> : <ImageIcon className="h-7 w-7 sm:h-8 sm:w-8" />}
                                    </div>
                                    <div className="absolute bottom-0 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-[22px] bg-[#4c63ff] text-white shadow-[0_28px_70px_rgba(76,99,255,0.34)] sm:h-20 sm:w-20">
                                        <Download className="h-7 w-7 rotate-180 sm:h-8 sm:w-8" />
                                    </div>
                                </div>

                                <div className="mt-10 text-[clamp(2rem,3vw,3.1rem)] font-semibold tracking-tight text-white">
                                    Agrega tu comprobante
                                </div>
                                <div className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-lg">
                                    Arrastra un PDF o una imagen a cualquier parte de la pantalla para adjuntarlo al chat.
                                </div>

                                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                    <span className="rounded-full border border-white/8 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-100 sm:text-sm">PDF, JPG, PNG, WEBP</span>
                                    <span className="rounded-full border border-white/8 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-100 sm:text-sm">1 archivo por envío</span>
                                    <span className="rounded-full border border-white/8 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-100 sm:text-sm">hasta {(ASSISTANT_DOCUMENT_MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
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
                                className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-lime-300/15 bg-lime-400/12 shadow-[0_10px_24px_rgba(163,230,53,0.12)]">
                                        <Bot className="h-3.5 w-3.5 text-lime-400" />
                                    </div>
                                )}
                                <div className={(() => {
                                    const parts = (msg.parts || []) as Array<{ type: string }>;
                                    const hasStructuredCard = parts.some((part) =>
                                        part.type === "data-document_review" || part.type === "data-transaction_summary"
                                    );

                                    if (msg.role === "user") {
                                        return "max-w-[min(86%,38rem)] rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(44,44,48,0.96),rgba(28,28,31,0.96))] px-4 py-3 text-sm leading-relaxed text-zinc-100 shadow-[0_18px_46px_rgba(0,0,0,0.24)]";
                                    }

                                    if (hasStructuredCard) {
                                        return "max-w-[min(88%,44rem)] text-sm leading-relaxed text-zinc-200";
                                    }

                                    return "max-w-[min(88%,48rem)] rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(20,20,24,0.84),rgba(11,11,14,0.78))] px-5 py-4 text-sm leading-relaxed text-zinc-200 shadow-[0_20px_52px_rgba(0,0,0,0.18)]";
                                })()}>
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
                                                    <div key={idx}>
                                                        <AssistantTextBlock text={p.text} />
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

                                            if (p.type === "data-document_review" && "data" in p && p.data) {
                                                return (
                                                    <DocumentReviewPanel
                                                        key={idx}
                                                        review={p.data as DocumentReviewCard}
                                                        onSelectSuggestion={handleSuggestionAction}
                                                    />
                                                );
                                            }

                                            if (p.type === "data-chat_suggestions" && "data" in p && p.data) {
                                                const suggestionsPayload = p.data as { title?: string; items?: ChatSuggestion[] };
                                                if (!suggestionsPayload.items?.length) return null;

                                                return (
                                                    <div key={idx} className="mt-3">
                                                        {suggestionsPayload.title ? (
                                                            <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                                                                {suggestionsPayload.title}
                                                            </div>
                                                        ) : null}
                                                        <SuggestionButtons
                                                            suggestions={suggestionsPayload.items}
                                                            onSelect={handleSuggestionAction}
                                                        />
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

                                                    const toolResult = p.output as ToolResult;
                                                    if (toolResult.needs_confirmation && toolResult.options?.length) {
                                                        return (
                                                            <div key={idx} className="mt-2 rounded-[22px] border border-white/10 bg-zinc-900/60 px-4 py-4">
                                                                {toolResult.message ? (
                                                                    <div className="text-sm leading-relaxed text-zinc-200">{toolResult.message}</div>
                                                                ) : null}
                                                                <SuggestionButtons
                                                                    suggestions={toolResult.options.map((option) => ({
                                                                        label: option,
                                                                        prompt: option,
                                                                    }))}
                                                                    onSelect={handleSuggestionAction}
                                                                />
                                                            </div>
                                                        );
                                                    }

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
                            <AssistantLoadingState
                                mode={((messages[messages.length - 1]?.parts || []) as Array<{ type: string }>).some((part) => part.type === "file")
                                    ? "document"
                                    : "chat"}
                            />
                        )}
                    </div>
                )}
            </div>

            <div className="px-4 pb-4 pt-2">
                <div ref={composerRef} className="relative mx-auto max-w-3xl">
                    {paletteMode && (
                        <div className="absolute bottom-[calc(100%+12px)] left-0 right-0 z-30">
                            <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(31,31,35,0.98),rgba(17,17,20,0.98))] shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur">
                                <div className="border-b border-white/8 px-4 py-4">
                                    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                                        <Search className="h-4 w-4 text-zinc-500" />
                                        <input
                                            value={paletteQuery}
                                            onChange={(e) => setPaletteQuery(e.target.value)}
                                            autoFocus
                                            placeholder={
                                                paletteMode === "currency"
                                                    ? "Buscar moneda por código o nombre..."
                                                    : entitySection === "root"
                                                        ? "Buscar en categorías, cuentas, presupuestos..."
                                                        : entitySection === "categories"
                                                            ? "Buscar en categorías..."
                                                            : entitySection === "accounts"
                                                                ? "Buscar en cuentas..."
                                                                : entitySection === "budgets"
                                                                    ? "Buscar en presupuestos..."
                                                                    : "Buscar en transacciones..."
                                            }
                                            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {paletteMode === "entities" && (
                                    <div className="max-h-[360px] overflow-y-auto px-3 pb-3">
                                        {paletteLoading ? (
                                            <div className="px-3 py-5 text-sm text-zinc-400">Cargando atajos...</div>
                                        ) : entitySection === "root" && !paletteQuery ? (
                                            <div className="space-y-1 pt-2">
                                                {[
                                                    { id: "categories", label: "Categorías", icon: Tags },
                                                    { id: "accounts", label: "Cuentas", icon: Wallet },
                                                    { id: "budgets", label: "Presupuestos", icon: PiggyBank },
                                                    { id: "transactions", label: "Transacciones", icon: ArrowRightLeft },
                                                ].map((item) => {
                                                    const Icon = item.icon;
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => setEntitySection(item.id as EntitySection)}
                                                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-zinc-200 transition-colors hover:bg-white/6"
                                                        >
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-zinc-300">
                                                                <Icon className="h-4 w-4" />
                                                            </div>
                                                            <span className="text-sm font-medium">{item.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="space-y-1 pt-2">
                                                {entitySection !== "root" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEntitySection("root");
                                                            setPaletteQuery("");
                                                        }}
                                                        className="mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-zinc-200 transition-colors hover:bg-white/6"
                                                    >
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-zinc-300">
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-sm font-medium">Volver</span>
                                                    </button>
                                                )}

                                                {(entitySection === "root" ? rootMatches : []).map((item) => (
                                                    <button
                                                        key={`${item.kind}-${item.id}`}
                                                        type="button"
                                                        onClick={() => {
                                                            if (item.kind === "category") {
                                                                const next = categoriesResource.find((entry) => entry.id === item.id);
                                                                if (next) selectCategory(next);
                                                            }
                                                            if (item.kind === "account") {
                                                                const next = accountsResource.find((entry) => entry.id === item.id);
                                                                if (next) selectAccount(next);
                                                            }
                                                            if (item.kind === "budget") {
                                                                const next = budgetsResource.find((entry) => entry.id === item.id);
                                                                if (next) selectBudget(next);
                                                            }
                                                            if (item.kind === "transaction") {
                                                                const next = transactionsResource.find((entry) => entry.id === item.id);
                                                                if (next) selectTransaction(next);
                                                            }
                                                        }}
                                                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-zinc-200 transition-colors hover:bg-white/6"
                                                    >
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-lg">{item.icon}</div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium">{item.label}</div>
                                                            <div className="text-xs capitalize text-zinc-500">{item.kind}</div>
                                                        </div>
                                                    </button>
                                                ))}

                                                {entitySection === "categories" && filteredCategories.map((item) => (
                                                    <button key={item.id} type="button" onClick={() => selectCategory(item)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-zinc-200 transition-colors hover:bg-white/6">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-lg">{item.icon || "🏷️"}</div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium">{item.name}</div>
                                                            <div className="text-xs text-zinc-500">{item.type === "income" ? "Ingreso" : item.type === "both" ? "Mixta" : "Gasto"}</div>
                                                        </div>
                                                    </button>
                                                ))}

                                                {entitySection === "accounts" && filteredAccounts.map((item) => (
                                                    <button key={item.id} type="button" onClick={() => selectAccount(item)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-zinc-200 transition-colors hover:bg-white/6">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-zinc-300">
                                                            <Wallet className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium">{item.name}</div>
                                                            <div className="text-xs text-zinc-500">{item.currency || "Sin moneda"}</div>
                                                        </div>
                                                    </button>
                                                ))}

                                                {entitySection === "budgets" && filteredBudgets.map((item) => (
                                                    <button key={item.id} type="button" onClick={() => selectBudget(item)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-zinc-200 transition-colors hover:bg-white/6">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-zinc-300">
                                                            <PiggyBank className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium">{item.name}</div>
                                                            <div className="text-xs text-zinc-500">{item.currency || "Presupuesto"}</div>
                                                        </div>
                                                    </button>
                                                ))}

                                                {entitySection === "transactions" && filteredTransactions.map((item) => (
                                                    <button key={item.id} type="button" onClick={() => selectTransaction(item)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-zinc-200 transition-colors hover:bg-white/6">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-zinc-300">
                                                            <ArrowRightLeft className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium">{item.description}</div>
                                                            <div className="text-xs text-zinc-500">{item.type === "income" ? "Ingreso" : "Gasto"}{item.date ? ` · ${item.date}` : ""}</div>
                                                        </div>
                                                    </button>
                                                ))}

                                                {((entitySection === "root" && paletteQuery && rootMatches.length === 0) ||
                                                    (entitySection === "categories" && filteredCategories.length === 0) ||
                                                    (entitySection === "accounts" && filteredAccounts.length === 0) ||
                                                    (entitySection === "budgets" && filteredBudgets.length === 0) ||
                                                    (entitySection === "transactions" && filteredTransactions.length === 0)) && (
                                                    <div className="px-4 py-5 text-sm text-zinc-500">Sin resultados para esta búsqueda.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {paletteMode === "currency" && (
                                    <div className="max-h-[360px] overflow-y-auto px-3 pb-3 pt-2">
                                        {groupedCurrencies.map(([region, items]) => (
                                            <div key={region} className="mb-3">
                                                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{region}</div>
                                                <div className="space-y-1">
                                                    {items.map((currency) => {
                                                        const isSelected = selectedCurrency?.code === currency.code || (!selectedCurrency && currency.code === "NONE");
                                                        return (
                                                            <button
                                                                key={currency.code}
                                                                type="button"
                                                                onClick={() => selectCurrency(currency)}
                                                                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                                                                    isSelected ? "bg-lime-300/10 text-lime-100" : "text-zinc-200 hover:bg-white/6"
                                                                }`}
                                                            >
                                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-lg">{currency.flag}</div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="truncate text-sm font-medium">{currency.code === "NONE" ? "Ninguna" : `${currency.code} · ${currency.name}`}</div>
                                                                    <div className="text-xs text-zinc-500">{currency.region}</div>
                                                                </div>
                                                                {isSelected && <Check className="h-4 w-4 text-lime-300" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div
                            className="relative min-h-[118px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(163,230,53,0.14),transparent_32%),linear-gradient(180deg,rgba(39,39,42,0.92),rgba(24,24,27,0.96))] shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition-all duration-200"
                        >
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
                                        onClick={openEntityPalette}
                                        title="Atajos y contexto"
                                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
                                            paletteMode === "entities"
                                                ? "border-lime-300/30 bg-lime-300/12 text-lime-200"
                                                : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10"
                                        } disabled:opacity-50`}
                                    >
                                        <AtSign className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={openCurrencyPalette}
                                        title={selectedCurrency ? `Moneda ${selectedCurrency.code}` : "Elegir moneda"}
                                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
                                            paletteMode === "currency"
                                                ? "border-lime-300/30 bg-lime-300/12 text-lime-200"
                                                : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10"
                                        } disabled:opacity-50`}
                                    >
                                        <Coins className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Adjuntar PDF o imagen"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
                                    >
                                        <Paperclip className="h-3.5 w-3.5" />
                                    </button>
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

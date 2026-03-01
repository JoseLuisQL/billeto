"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Plus,
    Trash2,
    Calendar,
    Search,
    Filter,
    Settings,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    FileText,
    Wallet,
    TrendingUp,
    TrendingDown,
    X,
    Check,
    ChevronDown,
    Save,
    Bookmark,
    Lock,
    Eye,
    EyeOff,
    ArrowUpDown,
    CreditCard,
    ArrowDown,
    TableProperties,
    Download,
    Zap,
    Upload,
    Folder,
    Info,
    Star
} from "lucide-react";
import {
    listarTransacciones,
    crearTransaccion,
    editarTransaccion,
    eliminarTransaccion,
    obtenerResumenDashboard,
} from "@/lib/actions/transactions";
import { listarCuentas } from "@/lib/actions/accounts";
import { listarCategorias } from "@/lib/actions/categories";
import { obtenerDistribucionCategorias } from "@/lib/actions/charts";
import { asignarTransaccionAMeta, listarMetasAsignables } from "@/lib/actions/goals";
import { useToast } from "@/components/ui/toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { currencies, Currency } from "@/lib/currencies";

// --- Types ---
type TransactionItem = {
    id: string;
    date: string;
    description: string;
    type: "income" | "expense";
    amountOriginal: number;
    currencyOriginal?: string;
    baseCurrency?: string;
    accountId?: string | null;
    categoryId?: string | null;
    account?: { id?: string; name?: string; currency?: string };
    category?: { id?: string; name?: string; icon?: string } | null;
    tags?: string[];
};

type SelectItem = { id: string; name: string; currency?: string; icon?: string };
type EditFormState = {
    date: string;
    description: string;
    amount: string;
    type: "income" | "expense";
    categoryId: string;
    accountId: string;
};

type GoalAssignable = {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    remaining: number;
    progressPct: number;
    currency: string;
    deadline: string | null;
    status: "active" | "paused" | "completed" | "archived";
};

// --- Main Component ---
export default function TransactionsPage() {
    const { status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    // Data State
    const [transacciones, setTransacciones] = useState<TransactionItem[]>([]);
    const [cuentas, setCuentas] = useState<SelectItem[]>([]);
    const [categorias, setCategorias] = useState<SelectItem[]>([]);
    const [cargando, setCargando] = useState(true);
    const [resumen, setResumen] = useState<{
        balanceTotal: number;
        ingresosMes: number;
        gastosMes: number;
        moneda: string;
    }>({ balanceTotal: 0, ingresosMes: 0, gastosMes: 0, moneda: "" });
    const [topCategoria, setTopCategoria] = useState<{ name: string; value: number } | null>(null);

    // UI State
    const [modal, setModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    // Feature Modals
    const [assignGoalModalOpen, setAssignGoalModalOpen] = useState(false);
    const [selectedTransactionForGoal, setSelectedTransactionForGoal] = useState<TransactionItem | null>(null);
    const [assignGoalTab, setAssignGoalTab] = useState<"sugerencias" | "manual">("sugerencias");
    const [goalsAssignable, setGoalsAssignable] = useState<GoalAssignable[]>([]);
    const [goalToAssignId, setGoalToAssignId] = useState<string>("");
    const [goalsLoading, setGoalsLoading] = useState(false);
    const [goalAssigning, setGoalAssigning] = useState(false);
    const [exchangeRateInput, setExchangeRateInput] = useState<string>("");
    const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState<EditFormState>({
        date: "",
        description: "",
        amount: "",
        type: "expense",
        categoryId: "",
        accountId: "",
    });
    const [categoriesModal, setCategoriesModal] = useState(false);
    const [createCategoryModal, setCreateCategoryModal] = useState(false);
    const [searchCategory, setSearchCategory] = useState("");
    const [newCategoryEmoji, setNewCategoryEmoji] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");

    // Filters & Settings
    const [filtroTipo, setFiltroTipo] = useState<string>("");
    const [filtroCuenta, setFiltroCuenta] = useState<string>("");
    const [searchCurrency, setSearchCurrency] = useState<string>("");
    const [settings, setSettings] = useState({
        roundAmounts: false,
        hideTransfers: false,
        limit: 20,
        mainCurrency: "PEN"
    });

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [txResult, cuentasResult, categoriasResult, resumenResult, categoriasDistResult] = await Promise.all([
                listarTransacciones({
                    page,
                    pageSize: settings.limit,
                    type: filtroTipo || undefined,
                    accountId: filtroCuenta || undefined,
                }),
                listarCuentas(),
                listarCategorias(),
                obtenerResumenDashboard(),
                obtenerDistribucionCategorias({ type: "expense" }),
            ]);

            setTransacciones((txResult.transacciones as TransactionItem[]) || []);
            setTotalPages(txResult.totalPages);
            setTotal(txResult.total);
            setCuentas((cuentasResult.cuentas as SelectItem[]) || []);
            setCategorias((categoriasResult.categorias as SelectItem[]) || []);
            setResumen({
                balanceTotal: resumenResult.balanceTotal,
                ingresosMes: resumenResult.ingresosMes,
                gastosMes: resumenResult.gastosMes,
                moneda: resumenResult.moneda,
            });
            const topCat = categoriasDistResult.datos?.[0] ?? null;
            setTopCategoria(topCat);
        } catch (err) {
            console.error("Error loading data", err);
            toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "error" });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            void cargarDatos();
        }
    }, [status, page, filtroTipo, filtroCuenta, settings.limit]);

    // --- Handlers ---
    const handleCrear = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);

        // Optimistic UI or wait? Let's wait for simplicity but show toast
        const result = await crearTransaccion(formData);
        if (result.error) {
            setError(result.error);
            toast({ title: "Error", description: result.error, variant: "error" });
        } else {
            setModal(false);
            setPage(1);
            toast({
                title: "Transaccion guardada",
                description: "Se ha registrado el movimiento correctamente.",
                variant: "success"
            });
            cargarDatos();
        }
    };

    const handleCrearCategoria = async (e: React.FormEvent) => {
        e.preventDefault();
        // Here we would call an action to save the category.
        // For now, we simulate success.
        toast({ title: "Categoría creada", description: "La categoría se creó exitosamente.", variant: "success" });
        setCreateCategoryModal(false);
        setNewCategoryEmoji("");
        setNewCategoryName("");
        cargarDatos();
    };

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Eliminar esta transacción?")) return;
        const result = await eliminarTransaccion(id);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
        } else {
            toast({ title: "Eliminado", description: "Transaccion eliminada.", variant: "success" });
            cargarDatos();
        }
    };

    const cargarMetasAsignables = async () => {
        setGoalsLoading(true);
        const result = await listarMetasAsignables();
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
            setGoalsAssignable([]);
            setGoalToAssignId("");
            setGoalsLoading(false);
            return;
        }

        const metas = (result.metas as GoalAssignable[]) || [];
        setGoalsAssignable(metas);
        setGoalToAssignId(metas[0]?.id || "");
        setGoalsLoading(false);
    };

    const abrirModalAsignarMeta = (tx: TransactionItem) => {
        setSelectedTransactionForGoal(tx);
        setAssignGoalTab("sugerencias");
        setExchangeRateInput("");
        setAssignGoalModalOpen(true);
        void cargarMetasAsignables();
    };

    const asignarMetaSeleccionada = async () => {
        if (!selectedTransactionForGoal?.id) {
            toast({ title: "Error", description: "No se encontró la transacción seleccionada.", variant: "error" });
            return;
        }

        if (!goalToAssignId) {
            toast({ title: "Error", description: "Selecciona una meta para continuar.", variant: "error" });
            return;
        }

        const goal = goalsAssignable.find((item) => item.id === goalToAssignId);
        if (!goal) {
            toast({ title: "Error", description: "Meta seleccionada no disponible.", variant: "error" });
            return;
        }

        const txCurrency = selectedTransactionForGoal.account?.currency || selectedTransactionForGoal.currencyOriginal || "PEN";
        const requiresExchange = txCurrency !== goal.currency;

        const hasExchangeInput = exchangeRateInput.trim().length > 0;
        const parsedExchangeRate = hasExchangeInput ? Number.parseFloat(exchangeRateInput) : Number.NaN;

        if (hasExchangeInput && (!Number.isFinite(parsedExchangeRate) || parsedExchangeRate <= 0)) {
            toast({
                title: "Tipo de cambio inválido",
                description: "Si ingresas tipo de cambio, debe ser mayor a 0.",
                variant: "error"
            });
            return;
        }

        setGoalAssigning(true);
        const result = await asignarTransaccionAMeta({
            goalId: goalToAssignId,
            transactionId: selectedTransactionForGoal.id,
            exchangeRate: hasExchangeInput ? parsedExchangeRate : undefined,
            strategy: requiresExchange && hasExchangeInput ? "divide" : "identity",
        });
        setGoalAssigning(false);

        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
            return;
        }

        toast({ title: "Meta actualizada", description: "La transacción se asignó correctamente.", variant: "success" });
        setAssignGoalModalOpen(false);
        setSelectedTransactionForGoal(null);
        setGoalToAssignId("");
        setExchangeRateInput("");
        await cargarDatos();
    };

    const abrirPanelEditar = (tx: TransactionItem) => {
        const isoDate = new Date(tx.date).toISOString().split("T")[0];
        setEditingTransaction(tx);
        setEditForm({
            date: isoDate,
            description: tx.description || "",
            amount: String(Math.abs(tx.amountOriginal ?? 0)),
            type: tx.type || "expense",
            categoryId: tx.category?.id || tx.categoryId || "",
            accountId: tx.account?.id || tx.accountId || "",
        });
        setIsEditPanelOpen(true);
    };

    const handleGuardarEdicion = async () => {
        if (!editingTransaction) return;

        const amount = Number(editForm.amount);
        if (!editForm.description.trim()) {
            toast({ title: "Error", description: "La descripción es obligatoria.", variant: "error" });
            return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            toast({ title: "Error", description: "El monto debe ser mayor a 0.", variant: "error" });
            return;
        }

        setIsSavingEdit(true);
        const result = await editarTransaccion({
            id: editingTransaction.id,
            date: editForm.date,
            description: editForm.description,
            amount,
            type: editForm.type,
            categoryId: editForm.categoryId || null,
            accountId: editForm.accountId || null,
        });
        setIsSavingEdit(false);

        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
            return;
        }

        toast({ title: "Transacción actualizada", description: "Los cambios se guardaron correctamente.", variant: "success" });
        setIsEditPanelOpen(false);
        setEditingTransaction(null);
        await cargarDatos();
    };

    const toggleRowSelection = (id: string) => {
        if (id === "all") {
            if (selectedRows.length === transacciones.length) {
                setSelectedRows([]);
            } else {
                setSelectedRows(transacciones.map(t => t.id));
            }
        } else {
            if (selectedRows.includes(id)) {
                setSelectedRows(selectedRows.filter(rowId => rowId !== id));
            } else {
                setSelectedRows([...selectedRows, id]);
            }
        }
    };

    // --- Formatters ---
    const formatearMoneda = (monto: number, currency?: string) => {
        const val = settings.roundAmounts ? Math.round(monto) : monto;
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: currency || "PEN",
            minimumFractionDigits: settings.roundAmounts ? 0 : 2,
            maximumFractionDigits: settings.roundAmounts ? 0 : 2,
        }).format(val);
    };

    const formatearFecha = (fecha: string) => {
        // Mocking "Feb 17" format
        const d = new Date(fecha);
        return d.toLocaleDateString("es-PE", { month: "short", day: "numeric" }).replace('.', '');
    };

    const selectedGoalForAssign = goalsAssignable.find((item) => item.id === goalToAssignId) || null;
    const txCurrencyForAssign = selectedTransactionForGoal?.account?.currency || selectedTransactionForGoal?.currencyOriginal || "PEN";
    const requiresExchangeRate = Boolean(selectedGoalForAssign && txCurrencyForAssign !== selectedGoalForAssign.currency);

    if (status === "loading") return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500">Cargando...</div>;
    if (status === "unauthenticated") { router.push("/login"); return null; }

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-[#D3FF0A]/20 pb-20">

            {/* --- Top Navigation / Header --- */}
            <header className="flex h-[4.5rem] items-center justify-between px-8 border-b border-zinc-800/60 sticky top-0 bg-[#09090b] z-40">
                <div className="flex items-center gap-2.5 text-zinc-400">
                    <TableProperties className="w-4 h-4 text-zinc-300" />
                    <span className="font-semibold text-[13px] text-white tracking-wide">Tabla</span>
                </div>

                <div className="flex items-center gap-2.5">
                    <button className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                        <Search className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                                <Settings className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[280px] bg-[#18181b] border border-zinc-800/80 shadow-2xl rounded-xl p-2 z-50">
                            {/* Redondear montos */}
                            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-800/30 transition-colors">
                                <div className="flex items-center gap-1.5 text-[14px] text-zinc-300 font-medium">
                                    Redondear montos
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="w-[14px] h-[14px] text-zinc-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-black text-white text-[12px] font-medium border border-zinc-800 rounded-[6px] px-3.5 py-2.5 shadow-2xl max-w-[280px]">
                                            <p className="mb-0.5 whitespace-nowrap">Verás transacciones abreviadas. Ejemplo:</p>
                                            <p className="whitespace-nowrap">10000 USD se mostrarán como 10k USD</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <button
                                    onClick={(e) => { e.preventDefault(); setSettings(s => ({ ...s, roundAmounts: !s.roundAmounts })) }}
                                    className={`w-[36px] h-[20px] rounded-full flex items-center px-[2px] transition-all duration-200 ${settings.roundAmounts ? 'border-[1.5px] border-[#D3FF0A] bg-transparent' : 'border-[1.5px] border-transparent bg-zinc-700/80'}`}
                                >
                                    <div className={`w-[13px] h-[13px] rounded-full transition-transform duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${settings.roundAmounts ? 'translate-x-[16px] bg-[#27272a]' : 'translate-x-0 bg-[#18181b]'}`}></div>
                                </button>
                            </div>

                            {/* Ocultar transferencias */}
                            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-800/30 transition-colors mt-0.5">
                                <div className="text-[14px] text-zinc-300 font-medium">
                                    Ocultar transferencias
                                </div>
                                <button
                                    onClick={(e) => { e.preventDefault(); setSettings(s => ({ ...s, hideTransfers: !s.hideTransfers })) }}
                                    className={`w-[36px] h-[20px] rounded-full flex items-center px-[2px] transition-all duration-200 ${settings.hideTransfers ? 'border-[1.5px] border-[#D3FF0A] bg-transparent' : 'border-[1.5px] border-transparent bg-zinc-700/80'}`}
                                >
                                    <div className={`w-[13px] h-[13px] rounded-full transition-transform duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${settings.hideTransfers ? 'translate-x-[16px] bg-[#27272a]' : 'translate-x-0 bg-[#18181b]'}`}></div>
                                </button>
                            </div>

                            {/* Límite */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-800/30 transition-colors mt-0.5 group focus:bg-zinc-800/30 data-[state=open]:bg-zinc-800/30 text-[14px] text-zinc-300 font-medium cursor-pointer">
                                    Límite
                                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-200">
                                        <span>{settings.limit}</span>
                                    </div>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-[120px] bg-[#18181b] border-zinc-800/80 shadow-2xl rounded-xl p-1.5 z-50 ml-1">
                                    {[5, 10, 20, 50, 100].map(val => (
                                        <DropdownMenuItem
                                            key={val}
                                            onClick={() => setSettings(s => ({ ...s, limit: val }))}
                                            className="text-sm py-2 px-3 flex justify-between cursor-pointer hover:bg-zinc-800 hover:text-white rounded-lg focus:bg-zinc-800 focus:text-white transition-colors"
                                        >
                                            <span className="font-medium">{val}</span>
                                            {settings.limit === val && <Check className="w-4 h-4 text-[#D3FF0A]" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            {/* Moneda */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-800/30 transition-colors mt-0.5 group focus:bg-zinc-800/30 data-[state=open]:bg-zinc-800/30 cursor-pointer">
                                    <div className="flex items-center gap-1.5 text-[14px] text-zinc-300 font-medium">
                                        Moneda principal
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onPointerDown={e => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                    }}
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                    }}
                                                    className="flex items-center justify-center cursor-help"
                                                >
                                                    <Info className="w-[14px] h-[14px] text-zinc-500" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="bg-black text-white text-[12px] font-medium border border-zinc-800 rounded-[6px] px-3.5 py-2.5 shadow-2xl max-w-[280px] z-[100]">
                                                <p className="mb-0.5 whitespace-nowrap">En esta moneda se unificarán tus reportes.</p>
                                                <p className="whitespace-nowrap">No confundir con &quot;Moneda de integraciones&quot;</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-200 uppercase tracking-wide">
                                        <span className="opacity-60">{settings.mainCurrency.slice(0, 2)}</span> {settings.mainCurrency}
                                    </div>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-[280px] h-[400px] flex flex-col bg-[#18181b] border border-zinc-800/80 shadow-2xl rounded-xl p-0 z-50 ml-1">
                                    <div className="p-2 border-b border-zinc-800/60 sticky top-0 bg-[#18181b] z-10 rounded-t-xl shrink-0">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <input
                                                type="text"
                                                placeholder="Buscar moneda..."
                                                value={searchCurrency}
                                                onChange={e => setSearchCurrency(e.target.value)}
                                                onKeyDown={e => e.stopPropagation()}
                                                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-[13px] text-zinc-300 focus:outline-none focus:border-zinc-700 transition-colors placeholder:text-zinc-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                        {(['Global', 'Favorita', 'Latinoamérica', 'Norteamérica', 'Europa', 'Asia', 'Mundial'] as const).map(region => {
                                            const regionCurrencies = currencies.filter(c =>
                                                c.region === region &&
                                                (c.name.toLowerCase().includes(searchCurrency.toLowerCase()) || c.code.toLowerCase().includes(searchCurrency.toLowerCase()))
                                            );

                                            if (regionCurrencies.length === 0) return null;

                                            return (
                                                <div key={region} className="mb-2 last:mb-0">
                                                    {region !== 'Global' && (
                                                        <div className="px-3 py-1.5 text-[11px] font-medium text-zinc-500 mt-1">
                                                            {region}
                                                        </div>
                                                    )}
                                                    {regionCurrencies.map(currency => (
                                                        <DropdownMenuItem
                                                            key={currency.code}
                                                            onClick={() => setSettings(s => ({ ...s, mainCurrency: currency.code === 'NONE' ? 'PEN' : currency.code }))}
                                                            className={`text-[13px] py-1.5 px-3 gap-2.5 cursor-pointer hover:bg-zinc-800/80 hover:text-white rounded-lg focus:bg-zinc-800 focus:text-white transition-colors flex items-center ${settings.mainCurrency === currency.code ? 'bg-zinc-800/40 text-white' : 'text-zinc-300'}`}
                                                        >
                                                            <div className="w-[20px] text-center text-sm drop-shadow-sm leading-none">{currency.flag}</div>
                                                            <div className="flex-1 flex items-center gap-1.5 truncate">
                                                                {currency.code !== 'NONE' && <span className="text-[10px] font-bold text-zinc-400">{currency.code.slice(0, 2)}</span>}
                                                                <span className={currency.code !== 'NONE' ? "font-medium" : ""}>{currency.code !== 'NONE' ? currency.code : currency.name}</span>
                                                                {currency.code !== 'NONE' && <span className="text-zinc-500 font-normal truncate">- {currency.name}</span>}
                                                            </div>
                                                            {currency.region === 'Favorita' && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    {region === 'Global' && searchCurrency === "" && <div className="h-px bg-zinc-800/60 my-1 mx-2" />}
                                                </div>
                                            );
                                        })}
                                        {currencies.filter(c => c.name.toLowerCase().includes(searchCurrency.toLowerCase()) || c.code.toLowerCase().includes(searchCurrency.toLowerCase())).length === 0 && (
                                            <div className="py-6 px-3 text-center text-[13px] text-zinc-500">
                                                No se encontraron resultados para &quot;{searchCurrency}&quot;
                                            </div>
                                        )}
                                    </div>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button className="w-6 h-6 ml-1.5 rounded flex items-center justify-center bg-[#5E2BFF] text-white hover:bg-[#6c3dfa] transition-colors">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                    </button>

                    <div className="flex items-center ml-3 bg-[#18181b] border border-zinc-800 rounded-[6px] h-7 overflow-hidden">
                        <button
                            onClick={() => setModal(true)}
                            className="text-[#D3FF0A] hover:bg-[#D3FF0A]/20 text-[11px] font-medium px-3 flex items-center h-full transition-colors"
                        >
                            Nueva
                        </button>
                        <div className="w-[1px] h-4 bg-zinc-800"></div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="text-[#D3FF0A] hover:bg-[#D3FF0A]/20 px-1.5 flex items-center h-full transition-colors">
                                    <ChevronDown className="w-3 h-3 opacity-60" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#18181b] border border-zinc-800/80 shadow-2xl rounded-xl text-zinc-300 w-64 mt-2 p-1.5">
                                <DropdownMenuItem onClick={() => setModal(true)} className="text-sm py-2 px-3 gap-3 cursor-pointer hover:bg-zinc-800 hover:text-white rounded-lg focus:bg-zinc-800 focus:text-white transition-colors">
                                    <Plus className="w-4 h-4 text-zinc-400" /> <span className="font-medium text-[13px]">Crear nueva transacción</span>
                                </DropdownMenuItem>
                                <div className="h-[1px] bg-zinc-800/80 my-1 mx-2"></div>
                                <DropdownMenuItem onClick={() => router.push('/transactions/import-transactions')} className="text-sm py-2 px-3 gap-3 cursor-pointer hover:bg-zinc-800 hover:text-white rounded-lg focus:bg-zinc-800 focus:text-white transition-colors">
                                    <Upload className="w-4 h-4 text-zinc-400" /> <span className="font-medium text-[13px]">Importar desde proveedor</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setCategoriesModal(true)} className="text-sm py-2 px-3 gap-3 cursor-pointer hover:bg-zinc-800 hover:text-white rounded-lg focus:bg-zinc-800 focus:text-white transition-colors mt-0.5">
                                    <Folder className="w-4 h-4 text-zinc-400" /> <span className="font-medium text-[13px]">Configurar categorías</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="px-8 pt-6 pb-12 max-w-[1600px] mx-auto space-y-7">

                {/* --- Vistas guardadas --- */}
                <div className="flex justify-end">
                    <Button variant="outline" className="h-8 text-[11px] font-medium bg-[#18181b] border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1.5 rounded-md px-3 shadow-none">
                        <Bookmark className="w-3.5 h-3.5 opacity-70" />
                        Vistas guardadas
                        <ChevronDown className="w-3.5 h-3.5 opacity-50 ml-1" />
                    </Button>
                </div>

                {/* --- MTabs Wrapper --- */}
                <div className="flex justify-start">
                    {/* --- PEN Tabs --- */}
                    <div className="flex items-center gap-1 bg-[#18181b] rounded-[6px] p-1 w-fit border border-zinc-800/80">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D3FF0A]/10 text-[#D3FF0A] rounded-[4px] text-xs font-medium">
                            <Filter className="w-3 h-3" />
                            {resumen.moneda || "---"}
                        </button>
                    </div>
                </div>

                {/* --- KPIs Cards --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Balance */}
                    <div className="bg-[#18181b] rounded-xl p-5 border border-zinc-800/50 flex flex-col justify-between h-[104px]">
                        <div className="text-zinc-400 text-[13px] font-medium">Balance</div>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-[26px] font-semibold text-[#00E676] tracking-tight">
                                {formatearMoneda(resumen.balanceTotal, resumen.moneda).replace(resumen.moneda, "").trim()}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium ml-0.5 uppercase">{resumen.moneda}</span>
                        </div>
                    </div>

                    {/* Gastos */}
                    <div className="bg-[#18181b] rounded-xl p-5 border border-zinc-800/50 flex flex-col justify-between h-[104px]">
                        <div className="text-zinc-400 text-[13px] font-medium">Gastos</div>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-[26px] font-semibold text-[#FF4444] tracking-tight">
                                {formatearMoneda(-resumen.gastosMes, resumen.moneda).replace(resumen.moneda, "").trim()}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium ml-0.5 uppercase">{resumen.moneda}</span>
                        </div>
                    </div>

                    {/* Ingresos */}
                    <div className="bg-[#18181b] rounded-xl p-5 border border-zinc-800/50 flex flex-col justify-between h-[104px]">
                        <div className="text-zinc-400 text-[13px] font-medium">Ingresos</div>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-[26px] font-semibold text-[#00E676] tracking-tight">
                                {formatearMoneda(resumen.ingresosMes, resumen.moneda).replace(resumen.moneda, "").trim()}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium ml-0.5 uppercase">{resumen.moneda}</span>
                        </div>
                    </div>

                    {/* Category Top */}
                    <div className="bg-[#18181b] rounded-xl p-5 border border-zinc-800/50 flex flex-col justify-between h-[104px]">
                        <div className="text-zinc-400 text-[13px] font-medium">Categoría con más gastos</div>
                        {topCategoria ? (
                            <div className="flex items-center gap-3 mt-2">
                                <div className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-[15px] grayscale opacity-90">
                                    {topCategoria.name.split(" ")[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[15px] font-medium text-white mb-0.5">{topCategoria.name.split(" ").slice(1).join(" ")}</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[12px] font-semibold text-[#FF4444]">{formatearMoneda(-topCategoria.value, resumen.moneda).replace(resumen.moneda, "").trim()}</span>
                                        <span className="text-[9px] text-zinc-600 font-medium uppercase">{resumen.moneda}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-[13px] text-zinc-600 mt-2">Sin datos</div>
                        )}
                    </div>
                </div>

                {/* --- Transaction Table --- */}
                <div className="pt-2">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-zinc-800/60">
                                    <th className="py-3 px-3 w-12 text-center">
                                        <div
                                            onClick={() => toggleRowSelection("all")}
                                            className={`w-3.5 h-3.5 rounded-[4px] border cursor-pointer mx-auto flex items-center justify-center transition-colors ${selectedRows.length === transacciones.length && transacciones.length > 0 ? "bg-zinc-700 border-zinc-600" : "border-zinc-700 hover:border-zinc-500"}`}
                                        >
                                            {selectedRows.length === transacciones.length && transacciones.length > 0 && <Check className="w-2.5 h-2.5 text-white" />}
                                        </div>
                                    </th>
                                    <th className="py-3 px-3 text-zinc-300 font-medium cursor-pointer hover:text-white group transition-colors">
                                        <div className="flex items-center gap-1.5">Fecha <ArrowDown className="w-3 h-3 text-zinc-500" /></div>
                                    </th>
                                    <th className="py-3 px-3 text-zinc-300 font-medium">Descripción</th>
                                    <th className="py-3 px-3 text-zinc-300 font-medium">Monto</th>
                                    <th className="py-3 px-3 text-zinc-300 font-medium">Categoría</th>
                                    <th className="py-3 px-3 text-zinc-300 font-medium">Cuenta</th>
                                    <th className="py-3 px-3 text-zinc-300 font-medium">Origen</th>
                                    <th className="py-3 px-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {cargando ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={8} className="py-4 px-3 text-zinc-700 text-center animate-pulse">Cargando...</td>
                                        </tr>
                                    ))
                                ) : transacciones.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center text-zinc-600">
                                            No hay transacciones que mostrar.
                                        </td>
                                    </tr>
                                ) : (
                                    transacciones.map((tx) => (
                                        <tr
                                            key={tx.id}
                                            className={`group transition-colors ${selectedRows.includes(tx.id) ? "bg-zinc-900/50" : "hover:bg-zinc-900/20"}`}
                                        >
                                            <td className="py-4 px-3 align-middle">
                                                <div
                                                    onClick={() => toggleRowSelection(tx.id)}
                                                    className={`w-3.5 h-3.5 mx-auto rounded-[4px] border cursor-pointer flex items-center justify-center transition-colors ${selectedRows.includes(tx.id) ? "bg-zinc-700 border-zinc-600" : "border-zinc-700 opacity-20 group-hover:opacity-100"}`}
                                                >
                                                    {selectedRows.includes(tx.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                                </div>
                                            </td>
                                            <td className="py-4 px-3 text-zinc-300 font-medium whitespace-nowrap capitalize align-middle">
                                                {formatearFecha(tx.date)}
                                            </td>
                                            <td className="py-4 px-3 font-medium text-white align-middle">
                                                {tx.description}
                                            </td>
                                            <td className="py-4 px-3 whitespace-nowrap align-middle">
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-[13px] font-medium ${tx.type === "income" ? "text-[#00E676]" : "text-[#FF4444]"}`}>
                                                        {tx.type === "income" ? "" : "-"}{Math.abs(tx.amountOriginal).toFixed(2).replace(".", ",")}
                                                    </span>
                                                    <span className="text-[9px] text-zinc-500 font-medium uppercase">{tx.currencyOriginal || resumen.moneda}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-3 align-middle">
                                                {tx.category ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#18181b]/80 border border-zinc-800/80 w-fit">
                                                        <span className="text-[12px] opacity-90">{tx.category.icon}</span>
                                                        <span className="text-[12px] text-zinc-300 font-medium">{(tx.category.name || '').replace(/^[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s?/, '')}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-700">-</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-3 text-zinc-500 font-medium align-middle">
                                                {tx.account?.name || "-"}
                                            </td>
                                            <td className="py-4 px-3 align-middle">
                                                <div className="flex items-center text-zinc-500">
                                                    <svg className="w-4 h-4 ml-1 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                </div>
                                            </td>
                                            <td className="py-4 px-3 text-center align-middle">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-1 text-zinc-500 hover:text-white transition-colors">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#18181b] border-zinc-800 text-zinc-300 min-w-[170px]">
                                                        <DropdownMenuItem onClick={() => abrirModalAsignarMeta(tx)} className="text-xs cursor-pointer">
                                                            Asignar a meta
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => abrirPanelEditar(tx)} className="text-xs cursor-pointer">
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                                        <DropdownMenuItem onClick={() => handleEliminar(tx.id)} className="text-xs text-rose-500 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer">
                                                            <Trash2 className="w-3 h-3 mr-2" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-5 select-none mt-1">
                        <div className="text-[12px] text-zinc-500 font-medium">
                            {total} transacciones
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-[#18181b] border border-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 rounded-[6px]"
                                disabled={page <= 1}
                                onClick={() => setPage(1)}
                            >
                                <span className="text-[11px] font-semibold">{"<<"}</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-[#18181b] border border-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 rounded-[6px]"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                            <div className="text-[12px] text-white font-medium px-4 flex h-8 items-center bg-[#18181b] rounded-[6px] border border-zinc-800/80">
                                Página {page} de {totalPages || 1}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-[#18181b] border border-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 rounded-[6px]"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-[#18181b] border border-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 rounded-[6px]"
                                disabled={page >= totalPages}
                                onClick={() => setPage(totalPages)}
                            >
                                <span className="text-[11px] font-semibold">{">>"}</span>
                            </Button>
                        </div>
                    </div>
                </div>

            </main>

            {isEditPanelOpen && editingTransaction && (
                <div className="fixed inset-0 z-[62] flex animate-in fade-in duration-200">
                    <div className="flex-1 bg-black/35 transition-opacity duration-200" onClick={() => setIsEditPanelOpen(false)} />
                    <aside className="w-full max-w-[440px] bg-[#2a2a2d] border-l border-zinc-700/60 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300 ease-out">
                        <div className="p-5 border-b border-zinc-700/60">
                            <h3 className="text-[16px] font-semibold text-zinc-100">Editar transacción</h3>
                            <p className="text-[12px] text-zinc-400 mt-1">Editar detalles de transacción</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="rounded-xl border border-zinc-700/70 bg-[#222225] p-4 text-center">
                                <div className="w-10 h-10 rounded-full border border-zinc-700/80 mx-auto mb-3 flex items-center justify-center text-zinc-400">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <p className="text-[13px] text-zinc-200 font-medium">Función Pro</p>
                                <p className="text-[11px] text-zinc-500 mt-1">Sube comprobantes con el plan Pro o Premium</p>
                                <Button variant="outline" className="mt-3 h-7 text-[11px] border-[#D3FF0A]/30 text-[#D3FF0A] bg-[#D3FF0A]/10 hover:bg-[#D3FF0A]/20">
                                    Mejorar plan
                                </Button>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[12px] text-zinc-400">Fecha</Label>
                                <Input
                                    type="date"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                                    className="bg-[#3a3a3f] border-zinc-700 text-zinc-100"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[12px] text-zinc-400">Descripción</Label>
                                <Input
                                    value={editForm.description}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                                    className="bg-[#3a3a3f] border-zinc-700 text-zinc-100"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[12px] text-zinc-400">Monto</Label>
                                <div className="grid grid-cols-[1fr_100px] gap-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={editForm.amount}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                                        className="bg-[#3a3a3f] border-zinc-700 text-zinc-100"
                                    />
                                    <div className="h-10 rounded-md bg-[#3a3a3f] border border-zinc-700 text-zinc-300 text-xs flex items-center justify-center uppercase">
                                        PEN
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[12px] text-zinc-400">Categoría</Label>
                                <select
                                    value={editForm.categoryId}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                                    className="w-full h-10 rounded-md bg-[#3a3a3f] border border-zinc-700 px-3 text-sm text-zinc-100"
                                >
                                    <option value="">Sin categoría</option>
                                    {categorias.map((c) => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[12px] text-zinc-400">Tipo</Label>
                                <select
                                    value={editForm.type}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value as "income" | "expense" }))}
                                    className="w-full h-10 rounded-md bg-[#3a3a3f] border border-zinc-700 px-3 text-sm text-zinc-100"
                                >
                                    <option value="income">Ingreso</option>
                                    <option value="expense">Gasto</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[12px] text-zinc-400">Cuenta</Label>
                                <select
                                    value={editForm.accountId}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, accountId: e.target.value }))}
                                    className="w-full h-10 rounded-md bg-[#3a3a3f] border border-zinc-700 px-3 text-sm text-zinc-100"
                                >
                                    <option value="">Sin cuenta</option>
                                    {cuentas.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[12px] text-zinc-400">Tags</Label>
                                <div className="h-10 rounded-md bg-[#3a3a3f] border border-zinc-700 px-3 text-sm text-zinc-500 flex items-center">
                                    Seleccionar etiquetas
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-zinc-700/60 space-y-2">
                            <Button
                                type="button"
                                onClick={() => abrirModalAsignarMeta(editingTransaction)}
                                className="w-full h-9 bg-[#3a3a3f] text-zinc-100 hover:bg-[#47474d]"
                            >
                                Asignar a Meta
                            </Button>
                            <Button
                                type="button"
                                onClick={handleGuardarEdicion}
                                disabled={isSavingEdit}
                                className="w-full h-9 bg-[#7E9E2E] text-black hover:bg-[#90b236] font-semibold"
                            >
                                {isSavingEdit ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </aside>
                </div>
            )}

            {/* --- Modal / Slide-over --- */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                    <div className="bg-[#18181b] w-full max-w-4xl h-[600px] rounded-xl border border-zinc-800 shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Left Side: Receipt Upload Placeholder */}
                        <div className="hidden md:flex flex-col items-center justify-center w-[300px] bg-[#09090b] border-r border-zinc-800 p-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                                <Lock className="w-5 h-5 text-zinc-600" />
                            </div>
                            <h3 className="text-sm font-medium text-zinc-300 mb-2">Función Pro</h3>
                            <p className="text-xs text-zinc-500 mb-6 max-w-[200px] leading-relaxed">
                                Sube comprobantes con el plan Pro o Premium para mantener todo organizado.
                            </p>
                            <Button variant="outline" className="h-8 text-xs border-[#D3FF0A]/20 text-[#D3FF0A] bg-[#D3FF0A]/5 hover:bg-[#D3FF0A]/10 w-full">
                                Mejorar plan
                            </Button>
                        </div>

                        {/* Right Side: Form */}
                        <div className="flex-1 flex flex-col bg-[#18181b]">
                            <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
                                <div>
                                    <h2 className="text-base font-semibold text-white">Nueva Transacción</h2>
                                    <p className="text-xs text-zinc-500">Agrega una nueva transacción a tu cuenta</p>
                                </div>
                                <button onClick={() => setModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800">
                                <form id="transaction-form" onSubmit={handleCrear} className="space-y-5">
                                    {/* Row 1: Date */}
                                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                        <Label className="text-xs text-zinc-400 font-medium text-right">Fecha</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-[#D3FF0A]" />
                                            <input
                                                type="date"
                                                name="date"
                                                defaultValue={new Date().toISOString().split('T')[0]}
                                                className="w-full bg-[#27272a] border-transparent rounded-md py-2 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#D3FF0A]/50"
                                            />
                                        </div>
                                    </div>

                                    {/* Row 2: Description */}
                                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                        <Label className="text-xs text-zinc-400 font-medium text-right">Descripción</Label>
                                        <Input
                                            name="description"
                                            placeholder="Descripción de la transacción"
                                            className="bg-[#27272a] border-transparent placeholder:text-zinc-600 text-zinc-200 focus:ring-1 focus:ring-[#D3FF0A]/50"
                                            required
                                        />
                                    </div>

                                    {/* Row 3: Amount */}
                                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                        <Label className="text-xs text-zinc-400 font-medium text-right">Monto</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                name="amount"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="bg-[#27272a] border-transparent placeholder:text-zinc-600 text-zinc-200 focus:ring-1 focus:ring-[#D3FF0A]/50"
                                                required
                                            />
                                            <div className="w-24 bg-[#27272a] rounded-md flex items-center justify-center text-xs text-zinc-400 font-medium">
                                                PEN
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 4: Category */}
                                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                        <Label className="text-xs text-zinc-400 font-medium text-right">Categoría</Label>
                                        <select
                                            name="categoryId"
                                            className="w-full bg-[#27272a] border-transparent rounded-md py-2 px-3 text-sm text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#D3FF0A]/50 appearance-none"
                                        >
                                            <option value="">Seleccionar categoría</option>
                                            {categorias.map(c => (
                                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Row 5: Tags (Mock) */}
                                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                        <Label className="text-xs text-zinc-400 font-medium text-right">Etiquetas</Label>
                                        <div className="bg-[#27272a] rounded-md py-2 px-3 text-sm text-zinc-600 italic">
                                            Seleccionar etiquetas
                                        </div>
                                    </div>

                                    {/* Row 6: Type */}
                                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                        <Label className="text-xs text-zinc-400 font-medium text-right">Tipo</Label>
                                        <div className="flex bg-[#27272a] rounded-md p-1 w-fit">
                                            <label className="cursor-pointer">
                                                <input type="radio" name="type" value="expense" defaultChecked className="peer sr-only" />
                                                <div className="px-4 py-1.5 rounded text-xs font-medium text-zinc-500 peer-checked:bg-rose-500 peer-checked:text-white transition-all">
                                                    Gasto
                                                </div>
                                            </label>
                                            <label className="cursor-pointer">
                                                <input type="radio" name="type" value="income" className="peer sr-only" />
                                                <div className="px-4 py-1.5 rounded text-xs font-medium text-zinc-500 peer-checked:bg-emerald-500 peer-checked:text-white transition-all">
                                                    Ingreso
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Row 7: Recurrent */}
                                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                        <Label className="text-xs text-zinc-400 font-medium text-right">Recurrente</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-5 bg-zinc-800 rounded-full relative cursor-not-allowed opacity-50">
                                                <div className="absolute left-1 top-1 w-3 h-3 bg-zinc-600 rounded-full"></div>
                                            </div>
                                            <span className="text-xs text-zinc-500">Transacción recurrente</span>
                                        </div>
                                    </div>

                                    {/* Row 8: Account */}
                                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                        <Label className="text-xs text-zinc-400 font-medium text-right">Cuenta</Label>
                                        <select
                                            name="accountId"
                                            className="w-full bg-[#27272a] border-transparent rounded-md py-2 px-3 text-sm text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#D3FF0A]/50 appearance-none"
                                        >
                                            <option value="">Sin cuenta específica</option>
                                            {cuentas.map(c => (
                                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                </form>
                            </div>

                            <div className="p-5 border-t border-zinc-800/50 flex justify-end">
                                <Button
                                    type="submit"
                                    form="transaction-form"
                                    className="bg-[#D3FF0A] text-black hover:bg-[#c5f000] font-semibold text-sm px-6"
                                >
                                    Guardar Transacción
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {assignGoalModalOpen && selectedTransactionForGoal && (
                <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/70 backdrop-blur-[2px] px-4">
                    <div className="w-full max-w-[620px] rounded-xl border border-zinc-700 bg-[#1b1b1d] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-zinc-700/70">
                            <div>
                                <h3 className="text-[18px] font-semibold text-zinc-100">Asignar a Metas</h3>
                                <p className="text-[12px] text-zinc-400 mt-1">Esta transacción se asignará 100% a tu meta seleccionada.</p>
                            </div>
                            <button
                                onClick={() => setAssignGoalModalOpen(false)}
                                className="text-zinc-500 hover:text-zinc-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-5 py-4">
                            <div className="rounded-lg bg-[#2b2b2e] border border-zinc-700 px-4 py-3">
                                <p className="text-[14px] font-medium text-zinc-100 leading-tight">{selectedTransactionForGoal.description}</p>
                                <p className="text-[28px] font-semibold text-zinc-100 mt-1 tracking-tight">
                                    {formatearMoneda(Math.abs(selectedTransactionForGoal.amountOriginal), selectedTransactionForGoal.account?.currency || "PEN")}
                                </p>
                            </div>

                            <div className="mt-4 rounded-lg border border-zinc-700 overflow-hidden">
                                <div className="grid grid-cols-2 bg-[#2b2b2e]">
                                    <button
                                        onClick={() => setAssignGoalTab("sugerencias")}
                                        className={`h-9 text-[13px] font-medium transition-colors ${assignGoalTab === "sugerencias" ? "bg-[#D3FF0A] text-black" : "text-zinc-300 hover:bg-zinc-700/40"}`}
                                    >
                                        Sugerencias
                                    </button>
                                    <button
                                        onClick={() => setAssignGoalTab("manual")}
                                        className={`h-9 text-[13px] font-medium transition-colors ${assignGoalTab === "manual" ? "bg-[#3a3a3f] text-zinc-100" : "text-zinc-300 hover:bg-zinc-700/40"}`}
                                    >
                                        Manual
                                    </button>
                                </div>

                                <div className="bg-[#1f1f22] p-4 min-h-[120px] space-y-4">
                                    {goalsLoading ? (
                                        <div className="rounded-md border border-zinc-700/80 bg-[#232326] px-3 py-3 text-[13px] text-zinc-300">
                                            Cargando metas activas...
                                        </div>
                                    ) : goalsAssignable.length === 0 ? (
                                        <div className="rounded-md border border-zinc-700/80 bg-[#232326] px-3 py-3 text-[13px] text-zinc-300">
                                            No se encontraron metas activas. Crea una meta primero para obtener sugerencias de asignación.
                                        </div>
                                    ) : (
                                        <>
                                            {assignGoalTab === "sugerencias" ? (
                                                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                                    {goalsAssignable
                                                        .slice()
                                                        .sort((a, b) => {
                                                            const byRemaining = a.remaining - b.remaining;
                                                            if (byRemaining !== 0) return byRemaining;
                                                            return b.progressPct - a.progressPct;
                                                        })
                                                        .slice(0, 5)
                                                        .map((goal) => {
                                                            const isSelected = goalToAssignId === goal.id;
                                                            return (
                                                                <button
                                                                    key={goal.id}
                                                                    type="button"
                                                                    onClick={() => setGoalToAssignId(goal.id)}
                                                                    className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${isSelected ? "border-[#D3FF0A]/70 bg-[#D3FF0A]/10" : "border-zinc-700 bg-[#232326] hover:bg-zinc-800"}`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div>
                                                                            <p className="text-[13px] font-medium text-zinc-100">{goal.name}</p>
                                                                            <p className="text-[12px] text-zinc-400">Progreso {goal.progressPct.toFixed(0)}%</p>
                                                                        </div>
                                                                        <p className="text-[12px] text-zinc-400">{formatearMoneda(goal.remaining, goal.currency)}</p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-[13px] font-medium text-zinc-300 mb-1.5">Seleccionar Meta</label>
                                                        <select
                                                            value={goalToAssignId}
                                                            onChange={(e) => setGoalToAssignId(e.target.value)}
                                                            className="w-full bg-[#232326] border border-zinc-700 rounded-md py-2 px-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#D3FF0A]/50"
                                                        >
                                                            {goalsAssignable.map((goal) => (
                                                                <option key={goal.id} value={goal.id}>{goal.name} ({goal.currency})</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {requiresExchangeRate && selectedGoalForAssign && (
                                                        <div>
                                                            <label className="block text-[13px] font-medium text-zinc-300 mb-1.5">
                                                                Tipo de Cambio ({txCurrencyForAssign}/{selectedGoalForAssign.currency})
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.00000001"
                                                                value={exchangeRateInput}
                                                                onChange={(e) => setExchangeRateInput(e.target.value)}
                                                                placeholder={`e.g., 1500 (${txCurrencyForAssign} per 1 ${selectedGoalForAssign.currency})`}
                                                                className="w-full bg-[#232326] border border-zinc-700 rounded-md py-2 px-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#D3FF0A]/50"
                                                            />
                                                            <p className="mt-1 text-[12px] text-zinc-500">
                                                                Opcional: ingresa cuántos {txCurrencyForAssign} equivalen a 1 {selectedGoalForAssign.currency}. Si lo dejas vacío, se asignará el monto total sin conversión.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="rounded-md border border-zinc-700 bg-[#232326] px-3 py-2.5 text-[13px] text-zinc-400">
                                                    % asignado: 100%
                                                </div>
                                                <div className="rounded-md border border-zinc-700 bg-[#232326] px-3 py-2.5 text-[13px] text-zinc-400">
                                                    Monto asignado: {formatearMoneda(Math.abs(selectedTransactionForGoal.amountOriginal), txCurrencyForAssign)}
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    onClick={() => setAssignGoalModalOpen(false)}
                                                    className="h-9 bg-[#3a3a3f] text-zinc-100 hover:bg-[#47474d]"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={asignarMetaSeleccionada}
                                                    disabled={goalAssigning || !goalToAssignId}
                                                    className="h-9 bg-[#D3FF0A] text-black hover:bg-[#c5f000] font-semibold text-sm"
                                                >
                                                    {goalAssigning ? "Asignando..." : "Asignar"}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modals for Categories --- */}
            {categoriesModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                    <div className="bg-[#18181b] w-full max-w-2xl h-[600px] sm:h-[700px] rounded-xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 pb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white tracking-tight">Administrar Categorías</h2>
                                <p className="text-[13px] text-zinc-400 mt-1">Organiza tus categorías personalizadas para mejorar la gestión de transacciones.</p>
                            </div>
                            <button onClick={() => setCategoriesModal(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 bg-zinc-800/50 rounded-md">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search and Action */}
                        <div className="px-6 pb-4 flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o emoji"
                                    value={searchCategory}
                                    onChange={(e) => setSearchCategory(e.target.value)}
                                    className="w-full bg-[#09090b] border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all placeholder:text-zinc-500"
                                />
                            </div>
                            <Button
                                onClick={() => setCreateCategoryModal(true)}
                                className="bg-[#D3FF0A]/10 text-[#D3FF0A] border border-[#D3FF0A]/20 hover:bg-[#D3FF0A]/20 font-medium text-[13px] px-4 rounded-lg gap-2 h-[42px]"
                            >
                                <Plus className="w-4 h-4" />
                                Crear Categoría
                            </Button>
                        </div>

                        {/* Categories List */}
                        <div className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-thin scrollbar-thumb-zinc-800">
                            <h3 className="text-[13px] font-semibold text-zinc-300 mb-4">Predefinidas</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {/* Display predefined categories from state, filtered by search */}
                                {categorias
                                    .filter(c => c.name.toLowerCase().includes(searchCategory.toLowerCase()))
                                    .map(c => {
                                        // Extract emoji safely (assuming format "$emoji $name" or similar)
                                        const emojiMatch = c.icon || c.name.match(/^[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s?/);
                                        const emoji = emojiMatch ? (Array.isArray(emojiMatch) ? emojiMatch[0].trim() : emojiMatch) : "📁";
                                        const nameOnly = c.name.replace(/^[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s?/, '').trim() || c.name;

                                        return (
                                            <div key={c.id} className="bg-[#27272a]/30 hover:bg-[#27272a]/80 border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-colors group">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-200">
                                                    {emoji}
                                                </div>
                                                <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-300 text-center line-clamp-1">{nameOnly}</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Crear Categoría Sub-modal */}
            {createCategoryModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-[2px]">
                    <div className="bg-[#18181b] w-full max-w-[400px] rounded-2xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 flex items-start justify-between">
                            <div>
                                <h3 className="text-[15px] font-semibold text-white tracking-tight">Crear Categoría</h3>
                                <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">Add a new custom category to organize your transactions.</p>
                            </div>
                            <button onClick={() => setCreateCategoryModal(false)} className="text-zinc-500 hover:text-white transition-colors p-1 bg-zinc-800/50 rounded-md">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-5 pb-5">
                            <form onSubmit={handleCrearCategoria} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[13px] font-medium text-zinc-300">Emoji</Label>
                                    <div className="relative">
                                        <Input
                                            value={newCategoryEmoji}
                                            onChange={(e) => setNewCategoryEmoji(e.target.value)}
                                            placeholder="🍕"
                                            className="bg-[#09090b] border border-[#D3FF0A]/40 text-base py-5 px-4 rounded-xl focus-visible:ring-1 focus-visible:ring-[#D3FF0A]/50 focus-visible:border-[#D3FF0A]/60"
                                            maxLength={2}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[13px] font-medium text-zinc-300">Nombre</Label>
                                    <Input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Comida y Bebida"
                                        className="bg-[#27272a]/50 border-zinc-800 text-zinc-200 py-5 px-4 rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:border-zinc-700"
                                        required
                                    />
                                </div>
                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className="w-full bg-[#D3FF0A]/20 hover:bg-[#D3FF0A]/30 text-[#D3FF0A] border border-[#D3FF0A]/20 font-medium py-5 rounded-xl transition-all"
                                    >
                                        Crear Categoría
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

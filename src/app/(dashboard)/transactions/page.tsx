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
    Zap
} from "lucide-react";
import {
    listarTransacciones,
    crearTransaccion,
    eliminarTransaccion,
    obtenerResumenDashboard,
} from "@/lib/actions/transactions";
import { listarCuentas } from "@/lib/actions/accounts";
import { listarCategorias } from "@/lib/actions/categories";
import { obtenerDistribucionCategorias } from "@/lib/actions/charts";
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
    DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// --- Types ---
type TransactionItem = {
    id: string;
    date: string;
    description: string;
    type: "income" | "expense";
    amountOriginal: number;
    account?: { name?: string; currency?: string };
    category?: { name?: string; icon?: string } | null;
    tags?: string[];
};

type SelectItem = { id: string; name: string; currency?: string; icon?: string };

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
    }>({ balanceTotal: 0, ingresosMes: 0, gastosMes: 0, moneda: "PEN" });
    const [topCategoria, setTopCategoria] = useState<{ name: string; value: number } | null>(null);

    // UI State
    const [modal, setModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    // Filters & Settings
    const [filtroTipo, setFiltroTipo] = useState<string>("");
    const [filtroCuenta, setFiltroCuenta] = useState<string>("");
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
                    <button className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                        <Settings className="w-4 h-4" />
                    </button>
                    <button className="w-6 h-6 ml-1.5 rounded flex items-center justify-center bg-[#5E2BFF] text-white hover:bg-[#6c3dfa] transition-colors">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                    </button>

                    <Button
                        onClick={() => setModal(true)}
                        className="bg-[#18181b] text-[#D3FF0A] border border-zinc-800 hover:bg-zinc-900 text-[11px] font-medium h-7 px-3 pr-2 ml-3 rounded-[6px] gap-1 shadow-none"
                    >
                        Nueva
                        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                    </Button>
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
                            PEN
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 hover:text-zinc-300 rounded-[4px] text-xs font-medium transition-colors">
                            PEN
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
                                {formatearMoneda(resumen.balanceTotal, "").replace("PEN", "").trim()}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium ml-0.5 uppercase">PEN</span>
                        </div>
                    </div>

                    {/* Gastos */}
                    <div className="bg-[#18181b] rounded-xl p-5 border border-zinc-800/50 flex flex-col justify-between h-[104px]">
                        <div className="text-zinc-400 text-[13px] font-medium">Gastos</div>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-[26px] font-semibold text-[#FF4444] tracking-tight">
                                {formatearMoneda(-resumen.gastosMes, "").replace("PEN", "").trim()}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium ml-0.5 uppercase">PEN</span>
                        </div>
                    </div>

                    {/* Ingresos */}
                    <div className="bg-[#18181b] rounded-xl p-5 border border-zinc-800/50 flex flex-col justify-between h-[104px]">
                        <div className="text-zinc-400 text-[13px] font-medium">Ingresos</div>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-[26px] font-semibold text-[#00E676] tracking-tight">
                                {formatearMoneda(resumen.ingresosMes, "").replace("PEN", "").trim()}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium ml-0.5 uppercase">PEN</span>
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
                                        <span className="text-[12px] font-semibold text-[#FF4444]">{formatearMoneda(-topCategoria.value, "").replace("PEN", "").trim()}</span>
                                        <span className="text-[9px] text-zinc-600 font-medium uppercase">PEN</span>
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
                                                    <span className="text-[9px] text-zinc-500 font-medium uppercase">PEN</span>
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
                                                    <DropdownMenuContent align="end" className="bg-[#18181b] border-zinc-800 text-zinc-300">
                                                        <DropdownMenuItem className="text-xs">Editar</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-xs">Duplicar</DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                                        <DropdownMenuItem onClick={() => handleEliminar(tx.id)} className="text-xs text-rose-500 focus:text-rose-400 focus:bg-rose-500/10">
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
        </div>
    );
}

// --- Icons Helper (if needed) ---
function Icon(props: any) {
    return <div {...props} />;
}

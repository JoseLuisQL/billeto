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
    CreditCard
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
        return d.toLocaleDateString("es-PE", { month: "short", day: "numeric" });
    };

    if (status === "loading") return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500">Cargando...</div>;
    if (status === "unauthenticated") { router.push("/login"); return null; }

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-[#D3FF0A]/20">

            {/* --- Top Navigation / Header --- */}
            <header className="flex h-16 items-center justify-between px-6 border-b border-zinc-800/40 sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-40">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <ArrowUpDown className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-white">Transacciones</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Only showing icons to match clean aesthetics, or minimalistic buttons */}
                </div>
            </header>

            <main className="p-6 space-y-6 max-w-[1920px] mx-auto">

                {/* --- Filters Bar --- */}
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                    <div className="flex flex-wrap items-center gap-3 w-full">
                        {/* Date Picker Trigger (Mock) */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded text-xs font-medium text-[#007AFF] hover:bg-[#007AFF]/20 transition-colors cursor-pointer">
                            <span>Fecha está entre 01/02/2026 → 28/02/2026</span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </div>

                        {/* Add Filter Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 text-xs gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" /> Agregar filtro
                        </Button>

                        {/* View Presets */}
                        <div className="ml-auto xl:ml-0 flex items-center gap-2 pt-2 xl:pt-0">
                            <div className="ml-auto flex gap-2">
                                <Button variant="ghost" className="h-8 text-zinc-500 hover:text-zinc-300 text-xs gap-2">
                                    <Bookmark className="w-3.5 h-3.5" /> Vistas guardadas
                                </Button>
                                <Button variant="ghost" className="h-8 text-zinc-500 hover:text-zinc-300 text-xs gap-2">
                                    <Save className="w-3.5 h-3.5" /> Guardar vista
                                </Button>
                                <Button variant="ghost" className="h-8 text-zinc-500 hover:text-zinc-300 text-xs gap-2">
                                    <RotateCcw className="w-3.5 h-3.5" /> Restablecer
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                            <input
                                placeholder=""
                                className="w-8 h-8 md:w-64 md:pl-8 md:pr-3 md:h-8 bg-transparent md:bg-zinc-900/50 border border-transparent md:border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-600"
                            />
                        </div>

                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                            <Filter className="w-4 h-4" />
                        </Button>

                        <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>

                        {/* Settings Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 bg-[#18181b] border-zinc-800 text-zinc-300 p-2">
                                <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Visualización</div>
                                <DropdownMenuCheckboxItem
                                    className="text-xs focus:bg-zinc-800 focus:text-white rounded px-2 py-1.5"
                                    checked={settings.roundAmounts}
                                    onCheckedChange={(c) => setSettings({ ...settings, roundAmounts: c })}
                                >
                                    Redondear montos
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    className="text-xs focus:bg-zinc-800 focus:text-white rounded px-2 py-1.5"
                                    checked={settings.hideTransfers}
                                    onCheckedChange={(c) => setSettings({ ...settings, hideTransfers: c })}
                                >
                                    Ocultar transferencias
                                </DropdownMenuCheckboxItem>
                                <div className="my-1 h-[1px] bg-zinc-800"></div>
                                <div className="flex items-center justify-between px-2 py-1.5 text-xs">
                                    <span>Límite</span>
                                    <select
                                        value={settings.limit}
                                        onChange={(e) => setSettings({ ...settings, limit: Number(e.target.value) })}
                                        className="bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-zinc-300 focus:outline-none"
                                    >
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between px-2 py-1.5 text-xs">
                                    <span>Moneda principal</span>
                                    <span className="text-zinc-500">PEN</span>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            onClick={() => setModal(true)}
                            className="bg-[#D3FF0A] text-black hover:bg-[#b8e600] text-xs font-semibold h-8 px-4 ml-2"
                        >
                            Nueva
                            <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
                        </Button>
                    </div>
                </div>

                {/* --- Active filter chips (Example) --- */}
                <div className="flex gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-[#D3FF0A]/10 border border-[#D3FF0A]/20 text-[#D3FF0A] px-2 py-0.5 rounded">
                        <span>PEN</span>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded">
                        <span>PEN</span>
                    </div>
                </div>

                {/* --- KPIs Cards --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* Balance */}
                    <Card className="bg-[#18181b] border-transparent hover:border-zinc-800 transition-colors">
                        <CardHeader className="p-4 pb-1">
                            <span className="text-xs font-medium text-zinc-500">Balance</span>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <div className="text-2xl font-bold text-[#D3FF0A]">
                                {formatearMoneda(resumen.balanceTotal, resumen.moneda)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gastos */}
                    <Card className="bg-[#18181b] border-transparent hover:border-zinc-800 transition-colors">
                        <CardHeader className="p-4 pb-1">
                            <span className="text-xs font-medium text-zinc-500">Gastos</span>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <div className="text-2xl font-bold text-rose-500">
                                {formatearMoneda(-resumen.gastosMes, resumen.moneda)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ingresos */}
                    <Card className="bg-[#18181b] border-transparent hover:border-zinc-800 transition-colors">
                        <CardHeader className="p-4 pb-1">
                            <span className="text-xs font-medium text-zinc-500">Ingresos</span>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <div className="text-2xl font-bold text-emerald-500">
                                {formatearMoneda(resumen.ingresosMes, resumen.moneda)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Top */}
                    <Card className="bg-[#18181b] border-transparent hover:border-zinc-800 transition-colors">
                        <CardHeader className="p-4 pb-1">
                            <span className="text-xs font-medium text-zinc-500">Categoria con mas gastos</span>
                        </CardHeader>
                        <CardContent className="p-4 pt-1 flex items-center gap-3">
                            {topCategoria ? (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
                                        {topCategoria.name.split(" ")[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-zinc-200">{topCategoria.name.split(" ").slice(1).join(" ")}</div>
                                        <div className="text-xs text-rose-500">{formatearMoneda(-topCategoria.value, resumen.moneda)}</div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-zinc-600">Sin datos</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* --- Transaction Table --- */}
                <div className="bg-[#09090b] rounded-lg overflow-hidden border border-zinc-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-zinc-800/50">
                                    <th className="py-3 px-4 w-10">
                                        <div
                                            onClick={() => toggleRowSelection("all")}
                                            className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-colors ${selectedRows.length === transacciones.length && transacciones.length > 0 ? "bg-zinc-700 border-zinc-600" : "border-zinc-700 hover:border-zinc-500"}`}
                                        >
                                            {selectedRows.length === transacciones.length && transacciones.length > 0 && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </th>
                                    <th className="py-3 px-4 text-zinc-500 font-medium cursor-pointer hover:text-zinc-300 group">
                                        <div className="flex items-center gap-1">Fecha <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /></div>
                                    </th>
                                    <th className="py-3 px-4 text-zinc-500 font-medium">Descripción</th>
                                    <th className="py-3 px-4 text-zinc-500 font-medium text-right">Monto</th>
                                    <th className="py-3 px-4 text-zinc-500 font-medium">Categoría</th>
                                    <th className="py-3 px-4 text-zinc-500 font-medium">Cuenta</th>
                                    <th className="py-3 px-4 text-zinc-500 font-medium text-center">Origen</th>
                                    <th className="py-3 px-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {cargando ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={8} className="py-4 px-4 text-zinc-700 text-center animate-pulse">Cargando...</td>
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
                                            className={`group transition-colors ${selectedRows.includes(tx.id) ? "bg-zinc-900/60" : "hover:bg-zinc-900/30"}`}
                                        >
                                            <td className="py-3 px-4">
                                                <div
                                                    onClick={() => toggleRowSelection(tx.id)}
                                                    className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-colors ${selectedRows.includes(tx.id) ? "bg-zinc-700 border-zinc-600" : "border-zinc-700 opacity-60 group-hover:opacity-100"}`}
                                                >
                                                    {selectedRows.includes(tx.id) && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                                                {formatearFecha(tx.date)}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-zinc-300">
                                                {tx.description}
                                            </td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <span className={`font-medium ${tx.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                                                    {tx.amountOriginal} <span className="text-[10px] text-zinc-600">PEN</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {tx.category ? (
                                                    <div className="flex items-center gap-2">
                                                        <span>{tx.category.icon}</span>
                                                        <span className="text-zinc-400 capitalize">{tx.category.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-700">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-zinc-500">
                                                {tx.account?.name || "-"}
                                            </td>
                                            <td className="py-3 px-4 text-center text-zinc-600">
                                                <Wallet className="w-3.5 h-3.5 mx-auto opacity-50" />
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-1 text-zinc-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                                            <MoreVertical className="w-3.5 h-3.5" />
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
                    <div className="flex items-center justify-end px-4 py-3 border-t border-zinc-800/50 select-none">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-600 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="text-xs text-zinc-500 px-2">
                                Página {page} de {totalPages || 1}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-600 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-zinc-600 px-1">
                    {total} transacciones
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

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus,
    Trash2,
    Receipt,
    TrendingUp,
    TrendingDown,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    listarTransacciones,
    crearTransaccion,
    eliminarTransaccion,
} from "@/lib/actions/transactions";
import { listarCuentas } from "@/lib/actions/accounts";
import { listarCategorias } from "@/lib/actions/categories";
import { useToast } from "@/components/ui/toast";

type TransactionItem = {
    id: string;
    date: string;
    description: string;
    type: "income" | "expense";
    amountOriginal: number;
    account?: { name?: string; currency?: string };
    category?: { name?: string; icon?: string } | null;
};

type SelectItem = { id: string; name: string; currency?: string; icon?: string };

export default function TransactionsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [transacciones, setTransacciones] = useState<TransactionItem[]>([]);
    const [cuentas, setCuentas] = useState<SelectItem[]>([]);
    const [categorias, setCategorias] = useState<SelectItem[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modal, setModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);

    // Filtros
    const [filtroTipo, setFiltroTipo] = useState<string>("");
    const [filtroCuenta, setFiltroCuenta] = useState<string>("");

    const cargarDatos = async () => {
        setCargando(true);
        const [txResult, cuentasResult, categoriasResult] = await Promise.all([
            listarTransacciones({
                page,
                pageSize: 15,
                type: filtroTipo || undefined,
                accountId: filtroCuenta || undefined,
            }),
            listarCuentas(),
            listarCategorias(),
        ]);

        setTransacciones((txResult.transacciones as TransactionItem[]) || []);
        setTotalPages(txResult.totalPages);
        setTotal(txResult.total);
        setCuentas((cuentasResult.cuentas as SelectItem[]) || []);
        setCategorias((categoriasResult.categorias as SelectItem[]) || []);
        setCargando(false);
    };

    useEffect(() => {
        if (status === "authenticated") {
            void cargarDatos();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, page, filtroTipo, filtroCuenta]);

    const handleCrear = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await crearTransaccion(formData);
        if (result.error) {
            setError(result.error);
            toast({ title: "No se pudo crear la transacción", description: result.error, variant: "error" });
        } else {
            setModal(false);
            setPage(1);
            toast({ title: "Transacción registrada", description: "La transacción fue creada correctamente.", variant: "success" });
            cargarDatos();
        }
    };

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Eliminar esta transacción? El balance de la cuenta se revertirá.")) return;
        const result = await eliminarTransaccion(id);
        if (result.error) {
            toast({ title: "No se pudo eliminar", description: result.error, variant: "error" });
        } else {
            toast({ title: "Transacción eliminada", description: "Se revirtió el balance correctamente.", variant: "success" });
            cargarDatos();
        }
    };

    const formatearMoneda = (monto: number, currency?: string) => {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: currency || "PEN",
        }).format(monto);
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-muted-foreground">Cargando...</div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    return (
        <div className="flex min-h-screen">
            <DashboardSidebar user={session!.user} />
            <main className="flex-1 ml-64 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Transacciones</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {total} transacciones registradas
                        </p>
                    </div>
                    <Button
                        onClick={() => { setModal(true); setError(null); }}
                        className="bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nueva Transacción
                    </Button>
                </div>

                {/* Filtros */}
                <div className="flex gap-3 mb-6 flex-wrap">
                    <select
                        value={filtroTipo}
                        onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
                    >
                        <option value="">Todos los tipos</option>
                        <option value="expense">Gastos</option>
                        <option value="income">Ingresos</option>
                    </select>

                    <select
                        value={filtroCuenta}
                        onChange={(e) => { setFiltroCuenta(e.target.value); setPage(1); }}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
                    >
                        <option value="">Todas las cuentas</option>
                        {cuentas.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Tabla de transacciones */}
                <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
                    {cargando ? (
                        <div className="p-8 text-center text-muted-foreground animate-pulse">
                            Cargando transacciones...
                        </div>
                    ) : transacciones.length === 0 ? (
                        <div className="text-center py-16">
                            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Sin transacciones</h3>
                            <p className="text-muted-foreground mb-4">Registrá tu primer movimiento financiero.</p>
                            <Button
                                onClick={() => { setModal(true); setError(null); }}
                                className="bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Registrar transacción
                            </Button>
                        </div>
                    ) : (
                        <>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Descripción</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoría</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cuenta</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Monto</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transacciones.map((tx) => (
                                        <tr key={tx.id} className="border-b border-white/5 group hover:bg-white/[0.02]">
                                            <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                                                {formatearFecha(tx.date)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    {tx.type === "income" ? (
                                                        <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                                                    ) : (
                                                        <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                                                    )}
                                                    <span className="text-sm text-white truncate max-w-[200px]">
                                                        {tx.description}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {tx.category ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs bg-zinc-800/50 px-2 py-1 rounded-md">
                                                        <span>{tx.category.icon}</span>
                                                        <span className="text-zinc-400">{tx.category.name}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-zinc-600">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-muted-foreground">
                                                {tx.account?.name}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className={`text-sm font-medium ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                                                    }`}>
                                                    {tx.type === "income" ? "+" : "-"}
                                                    {formatearMoneda(tx.amountOriginal, tx.account?.currency)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleEliminar(tx.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Paginación */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                                    <p className="text-xs text-muted-foreground">
                                        Página {page} de {totalPages} ({total} total)
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => setPage(page - 1)}
                                            className="bg-transparent border-white/10 text-white hover:bg-white/5"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage(page + 1)}
                                            className="bg-transparent border-white/10 text-white hover:bg-white/5"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal Nueva Transacción */}
                {modal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-md bg-zinc-900 border-white/10">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg text-white">Nueva Transacción</CardTitle>
                                <button onClick={() => setModal(false)} className="text-muted-foreground hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCrear} className="space-y-4">
                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                            {error}
                                        </div>
                                    )}

                                    {/* Tipo */}
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Tipo</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <label className="flex items-center gap-2 p-3 rounded-lg border border-zinc-800 cursor-pointer has-[:checked]:border-rose-400 has-[:checked]:bg-rose-400/5">
                                                <input type="radio" name="type" value="expense" defaultChecked className="sr-only" />
                                                <TrendingDown className="w-4 h-4 text-rose-400" />
                                                <span className="text-sm text-white">Gasto</span>
                                            </label>
                                            <label className="flex items-center gap-2 p-3 rounded-lg border border-zinc-800 cursor-pointer has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-400/5">
                                                <input type="radio" name="type" value="income" className="sr-only" />
                                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                                <span className="text-sm text-white">Ingreso</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Monto */}
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Monto</Label>
                                        <Input
                                            name="amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0.00"
                                            className="bg-zinc-900/50 border-zinc-800 focus:border-lime-400 text-2xl font-bold text-center h-14"
                                            required
                                        />
                                    </div>

                                    {/* Descripción */}
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Descripción</Label>
                                        <Input
                                            name="description"
                                            placeholder="Ej: Almuerzo en restaurante"
                                            className="bg-zinc-900/50 border-zinc-800 focus:border-lime-400"
                                            required
                                        />
                                    </div>

                                    {/* Cuenta */}
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Cuenta</Label>
                                        <select
                                            name="accountId"
                                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
                                            required
                                        >
                                            <option value="">Seleccionar cuenta</option>
                                            {cuentas.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name} ({c.currency})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Categoría */}
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Categoría (opcional)</Label>
                                        <select
                                            name="categoryId"
                                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
                                        >
                                            <option value="">Sin categoría</option>
                                            {categorias.map((c) => (
                                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Fecha */}
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Fecha</Label>
                                        <Input
                                            name="date"
                                            type="date"
                                            defaultValue={new Date().toISOString().split("T")[0]}
                                            className="bg-zinc-900/50 border-zinc-800 focus:border-lime-400"
                                        />
                                    </div>

                                    <Button type="submit" className="w-full bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]">
                                        Registrar Transacción
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}

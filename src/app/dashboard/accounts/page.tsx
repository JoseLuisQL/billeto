"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus,
    Pencil,
    Trash2,
    Wallet,
    CreditCard,
    Building2,
    PiggyBank,
    X,
} from "lucide-react";
import { listarCuentas, crearCuenta, actualizarCuenta, eliminarCuenta } from "@/lib/actions/accounts";

/**
 * Tipos de cuenta disponibles.
 */
const tiposCuenta = [
    { value: "cash", label: "Efectivo", icon: Wallet },
    { value: "bank", label: "Banco", icon: Building2 },
    { value: "credit_card", label: "Tarjeta de Crédito", icon: CreditCard },
    { value: "savings", label: "Ahorro", icon: PiggyBank },
];

const monedas = [
    { value: "PEN", label: "Soles (PEN)" },
    { value: "USD", label: "Dólares (USD)" },
    { value: "EUR", label: "Euros (EUR)" },
];

export default function AccountsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [cuentas, setCuentas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modal, setModal] = useState<"crear" | "editar" | null>(null);
    const [editando, setEditando] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Cargar cuentas
    useEffect(() => {
        if (status === "authenticated") {
            cargarCuentas();
        }
    }, [status]);

    const cargarCuentas = async () => {
        setCargando(true);
        const result = await listarCuentas();
        setCuentas(result.cuentas);
        setCargando(false);
    };

    const handleCrear = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await crearCuenta(formData);
        if (result.error) {
            setError(result.error);
        } else {
            setModal(null);
            cargarCuentas();
        }
    };

    const handleEditar = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await actualizarCuenta(editando.id, formData);
        if (result.error) {
            setError(result.error);
        } else {
            setModal(null);
            setEditando(null);
            cargarCuentas();
        }
    };

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta cuenta?")) return;
        const result = await eliminarCuenta(id);
        if (result.error) {
            alert(result.error);
        } else {
            cargarCuentas();
        }
    };

    const formatearMoneda = (monto: number, currency: string) => {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency,
        }).format(monto);
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
                        <h1 className="text-2xl font-bold text-white">Cuentas</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gestioná tus cuentas bancarias, billeteras y tarjetas
                        </p>
                    </div>
                    <Button
                        onClick={() => { setModal("crear"); setError(null); }}
                        className="bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nueva Cuenta
                    </Button>
                </div>

                {/* Lista de cuentas */}
                {cargando ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 rounded-xl border border-white/10 bg-zinc-900/50 animate-pulse" />
                        ))}
                    </div>
                ) : cuentas.length === 0 ? (
                    <div className="text-center py-16">
                        <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Sin cuentas</h3>
                        <p className="text-muted-foreground mb-4">Creá tu primera cuenta para empezar a registrar movimientos.</p>
                        <Button
                            onClick={() => { setModal("crear"); setError(null); }}
                            className="bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Crear cuenta
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cuentas.map((cuenta) => {
                            const tipo = tiposCuenta.find((t) => t.value === cuenta.type);
                            const Icon = tipo?.icon || Wallet;

                            return (
                                <div
                                    key={cuenta.id}
                                    className="rounded-xl border border-white/10 bg-zinc-900/50 p-5 group hover:border-lime-400/30 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-lime-400/10">
                                                <Icon className="w-5 h-5 text-lime-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-white">{cuenta.name}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {tipo?.label || cuenta.type} • {cuenta.currency}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditando(cuenta); setModal("editar"); setError(null); }}
                                                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleEliminar(cuenta.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-white">
                                        {formatearMoneda(Number(cuenta.currentBalance), cuenta.currency)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modal Crear/Editar */}
                {modal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-md bg-zinc-900 border-white/10">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg text-white">
                                    {modal === "crear" ? "Nueva Cuenta" : "Editar Cuenta"}
                                </CardTitle>
                                <button
                                    onClick={() => { setModal(null); setEditando(null); }}
                                    className="text-muted-foreground hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={modal === "crear" ? handleCrear : handleEditar} className="space-y-4">
                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Nombre</Label>
                                        <Input
                                            name="name"
                                            placeholder="Ej: Cuenta BCP"
                                            defaultValue={editando?.name}
                                            className="bg-zinc-900/50 border-zinc-800 focus:border-lime-400"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Tipo</Label>
                                        <select
                                            name="type"
                                            defaultValue={editando?.type || "cash"}
                                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
                                        >
                                            {tiposCuenta.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Moneda</Label>
                                        <select
                                            name="currency"
                                            defaultValue={editando?.currency || "PEN"}
                                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
                                        >
                                            {monedas.map((m) => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {modal === "crear" && (
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider text-zinc-500">Balance Inicial</Label>
                                            <Input
                                                name="initialBalance"
                                                type="number"
                                                step="0.01"
                                                defaultValue="0"
                                                className="bg-zinc-900/50 border-zinc-800 focus:border-lime-400"
                                            />
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]"
                                    >
                                        {modal === "crear" ? "Crear Cuenta" : "Guardar Cambios"}
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

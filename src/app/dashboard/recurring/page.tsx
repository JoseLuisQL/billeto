"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { RefreshCw, Plus, Trash2, Pencil, Play, Pause } from "lucide-react";
import {
    listarRecurrentes,
    crearRecurrente,
    actualizarRecurrente,
    eliminarRecurrente,
    ejecutarRecurrentes,
} from "@/lib/actions/recurring";
import { listarCuentas } from "@/lib/actions/accounts";
import { listarCategorias } from "@/lib/actions/categories";
import { useToast } from "@/components/ui/toast";

type RecurrenteItem = {
    id: string;
    name: string;
    amount: number;
    type: "income" | "expense";
    frequency: string;
    status: "active" | "paused";
    accountId?: string | null;
    categoryId?: string | null;
    nextRunAt: string;
};

type OptionItem = { id: string; name: string; icon?: string };

export default function RecurringPage() {
    const { status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [recurrentes, setRecurrentes] = useState<RecurrenteItem[]>([]);
    const [cuentas, setCuentas] = useState<OptionItem[]>([]);
    const [categorias, setCategorias] = useState<OptionItem[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [ejecutando, setEjecutando] = useState(false);

    // Form state
    const [nombre, setNombre] = useState("");
    const [monto, setMonto] = useState("");
    const [tipo, setTipo] = useState("expense");
    const [frecuencia, setFrecuencia] = useState("monthly");
    const [cuentaId, setCuentaId] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    async function cargarDatos() {
        setCargando(true);
        const [recRes, ctsRes, catsRes] = await Promise.all([
            listarRecurrentes(),
            listarCuentas(),
            listarCategorias(),
        ]);
        setRecurrentes((recRes.recurrentes as RecurrenteItem[]) || []);
        setCuentas((ctsRes.cuentas as OptionItem[]) || []);
        setCategorias((catsRes.categorias as OptionItem[]) || []);
        setCargando(false);
    }

    useEffect(() => {
        if (status === "authenticated") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void cargarDatos();
        }
    }, [status]);

    function abrirModal(rec?: RecurrenteItem) {
        if (rec) {
            setEditandoId(rec.id);
            setNombre(rec.name);
            setMonto(rec.amount.toString());
            setTipo(rec.type);
            setFrecuencia(rec.frequency);
            setCuentaId(rec.accountId || "");
            setCategoriaId(rec.categoryId || "");
        } else {
            setEditandoId(null);
            setNombre("");
            setMonto("");
            setTipo("expense");
            setFrecuencia("monthly");
            setCuentaId("");
            setCategoriaId("");
        }
        setModalAbierto(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setGuardando(true);

        const result = editandoId
            ? await actualizarRecurrente(editandoId, {
                name: nombre,
                amount: parseFloat(monto),
                type: tipo,
                frequency: frecuencia,
                accountId: cuentaId || undefined,
                categoryId: categoriaId || undefined,
            })
            : await crearRecurrente({
                name: nombre,
                amount: parseFloat(monto),
                type: tipo,
                frequency: frecuencia,
                accountId: cuentaId || undefined,
                categoryId: categoriaId || undefined,
            });

        setGuardando(false);

        if (!result.ok) {
            toast({ title: "No se pudo guardar", description: result.error, variant: "error" });
            return;
        }

        setModalAbierto(false);
        toast({
            title: editandoId ? "Recurrente actualizada" : "Recurrente creada",
            description: "La configuración se guardó correctamente.",
            variant: "success",
        });
        cargarDatos();
    }

    async function handleEliminar(id: string) {
        if (!confirm("¿Eliminar esta transacción recurrente?")) return;
        const result = await eliminarRecurrente(id);
        if (!result.ok) {
            toast({ title: "No se pudo eliminar", description: result.error, variant: "error" });
            return;
        }
        toast({ title: "Recurrente eliminada", description: "La regla recurrente fue eliminada.", variant: "success" });
        cargarDatos();
    }

    async function handleTogglePause(rec: RecurrenteItem) {
        const nuevoStatus = rec.status === "active" ? "paused" : "active";
        const result = await actualizarRecurrente(rec.id, { status: nuevoStatus });
        if (!result.ok) {
            toast({ title: "No se pudo actualizar", description: result.error, variant: "error" });
            return;
        }
        toast({
            title: nuevoStatus === "active" ? "Recurrente activada" : "Recurrente pausada",
            variant: "success",
        });
        cargarDatos();
    }

    async function handleEjecutar() {
        setEjecutando(true);
        const result = await ejecutarRecurrentes();
        setEjecutando(false);
        if (result.ok) {
            toast({
                title: "Ejecución completada",
                description: `Se ejecutaron ${result.ejecutadas} transacciones recurrentes.`,
                variant: "success",
            });
        } else {
            toast({ title: "Error al ejecutar recurrentes", description: result.error, variant: "error" });
        }
        cargarDatos();
    }

    const frecuenciaLabels: Record<string, string> = {
        daily: "Diaria",
        weekly: "Semanal",
        biweekly: "Quincenal",
        monthly: "Mensual",
        yearly: "Anual",
    };

    function formatFecha(iso: string) {
        return new Date(iso).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    const pendientes = recurrentes.filter(
        (r) => r.status === "active" && new Date(r.nextRunAt) <= new Date()
    ).length;

    if (status === "loading") return null;

    return (
        <div className="flex min-h-screen bg-zinc-950">
            <DashboardSidebar user={{ id: "", name: "Usuario", email: "" }} />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <RefreshCw className="w-6 h-6 text-blue-400" />
                                Transacciones recurrentes
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Suscripciones y pagos que se repiten periódicamente.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {pendientes > 0 && (
                                <button
                                    onClick={handleEjecutar}
                                    disabled={ejecutando}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 text-sm"
                                >
                                    <Play className="w-4 h-4" />
                                    {ejecutando ? "Ejecutando..." : `Ejecutar ${pendientes} pendientes`}
                                </button>
                            )}
                            <button
                                onClick={() => abrirModal()}
                                className="flex items-center gap-2 bg-[#D3FF0A] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#bde609] transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Nueva recurrente
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
                        {cargando ? (
                            <div className="p-8 text-center text-muted-foreground animate-pulse">
                                Cargando recurrentes...
                            </div>
                        ) : recurrentes.length === 0 ? (
                            <div className="p-12 text-center">
                                <RefreshCw className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                                <p className="text-muted-foreground">No hay transacciones recurrentes</p>
                                <p className="text-xs text-zinc-600 mt-1">
                                    Agregá suscripciones y pagos periódicos acá
                                </p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-xs text-muted-foreground uppercase tracking-wider">
                                        <th className="px-4 py-3 text-left">Nombre</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3 text-center">Frecuencia</th>
                                        <th className="px-4 py-3 text-center">Próxima ejecución</th>
                                        <th className="px-4 py-3 text-center">Estado</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recurrentes.map((rec) => {
                                        const vencida =
                                            rec.status === "active" && new Date(rec.nextRunAt) <= new Date();
                                        return (
                                            <tr
                                                key={rec.id}
                                                className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <span className="text-white font-medium">{rec.name}</span>
                                                    <span className="text-xs text-zinc-500 ml-2">
                                                        {rec.type === "income" ? "ingreso" : "gasto"}
                                                    </span>
                                                </td>
                                                <td
                                                    className={`px-4 py-3 text-right font-medium ${rec.type === "income" ? "text-emerald-400" : "text-rose-400"
                                                        }`}
                                                >
                                                    {rec.type === "income" ? "+" : "-"}S/ {rec.amount.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-zinc-400">
                                                    {frecuenciaLabels[rec.frequency] || rec.frequency}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm">
                                                    <span
                                                        className={
                                                            vencida
                                                                ? "text-amber-400 font-medium"
                                                                : "text-zinc-400"
                                                        }
                                                    >
                                                        {formatFecha(rec.nextRunAt)}
                                                        {vencida && " ⚠️"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full ${rec.status === "active"
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : "bg-zinc-700/50 text-zinc-500"
                                                            }`}
                                                    >
                                                        {rec.status === "active" ? "Activa" : "Pausada"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleTogglePause(rec)}
                                                            className="p-1.5 rounded-md hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                                                            title={rec.status === "active" ? "Pausar" : "Reanudar"}
                                                        >
                                                            {rec.status === "active" ? (
                                                                <Pause className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <Play className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => abrirModal(rec)}
                                                            className="p-1.5 rounded-md hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEliminar(rec.id)}
                                                            className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <form
                        onSubmit={handleSubmit}
                        className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-lg space-y-5"
                    >
                        <h2 className="text-lg font-semibold text-white">
                            {editandoId ? "Editar recurrente" : "Nueva recurrente"}
                        </h2>

                        {/* Nombre */}
                        <div>
                            <label className="block text-xs uppercase text-muted-foreground mb-1">Nombre</label>
                            <input
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                placeholder="Ej: Spotify Premium"
                                required
                            />
                        </div>

                        {/* Tipo + Monto */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs uppercase text-muted-foreground mb-1">Tipo</label>
                                <select
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                >
                                    <option value="expense">Gasto</option>
                                    <option value="income">Ingreso</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-muted-foreground mb-1">Monto</label>
                                <input
                                    type="number"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        {/* Frecuencia */}
                        <div>
                            <label className="block text-xs uppercase text-muted-foreground mb-1">
                                Frecuencia
                            </label>
                            <select
                                value={frecuencia}
                                onChange={(e) => setFrecuencia(e.target.value)}
                                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                            >
                                <option value="daily">Diaria</option>
                                <option value="weekly">Semanal</option>
                                <option value="biweekly">Quincenal</option>
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                            </select>
                        </div>

                        {/* Cuenta y Categoría */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs uppercase text-muted-foreground mb-1">
                                    Cuenta
                                </label>
                                <select
                                    value={cuentaId}
                                    onChange={(e) => setCuentaId(e.target.value)}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                >
                                    <option value="">Sin asignar</option>
                                    {cuentas.map((ct) => (
                                        <option key={ct.id} value={ct.id}>
                                            {ct.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-muted-foreground mb-1">
                                    Categoría
                                </label>
                                <select
                                    value={categoriaId}
                                    onChange={(e) => setCategoriaId(e.target.value)}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                >
                                    <option value="">Sin asignar</option>
                                    {categorias.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon || "📋"} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-muted-foreground hover:bg-white/5"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={guardando}
                                className="px-4 py-2 rounded-lg bg-[#D3FF0A] text-black font-medium text-sm hover:bg-[#bde609] disabled:opacity-50"
                            >
                                {guardando
                                    ? "Guardando..."
                                    : editandoId
                                        ? "Actualizar"
                                        : "Crear recurrente"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

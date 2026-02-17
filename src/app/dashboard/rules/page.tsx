"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { Zap, Plus, Trash2, Pencil } from "lucide-react";
import {
    listarReglas,
    crearRegla,
    actualizarRegla,
    eliminarRegla,
} from "@/lib/actions/rules";
import { listarCategorias } from "@/lib/actions/categories";
import { useToast } from "@/components/ui/toast";

type RuleItem = {
    id: string;
    name: string;
    status: "active" | "paused";
    priority: number;
    conditions?: { operator?: string; value?: string; field?: string };
    actions?: { categoryId?: string };
};

type RuleCategoryItem = { id: string; name: string; icon?: string };

export default function RulesPage() {
    const { status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [reglas, setReglas] = useState<RuleItem[]>([]);
    const [categorias, setCategorias] = useState<RuleCategoryItem[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState<string | null>(null);

    // Form state
    const [nombre, setNombre] = useState("");
    const [campo, setCampo] = useState("description");
    const [operador, setOperador] = useState("contains");
    const [valor, setValor] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [prioridad, setPrioridad] = useState(0);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    async function cargarDatos() {
        setCargando(true);
        const [reglasRes, catsRes] = await Promise.all([
            listarReglas(),
            listarCategorias(),
        ]);
        setReglas((reglasRes.reglas as RuleItem[]) || []);
        setCategorias((catsRes.categorias as RuleCategoryItem[]) || []);
        setCargando(false);
    }

    useEffect(() => {
        if (status === "authenticated") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void cargarDatos();
        }
    }, [status]);

    function abrirModal(regla?: RuleItem) {
        if (regla) {
            setEditandoId(regla.id);
            setNombre(regla.name);
            setCampo(regla.conditions?.field || "description");
            setOperador(regla.conditions?.operator || "contains");
            setValor(regla.conditions?.value || "");
            setCategoriaId(regla.actions?.categoryId || "");
            setPrioridad(regla.priority);
        } else {
            setEditandoId(null);
            setNombre("");
            setCampo("description");
            setOperador("contains");
            setValor("");
            setCategoriaId("");
            setPrioridad(0);
        }
        setModalAbierto(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setGuardando(true);

        const result = editandoId
            ? await actualizarRegla(editandoId, {
                name: nombre,
                conditionField: campo,
                conditionOperator: operador,
                conditionValue: valor,
                actionCategoryId: categoriaId,
                priority: prioridad,
            })
            : await crearRegla({
                name: nombre,
                conditionField: campo,
                conditionOperator: operador,
                conditionValue: valor,
                actionCategoryId: categoriaId,
                priority: prioridad,
            });

        setGuardando(false);

        if (!result.ok) {
            toast({ title: "No se pudo guardar la regla", description: result.error, variant: "error" });
            return;
        }

        setModalAbierto(false);
        toast({
            title: editandoId ? "Regla actualizada" : "Regla creada",
            description: "La regla fue guardada correctamente.",
            variant: "success",
        });
        cargarDatos();
    }

    async function handleEliminar(id: string) {
        if (!confirm("¿Eliminar esta regla?")) return;
        const result = await eliminarRegla(id);
        if (!result.ok) {
            toast({ title: "No se pudo eliminar", description: result.error, variant: "error" });
            return;
        }
        toast({ title: "Regla eliminada", description: "La regla fue eliminada correctamente.", variant: "success" });
        cargarDatos();
    }

    async function handleToggleStatus(regla: RuleItem) {
        const nuevoStatus = regla.status === "active" ? "paused" : "active";
        const result = await actualizarRegla(regla.id, { status: nuevoStatus });
        if (!result.ok) {
            toast({ title: "No se pudo actualizar", description: result.error, variant: "error" });
            return;
        }
        toast({
            title: nuevoStatus === "active" ? "Regla activada" : "Regla pausada",
            variant: "success",
        });
        cargarDatos();
    }

    function obtenerNombreCategoria(catId?: string) {
        if (!catId) return "Sin categoría";
        const cat = categorias.find((c) => c.id === catId);
        return cat ? `${cat.icon || "📋"} ${cat.name}` : "Sin categoría";
    }

    const operadorLabels: Record<string, string> = {
        contains: "contiene",
        startsWith: "empieza con",
        equals: "es igual a",
        regex: "regex",
    };

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
                                <Zap className="w-6 h-6 text-yellow-400" />
                                Reglas de auto-categorización
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Las reglas asignan categorías automáticamente según la descripción.
                            </p>
                        </div>
                        <button
                            onClick={() => abrirModal()}
                            className="flex items-center gap-2 bg-[#D3FF0A] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#bde609] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva regla
                        </button>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
                        {cargando ? (
                            <div className="p-8 text-center text-muted-foreground animate-pulse">
                                Cargando reglas...
                            </div>
                        ) : reglas.length === 0 ? (
                            <div className="p-12 text-center">
                                <Zap className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                                <p className="text-muted-foreground">No hay reglas creadas</p>
                                <p className="text-xs text-zinc-600 mt-1">
                                    Creá reglas para categorizar transacciones automáticamente
                                </p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-xs text-muted-foreground uppercase tracking-wider">
                                        <th className="px-4 py-3 text-left">Nombre</th>
                                        <th className="px-4 py-3 text-left">Condición</th>
                                        <th className="px-4 py-3 text-left">Categoría</th>
                                        <th className="px-4 py-3 text-center">Prioridad</th>
                                        <th className="px-4 py-3 text-center">Estado</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reglas.map((regla) => (
                                        <tr
                                            key={regla.id}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-white font-medium">{regla.name}</td>
                                            <td className="px-4 py-3 text-sm text-zinc-400">
                                                <span className="text-zinc-500">Descripción</span>{" "}
                                                <span className="text-amber-400/80">
                                                    {regla.conditions?.operator
                                                        ? (operadorLabels[regla.conditions.operator] || regla.conditions.operator)
                                                        : "condición"}
                                                </span>{" "}
                                                <span className="text-white font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded">
                                                    {regla.conditions?.value}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-zinc-300">
                                                {obtenerNombreCategoria(regla.actions?.categoryId)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-zinc-500">
                                                {regla.priority}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(regla)}
                                                    className={`text-xs px-2 py-1 rounded-full ${regla.status === "active"
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : "bg-zinc-700/50 text-zinc-500"
                                                        }`}
                                                >
                                                    {regla.status === "active" ? "Activa" : "Pausada"}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => abrirModal(regla)}
                                                        className="p-1.5 rounded-md hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminar(regla.id)}
                                                        className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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
                            {editandoId ? "Editar regla" : "Nueva regla"}
                        </h2>

                        {/* Nombre */}
                        <div>
                            <label className="block text-xs uppercase text-muted-foreground mb-1">Nombre</label>
                            <input
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                placeholder="Ej: Netflix → Entretenimiento"
                                required
                            />
                        </div>

                        {/* Condición */}
                        <div className="space-y-3">
                            <label className="block text-xs uppercase text-muted-foreground">
                                Condición
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={operador}
                                    onChange={(e) => setOperador(e.target.value)}
                                    className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                >
                                    <option value="contains">Contiene</option>
                                    <option value="startsWith">Empieza con</option>
                                    <option value="equals">Es igual a</option>
                                    <option value="regex">Regex</option>
                                </select>
                                <input
                                    value={valor}
                                    onChange={(e) => setValor(e.target.value)}
                                    className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                    placeholder="Valor a buscar..."
                                    required
                                />
                            </div>
                        </div>

                        {/* Acción: categoría */}
                        <div>
                            <label className="block text-xs uppercase text-muted-foreground mb-1">
                                Asignar categoría
                            </label>
                            <select
                                value={categoriaId}
                                onChange={(e) => setCategoriaId(e.target.value)}
                                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                required
                            >
                                <option value="">Seleccionar categoría...</option>
                                {categorias.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon || "📋"} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Prioridad */}
                        <div>
                            <label className="block text-xs uppercase text-muted-foreground mb-1">
                                Prioridad (mayor = primero)
                            </label>
                            <input
                                type="number"
                                value={prioridad}
                                onChange={(e) => setPrioridad(parseInt(e.target.value) || 0)}
                                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                min={0}
                                max={100}
                            />
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
                                {guardando ? "Guardando..." : editandoId ? "Actualizar" : "Crear regla"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

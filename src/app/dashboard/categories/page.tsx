"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Tags, X } from "lucide-react";
import {
    listarCategorias,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
} from "@/lib/actions/categories";
import { useToast } from "@/components/ui/toast";

/**
 * Iconos disponibles para categorías.
 */
const iconosDisponibles = [
    "🍔", "🛒", "🏠", "🚗", "🎓", "💊", "🎮", "✈️", "👕",
    "📱", "💰", "📊", "🎁", "🏋️", "🐶", "☕", "📁", "💡",
];

const coloresDisponibles = [
    "#D3FF0A", "#22C55E", "#3B82F6", "#8B5CF6", "#F43F5E",
    "#F59E0B", "#06B6D4", "#EC4899", "#71717A",
];

type CategoriaItem = {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: "expense" | "income" | "both";
    ownerUserId?: string;
};

export default function CategoriesPage() {
    const { status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modal, setModal] = useState<"crear" | "editar" | null>(null);
    const [editando, setEditando] = useState<CategoriaItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [iconSeleccionado, setIconSeleccionado] = useState("📁");
    const [colorSeleccionado, setColorSeleccionado] = useState("#71717A");
    const [filtroTipo, setFiltroTipo] = useState<"all" | "expense" | "income">("all");

    const cargarCategorias = async () => {
        setCargando(true);
        const result = await listarCategorias();
        setCategorias((result.categorias as CategoriaItem[]) || []);
        setCargando(false);
    };

    useEffect(() => {
        if (status === "authenticated") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void cargarCategorias();
        }
    }, [status]);

    const handleCrear = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        formData.set("icon", iconSeleccionado);
        formData.set("color", colorSeleccionado);
        const result = await crearCategoria(formData);
        if (result.error) {
            setError(result.error);
            toast({ title: "No se pudo crear la categoría", description: result.error, variant: "error" });
        } else {
            setModal(null);
            toast({ title: "Categoría creada", description: "La categoría se guardó correctamente.", variant: "success" });
            cargarCategorias();
        }
    };

    const handleEditar = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        if (!editando) {
            toast({ title: "No hay categoría seleccionada", variant: "error" });
            return;
        }
        const formData = new FormData(e.currentTarget);
        formData.set("icon", iconSeleccionado);
        formData.set("color", colorSeleccionado);
        const result = await actualizarCategoria(editando.id, formData);
        if (result.error) {
            setError(result.error);
            toast({ title: "No se pudo actualizar", description: result.error, variant: "error" });
        } else {
            setModal(null);
            setEditando(null);
            toast({ title: "Categoría actualizada", description: "Los cambios fueron guardados.", variant: "success" });
            cargarCategorias();
        }
    };

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Eliminar esta categoría?")) return;
        const result = await eliminarCategoria(id);
        if (result.error) {
            toast({ title: "No se pudo eliminar", description: result.error, variant: "error" });
        } else {
            toast({ title: "Categoría eliminada", description: "La categoría fue eliminada correctamente.", variant: "success" });
            cargarCategorias();
        }
    };

    const categoriasFiltradas = filtroTipo === "all"
        ? categorias
        : categorias.filter((c) => c.type === filtroTipo);

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
        <main className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Categorías</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Organizá tus ingresos y gastos por categoría
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setModal("crear");
                            setError(null);
                            setIconSeleccionado("📁");
                            setColorSeleccionado("#71717A");
                        }}
                        className="bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
                    </Button>
                </div>

                {/* Filtros */}
                <div className="flex gap-2 mb-6">
                    {[
                        { value: "all" as const, label: "Todas" },
                        { value: "expense" as const, label: "Gastos" },
                        { value: "income" as const, label: "Ingresos" },
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFiltroTipo(f.value)}
                            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${filtroTipo === f.value
                                    ? "bg-lime-400/10 text-lime-400 font-medium"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Lista de categorías */}
                {cargando ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-16 rounded-xl border border-white/10 bg-zinc-900/50 animate-pulse" />
                        ))}
                    </div>
                ) : categoriasFiltradas.length === 0 ? (
                    <div className="text-center py-16">
                        <Tags className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Sin categorías</h3>
                        <p className="text-muted-foreground">No hay categorías para este filtro.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {categoriasFiltradas.map((cat) => (
                            <div
                                key={cat.id}
                                className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-zinc-900/50 group hover:border-white/20 transition-all"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span
                                        className="text-xl w-8 h-8 flex items-center justify-center rounded-lg"
                                        style={{ backgroundColor: `${cat.color}15` }}
                                    >
                                        {cat.icon}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{cat.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {cat.type === "income" ? "Ingreso" : "Gasto"}
                                            {cat.ownerUserId === "__SYSTEM__" ? " · Predefinida" : " · Personal"}
                                        </p>
                                    </div>
                                </div>
                                {cat.ownerUserId !== "__SYSTEM__" && (
                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button
                                            onClick={() => {
                                                setEditando(cat);
                                                setIconSeleccionado(cat.icon);
                                                setColorSeleccionado(cat.color);
                                                setModal("editar");
                                                setError(null);
                                            }}
                                            className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => handleEliminar(cat.id)}
                                            className="p-1 rounded hover:bg-red-400/10 text-muted-foreground hover:text-red-400"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal Crear/Editar */}
                {modal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-md bg-zinc-900 border-white/10">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg text-white">
                                    {modal === "crear" ? "Nueva Categoría" : "Editar Categoría"}
                                </CardTitle>
                                <button onClick={() => { setModal(null); setEditando(null); }} className="text-muted-foreground hover:text-white">
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
                                            placeholder="Ej: Alimentación"
                                            defaultValue={editando?.name}
                                            className="bg-zinc-900/50 border-zinc-800 focus:border-lime-400"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Tipo</Label>
                                        <select
                                            name="type"
                                            defaultValue={editando?.type || "expense"}
                                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
                                        >
                                            <option value="expense">Gasto</option>
                                            <option value="income">Ingreso</option>
                                        </select>
                                    </div>

                                    {/* Selector de icono */}
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Icono</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {iconosDisponibles.map((icon) => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    onClick={() => setIconSeleccionado(icon)}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all ${iconSeleccionado === icon
                                                            ? "bg-lime-400/20 ring-2 ring-lime-400"
                                                            : "bg-zinc-800/50 hover:bg-zinc-700/50"
                                                        }`}
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Selector de color */}
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Color</Label>
                                        <div className="flex gap-2">
                                            {coloresDisponibles.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setColorSeleccionado(color)}
                                                    className={`w-7 h-7 rounded-full transition-all ${colorSeleccionado === color ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]">
                                        {modal === "crear" ? "Crear Categoría" : "Guardar Cambios"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
        </main>
    );
}

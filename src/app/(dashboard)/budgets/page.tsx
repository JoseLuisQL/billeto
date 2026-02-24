"use client";

import { useCallback, useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import {
    ChevronDown,
    MoreVertical,
    PiggyBank,
    Plus,
    Search,
    TrendingDown,
    X,
    BarChart3,
    ArrowLeftRight,
    Star,
    Check,
} from "lucide-react";
import {
    listarPresupuestos,
    crearPresupuesto,
    actualizarPresupuesto,
    eliminarPresupuesto,
    obtenerGastoDiarioPresupuesto,
} from "@/lib/actions/budgets";
import { listarCategorias } from "@/lib/actions/categories";
import { useToast } from "@/components/ui/toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currencies } from "@/lib/currencies";

// ─── Types ───────────────────────────────────────────

type BudgetItem = {
    id: string;
    categoryId: string | null;
    name: string;
    amount: number;
    currency: string;
    period: string;
    budgetType: "fixed" | "percentage";
    alertAt80: boolean;
    alertAt100: boolean;
    spentAmount: number;
    effectiveLimit: number;
    remaining: number;
    progressPct: number;
    incomeAmount: number;
    periodStart: string;
    periodEnd: string;
    category: {
        id: string;
        name: string;
        icon: string | null;
        color: string | null;
    } | null;
};

type CategoryItem = {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
    type?: string;
};

type FormState = {
    id?: string;
    categoryId: string;
    name: string;
    amount: string;
    currency: string;
    budgetType: "fixed" | "percentage";
};

// ─── Helpers ─────────────────────────────────────────

function formatCurrency(value: number, currency: string) {
    try {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${currency} ${value.toFixed(2)}`;
    }
}

function formatPeriodRange(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    e.setDate(e.getDate() - 1);
    const fmt = (d: Date) =>
        d.toLocaleDateString("es-PE", { month: "short", year: "2-digit" }).replace(".", "");
    return `${fmt(s)} - ${fmt(e)}`;
}

function getCurrencyCodes() {
    return currencies
        .filter((c) => c.code !== "NONE")
        .map((c) => c.code);
}

// ─── Main Page ───────────────────────────────────────

export default function BudgetsPage() {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [budgets, setBudgets] = useState<BudgetItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formState, setFormState] = useState<FormState>({
        categoryId: "",
        name: "",
        amount: "",
        currency: "PEN",
        budgetType: "fixed",
    });

    // Category dropdown
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");
    const categoryRef = useRef<HTMLDivElement>(null);

    // Currency dropdown
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [currencySearch, setCurrencySearch] = useState("");
    const currencyRef = useRef<HTMLDivElement>(null);

    // Type dropdown
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const typeRef = useRef<HTMLDivElement>(null);

    const filteredBudgets = useMemo(() => {
        if (!searchQuery.trim()) return budgets;
        const q = searchQuery.toLowerCase();
        return budgets.filter(
            (b) =>
                b.name.toLowerCase().includes(q) ||
                b.category?.name.toLowerCase().includes(q)
        );
    }, [budgets, searchQuery]);

    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) return categories;
        const q = categorySearch.toLowerCase();
        return categories.filter(
            (c) => c.name.toLowerCase().includes(q)
        );
    }, [categories, categorySearch]);

    const selectedCategory = useMemo(
        () => categories.find((c) => c.id === formState.categoryId) || null,
        [categories, formState.categoryId]
    );

    const loadData = useCallback(async () => {
        setLoading(true);
        const [budgetsResult, categoriasResult] = await Promise.all([
            listarPresupuestos(),
            listarCategorias(),
        ]);

        if (!budgetsResult.error) {
            setBudgets(budgetsResult.presupuestos as BudgetItem[]);
        }
        if (!categoriasResult.error) {
            setCategories(categoriasResult.categorias as CategoryItem[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadData();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadData]);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
                setIsCategoryOpen(false);
            }
            if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
                setIsCurrencyOpen(false);
            }
            if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
                setIsTypeOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const resetForm = () => {
        setFormState({
            categoryId: "",
            name: "",
            amount: "",
            currency: "PEN",
            budgetType: "fixed",
        });
        setCategorySearch("");
        setCurrencySearch("");
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (budget: BudgetItem) => {
        setFormState({
            id: budget.id,
            categoryId: budget.categoryId || "",
            name: budget.name,
            amount: String(budget.amount),
            currency: budget.currency,
            budgetType: budget.budgetType,
        });
        setIsModalOpen(true);
    };

    const submitBudget = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Auto-set name from category if empty
        const name = formState.name.trim()
            || selectedCategory?.name
            || "Presupuesto";

        const formData = new FormData();
        formData.set("categoryId", formState.categoryId);
        formData.set("name", name);
        formData.set("amount", formState.amount);
        formData.set("currency", formState.currency);
        formData.set("budgetType", formState.budgetType);
        formData.set("period", "monthly");

        setSaving(true);
        const result = formState.id
            ? await actualizarPresupuesto(formState.id, formData)
            : await crearPresupuesto(formData);
        setSaving(false);

        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
            return;
        }

        toast({
            title: formState.id ? "Presupuesto actualizado" : "Presupuesto creado",
            description: formState.id
                ? "El presupuesto se actualizó correctamente."
                : "El presupuesto se creó correctamente.",
            variant: "success",
        });

        setIsModalOpen(false);
        resetForm();
        await loadData();
    };

    const onDelete = async (budget: BudgetItem) => {
        const confirmed = confirm(`¿Eliminar el presupuesto "${budget.name}"?`);
        if (!confirmed) return;

        const result = await eliminarPresupuesto(budget.id);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
            return;
        }

        toast({
            title: "Presupuesto eliminado",
            description: "El presupuesto fue eliminado.",
            variant: "success",
        });
        await loadData();
    };

    // ─── Render ──────────────────────────────────────────

    return (
        <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Presupuestos
                    </h1>
                    <p className="mt-1.5 text-sm text-zinc-400">
                        Controla tus gastos con presupuestos inteligentes
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar presupuestos..."
                            className="h-9 w-56 rounded-md border border-zinc-700 bg-zinc-900 pl-9 pr-3 text-sm text-zinc-100 outline-none transition focus:border-lime-400 placeholder:text-zinc-500"
                        />
                    </div>
                    {/* New Budget */}
                    <button
                        onClick={openCreateModal}
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-lime-500/[0.15] px-4 text-sm font-semibold text-lime-400 transition hover:bg-lime-500/25"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo presupuesto
                    </button>
                </div>
            </section>

            {/* Budget Cards */}
            <section className="space-y-4">
                {loading ? (
                    <div className="rounded-xl border border-white/5 bg-[#121214] p-8 text-center text-zinc-500">
                        Cargando presupuestos...
                    </div>
                ) : filteredBudgets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-[#121214]/50 p-10 text-center">
                        <PiggyBank className="mx-auto h-7 w-7 text-zinc-500" />
                        <p className="mt-4 text-lg font-medium text-zinc-200">
                            {searchQuery ? "No se encontraron presupuestos" : "Aún no tienes presupuestos"}
                        </p>
                        <p className="mt-1 text-sm text-zinc-400">
                            {searchQuery
                                ? "Intenta con otro término de búsqueda"
                                : "Crea tu primer presupuesto para controlar tus gastos"}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={openCreateModal}
                                className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-lime-400 px-4 text-sm font-semibold text-black hover:bg-lime-300"
                            >
                                <Plus className="h-4 w-4" />
                                Crear Presupuesto
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                        {filteredBudgets.map((budget) => (
                            <BudgetCard
                                key={budget.id}
                                budget={budget}
                                onEdit={() => openEditModal(budget)}
                                onDelete={() => onDelete(budget)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <ModalShell onClose={() => setIsModalOpen(false)} maxWidth="max-w-lg">
                    <div className="px-6 pt-6 pb-1">
                        <h3 className="text-lg font-semibold text-zinc-100">
                            {formState.id ? "Editar presupuesto" : "Crear nuevo"}
                        </h3>
                        <p className="text-sm text-zinc-400">
                            Define un límite para controlar tus gastos
                        </p>
                    </div>

                    <form className="space-y-5 px-6 py-5" onSubmit={submitBudget}>
                        {/* Category Selector */}
                        <div className="flex items-center gap-4">
                            <label className="w-24 shrink-0 text-sm font-medium text-zinc-300">
                                Categoría
                            </label>
                            <div ref={categoryRef} className="relative flex-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCategoryOpen(!isCategoryOpen);
                                        setCategorySearch("");
                                    }}
                                    className={`flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm transition ${isCategoryOpen
                                        ? "border-lime-400 bg-zinc-900"
                                        : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
                                        }`}
                                >
                                    {selectedCategory ? (
                                        <span className="flex items-center gap-2 text-zinc-100">
                                            <span>{selectedCategory.icon || "📁"}</span>
                                            <span>{selectedCategory.name}</span>
                                        </span>
                                    ) : (
                                        <span className="text-zinc-500">Seleccionar categoría</span>
                                    )}
                                    <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${isCategoryOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isCategoryOpen && (
                                    <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-zinc-700 bg-[#1b1b1d] shadow-2xl">
                                        {/* Search */}
                                        <div className="border-b border-zinc-800 p-2">
                                            <input
                                                type="text"
                                                value={categorySearch}
                                                onChange={(e) => setCategorySearch(e.target.value)}
                                                placeholder='Buscar categoría... (ej: "casa" para encontrar "Vivienda")'
                                                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 placeholder:text-zinc-500"
                                                autoFocus
                                            />
                                        </div>
                                        {/* List */}
                                        <div className="max-h-56 overflow-y-auto p-1">
                                            <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                                                Predeterminadas
                                            </div>
                                            {filteredCategories.length === 0 ? (
                                                <div className="px-3 py-4 text-center text-sm text-zinc-500">
                                                    No se encontraron categorías
                                                </div>
                                            ) : (
                                                filteredCategories.map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormState((prev) => ({
                                                                ...prev,
                                                                categoryId: cat.id,
                                                                name: prev.name || cat.name,
                                                            }));
                                                            setIsCategoryOpen(false);
                                                        }}
                                                        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-white/5 ${formState.categoryId === cat.id
                                                            ? "bg-lime-500/10 text-lime-400"
                                                            : "text-zinc-200"
                                                            }`}
                                                    >
                                                        <span className="text-base">{cat.icon || "📁"}</span>
                                                        <span>{cat.name}</span>
                                                        {formState.categoryId === cat.id && (
                                                            <Check className="ml-auto h-4 w-4 text-lime-400" />
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Type Selector */}
                        <div className="flex items-center gap-4">
                            <label className="w-24 shrink-0 text-sm font-medium text-zinc-300">
                                Tipo
                            </label>
                            <div ref={typeRef} className="relative flex-1">
                                <button
                                    type="button"
                                    onClick={() => setIsTypeOpen(!isTypeOpen)}
                                    className={`flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm transition ${isTypeOpen
                                        ? "border-lime-400 bg-zinc-900"
                                        : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
                                        }`}
                                >
                                    <span className="text-zinc-100">
                                        {formState.budgetType === "fixed" ? "Fijo" : "Porcentaje"}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${isTypeOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isTypeOpen && (
                                    <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-zinc-700 bg-[#1b1b1d] shadow-2xl">
                                        <div className="p-1">
                                            {(["fixed", "percentage"] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormState((prev) => ({ ...prev, budgetType: type, amount: "" }));
                                                        setIsTypeOpen(false);
                                                    }}
                                                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition hover:bg-white/5 ${formState.budgetType === type
                                                        ? "bg-lime-500/10 text-lime-400"
                                                        : "text-zinc-200"
                                                        }`}
                                                >
                                                    {type === "fixed" ? (
                                                        <TrendingDown className="h-4 w-4" />
                                                    ) : (
                                                        <BarChart3 className="h-4 w-4" />
                                                    )}
                                                    <span>{type === "fixed" ? "Fijo" : "Porcentaje"}</span>
                                                    {formState.budgetType === type && (
                                                        <Check className="ml-auto h-4 w-4 text-lime-400" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amount / Percentage + Currency */}
                        <div className="flex items-center gap-4">
                            <label className="w-24 shrink-0 text-sm font-medium text-zinc-300">
                                {formState.budgetType === "fixed" ? "Límite" : "Porcentaje"}
                            </label>
                            <div className="flex flex-1 items-center gap-2">
                                {/* Amount Input */}
                                <input
                                    type="number"
                                    min="0"
                                    step={formState.budgetType === "percentage" ? "1" : "0.01"}
                                    max={formState.budgetType === "percentage" ? "100" : undefined}
                                    value={formState.amount}
                                    onChange={(e) =>
                                        setFormState((prev) => ({ ...prev, amount: e.target.value }))
                                    }
                                    placeholder={formState.budgetType === "fixed" ? "Monto" : "Porcentaje"}
                                    className="h-10 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition focus:border-lime-400 placeholder:text-zinc-500"
                                    required
                                />

                                {/* Currency Selector */}
                                <div ref={currencyRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCurrencyOpen(!isCurrencyOpen);
                                            setCurrencySearch("");
                                        }}
                                        className={`flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm transition whitespace-nowrap ${isCurrencyOpen
                                            ? "border-lime-400 bg-zinc-900"
                                            : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
                                            }`}
                                    >
                                        <span className="text-[10px] font-bold text-zinc-500">
                                            {(() => {
                                                const c = currencies.find((cur) => cur.code === formState.currency);
                                                return c?.flag || "🌍";
                                            })()}
                                        </span>
                                        <span className="text-zinc-100 font-medium">
                                            {formState.currency}
                                        </span>
                                        <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition ${isCurrencyOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {isCurrencyOpen && (
                                        <div className="absolute right-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border border-zinc-700 bg-[#1b1b1d] shadow-2xl">
                                            {/* Search */}
                                            <div className="border-b border-zinc-800 p-2">
                                                <div className="relative">
                                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                                    <input
                                                        type="text"
                                                        value={currencySearch}
                                                        onChange={(e) => setCurrencySearch(e.target.value)}
                                                        placeholder="Buscar moneda..."
                                                        className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 pl-9 pr-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 placeholder:text-zinc-500"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            {/* List */}
                                            <div className="max-h-64 overflow-y-auto p-1">
                                                {(["Favorita", "Latinoamérica", "Norteamérica", "Europa", "Asia", "Mundial"] as const).map(
                                                    (region) => {
                                                        const regionCurrencies = currencies.filter(
                                                            (c) =>
                                                                c.region === region &&
                                                                c.code !== "NONE" &&
                                                                (c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
                                                                    c.code.toLowerCase().includes(currencySearch.toLowerCase()))
                                                        );
                                                        if (regionCurrencies.length === 0) return null;
                                                        return (
                                                            <div key={region}>
                                                                <div className="px-3 py-1.5 text-[11px] font-medium text-zinc-500">
                                                                    {region}
                                                                </div>
                                                                {regionCurrencies.map((cur) => (
                                                                    <button
                                                                        key={cur.code}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormState((prev) => ({
                                                                                ...prev,
                                                                                currency: cur.code,
                                                                            }));
                                                                            setIsCurrencyOpen(false);
                                                                        }}
                                                                        className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition hover:bg-white/5 ${formState.currency === cur.code
                                                                            ? "bg-lime-500/10 text-lime-400"
                                                                            : "text-zinc-200"
                                                                            }`}
                                                                    >
                                                                        <span className="text-base">{cur.flag}</span>
                                                                        <span className="text-[10px] font-bold text-zinc-400">
                                                                            {cur.code.slice(0, 2)}
                                                                        </span>
                                                                        <span className="font-medium">{cur.code}</span>
                                                                        <span className="text-zinc-500">— {cur.name}</span>
                                                                        {cur.region === "Favorita" && (
                                                                            <Star className="ml-auto h-3 w-3 fill-yellow-500 text-yellow-500" />
                                                                        )}
                                                                        {formState.currency === cur.code && (
                                                                            <Check className="ml-auto h-4 w-4 text-lime-400" />
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        );
                                                    }
                                                )}
                                                {currencies.filter(
                                                    (c) =>
                                                        c.code !== "NONE" &&
                                                        (c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
                                                            c.code.toLowerCase().includes(currencySearch.toLowerCase()))
                                                ).length === 0 && (
                                                        <div className="px-3 py-6 text-center text-sm text-zinc-500">
                                                            No se encontraron resultados para &quot;{currencySearch}&quot;
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Type label hint */}
                        <div className="pl-28 text-xs text-zinc-500">
                            {formState.budgetType === "fixed" ? "Fijo" : "Porcentaje"}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#6b6e1a] px-5 text-sm font-semibold text-lime-100 transition hover:bg-[#7d8020] disabled:opacity-70"
                            >
                                <Plus className="h-4 w-4" />
                                {saving ? "Guardando..." : formState.id ? "Guardar" : "Crear"}
                            </button>
                        </div>
                    </form>
                </ModalShell>
            )}
        </main>
    );
}

// ─── Budget Card ─────────────────────────────────────

type ChartDataPoint = { date: string; daily: number; cumulative: number };

function BudgetCard({
    budget,
    onEdit,
    onDelete,
}: {
    budget: BudgetItem;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [chartLimit, setChartLimit] = useState(0);
    const [chartLoaded, setChartLoaded] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        obtenerGastoDiarioPresupuesto(budget.id).then((res) => {
            if (cancelled) return;
            if (res.datos && res.datos.length > 0) {
                setChartData(res.datos as ChartDataPoint[]);
                setChartLimit(res.limit || budget.effectiveLimit);
            } else {
                // Generate synthetic data for the current period (all zeros)
                const start = new Date(budget.periodStart);
                const end = new Date();
                const points: ChartDataPoint[] = [];
                const cur = new Date(start);
                while (cur <= end) {
                    points.push({ date: cur.toISOString().slice(0, 10), daily: 0, cumulative: 0 });
                    cur.setDate(cur.getDate() + 1);
                }
                if (points.length === 0) points.push({ date: start.toISOString().slice(0, 10), daily: 0, cumulative: 0 });
                setChartData(points);
                setChartLimit(budget.effectiveLimit);
            }
            setChartLoaded(true);
        });
        return () => { cancelled = true; };
    }, [budget.id, budget.effectiveLimit, budget.periodStart]);

    const progressColor =
        budget.progressPct >= 100
            ? "#FF4444"
            : budget.progressPct >= 80
                ? "#F59E0B"
                : "#22c55e";

    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset =
        circumference - (Math.min(budget.progressPct, 100) / 100) * circumference;

    // ── Chart math ─────────────────────────────────
    const W = 440;
    const H = 140;
    const PAD_X = 0;
    const PAD_TOP = 8;
    const PAD_BOT = 4;

    const maxY = Math.max(chartLimit * 1.15, ...(chartData.map((d) => d.cumulative)), 1);
    const n = chartData.length;

    const xScale = (i: number) => PAD_X + (i / Math.max(n - 1, 1)) * (W - PAD_X * 2);
    const yScale = (v: number) => PAD_TOP + (1 - v / maxY) * (H - PAD_TOP - PAD_BOT);

    // Catmull-Rom spline for smooth curves
    function toSmoothPath(points: { x: number; y: number }[]) {
        if (points.length < 2) return "";
        if (points.length === 2) {
            return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
        }
        let d = `M${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(i - 1, 0)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(i + 2, points.length - 1)];
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }
        return d;
    }

    const linePoints = chartData.map((d, i) => ({ x: xScale(i), y: yScale(d.cumulative) }));
    const linePath = toSmoothPath(linePoints);
    const limitY = yScale(chartLimit);
    const areaPath = linePath
        ? `${linePath} L${linePoints[linePoints.length - 1]?.x ?? 0},${H} L${linePoints[0]?.x ?? 0},${H} Z`
        : "";

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!chartContainerRef.current || n === 0) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const svgW = rect.width;
        const ratio = mouseX / svgW;
        const idx = Math.round(ratio * (n - 1));
        setHoveredIdx(Math.max(0, Math.min(idx, n - 1)));
    };

    const hoveredPoint = hoveredIdx !== null && chartData[hoveredIdx] ? chartData[hoveredIdx] : null;
    const hoveredDate = hoveredPoint
        ? new Date(hoveredPoint.date + "T12:00:00").toLocaleDateString("es-PE", { month: "short", day: "numeric" }).replace(".", "")
        : "";

    return (
        <article className="rounded-xl border border-white/5 bg-[#121214] p-5 transition-colors hover:border-white/10">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <span
                        className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${budget.budgetType === "percentage"
                                ? "bg-lime-500/15 text-lime-400"
                                : "bg-blue-500/15 text-blue-400"
                            }`}
                    >
                        {budget.budgetType === "percentage" ? "Porcentaje" : "Fijo"}
                    </span>
                    <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-100">
                        <span>{budget.category?.icon || "💰"}</span>
                        <span>{budget.name}</span>
                    </h3>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200">
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-950 text-zinc-100">
                        <DropdownMenuItem onClick={onEdit} className="cursor-pointer text-xs">Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-xs text-rose-400">Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Progress Ring + Info */}
            <div className="mb-4 flex items-center gap-5">
                <div className="relative flex shrink-0 items-center justify-center">
                    <svg width="88" height="88" className="-rotate-90">
                        <circle cx="44" cy="44" r={radius} fill="none" stroke="#27272a" strokeWidth="7" />
                        <circle
                            cx="44" cy="44" r={radius} fill="none"
                            stroke={progressColor} strokeWidth="7" strokeLinecap="round"
                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-700 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full mb-0.5" style={{ backgroundColor: progressColor }} />
                        <span className="text-sm font-bold text-zinc-100">{Math.round(budget.progressPct)}%</span>
                    </div>
                </div>
                <div className="min-w-0">
                    <p className="text-sm text-zinc-200">
                        <span className="font-semibold">{formatCurrency(budget.spentAmount, budget.currency)}</span>
                        <span className="text-zinc-400"> gastado de </span>
                        <span className="font-semibold">{formatCurrency(budget.effectiveLimit, budget.currency)}</span>
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                        {budget.budgetType === "percentage"
                            ? `Límite: ${budget.amount}% de tus ingresos mensuales (${formatCurrency(budget.incomeAmount, budget.currency)})`
                            : `Límite: ${formatCurrency(budget.amount, budget.currency)} mensuales`}
                    </p>
                </div>
            </div>

            {/* ── Professional Spending Chart ─────────── */}
            {chartLoaded && (
                <div
                    ref={chartContainerRef}
                    className="relative mt-2 mb-2"
                    onMouseLeave={() => setHoveredIdx(null)}
                >
                    {/* Tooltip */}
                    {hoveredPoint && hoveredIdx !== null && (
                        <div
                            className="pointer-events-none absolute z-20 rounded-lg border border-zinc-700 bg-[#18181b] px-3 py-2 text-xs shadow-xl"
                            style={{
                                left: `${(hoveredIdx / Math.max(n - 1, 1)) * 100}%`,
                                top: 0,
                                transform: "translate(-50%, -4px)",
                            }}
                        >
                            <div className="font-semibold text-zinc-100 mb-1">{hoveredDate}:</div>
                            <div className="text-zinc-400">
                                Límite: <span className="font-bold text-lime-400">{formatCurrency(chartLimit, budget.currency)}</span>
                            </div>
                            <div className="text-zinc-400">
                                Gasto: <span className={`font-bold ${hoveredPoint.cumulative > chartLimit ? "text-red-400" : "text-emerald-400"}`}>
                                    {formatCurrency(hoveredPoint.cumulative, budget.currency)}
                                </span>
                            </div>
                        </div>
                    )}

                    <svg
                        viewBox={`0 0 ${W} ${H}`}
                        className="w-full"
                        style={{ height: 140 }}
                        preserveAspectRatio="none"
                        onMouseMove={handleMouseMove}
                    >
                        <defs>
                            <linearGradient id={`grad-${budget.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={progressColor} stopOpacity="0.35" />
                                <stop offset="100%" stopColor={progressColor} stopOpacity="0.02" />
                            </linearGradient>
                        </defs>

                        {/* Area fill */}
                        {areaPath && (
                            <path d={areaPath} fill={`url(#grad-${budget.id})`} />
                        )}

                        {/* Limit line (dashed) */}
                        <line
                            x1={0} y1={limitY} x2={W} y2={limitY}
                            stroke="#22c55e" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6"
                        />

                        {/* Spending line */}
                        {linePath && (
                            <path
                                d={linePath}
                                fill="none" stroke={progressColor} strokeWidth="2.5" strokeLinecap="round"
                                className="transition-all duration-500"
                            />
                        )}

                        {/* Hovered vertical line + dot */}
                        {hoveredIdx !== null && linePoints[hoveredIdx] && (
                            <>
                                <line
                                    x1={linePoints[hoveredIdx].x} y1={PAD_TOP}
                                    x2={linePoints[hoveredIdx].x} y2={H - PAD_BOT}
                                    stroke="#71717a" strokeWidth="1" strokeDasharray="3 3"
                                />
                                <circle
                                    cx={linePoints[hoveredIdx].x} cy={linePoints[hoveredIdx].y}
                                    r="4" fill={progressColor} stroke="#121214" strokeWidth="2"
                                />
                            </>
                        )}

                        {/* End dot */}
                        {linePoints.length > 0 && hoveredIdx === null && (
                            <circle
                                cx={linePoints[linePoints.length - 1].x}
                                cy={linePoints[linePoints.length - 1].y}
                                r="3.5" fill={progressColor} stroke="#121214" strokeWidth="2"
                            />
                        )}
                    </svg>
                </div>
            )}

            {/* Horizontal progress bar */}
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(budget.progressPct, 100)}%`, backgroundColor: progressColor }}
                />
            </div>

            {/* Period range */}
            <p className="text-center text-xs text-zinc-500">
                {formatPeriodRange(budget.periodStart, budget.periodEnd)}
            </p>
        </article>
    );
}

// ─── Modal Shell ─────────────────────────────────────

function ModalShell({
    children,
    onClose,
    maxWidth = "max-w-3xl",
}: {
    children: ReactNode;
    onClose: () => void;
    maxWidth?: string;
}) {
    return (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 px-4 backdrop-blur-[2px]">
            <div
                className={`relative w-full ${maxWidth} overflow-hidden rounded-xl border border-zinc-700 bg-[#1b1b1d] shadow-2xl`}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
                >
                    <X className="h-4 w-4" />
                </button>
                {children}
            </div>
        </div>
    );
}

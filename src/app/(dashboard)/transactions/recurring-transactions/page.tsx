"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

// Components
import { RecurringCategoryChart } from "@/components/recurring/RecurringCategoryChart";
import { RecurringMiniCalendar } from "@/components/recurring/RecurringMiniCalendar";
import { PopularSubscriptionsGrid } from "@/components/recurring/PopularSubscriptionsGrid";
import { RecurringTable } from "@/components/recurring/RecurringTable";
import { RecurringWizardModal } from "@/components/recurring/RecurringWizardModal";
import { Play } from "lucide-react";

type RecurrenteItem = {
    id: string;
    name: string;
    description?: string | null;
    amount: number;
    currency: string;
    type: string;
    frequency: string;
    dayOfMonth?: number | null;
    status: string;
    accountId?: string | null;
    categoryId?: string | null;
    categoryName?: string | null;
    categoryIcon?: string | null;
    nextRunAt: string;
    lastRunAt?: string | null;
    executionCount: number;
    endCondition?: string;
    endDate?: string | null;
    maxOccurrences?: number | null;
    startDate?: string | null;
};

type OptionItem = { id: string; name: string; icon?: string };

type PopularSub = {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    price: number;
    currency: string;
    category: string;
    frequency: string;
};

export default function RecurringPage() {
    const { status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [recurrentes, setRecurrentes] = useState<RecurrenteItem[]>([]);
    const [cuentas, setCuentas] = useState<OptionItem[]>([]);
    const [categorias, setCategorias] = useState<OptionItem[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [ejecutando, setEjecutando] = useState(false);
    const [prefill, setPrefill] = useState<{ name: string; amount: number; currency: string } | null>(null);
    const [editingItem, setEditingItem] = useState<RecurrenteItem | null>(null);
    const [chartKey, setChartKey] = useState(0);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    const cargarDatos = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            void cargarDatos();
        }
    }, [status, cargarDatos]);

    // Handle popular subscription click
    function handlePopularSelect(sub: PopularSub) {
        setEditingItem(null);
        setPrefill({
            name: sub.name,
            amount: sub.price,
            currency: sub.currency,
        });
        setModalAbierto(true);
    }

    // Handle new button click
    function handleNueva() {
        setEditingItem(null);
        setPrefill(null);
        setModalAbierto(true);
    }

    // Handle wizard submit (create or update)
    async function handleWizardSubmit(data: {
        accountId: string;
        type: string;
        description: string;
        amount: string;
        currency: string;
        categoryId: string;
        frequency: string;
        dayOfMonth: string;
        startDate: string;
        endCondition: string;
        endDate: string;
        maxOccurrences: string;
    }) {
        if (editingItem) {
            // --- UPDATE MODE ---
            const result = await actualizarRecurrente(editingItem.id, {
                name: data.description,
                description: data.description,
                amount: parseFloat(data.amount),
                currency: data.currency,
                type: data.type,
                frequency: data.frequency,
                dayOfMonth: data.dayOfMonth ? parseInt(data.dayOfMonth) : undefined,
                accountId: data.accountId || undefined,
                categoryId: data.categoryId || undefined,
                endCondition: data.endCondition,
                endDate: data.endDate || undefined,
                maxOccurrences: data.maxOccurrences ? parseInt(data.maxOccurrences) : undefined,
            });

            if (!result.ok) {
                toast({ title: "Error al actualizar", description: result.error, variant: "error" });
                return;
            }

            setModalAbierto(false);
            setEditingItem(null);
            toast({
                title: "Recurrente actualizada",
                description: "Los cambios se guardaron correctamente.",
                variant: "success",
            });
        } else {
            // --- CREATE MODE ---
            const result = await crearRecurrente({
                name: data.description,
                description: data.description,
                amount: parseFloat(data.amount),
                currency: data.currency,
                type: data.type,
                frequency: data.frequency,
                dayOfMonth: data.dayOfMonth ? parseInt(data.dayOfMonth) : undefined,
                accountId: data.accountId || undefined,
                categoryId: data.categoryId || undefined,
                startDate: data.startDate || undefined,
                endCondition: data.endCondition,
                endDate: data.endDate || undefined,
                maxOccurrences: data.maxOccurrences ? parseInt(data.maxOccurrences) : undefined,
            });

            if (!result.ok) {
                toast({ title: "Error al crear", description: result.error, variant: "error" });
                return;
            }

            setModalAbierto(false);
            setPrefill(null);
            toast({
                title: "Recurrente creada",
                description: "La transacción recurrente se creó correctamente.",
                variant: "success",
            });
        }
        await cargarDatos();
        setChartKey((k) => k + 1);
    }

    // Toggle pause/resume
    async function handleTogglePause(rec: RecurrenteItem) {
        const nuevoStatus = rec.status === "active" ? "paused" : "active";
        const result = await actualizarRecurrente(rec.id, { status: nuevoStatus });
        if (!result.ok) {
            toast({ title: "Error", description: result.error, variant: "error" });
            return;
        }
        toast({
            title: nuevoStatus === "active" ? "Recurrente activada" : "Recurrente pausada",
            variant: "success",
        });
        await cargarDatos();
        setChartKey((k) => k + 1);
    }

    // Delete
    async function handleEliminar(id: string) {
        if (!confirm("¿Eliminar esta transacción recurrente?")) return;
        const result = await eliminarRecurrente(id);
        if (!result.ok) {
            toast({ title: "Error", description: result.error, variant: "error" });
            return;
        }
        toast({ title: "Eliminada", description: "La transacción recurrente fue eliminada.", variant: "success" });
        await cargarDatos();
        setChartKey((k) => k + 1);
    }

    // Edit — pass full item data to modal
    function handleEdit(rec: RecurrenteItem) {
        setPrefill(null);
        setEditingItem(rec);
        setModalAbierto(true);
    }

    // Execute pending
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
            toast({ title: "Error", description: result.error, variant: "error" });
        }
        await cargarDatos();
        setChartKey((k) => k + 1);
    }

    // Compute pending count
    const pendientes = recurrentes.filter(
        (r) => r.status === "active" && new Date(r.nextRunAt) <= new Date()
    ).length;

    // Compute recurring dates for calendar
    const recurringDates = recurrentes
        .filter((r) => r.status === "active")
        .map((r) => ({
            day: new Date(r.nextRunAt).getDate(),
            name: r.name,
            type: r.type,
        }));

    if (status === "loading") return null;

    return (
        <main className="p-4 lg:p-6">
            <div className="max-w-[1200px] mx-auto space-y-4">

                {/* Row 1: Chart + Calendar */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
                    <RecurringCategoryChart key={chartKey} />
                    <RecurringMiniCalendar recurringDates={recurringDates} />
                </div>

                {/* Row 2: Popular subscriptions */}
                <PopularSubscriptionsGrid onSelect={handlePopularSelect} />

                {/* Execute pending banner */}
                {pendientes > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-sm text-amber-300">
                                Tienes {pendientes} {pendientes === 1 ? "transacción pendiente" : "transacciones pendientes"} de ejecutar
                            </span>
                        </div>
                        <button
                            onClick={handleEjecutar}
                            disabled={ejecutando}
                            className="flex items-center gap-1.5 bg-amber-500 text-black px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors"
                        >
                            <Play className="w-3 h-3" />
                            {ejecutando ? "Ejecutando..." : "Ejecutar pendientes"}
                        </button>
                    </div>
                )}

                {/* Row 3: Table */}
                {cargando ? (
                    <div className="h-48 animate-pulse rounded-xl bg-zinc-900/40 border border-white/5" />
                ) : (
                    <RecurringTable
                        recurrentes={recurrentes}
                        onEdit={handleEdit}
                        onTogglePause={handleTogglePause}
                        onDelete={handleEliminar}
                        onNew={handleNueva}
                    />
                )}
            </div>

            {/* Wizard Modal */}
            <RecurringWizardModal
                isOpen={modalAbierto}
                onClose={() => { setModalAbierto(false); setPrefill(null); setEditingItem(null); }}
                onSubmit={handleWizardSubmit}
                cuentas={cuentas}
                categorias={categorias}
                baseCurrency="PEN"
                prefill={prefill}
                editData={editingItem}
            />
        </main>
    );
}

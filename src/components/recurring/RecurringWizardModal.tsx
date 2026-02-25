"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

type OptionItem = { id: string; name: string; icon?: string };

interface WizardData {
    // Step 1
    accountId: string;
    type: string;
    description: string;
    amount: string;
    currency: string;
    categoryId: string;
    // Step 2
    frequency: string;
    dayOfMonth: string;
    startDate: string;
    // Step 3
    endCondition: string;
    endDate: string;
    maxOccurrences: string;
}

/** Full data of an existing recurring transaction for edit mode */
interface EditData {
    id: string;
    name: string;
    description?: string | null;
    amount: number;
    currency: string;
    type: string;
    frequency: string;
    dayOfMonth?: number | null;
    accountId?: string | null;
    categoryId?: string | null;
    status: string;
    startDate?: string | null;
    endCondition?: string;
    endDate?: string | null;
    maxOccurrences?: number | null;
}

interface RecurringWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: WizardData) => Promise<void>;
    cuentas: OptionItem[];
    categorias: OptionItem[];
    baseCurrency: string;
    /** Pre-fill data from a popular subscription (create mode) */
    prefill?: {
        name: string;
        amount: number;
        currency: string;
    } | null;
    /** Full edit data — when set, modal is in edit mode */
    editData?: EditData | null;
}

const STEP_TITLES = [
    "Información Básica",
    "Configuración de Recurrencia",
    "Condición de Finalización",
];

export function RecurringWizardModal({
    isOpen,
    onClose,
    onSubmit,
    cuentas,
    categorias,
    baseCurrency,
    prefill,
    editData,
}: RecurringWizardModalProps) {
    const [step, setStep] = useState(1);
    const [guardando, setGuardando] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    const isEditing = !!editData;

    // Build initial state based on mode
    function buildInitialData(): WizardData {
        if (editData) {
            return {
                accountId: editData.accountId || "",
                type: editData.type || "expense",
                description: editData.name || "",
                amount: editData.amount?.toString() || "",
                currency: editData.currency || baseCurrency,
                categoryId: editData.categoryId || "",
                frequency: editData.frequency || "monthly",
                dayOfMonth: editData.dayOfMonth?.toString() || "1",
                startDate: editData.startDate
                    ? new Date(editData.startDate).toISOString().split("T")[0]
                    : today,
                endCondition: editData.endCondition || "never",
                endDate: editData.endDate
                    ? new Date(editData.endDate).toISOString().split("T")[0]
                    : "",
                maxOccurrences: editData.maxOccurrences?.toString() || "",
            };
        }
        return {
            accountId: cuentas.length === 1 ? cuentas[0].id : "",
            type: "expense",
            description: prefill?.name || "",
            amount: prefill?.amount?.toString() || "",
            currency: prefill?.currency || baseCurrency,
            categoryId: "",
            frequency: "monthly",
            dayOfMonth: "1",
            startDate: today,
            endCondition: "never",
            endDate: "",
            maxOccurrences: "",
        };
    }

    const [data, setData] = useState<WizardData>(buildInitialData);

    // Re-initialize when modal opens or editData/prefill changes
    useEffect(() => {
        if (isOpen) {
            setData(buildInitialData());
            setStep(1);
        }
    }, [isOpen, editData?.id, prefill?.name]);

    function updateField(field: keyof WizardData, value: string) {
        setData((prev) => ({ ...prev, [field]: value }));
    }

    function canGoNext(): boolean {
        if (step === 1) {
            return data.accountId !== "" && data.description.trim() !== "" && data.amount !== "" && parseFloat(data.amount) > 0;
        }
        if (step === 2) {
            return data.startDate !== "";
        }
        return true;
    }

    async function handleSubmit() {
        setGuardando(true);
        await onSubmit(data);
        setGuardando(false);
        setStep(1);
    }

    function handleClose() {
        setStep(1);
        onClose();
    }

    if (!isOpen) return null;

    const currencies = ["PEN", "USD", "EUR", "BRL", "COP", "MXN", "ARS", "CLP"];
    const currencyFlags: Record<string, string> = {
        PEN: "🇵🇪", USD: "🇺🇸", EUR: "🇪🇺", BRL: "🇧🇷",
        COP: "🇨🇴", MXN: "🇲🇽", ARS: "🇦🇷", CLP: "🇨🇱",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-xl mx-4 shadow-2xl">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="px-6 pt-6 pb-2">
                    <h2 className="text-lg font-semibold text-white">
                        {isEditing ? "Editar Transacción Recurrente" : "Nueva Transacción Recurrente"}
                    </h2>
                    <p className="text-sm text-zinc-500">
                        Paso {step} de 3: {STEP_TITLES[step - 1]}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-0 py-4 px-6">
                    {[1, 2, 3].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s <= step
                                    ? "bg-[#D3FF0A] text-black shadow-[0_0_12px_rgba(211,255,10,0.3)]"
                                    : "bg-zinc-800 text-zinc-500 border border-white/10"
                                    }`}
                            >
                                {s}
                            </div>
                            {i < 2 && (
                                <div
                                    className={`w-16 h-0.5 transition-colors ${s < step ? "bg-[#D3FF0A]" : "bg-zinc-700"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step content */}
                <div className="px-6 pb-6 space-y-4">
                    {step === 1 && (
                        <>
                            {/* Cuenta */}
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1.5">
                                    Cuenta <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={data.accountId}
                                    onChange={(e) => updateField("accountId", e.target.value)}
                                    className={`w-full bg-zinc-800 border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3FF0A]/60 transition-colors ${data.accountId ? "border-[#D3FF0A]/30" : "border-red-500/30"
                                        }`}
                                >
                                    <option value="">Seleccionar cuenta</option>
                                    {cuentas.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {!data.accountId && (
                                    <p className="text-[10px] text-amber-400/80 mt-1">
                                        ⚠ Necesitas asignar una cuenta para poder ejecutar esta recurrente
                                    </p>
                                )}
                            </div>

                            {/* Tipo */}
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1.5">
                                    Tipo <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={data.type}
                                    onChange={(e) => updateField("type", e.target.value)}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3FF0A]/60 transition-colors"
                                >
                                    <option value="expense">Gasto</option>
                                    <option value="income">Ingreso</option>
                                </select>
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1.5">
                                    Descripción <span className="text-red-400">*</span>
                                </label>
                                <input
                                    value={data.description}
                                    onChange={(e) => updateField("description", e.target.value)}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#D3FF0A]/60 transition-colors"
                                    placeholder="Ej: Netflix mensual"
                                    required
                                />
                            </div>

                            {/* Monto + Moneda */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1.5">
                                        Monto <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={data.amount}
                                        onChange={(e) => updateField("amount", e.target.value)}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#D3FF0A]/60 transition-colors"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1.5">
                                        Moneda <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={data.currency}
                                        onChange={(e) => updateField("currency", e.target.value)}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3FF0A]/60 transition-colors"
                                    >
                                        {currencies.map((c) => (
                                            <option key={c} value={c}>
                                                {currencyFlags[c] || ""} {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Categoría */}
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1.5">
                                    Categoría (opcional)
                                </label>
                                <select
                                    value={data.categoryId}
                                    onChange={(e) => updateField("categoryId", e.target.value)}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3FF0A]/60 transition-colors"
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categorias.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon || "📋"} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* Frecuencia + Día del mes */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1.5">
                                        Frecuencia
                                    </label>
                                    <select
                                        value={data.frequency}
                                        onChange={(e) => updateField("frequency", e.target.value)}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3FF0A]/60 transition-colors"
                                    >
                                        <option value="daily">Diaria</option>
                                        <option value="weekly">Semanal</option>
                                        <option value="biweekly">Quincenal</option>
                                        <option value="monthly">Mensual</option>
                                        <option value="yearly">Anual</option>
                                    </select>
                                </div>
                                {data.frequency === "monthly" && (
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1.5">
                                            Día del mes
                                        </label>
                                        <select
                                            value={data.dayOfMonth}
                                            onChange={(e) => updateField("dayOfMonth", e.target.value)}
                                            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3FF0A]/60 transition-colors"
                                        >
                                            <option value="1">Primer día</option>
                                            <option value="15">Día 15</option>
                                            <option value="0">Último día</option>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                                <option key={d} value={d.toString()}>Día {d}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Fecha de inicio */}
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1.5">
                                    Fecha de inicio <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={data.startDate}
                                        onChange={(e) => updateField("startDate", e.target.value)}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3FF0A]/60 transition-colors [color-scheme:dark]"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            {/* Condición de finalización */}
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1.5">
                                    Condición de finalización
                                </label>
                                <select
                                    value={data.endCondition}
                                    onChange={(e) => updateField("endCondition", e.target.value)}
                                    className="w-full bg-zinc-800 border border-[#D3FF0A]/30 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3FF0A]/60 transition-colors"
                                >
                                    <option value="never">Nunca</option>
                                    <option value="after_count">Después de X pagos</option>
                                    <option value="on_date">En una fecha específica</option>
                                </select>
                            </div>

                            {data.endCondition === "after_count" && (
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1.5">
                                        Número de ejecuciones
                                    </label>
                                    <input
                                        type="number"
                                        value={data.maxOccurrences}
                                        onChange={(e) => updateField("maxOccurrences", e.target.value)}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#D3FF0A]/60 transition-colors"
                                        placeholder="Ej: 12"
                                        min="1"
                                    />
                                </div>
                            )}

                            {data.endCondition === "on_date" && (
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1.5">
                                        Fecha de finalización
                                    </label>
                                    <input
                                        type="date"
                                        value={data.endDate}
                                        onChange={(e) => updateField("endDate", e.target.value)}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D3FF0A]/60 transition-colors [color-scheme:dark]"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-2 px-6 pb-6">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                    >
                        Cancelar
                    </button>
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                        >
                            Anterior
                        </button>
                    )}
                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!canGoNext()}
                            className="px-5 py-2 rounded-lg bg-[#D3FF0A] text-black text-sm font-semibold hover:bg-[#bde609] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Siguiente
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={guardando}
                            className="px-5 py-2 rounded-lg bg-[#D3FF0A] text-black text-sm font-semibold hover:bg-[#bde609] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {guardando
                                ? (isEditing ? "Guardando..." : "Creando...")
                                : (isEditing ? "Guardar cambios" : "Crear")
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

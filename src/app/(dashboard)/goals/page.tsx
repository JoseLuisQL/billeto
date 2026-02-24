"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Goal,
  MoreVertical,
  Plus,
  Target,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";
import {
  actualizarMeta,
  crearMeta,
  eliminarContribucionMeta,
  eliminarMeta,
  listarMetas,
  listarPlantillasMeta,
  obtenerHistorialMeta,
  obtenerResumenMetas,
} from "@/lib/actions/goals";
import { currencies } from "@/lib/currencies";
import { useToast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type GoalStatus = "active" | "paused" | "completed" | "archived";

type GoalTemplateCategory = "todas" | "emergencia" | "compra" | "viaje" | "educacion" | "jubilacion" | "otra";

type GoalTemplate = {
  id: string;
  name: string;
  description: string;
  category: GoalTemplateCategory;
  emoji?: string | null;
  targetAmount: number;
  currency: string;
  suggestedMonths: number;
  sortOrder: number;
};

type GoalItem = {
  id: string;
  templateId: string | null;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  progressPct: number;
  currency: string;
  category: string | null;
  emoji: string | null;
  deadline: string | null;
  status: GoalStatus;
  monthlyRequired: number;
};

type GoalSummary = {
  metasActivas: number;
  progresoGeneral: number;
  metasCompletadas: number;
  requiereAtencion: number;
  perspectiva: {
    title: string;
    message: string;
    tone: "neutral" | "warning" | "positive";
  };
};

type GoalContribution = {
  id: string;
  amount: number;
  currency: string;
  amountBase: number;
  sourceAmount?: number | null;
  sourceCurrency?: string | null;
  exchangeRate?: number | null;
  source: string;
  note: string | null;
  createdAt: string;
  transaction: {
    id: string;
    description: string;
    date: string;
    type: string;
    amountOriginal: number;
    currencyOriginal: string;
  } | null;
};

type GoalHistory = {
  meta: GoalItem;
  contributions: GoalContribution[];
};

type GoalFormState = {
  id?: string;
  templateId?: string;
  name: string;
  targetAmount: string;
  currency: string;
  currentAmount: string;
  deadline: string;
  category: string;
  emoji: string;
  status: GoalStatus;
};

const CATEGORIES: Array<{ key: GoalTemplateCategory; label: string }> = [
  { key: "todas", label: "Todas" },
  { key: "emergencia", label: "Emergencia" },
  { key: "compra", label: "Compra" },
  { key: "viaje", label: "Viaje" },
  { key: "educacion", label: "Educación" },
  { key: "jubilacion", label: "Jubilación" },
  { key: "otra", label: "Otra" },
];

const STATUS_OPTIONS: Array<{ key: GoalStatus; label: string }> = [
  { key: "active", label: "Activa" },
  { key: "paused", label: "Pausada" },
  { key: "completed", label: "Completada" },
  { key: "archived", label: "Archivada" },
];

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

function getCurrencyCodes() {
  const list = currencies
    .map((item) => item.code)
    .filter((code) => code !== "NONE");

  return Array.from(new Set(list));
}

function getDeadlineMeta(deadline: string | null) {
  if (!deadline) {
    return { label: "Sin fecha meta", daysLeft: null as number | null };
  }

  const date = new Date(deadline);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const daysLeft = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);

  return {
    label: date.toLocaleDateString("es-PE", { month: "short", year: "numeric" }),
    daysLeft,
  };
}

export default function GoalsPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [summary, setSummary] = useState<GoalSummary>({
    metasActivas: 0,
    progresoGeneral: 0,
    metasCompletadas: 0,
    requiereAtencion: 0,
    perspectiva: {
      title: "Cargando perspectivas...",
      message: "",
      tone: "neutral",
    },
  });

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<GoalTemplateCategory>("todas");
  const [history, setHistory] = useState<GoalHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingContributionId, setDeletingContributionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState<GoalFormState>({
    name: "",
    targetAmount: "",
    currency: "USD",
    currentAmount: "0",
    deadline: "",
    category: "",
    emoji: "",
    status: "active",
  });

  const currencyCodes = useMemo(() => getCurrencyCodes(), []);

  const templatesByFilter = useMemo(() => {
    if (templateCategory === "todas") return templates;
    return templates.filter((item) => item.category === templateCategory);
  }, [templates, templateCategory]);

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === "active" || goal.status === "paused"),
    [goals]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    const [templatesResult, goalsResult, summaryResult] = await Promise.all([
      listarPlantillasMeta("todas"),
      listarMetas({ status: "all" }),
      obtenerResumenMetas(),
    ]);

    if (!templatesResult.error) {
      setTemplates(templatesResult.plantillas as GoalTemplate[]);
    }

    if (!goalsResult.error) {
      setGoals(goalsResult.metas as GoalItem[]);
    }

    setSummary(summaryResult as GoalSummary);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  const resetForm = () => {
    setFormState({
      name: "",
      targetAmount: "",
      currency: "USD",
      currentAmount: "0",
      deadline: "",
      category: "",
      emoji: "",
      status: "active",
    });
  };

  const openCustomGoalModal = () => {
    resetForm();
    setIsTemplateModalOpen(false);
    setIsFormModalOpen(true);
  };

  const openTemplateGoalModal = (template: GoalTemplate) => {
    setFormState({
      templateId: template.id,
      name: template.name === "Auto Nuevo" ? "Nuevo carro" : template.name,
      targetAmount: String(template.targetAmount),
      currency: template.currency,
      currentAmount: "0",
      deadline: "",
      category: template.category,
      emoji: template.emoji || "",
      status: "active",
    });
    setIsTemplateModalOpen(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (goal: GoalItem) => {
    setFormState({
      id: goal.id,
      templateId: goal.templateId || undefined,
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currency: goal.currency,
      currentAmount: String(goal.currentAmount),
      deadline: goal.deadline ? goal.deadline.slice(0, 10) : "",
      category: goal.category || "",
      emoji: goal.emoji || "",
      status: goal.status,
    });
    setIsFormModalOpen(true);
  };

  const openHistoryModal = async (goal: GoalItem) => {
    setHistoryLoading(true);
    setIsHistoryModalOpen(true);

    const result = await obtenerHistorialMeta(goal.id);
    if (result.error || !result.historial) {
      toast({
        title: "Error",
        description: result.error || "No se pudo cargar el historial.",
        variant: "error",
      });
      setHistory(null);
    } else {
      setHistory(result.historial as GoalHistory);
    }

    setHistoryLoading(false);
  };

  const eliminarContribucion = async (contributionId: string) => {
    if (!history?.meta?.id) return;

    setDeletingContributionId(contributionId);
    const result = await eliminarContribucionMeta({
      goalId: history.meta.id,
      contributionId,
    });
    setDeletingContributionId(null);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "error" });
      return;
    }

    toast({ title: "Contribución eliminada", description: "La asignación fue removida correctamente.", variant: "success" });

    await Promise.all([
      openHistoryModal(history.meta),
      loadData(),
    ]);
  };

  const submitGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData();
    formData.set("name", formState.name.trim());
    formData.set("targetAmount", formState.targetAmount);
    formData.set("currency", formState.currency);
    formData.set("currentAmount", formState.currentAmount || "0");
    formData.set("deadline", formState.deadline);
    formData.set("category", formState.category);
    formData.set("emoji", formState.emoji);
    formData.set("status", formState.status);
    if (formState.templateId) formData.set("templateId", formState.templateId);

    setSaving(true);
    const result = formState.id
      ? await actualizarMeta(formState.id, formData)
      : await crearMeta(formData);
    setSaving(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "error" });
      return;
    }

    toast({
      title: formState.id ? "Meta actualizada" : "Meta creada",
      description: formState.id
        ? "La meta se actualizó correctamente."
        : "La meta se registró correctamente.",
      variant: "success",
    });

    setIsFormModalOpen(false);
    resetForm();
    await loadData();
  };

  const onDeleteGoal = async (goal: GoalItem) => {
    const confirmed = confirm(`¿Eliminar la meta "${goal.name}"?`);
    if (!confirmed) return;

    const result = await eliminarMeta(goal.id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "error" });
      return;
    }

    toast({ title: "Meta eliminada", description: "La meta fue eliminada.", variant: "success" });
    await loadData();
  };

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col gap-4 rounded-xl border border-white/10 bg-zinc-900/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-100">Mis Metas</h1>
          <p className="mt-1 text-sm text-zinc-400">Sigue tu progreso y alcanza lo que te propones</p>
        </div>
        <button
          onClick={() => setIsTemplateModalOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-lime-400 px-4 text-sm font-semibold text-black transition hover:bg-lime-300"
        >
          <Plus className="h-4 w-4" />
          Nueva Meta
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Metas Activas" value={summary.metasActivas} icon={<Goal className="h-4 w-4" />} />
        <KpiCard title="Progreso General" value={`${Math.round(summary.progresoGeneral)}%`} icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard title="Metas Completadas" value={summary.metasCompletadas} icon={<CheckCircle2 className="h-4 w-4" />} />
        <KpiCard title="Requiere Atención" value={summary.requiereAtencion} icon={<AlertCircle className="h-4 w-4" />} />
      </section>

      <section className="rounded-xl border border-white/10 bg-zinc-900/40 p-5">
        <h2 className="mb-2 text-lg font-semibold text-zinc-100">Perspectivas</h2>
        <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4">
          <p className="text-base font-semibold text-zinc-100">{summary.perspectiva.title}</p>
          <p className="mt-1 text-sm text-zinc-400">{summary.perspectiva.message}</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-100">Metas Activas</h2>
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-8 text-center text-zinc-500">Cargando metas...</div>
        ) : activeGoals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-zinc-900/40 p-10 text-center">
            <Target className="mx-auto h-7 w-7 text-zinc-500" />
            <p className="mt-4 text-lg font-medium text-zinc-200">Aún no tienes metas</p>
            <p className="mt-1 text-sm text-zinc-400">Crea tu primera meta para comenzar a ahorrar</p>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-lime-400 px-4 text-sm font-semibold text-black hover:bg-lime-300"
            >
              <Plus className="h-4 w-4" />
              Crear Meta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 justify-items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {activeGoals.map((goal) => {
              const deadlineMeta = getDeadlineMeta(goal.deadline);
              const statusLabel = STATUS_OPTIONS.find((item) => item.key === goal.status)?.label || "Activa";

              return (
                <article
                  key={goal.id}
                  className="h-[412px] w-[340px] rounded-xl border border-white/10 bg-zinc-900/70 p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-zinc-500">META</p>
                      <h3 className="mt-1 truncate text-[1.9rem] font-semibold leading-tight text-zinc-100">{goal.name}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-950 text-zinc-100">
                        <DropdownMenuItem onClick={() => openEditModal(goal)} className="cursor-pointer text-xs">Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openHistoryModal(goal)} className="cursor-pointer text-xs">Ver historial</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteGoal(goal)} className="cursor-pointer text-xs text-rose-400">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-3 inline-flex rounded-full bg-lime-400 px-2.5 py-1 text-[11px] font-semibold text-black">
                    {statusLabel}
                  </div>

                  <div className="mb-1 flex items-center justify-between text-[1.75rem] leading-none text-zinc-100">
                    <span>Progreso</span>
                    <span className="font-semibold">{goal.progressPct.toFixed(1)}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800/80">
                    <div
                      className="h-full rounded-full bg-lime-400"
                      style={{ width: `${Math.min(goal.progressPct, 100)}%` }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 items-center gap-3 text-[1.65rem] font-semibold text-zinc-100 leading-tight">
                    <span className="truncate">{formatCurrency(goal.currentAmount, goal.currency)}</span>
                    <span className="truncate text-right">{formatCurrency(goal.targetAmount, goal.currency)}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[1rem] text-zinc-500">Falta</p>
                      <p className="truncate text-[1.95rem] leading-tight font-semibold text-zinc-100">{formatCurrency(goal.remaining, goal.currency)}</p>
                    </div>
                    <div>
                      <p className="inline-flex items-center gap-1 text-[1rem] text-zinc-500">
                        <Calendar className="h-4 w-4" /> Fecha Meta
                      </p>
                      <p className="text-[1.95rem] leading-tight font-semibold text-zinc-100">{deadlineMeta.label}</p>
                      {deadlineMeta.daysLeft != null ? <p className="text-[0.95rem] text-zinc-500">({deadlineMeta.daysLeft}d)</p> : null}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[1rem] text-zinc-500">Mensual</p>
                    <p className="truncate text-[1.95rem] leading-tight font-semibold text-zinc-100">{formatCurrency(goal.monthlyRequired, goal.currency)}</p>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-3">
                    <p className="text-[1.05rem] text-lime-300">¡Estás haciendo un gran progreso! Mantén el impulso.</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {isTemplateModalOpen && (
        <ModalShell onClose={() => setIsTemplateModalOpen(false)}>
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="text-lg font-semibold text-zinc-100">Elige una plantilla</h3>
            <p className="text-sm text-zinc-400">Comienza con una plantilla o crea una meta personalizada</p>
          </div>

          <div className="px-5 py-4">
            <div className="mb-4 flex flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTemplateCategory(item.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    templateCategory === item.key
                      ? "bg-lime-400 text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {templatesByFilter.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => openTemplateGoalModal(template)}
                    className="rounded-lg border border-white/10 bg-zinc-900/70 p-4 text-left transition hover:border-lime-400/60 hover:bg-zinc-800"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-lg">{template.emoji || "🎯"}</span>
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-100">{template.name}</p>
                    <p className="mt-1 text-xs text-zinc-400">{template.description}</p>
                    <p className="mt-3 text-base font-semibold text-zinc-100">
                      {formatCurrency(template.targetAmount, template.currency)}
                    </p>
                    <p className="text-xs text-zinc-400">Cronograma sugerido: {template.suggestedMonths} meses</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 p-4">
            <button
              onClick={openCustomGoalModal}
              className="h-10 w-full rounded-md bg-zinc-800 text-sm font-semibold text-zinc-200 hover:bg-zinc-700"
            >
              Crear Meta Personalizada
            </button>
          </div>
        </ModalShell>
      )}

      {isFormModalOpen && (
        <ModalShell onClose={() => setIsFormModalOpen(false)} maxWidth="max-w-lg">
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="text-lg font-semibold text-zinc-100">{formState.id ? "Editar Meta" : "Crear Meta"}</h3>
            <p className="text-sm text-zinc-400">Crea tu primera meta para comenzar a ahorrar</p>
          </div>

          <form className="space-y-4 px-5 py-4" onSubmit={submitGoal}>
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Nombre de la Meta</label>
              <input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ej: Fondo de Emergencia"
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-lime-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-zinc-300">Monto Meta</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.targetAmount}
                  onChange={(event) => setFormState((prev) => ({ ...prev, targetAmount: event.target.value }))}
                  placeholder="0.00"
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-lime-400"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-300">Moneda</label>
                <select
                  value={formState.currency}
                  onChange={(event) => setFormState((prev) => ({ ...prev, currency: event.target.value }))}
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-lime-400"
                >
                  {currencyCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Ahorros Actuales (Opcional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formState.currentAmount}
                onChange={(event) => setFormState((prev) => ({ ...prev, currentAmount: event.target.value }))}
                placeholder="0.00"
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-lime-400"
              />
              <p className="mt-1 text-xs text-zinc-500">¿Cuánto has ahorrado ya para esta meta?</p>
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Fecha Meta (Opcional)</label>
              <input
                type="date"
                value={formState.deadline}
                onChange={(event) => setFormState((prev) => ({ ...prev, deadline: event.target.value }))}
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-lime-400"
              />
            </div>

            {formState.id && (
              <div>
                <label className="mb-1 block text-sm text-zinc-300">Estado</label>
                <select
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: event.target.value as GoalStatus,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-lime-400"
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="h-10 rounded-md border border-zinc-700 px-4 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-md bg-lime-400 px-4 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-70"
              >
                {saving ? "Guardando..." : formState.id ? "Actualizar Meta" : "Crear Meta"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {isHistoryModalOpen && (
        <ModalShell onClose={() => setIsHistoryModalOpen(false)} maxWidth="max-w-3xl">
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="text-2xl font-semibold text-zinc-100">
              {history?.meta?.name || "Meta"} - Historial de Contribuciones
            </h3>
            <p className="text-sm text-zinc-400">Ver todas las contribuciones hechas a esta meta</p>
          </div>

          <div className="max-h-[72vh] overflow-y-auto px-5 py-4">
            {historyLoading || !history ? (
              <p className="py-10 text-center text-sm text-zinc-500">Cargando historial...</p>
            ) : (
              <>
                <div className="mb-4 rounded-lg border border-white/10 bg-zinc-900/70 p-4">
                  <p className="text-sm text-zinc-400">Progreso Actual</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-3xl font-bold text-zinc-100">
                      {formatCurrency(history.meta.currentAmount, history.meta.currency)} / {formatCurrency(history.meta.targetAmount, history.meta.currency)}
                    </p>
                    <p className="text-sm font-semibold text-zinc-300">{history.meta.progressPct.toFixed(1)}%</p>
                  </div>
                </div>

                {history.contributions.length === 0 ? (
                  <p className="rounded-md border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">
                    Aún no hay contribuciones para esta meta.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.contributions.map((item) => {
                      const txDate = item.transaction?.date || item.createdAt;
                      const txCurrency = item.sourceCurrency || item.transaction?.currencyOriginal || item.currency;
                      const txAmount = item.sourceAmount ?? item.transaction?.amountOriginal ?? item.amount;

                      return (
                        <div key={item.id} className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="inline-flex items-center gap-1 text-sm text-zinc-400">
                                <Calendar className="h-4 w-4" />
                                {new Date(txDate).toLocaleDateString("es-PE", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="mt-1 truncate text-lg font-semibold text-zinc-100">
                                {item.note || item.transaction?.description || "Contribución"}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-300">
                                <span>
                                  {txCurrency} {Number(txAmount).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span>→</span>
                                <span>
                                  {item.currency} {item.amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {item.exchangeRate != null ? (
                                  <span className="text-zinc-500">
                                    Rate: {item.exchangeRate} ({txCurrency}/{item.currency})
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs text-zinc-500">
                                Contribuido {new Date(item.createdAt).toLocaleDateString("es-PE", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })} {new Date(item.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>

                            <button
                              onClick={() => eliminarContribucion(item.id)}
                              disabled={deletingContributionId === item.id}
                              className="rounded-lg border border-lime-400/60 p-2 text-rose-400 hover:bg-rose-500/10 disabled:opacity-60"
                              title="Eliminar asignación"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {!historyLoading && history ? (
            <div className="border-t border-white/10 px-5 py-3 text-sm text-zinc-300">
              <span className="font-medium">Total de Contribuciones:</span> {history.contributions.length}
            </div>
          ) : null}
        </ModalShell>
      )}
    </main>
  );
}

function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
      <div className="mb-3 flex items-center justify-between text-zinc-400">
        <p className="text-sm">{title}</p>
        <span>{icon}</span>
      </div>
      <p className="text-2xl font-semibold text-zinc-100">{value}</p>
    </article>
  );
}

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
      <div className={`w-full ${maxWidth} overflow-hidden rounded-xl border border-zinc-700 bg-[#1b1b1d] shadow-2xl`}>
        <div className="flex justify-end border-b border-white/5 px-3 py-2">
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

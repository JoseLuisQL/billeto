"use client";

import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import {
    ReactFlow, Background, Controls, MiniMap, Panel,
    useNodesState, useEdgesState, addEdge,
    type Node, type Edge, type Connection, type OnConnect,
    MarkerType, BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    Zap, Plus, Settings, Activity, X, MoreVertical, Copy, Trash2, Save,
    ChevronDown, Check, Pencil, GitBranch, Tag, PlayCircle, Wand2,
} from "lucide-react";
import {
    listarReglas, crearRegla, actualizarRegla, eliminarRegla,
    duplicarRegla, obtenerEstadisticasReglas, probarReglas,
    type RuleCondition, type RuleAction, type RuleData,
} from "@/lib/actions/rules";
import { listarCategorias } from "@/lib/actions/categories";
import { listarCuentas } from "@/lib/actions/accounts";
import { listarMetasAsignables } from "@/lib/actions/goals";
import { useToast } from "@/components/ui/toast";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { nodeTypes } from "./flow-nodes";

// ─── Types ───────────────────────────────────────────

type RuleItem = {
    id: string; name: string; conditions: RuleCondition[]; actions: RuleAction[];
    status: "active" | "paused"; priority: number; createdAt: string;
};
type CategoryItem = { id: string; name: string; icon?: string | null; color?: string | null };
type AccountItem = { id: string; name: string; type: string };
type GoalItem = { id: string; name: string };

// ─── Helpers ─────────────────────────────────────────

const OPERATOR_LABELS: Record<string, string> = { contains: "Contiene", equals: "Igual a", startsWith: "Empieza con", endsWith: "Termina con", regex: "Expresión regular" };
const ACTION_LABELS: Record<string, string> = { setCategory: "Asignar categoría", setAccount: "Asignar cuenta", modifyDescription: "Modificar descripción", addToGoal: "Agregar a Meta" };
const FIELD_LABELS: Record<string, string> = { description: "Descripción", amount: "Monto", account: "Cuenta", category: "Categoría", type: "Tipo", currency: "Moneda", origin: "Origen", originNumber: "Número de origen", name: "Nombre" };

function uid() { return crypto.randomUUID(); }
function makeCondition(): RuleCondition { return { id: uid(), field: "description", operator: "contains", value: "", caseSensitive: false }; }
function makeAction(): RuleAction { return { id: uid(), type: "setCategory" }; }

// ─── Main Page ───────────────────────────────────────

export default function RulesPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [reglas, setReglas] = useState<RuleItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [accounts, setAccounts] = useState<AccountItem[]>([]);
    const [goals, setGoals] = useState<GoalItem[]>([]);
    const [stats, setStats] = useState({ total: 0, activas: 0 });
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorRule, setEditorRule] = useState<RuleItem | null>(null);
    const [testOpen, setTestOpen] = useState(false);
    const [testInput, setTestInput] = useState("");
    const [testResults, setTestResults] = useState<{ ruleId: string; ruleName: string; matched: boolean }[]>([]);
    const [testing, setTesting] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [r, c, a, g, s] = await Promise.all([
            listarReglas(),
            listarCategorias(),
            listarCuentas(),
            listarMetasAsignables(),
            obtenerEstadisticasReglas()
        ]);
        setReglas((r.reglas as RuleItem[]) || []);
        setCategories((c.categorias as CategoryItem[]) || []);
        setAccounts((a.cuentas as AccountItem[]) || []);
        setGoals((g.metas as GoalItem[]) || []);
        setStats(s);
        setLoading(false);
    }, []);

    useEffect(() => { void loadData(); }, [loadData]);

    const openEditor = (rule?: RuleItem) => { setEditorRule(rule || null); setEditorOpen(true); };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta regla?")) return;
        const res = await eliminarRegla(id);
        if (!res.ok) { toast({ title: "Error", description: res.error, variant: "error" }); return; }
        toast({ title: "Regla eliminada", variant: "success" }); await loadData();
    };
    const handleDuplicate = async (id: string) => {
        const res = await duplicarRegla(id);
        if (!res.ok) { toast({ title: "Error", description: res.error, variant: "error" }); return; }
        toast({ title: "Regla duplicada", variant: "success" }); await loadData();
    };
    const handleToggle = async (rule: RuleItem) => {
        const s = rule.status === "active" ? "paused" : "active";
        const res = await actualizarRegla(rule.id, { status: s as "active" | "paused" });
        if (!res.ok) { toast({ title: "Error", description: res.error, variant: "error" }); return; }
        toast({ title: s === "active" ? "Regla activada" : "Regla pausada", variant: "success" }); await loadData();
    };
    const handleTest = async () => {
        if (!testInput.trim()) return;
        setTesting(true);
        const res = await probarReglas(testInput.trim());
        if (res.ok && res.resultados) setTestResults(res.resultados as typeof testResults);
        setTesting(false);
    };
    const handleEditorSave = async () => { await loadData(); setEditorOpen(false); };

    const condSummaryFull = (cs: RuleCondition[]) => {
        if (!cs.length) return "Sin condiciones";
        return cs.map(c => {
            const field = FIELD_LABELS[c.field] || c.field;
            const op = (OPERATOR_LABELS[c.operator] || c.operator).toLowerCase();
            return `${field} ${op} "${c.value}"`;
        }).join(" y ");
    };
    const actSummaryFull = (as_: RuleAction[]) => {
        if (!as_.length) return "sin acciones";
        return as_.map(a => {
            if (a.type === "setCategory") {
                const cat = categories.find(c => c.id === a.categoryId);
                return `asignar categoría "${cat ? `${cat.icon || "📋"} ${cat.name}` : "…"}"`;
            }
            if (a.type === "setAccount") {
                const acc = accounts.find(ac => ac.id === a.accountId);
                return `asignar cuenta "${acc ? acc.name : "…"}"`;
            }
            if (a.type === "modifyDescription") {
                const mType = a.modifyType === "replace" ? "reemplazar" : a.modifyType === "prepend" ? "agregar al inicio" : "agregar al final";
                return `${mType} descripción "${a.value || "…"}"`;
            }
            if (a.type === "addToGoal") {
                const goal = goals.find(g => g.id === a.goalId);
                const pct = a.amountType === "fixed"
                    ? `(fijo ${a.amountValue ?? 0})`
                    : `(${a.amountValue ?? 100}%)`;
                return `agregar a meta "${goal ? goal.name : "…"}" ${pct}`;
            }
            if (a.type === "addTags") {
                return `agregar tags: ${(a.tags || []).map(t => `"${t}"`).join(", ") || "…"}`;
            }
            return ACTION_LABELS[a.type] || a.type;
        }).join(", ");
    };
    const fullSummary = (rule: RuleItem) => {
        const cond = condSummaryFull(rule.conditions);
        const act = actSummaryFull(rule.actions);
        return `Si ${cond}, entonces ${act}`;
    };

    return (
        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Automatiza tus transacciones con reglas</p>
                <button onClick={() => openEditor()} className="inline-flex h-9 items-center gap-2 rounded-md bg-lime-500/[0.15] px-4 text-sm font-semibold text-lime-400 transition hover:bg-lime-500/25"><Plus className="h-4 w-4" /> Crear regla</button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-[#121214] p-5">
                    <div className="flex items-center justify-between"><span className="text-sm text-zinc-400">Total de reglas</span><Settings className="h-4 w-4 text-zinc-600" /></div>
                    <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
                    <p className="mt-1 text-xs text-zinc-500">{stats.total === 0 ? "No hay reglas configuradas" : `Reglas configuradas`}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#121214] p-5">
                    <div className="flex items-center justify-between"><span className="text-sm text-zinc-400">Reglas activas</span><Activity className="h-4 w-4 text-zinc-600" /></div>
                    <p className="mt-2 text-3xl font-bold text-white">{stats.activas}</p>
                    <p className="mt-1 text-xs text-zinc-500">Reglas que se ejecutan sobre tus transacciones</p>
                </div>
            </div>

            {/* CTA Banner */}
            <div className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-900/30 to-purple-800/10 px-6 py-4">
                <div className="flex items-center gap-3"><GitBranch className="h-5 w-5 text-purple-400" /><div><p className="text-sm font-semibold text-purple-300">Configura y automatiza reglas</p><p className="text-xs text-purple-400/70">Crea reglas para categorizar y ajustar tus transacciones</p></div></div>
                <button onClick={() => setTestOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-purple-500/20 px-4 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/30"><PlayCircle className="h-4 w-4" /> Probar reglas</button>
            </div>

            {/* Rules List / Empty State */}
            {loading ? (
                <div className="rounded-xl border border-white/5 bg-[#121214] p-8 text-center text-zinc-500">Cargando reglas...</div>
            ) : reglas.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-[#121214] p-10 text-center">
                    <h3 className="text-lg font-bold text-white">Crea tu primer flujo</h3>
                    <p className="mt-1 text-sm text-zinc-400">Usa el editor visual para crear flujos</p>
                    <GitBranch className="mx-auto mt-6 h-10 w-10 text-purple-500" />
                    <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-4 text-center">
                        {[{ n: 1, t: "Arrastra los nodos", s: "Condiciones y acciones" }, { n: 2, t: "Conectar flujos", s: "Lógica compleja" }, { n: 3, t: "Automatizar", s: "Transacciones inteligentes" }].map(st => (
                            <div key={st.n}><div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-lime-500 text-xs font-bold text-black">{st.n}</div><p className="text-sm font-semibold text-white">{st.t}</p><p className="text-xs text-zinc-500">{st.s}</p></div>
                        ))}
                    </div>
                    <button onClick={() => openEditor()} className="mt-8 inline-flex h-10 items-center gap-2 rounded-lg bg-[#6b6e1a] px-6 text-sm font-semibold text-lime-100 transition hover:bg-[#7d8020]"><Plus className="h-4 w-4" /> Crear mi primer flujo</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Section header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Reglas configuradas</h2>
                            <p className="text-xs text-zinc-500">Gestionar reglas de automatización</p>
                        </div>
                        <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h4m0 0V3m0 4l4 4m10-4h-4m0 0V3m0 4l-4 4M3 17h4m0 0v4m0-4l4-4m10 4h-4m0 0v4m0-4l-4-4" /></svg>
                            Por prioridad
                        </button>
                    </div>

                    {/* Rule cards */}
                    {reglas.map(rule => (
                        <div key={rule.id} className="rounded-xl border border-white/5 bg-[#121214] p-5 transition hover:border-white/10">
                            {/* Top row: name + badges + actions */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <h3 className="font-semibold text-white truncate text-[15px]">{rule.name}</h3>
                                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${rule.status === "active" ? "bg-lime-500/20 text-lime-400" : "bg-zinc-700/50 text-zinc-500"}`}>
                                        {rule.status === "active" ? "Activa" : "Pausada"}
                                    </span>
                                    <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                                        Prioridad: {rule.priority}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Toggle */}
                                    <button
                                        onClick={() => handleToggle(rule)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.status === "active" ? "bg-lime-500" : "bg-zinc-700"}`}
                                        title={rule.status === "active" ? "Desactivar" : "Activar"}
                                    >
                                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${rule.status === "active" ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                                    </button>
                                    {/* Edit */}
                                    <button onClick={() => openEditor(rule)} className="rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200 transition" title="Editar">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    {/* Delete */}
                                    <button onClick={() => handleDelete(rule.id)} className="rounded-md p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition" title="Eliminar">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Subtitle */}
                            <p className="mt-1 text-xs text-zinc-500">Regla de automatización de transacciones</p>

                            {/* Summary code block */}
                            <div className="mt-3 rounded-lg border-l-[3px] border-purple-500 bg-zinc-900/60 px-4 py-3">
                                <p className="font-mono text-[13px] text-zinc-300 leading-relaxed">
                                    {fullSummary(rule)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Flow Editor */}
            {editorOpen && <FlowEditor rule={editorRule} categories={categories} accounts={accounts} goals={goals} onClose={() => setEditorOpen(false)} onSaved={handleEditorSave} />}

            {/* Test Modal */}
            {testOpen && (
                <ModalShell onClose={() => setTestOpen(false)}>
                    <div className="p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2"><PlayCircle className="h-5 w-5 text-purple-400" /> Probar reglas</h3>
                        <p className="text-sm text-zinc-400">Ingresa una descripción para probar qué reglas coinciden.</p>
                        <input value={testInput} onChange={e => setTestInput(e.target.value)} placeholder="Ej: Netflix, Uber..." className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-lime-400 placeholder:text-zinc-500" onKeyDown={e => e.key === "Enter" && handleTest()} />
                        <button onClick={handleTest} disabled={testing} className="inline-flex h-10 items-center gap-2 rounded-md bg-purple-500/20 px-5 text-sm font-semibold text-purple-300 hover:bg-purple-500/30 disabled:opacity-50">{testing ? "Probando..." : "Probar"}</button>
                        {testResults.length > 0 && <div className="space-y-2 pt-2">{testResults.map(r => (
                            <div key={r.ruleId} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${r.matched ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800/50 text-zinc-500"}`}>{r.matched ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}<span>{r.ruleName}</span><span className="ml-auto text-xs">{r.matched ? "Coincide ✓" : "No coincide"}</span></div>
                        ))}</div>}
                    </div>
                </ModalShell>
            )}
        </main>
    );
}

// ─── Flow Editor with React Flow ─────────────────────

function FlowEditor({ rule, categories, accounts, goals, onClose, onSaved }: {
    rule: RuleItem | null; categories: CategoryItem[]; accounts: AccountItem[]; goals: GoalItem[]; onClose: () => void; onSaved: () => void;
}) {
    const { toast } = useToast();
    const [name, setName] = useState(rule?.name || `Regla sin título ${Date.now().toString(36).slice(-3)}`);
    const [status, setStatus] = useState<"active" | "paused">(rule?.status || "active");
    const [priority, setPriority] = useState(rule?.priority ?? 1);
    const [conditions, setConditions] = useState<RuleCondition[]>(rule?.conditions?.length ? rule.conditions : [makeCondition()]);
    const [actions, setActions] = useState<RuleAction[]>(rule?.actions?.length ? rule.actions : [makeAction()]);
    const [saving, setSaving] = useState(false);
    const [configPanel, setConfigPanel] = useState<{ type: "condition" | "action"; id: string } | null>(null);

    // Node operations (MUST be defined before buildGraph to avoid TDZ)
    const addCondition = () => {
        setConditions(prev => [...prev, makeCondition()]);
        setActions(prev => [...prev, makeAction()]);
    };
    const addAction = () => setActions(prev => [...prev, makeAction()]);

    const removeCondition = useCallback((id: string) => {
        setConditions(prev => { if (prev.length <= 1) return prev; return prev.filter(c => c.id !== id); });
        setConfigPanel(p => p?.id === id ? null : p);
    }, []);
    const removeAction = useCallback((id: string) => {
        setActions(prev => { if (prev.length <= 1) return prev; return prev.filter(a => a.id !== id); });
        setConfigPanel(p => p?.id === id ? null : p);
    }, []);
    const duplicateCondition = useCallback((id: string) => {
        setConditions(prev => { const o = prev.find(c => c.id === id); return o ? [...prev, { ...o, id: uid() }] : prev; });
    }, []);
    const duplicateAction = useCallback((id: string) => {
        setActions(prev => { const o = prev.find(a => a.id === id); return o ? [...prev, { ...o, id: uid() }] : prev; });
    }, []);

    // Helper to build action node data
    const buildActionData = useCallback((a: RuleAction) => {
        const cat = a.type === "setCategory" && a.categoryId ? categories.find(c => c.id === a.categoryId) : null;
        const acc = a.type === "setAccount" && a.accountId ? accounts.find(ac => ac.id === a.accountId) : null;
        const goal = a.type === "addToGoal" && a.goalId ? goals.find(g => g.id === a.goalId) : null;
        const configured = a.type === "setCategory" ? !!a.categoryId : a.type === "setAccount" ? !!a.accountId : a.type === "modifyDescription" ? !!a.value?.trim() : a.type === "addToGoal" ? !!a.goalId : a.type === "addTags" ? !!(a.tags && a.tags.length > 0) : true;
        return { actionId: a.id, actionType: a.type, categoryName: cat ? `${cat.icon || "📋"} ${cat.name}` : undefined, accountName: acc ? acc.name : undefined, goalName: goal ? goal.name : undefined, descriptionValue: a.value || undefined, modifyType: a.modifyType || undefined, tags: a.tags || [], amountType: a.amountType || "percentage", amountValue: a.amountValue ?? 100, configured, onEdit: (id: string) => setConfigPanel({ type: "action", id }), onDuplicate: duplicateAction, onDelete: removeAction };
    }, [categories, accounts, goals, duplicateAction, removeAction]);

    // Build React Flow nodes and edges from conditions/actions
    const buildGraph = useCallback(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const CHAIN_GAP = 180; // compact gap for main chain
        const PAIR_GAP_Y = 80;  // vertical gap between extra pairs
        const PAIR_X_OFFSET = 500; // horizontal offset for paired action in extra rows
        const X = 0;

        const edgeStyle = { stroke: "#84cc16", strokeWidth: 2 };
        const edgeMarker = { type: MarkerType.ArrowClosed, color: "#84cc16" };

        // ── Main chain: Trigger → conditions[0] → actions[0] ──
        let y = 0;
        nodes.push({ id: "trigger", type: "trigger", position: { x: X, y }, data: { label: "Etiqueta del disparador", description: "Descripción del disparador" }, draggable: true });
        y += CHAIN_GAP;

        const c0 = conditions[0];
        if (c0) {
            const cid = `cond-${c0.id}`;
            nodes.push({ id: cid, type: "condition", position: { x: X, y }, data: { conditionId: c0.id, field: c0.field, operator: c0.operator, value: c0.value, caseSensitive: c0.caseSensitive, onEdit: (id: string) => setConfigPanel({ type: "condition", id }), onDuplicate: duplicateCondition, onDelete: removeCondition }, draggable: true });
            edges.push({ id: "e-trigger-c0", source: "trigger", target: cid, type: "smoothstep", animated: true, style: edgeStyle, markerEnd: edgeMarker });
            y += CHAIN_GAP;

            const a0 = actions[0];
            if (a0) {
                const aid = `act-${a0.id}`;
                nodes.push({ id: aid, type: "action", position: { x: X, y }, data: buildActionData(a0), draggable: true });
                edges.push({ id: "e-c0-a0", source: cid, target: aid, type: "smoothstep", animated: true, style: edgeStyle, markerEnd: edgeMarker });
                y += CHAIN_GAP;
            }
        }

        // ── Extra condition+action pairs (disconnected from main chain) ──
        let extraY = y + PAIR_GAP_Y;
        for (let i = 1; i < conditions.length; i++) {
            const c = conditions[i];
            const cid = `cond-${c.id}`;
            nodes.push({ id: cid, type: "condition", position: { x: X, y: extraY }, data: { conditionId: c.id, field: c.field, operator: c.operator, value: c.value, caseSensitive: c.caseSensitive, onEdit: (id: string) => setConfigPanel({ type: "condition", id }), onDuplicate: duplicateCondition, onDelete: removeCondition }, draggable: true });

            // Pair with corresponding action (condition[i] → action[i])
            const pairedAction = actions[i];
            if (pairedAction) {
                const aid = `act-${pairedAction.id}`;
                nodes.push({ id: aid, type: "action", position: { x: PAIR_X_OFFSET, y: extraY }, data: buildActionData(pairedAction), draggable: true });
                edges.push({ id: `e-pair-${i}`, source: cid, target: aid, type: "smoothstep", animated: true, style: edgeStyle, markerEnd: edgeMarker });
            }
            extraY += CHAIN_GAP + PAIR_GAP_Y;
        }

        // ── Standalone extra actions (no paired condition) ──
        for (let i = conditions.length; i < actions.length; i++) {
            const a = actions[i];
            const aid = `act-${a.id}`;
            nodes.push({ id: aid, type: "action", position: { x: X, y: extraY }, data: buildActionData(a), draggable: true });
            extraY += CHAIN_GAP + PAIR_GAP_Y;
        }

        return { nodes, edges };
    }, [conditions, actions, buildActionData, duplicateCondition, removeCondition]);

    const initialGraph = useMemo(() => buildGraph(), [buildGraph]);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);

    // Rebuild nodes/edges when conditions or actions change
    useEffect(() => {
        const g = buildGraph();
        setNodes(g.nodes);
        setEdges(g.edges);
    }, [conditions, actions, buildGraph, setNodes, setEdges]);

    const onConnect: OnConnect = useCallback((params: Connection) => {
        setEdges(eds => addEdge({ ...params, type: "smoothstep", animated: true, style: { stroke: "#84cc16", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#84cc16" } }, eds));
    }, [setEdges]);

    // Auto-layout: reset positions to vertical stack
    const autoLayout = useCallback(() => {
        const GAP = 120;
        setNodes(nds => nds.map((n, i) => ({ ...n, position: { x: 0, y: i * GAP } })));
    }, [setNodes]);
    const updateCondition = (id: string, patch: Partial<RuleCondition>) => {
        setConditions(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    };
    const updateAction = (id: string, patch: Partial<RuleAction>) => {
        setActions(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    };

    // Validation
    const errors: string[] = [];
    for (const c of conditions) { if (!c.value?.trim()) errors.push(`Nodo "Condición" no es válido: Configurar condición`); }
    for (const a of actions) {
        if (a.type === "setCategory" && !a.categoryId) errors.push(`Nodo "Acción" no es válido: Seleccionar categoría`);
        if (a.type === "setAccount" && !a.accountId) errors.push(`Nodo "Acción" no es válido: Seleccionar cuenta`);
        if (a.type === "modifyDescription" && !a.value?.trim()) errors.push(`Nodo "Acción" no es válido: Configurar texto`);
        if (a.type === "addToGoal" && !a.goalId) errors.push(`Nodo "Acción" no es válido: Seleccionar meta`);
        if (a.type === "addTags" && !(a.tags && a.tags.length > 0)) errors.push(`Nodo "Acción" no es válido: Agregar al menos una etiqueta`);
    }

    const handleSave = async () => {
        if (!name.trim()) { toast({ title: "El nombre es obligatorio", variant: "error" }); return; }
        setSaving(true);
        const data: RuleData = { name, conditions, actions, priority, status };
        const res = rule ? await actualizarRegla(rule.id, data) : await crearRegla(data);
        setSaving(false);
        if (!res.ok) { toast({ title: "Error", description: res.error, variant: "error" }); return; }
        toast({ title: rule ? "Regla actualizada" : "Regla creada", variant: "success" }); onSaved();
    };

    const handleDeleteRule = async () => {
        if (!rule) { onClose(); return; }
        if (!confirm(`¿Eliminar la regla "${name}"?`)) return;
        const res = await eliminarRegla(rule.id);
        if (!res.ok) { toast({ title: "Error", description: res.error, variant: "error" }); return; }
        toast({ title: "Regla eliminada", variant: "success" }); onSaved();
    };
    const handleDuplicateRule = async () => {
        if (!rule) return;
        const res = await duplicarRegla(rule.id);
        if (!res.ok) { toast({ title: "Error", description: res.error, variant: "error" }); return; }
        toast({ title: "Regla duplicada", variant: "success" }); onSaved();
    };

    const activeCond = configPanel?.type === "condition" ? conditions.find(c => c.id === configPanel.id) : null;
    const activeAct = configPanel?.type === "action" ? actions.find(a => a.id === configPanel.id) : null;

    return (
        <div className="fixed inset-0 z-[80] flex flex-col bg-[#0e0e10]">
            {/* Top bar */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#121214] px-4">
                <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5 text-purple-400" />
                    <input value={name} onChange={e => setName(e.target.value)} className="bg-transparent text-sm font-semibold text-white outline-none border-b border-transparent focus:border-lime-400 w-48" />
                    <button onClick={() => setStatus(status === "active" ? "paused" : "active")} className={`ml-2 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${status === "active" ? "bg-lime-500/20 text-lime-400" : "bg-zinc-700/50 text-zinc-500"}`}>
                        <div className={`h-2 w-2 rounded-full ${status === "active" ? "bg-lime-400" : "bg-zinc-600"}`} />{status === "active" ? "Activa" : "Pausada"}
                    </button>
                    {errors.length > 0 && <span className="ml-3 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-400">{errors.length} error{errors.length > 1 ? "es" : ""}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 mr-4">
                        <span className="text-xs text-zinc-500">Prioridad:</span>
                        <input type="number" min={1} max={100} value={priority} onChange={e => setPriority(parseInt(e.target.value) || 1)} className="h-7 w-14 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-center text-xs text-white outline-none focus:border-lime-400" />
                        <span className="text-xs text-zinc-600">(1=alta, 100=baja)</span>
                    </div>
                    {rule && (<>
                        <button onClick={handleDuplicateRule} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-white/5"><Copy className="h-3.5 w-3.5" /> Duplicar</button>
                        <button onClick={handleDeleteRule} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-white/5"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                    </>)}
                    <button onClick={handleSave} disabled={saving} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-lime-500/20 px-4 text-xs font-semibold text-lime-400 hover:bg-lime-500/30 disabled:opacity-50"><Save className="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar"}</button>
                    <button onClick={onClose} className="ml-2 rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="flex w-44 shrink-0 flex-col gap-2 border-r border-white/5 bg-[#121214] p-3">
                    <button onClick={addCondition} className="flex h-9 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-300 hover:bg-white/5"><Zap className="h-3.5 w-3.5 text-amber-400" /> Agregar Condición</button>
                    <button onClick={addAction} className="flex h-9 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-300 hover:bg-white/5"><Tag className="h-3.5 w-3.5 text-lime-400" /> Agregar Acción</button>
                </div>

                {/* React Flow Canvas */}
                <div className="relative flex-1">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.4 }}
                        className="bg-[#0e0e10]"
                        proOptions={{ hideAttribution: true }}
                        defaultEdgeOptions={{ type: "smoothstep", animated: true, style: { stroke: "#84cc16", strokeWidth: 2 } }}
                        minZoom={0.3}
                        maxZoom={2}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
                        <Controls className="!bg-zinc-900 !border-zinc-700 !rounded-lg !shadow-xl [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-300 [&>button:hover]:!bg-zinc-700" />
                        <MiniMap
                            nodeColor={(n) => n.type === "trigger" ? "#84cc16" : n.type === "condition" ? "#f59e0b" : "#3b82f6"}
                            className="!bg-zinc-900 !border-zinc-700 !rounded-lg"
                            maskColor="rgba(0,0,0,0.7)"
                        />
                        {/* Auto-layout button */}
                        <Panel position="bottom-left" className="!ml-14">
                            <button onClick={autoLayout} className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-300 hover:bg-zinc-800 shadow-lg" title="Auto Layout">
                                <Wand2 className="h-3.5 w-3.5" /> Auto Layout
                            </button>
                        </Panel>
                    </ReactFlow>

                    {/* Validation panel */}
                    {errors.length > 0 && (
                        <div className="absolute bottom-4 right-4 z-10 max-w-xs rounded-lg border border-red-500/30 bg-red-950/80 p-3 backdrop-blur-sm">
                            <p className="text-xs font-bold text-red-400 mb-1">Errores de Validación:</p>
                            {errors.map((err, i) => <p key={i} className="text-xs text-red-300/80">• {err}</p>)}
                        </div>
                    )}
                </div>

                {/* Config Modals - centered like gasti.pro */}
                {activeCond && (
                    <ConditionConfigModal condition={activeCond} onUpdate={(p) => updateCondition(activeCond.id, p)} onClose={() => setConfigPanel(null)} />
                )}
                {activeAct && (
                    <ActionConfigModal action={activeAct} categories={categories} accounts={accounts} goals={goals} onUpdate={(p) => updateAction(activeAct.id, p)} onClose={() => setConfigPanel(null)} />
                )}
            </div>
        </div>
    );
}

// ─── Condition Config Modal (centered, gasti.pro style) ──────

const ALL_FIELDS = [
    { key: "description", label: "Descripción" },
    { key: "amount", label: "Monto" },
    { key: "account", label: "Cuenta" },
    { key: "category", label: "Categoría" },
    { key: "type", label: "Tipo" },
    { key: "currency", label: "Moneda" },
    { key: "origin", label: "Origen" },
    { key: "originNumber", label: "Número de origen" },
    { key: "name", label: "Nombre" },
] as const;

const ALL_OPERATORS = [
    { key: "contains", label: "Contiene" },
    { key: "equals", label: "Igual a" },
    { key: "startsWith", label: "Empieza con" },
    { key: "endsWith", label: "Termina con" },
    { key: "regex", label: "Expresión regular" },
] as const;

function ConditionConfigModal({ condition, onUpdate, onClose }: {
    condition: RuleCondition; onUpdate: (p: Partial<RuleCondition>) => void; onClose: () => void;
}) {
    const [fieldOpen, setFieldOpen] = useState(false);
    const [opOpen, setOpOpen] = useState(false);

    const currentFieldLabel = ALL_FIELDS.find(f => f.key === condition.field)?.label || condition.field;
    const currentOpLabel = ALL_OPERATORS.find(o => o.key === condition.operator)?.label || condition.operator;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-zinc-700/50 bg-[#1b1b1d] p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                            <Zap className="h-4 w-4 text-amber-400" />
                        </div>
                        Configurar condición
                    </h3>
                    <button onClick={onClose} className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
                </div>

                <div className="space-y-5">
                    {/* Campo */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Campo</label>
                        <div className="relative">
                            <button
                                onClick={() => { setFieldOpen(!fieldOpen); setOpOpen(false); }}
                                className="flex h-11 w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 text-sm text-zinc-100 transition hover:border-zinc-600"
                            >
                                <span>{currentFieldLabel}</span>
                                <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${fieldOpen ? "rotate-180" : ""}`} />
                            </button>
                            {fieldOpen && (
                                <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-[#1b1b1d] py-1 shadow-2xl max-h-64 overflow-y-auto">
                                    {ALL_FIELDS.map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => { onUpdate({ field: f.key }); setFieldOpen(false); }}
                                            className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-white/5 ${condition.field === f.key ? "text-lime-400" : "text-zinc-200"}`}
                                        >
                                            {f.label}
                                            {condition.field === f.key && <Check className="h-4 w-4" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operador */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Operador</label>
                        <div className="relative">
                            <button
                                onClick={() => { setOpOpen(!opOpen); setFieldOpen(false); }}
                                className="flex h-11 w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 text-sm text-zinc-100 transition hover:border-zinc-600"
                            >
                                <span>{currentOpLabel}</span>
                                <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${opOpen ? "rotate-180" : ""}`} />
                            </button>
                            {opOpen && (
                                <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-[#1b1b1d] py-1 shadow-2xl">
                                    {ALL_OPERATORS.map(op => (
                                        <button
                                            key={op.key}
                                            onClick={() => { onUpdate({ operator: op.key }); setOpOpen(false); }}
                                            className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-white/5 ${condition.operator === op.key ? "text-lime-400" : "text-zinc-200"}`}
                                        >
                                            {op.label}
                                            {condition.operator === op.key && <Check className="h-4 w-4" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Valor */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Valor</label>
                        <input
                            value={condition.value}
                            onChange={e => onUpdate({ value: e.target.value })}
                            placeholder="Ej: valor"
                            className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 text-sm text-zinc-100 outline-none transition focus:border-lime-400 placeholder:text-zinc-500 hover:border-zinc-600"
                        />
                    </div>

                    {/* Case sensitive */}
                    <label className="flex items-center gap-3 text-sm text-zinc-400 cursor-pointer select-none">
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${!condition.caseSensitive ? "border-lime-400 bg-lime-500/20" : "border-zinc-600 bg-zinc-800"}`}>
                            {!condition.caseSensitive && <Check className="h-3 w-3 text-lime-400" />}
                        </div>
                        Ignorar mayúsculas y acentos
                    </label>
                </div>

                {/* Footer */}
                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 rounded-lg bg-[#5a5e1a] text-sm font-semibold text-lime-100 transition hover:bg-[#6b6e20] flex items-center justify-center gap-2"
                    >
                        <Save className="h-4 w-4" /> Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Action Config Modal (centered, gasti.pro style) ─────────

function ActionConfigModal({ action, categories, accounts, goals, onUpdate, onClose }: {
    action: RuleAction; categories: CategoryItem[]; accounts: AccountItem[]; goals: GoalItem[]; onUpdate: (p: Partial<RuleAction>) => void; onClose: () => void;
}) {
    const [typeOpen, setTypeOpen] = useState(false);

    const [catOpen, setCatOpen] = useState(false);
    const [catSearch, setCatSearch] = useState("");
    const filteredCats = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));

    const [accOpen, setAccOpen] = useState(false);
    const [accSearch, setAccSearch] = useState("");
    const filteredAccs = accounts.filter(a => a.name.toLowerCase().includes(accSearch.toLowerCase()));

    const [modTypeOpen, setModTypeOpen] = useState(false);
    const MOD_TYPES = [
        { key: "append", label: "Agregar al final" },
        { key: "replace", label: "Reemplazar" },
        { key: "prepend", label: "Agregar al principio" }
    ] as const;

    const [tagOpen, setTagOpen] = useState(false);
    const [tagSearch, setTagSearch] = useState("");

    const [goalOpen, setGoalOpen] = useState(false);
    const [amountTypeOpen, setAmountTypeOpen] = useState(false);
    const AMOUNT_TYPES = [
        { key: "percentage", label: "Porcentaje del monto" },
        { key: "fixed", label: "Monto fijo" }
    ] as const;

    const ACTION_TYPES = [
        { key: "setCategory", label: "Asignar categoría" },
        { key: "setAccount", label: "Asignar cuenta" },
        { key: "modifyDescription", label: "Modificar descripción" },
        { key: "addTags", label: "Agregar Tags" },
        { key: "addToGoal", label: "Agregar a Meta" },
    ] as const;

    const closeAllSelects = () => { setTypeOpen(false); setCatOpen(false); setAccOpen(false); setModTypeOpen(false); setTagOpen(false); setGoalOpen(false); setAmountTypeOpen(false); };

    const currentTypeLabel = ACTION_TYPES.find(t => t.key === action.type)?.label || action.type;
    const selectedCat = action.categoryId ? categories.find(c => c.id === action.categoryId) : null;
    const selectedAcc = action.accountId ? accounts.find(a => a.id === action.accountId) : null;
    const currentModTypeLabel = MOD_TYPES.find(t => t.key === (action.modifyType || "append"))?.label || "Agregar al final";
    const selectedGoal = action.goalId ? goals.find(g => g.id === action.goalId) : null;
    const currentAmountTypeLabel = AMOUNT_TYPES.find(t => t.key === (action.amountType || "percentage"))?.label || "Porcentaje del monto";

    const handleAddTag = () => {
        if (!tagSearch.trim()) return;
        const newTags = [...(action.tags || [])];
        if (!newTags.includes(tagSearch.trim())) {
            newTags.push(tagSearch.trim());
            onUpdate({ tags: newTags });
        }
        setTagSearch("");
        setTagOpen(false);
    };

    const handleRemoveTag = (tag: string) => {
        onUpdate({ tags: (action.tags || []).filter(t => t !== tag) });
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-[2px]" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-md rounded-2xl border border-zinc-700/50 bg-[#1b1b1d] p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700/50">
                            <Settings className="h-4 w-4 text-zinc-300" />
                        </div>
                        Configurar acción
                    </h3>
                    <button onClick={onClose} className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
                </div>

                <div className="space-y-4">
                    {/* Tipo de acción */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Tipo de acción</label>
                        <div className="relative">
                            <button
                                onClick={() => { const wasOpen = typeOpen; closeAllSelects(); setTypeOpen(!wasOpen); }}
                                className="flex h-11 w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 text-sm text-zinc-100 transition hover:border-zinc-600"
                            >
                                <span>{currentTypeLabel}</span>
                                <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${typeOpen ? "rotate-180" : ""}`} />
                            </button>
                            {typeOpen && (
                                <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-[#1b1b1d] py-1 shadow-2xl">
                                    {ACTION_TYPES.map(t => (
                                        <button
                                            key={t.key}
                                            onClick={() => { onUpdate({ type: t.key as RuleAction["type"] }); setTypeOpen(false); }}
                                            className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-white/5 ${action.type === t.key ? "text-lime-400" : "text-zinc-200"}`}
                                        >
                                            {t.label}
                                            {action.type === t.key && <Check className="h-4 w-4" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-zinc-800 my-4" />

                    {/* Category Action */}
                    {action.type === "setCategory" && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Categoría</label>
                            <div className="relative">
                                <button
                                    onClick={() => { const wasOpen = catOpen; closeAllSelects(); setCatOpen(!wasOpen); }}
                                    className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm transition hover:border-zinc-600 ${catOpen ? "border-lime-400 bg-zinc-800/50" : "border-zinc-700 bg-zinc-800/50"} ${selectedCat ? "text-zinc-100" : "text-zinc-500"}`}
                                >
                                    <span>{selectedCat ? `${selectedCat.icon || "📋"} ${selectedCat.name}` : "Seleccionar categoría"}</span>
                                    <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${catOpen ? "rotate-180" : ""}`} />
                                </button>
                                {catOpen && (
                                    <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-[#1b1b1d] shadow-2xl overflow-hidden">
                                        <div className="p-2">
                                            <input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder={'Buscar categoría... (ej: "casa" para...)'} className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-800/70 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-600" autoFocus />
                                        </div>
                                        <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-lime-400 transition hover:bg-white/5 border-b border-zinc-800">
                                            <Plus className="h-4 w-4" /> Crear nueva categoría
                                        </button>
                                        <div className="px-4 pt-3 pb-1.5"><span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Predeterminadas</span></div>
                                        <div className="max-h-48 overflow-y-auto pb-1">
                                            {filteredCats.map(cat => (
                                                <button key={cat.id} onClick={() => { onUpdate({ categoryId: cat.id }); setCatOpen(false); setCatSearch(""); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-white/5 ${action.categoryId === cat.id ? "text-lime-400 bg-lime-500/10" : "text-zinc-200"}`}>
                                                    <span className="text-base">{cat.icon || "📋"}</span><span>{cat.name}</span>
                                                    {action.categoryId === cat.id && <Check className="ml-auto h-4 w-4" />}
                                                </button>
                                            ))}
                                            {filteredCats.length === 0 && <p className="px-4 py-3 text-sm text-zinc-500 text-center">No se encontraron categorías</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Account Action */}
                    {action.type === "setAccount" && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Nombre</label>
                            <div className="relative">
                                <button
                                    onClick={() => { const wasOpen = accOpen; closeAllSelects(); setAccOpen(!wasOpen); }}
                                    className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm transition hover:border-zinc-600 ${accOpen ? "border-lime-400 bg-zinc-800/50" : "border-zinc-700 bg-zinc-800/50"} ${selectedAcc ? "text-zinc-100" : "text-zinc-500"}`}
                                >
                                    <span>{selectedAcc ? selectedAcc.name : "Seleccionar cuenta"}</span>
                                    <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${accOpen ? "rotate-180" : ""}`} />
                                </button>
                                {accOpen && (
                                    <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-[#1b1b1d] shadow-2xl py-1">
                                        <div className="px-2 pb-2 mt-2">
                                            <input value={accSearch} onChange={e => setAccSearch(e.target.value)} placeholder="Buscar cuenta..." className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-800/70 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-600" autoFocus />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto pb-1">
                                            {filteredAccs.map(acc => (
                                                <button key={acc.id} onClick={() => { onUpdate({ accountId: acc.id }); setAccOpen(false); setAccSearch(""); }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-white/5 ${action.accountId === acc.id ? "text-lime-400" : "text-zinc-200"}`}>
                                                    <span>{acc.name}</span>
                                                    {action.accountId === acc.id && <Check className="ml-auto h-4 w-4" />}
                                                </button>
                                            ))}
                                            {filteredAccs.length === 0 && <p className="px-4 py-3 text-sm text-zinc-500 text-center">No hay cuentas disponibles</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Modify Description Action */}
                    {action.type === "modifyDescription" && (<>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Tipo de modificación</label>
                            <div className="relative">
                                <button
                                    onClick={() => { const wasOpen = modTypeOpen; closeAllSelects(); setModTypeOpen(!wasOpen); }}
                                    className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm transition hover:border-zinc-600 ${modTypeOpen ? "border-lime-400 bg-zinc-800/50" : "border-zinc-700 bg-zinc-800/50"} text-zinc-100`}
                                >
                                    <span>{currentModTypeLabel}</span>
                                    <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${modTypeOpen ? "rotate-180" : ""}`} />
                                </button>
                                {modTypeOpen && (
                                    <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-[#1b1b1d] py-1 shadow-2xl">
                                        {MOD_TYPES.map(t => (
                                            <button key={t.key} onClick={() => { onUpdate({ modifyType: t.key as RuleAction["modifyType"] }); setModTypeOpen(false); }} className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-white/5 ${action.modifyType === t.key || (!action.modifyType && t.key === "append") ? "text-lime-400" : "text-zinc-200"}`}>
                                                {t.label}
                                                {(action.modifyType === t.key || (!action.modifyType && t.key === "append")) && <Check className="h-4 w-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Texto</label>
                            <input value={action.value || ""} onChange={e => onUpdate({ value: e.target.value })} placeholder="ej. [IMPORTANTE]" className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 placeholder:text-zinc-500" />
                        </div>
                    </>)}

                    {/* Add Tags Action */}
                    {action.type === "addTags" && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Seleccionar Tags</label>
                            <div className="relative">
                                <button
                                    onClick={() => { const wasOpen = tagOpen; closeAllSelects(); setTagOpen(!wasOpen); }}
                                    className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm transition hover:border-zinc-600 ${tagOpen ? "border-lime-400 bg-zinc-800/50" : "border-zinc-700 bg-zinc-800/50"} text-zinc-500`}
                                >
                                    <span>Seleccionar etiquetas</span>
                                    <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${tagOpen ? "rotate-180" : ""}`} />
                                </button>
                                {tagOpen && (
                                    <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-[#1b1b1d] shadow-2xl overflow-hidden py-1">
                                        <div className="px-2 pt-2 pb-1 relative">
                                            <div className="absolute left-4 top-[18px] text-zinc-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
                                            <input value={tagSearch} onChange={e => setTagSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddTag()} placeholder="Buscar o crear etiquetas" className="h-9 w-full rounded-md bg-transparent pl-8 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:bg-zinc-800/50" autoFocus />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto pb-1 border-t border-zinc-800 mt-1 pt-1">
                                            {tagSearch.trim() && (
                                                <button onClick={handleAddTag} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-lime-400 transition hover:bg-white/5">
                                                    Crear etiqueta "{tagSearch.trim()}"
                                                </button>
                                            )}
                                            {!tagSearch.trim() && <p className="px-4 py-3 text-sm text-zinc-500 text-center">No se encontraron etiquetas.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {action.tags && action.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                                    {action.tags.map((tag, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 rounded-md bg-[#5a5e1a] px-2 py-1 text-xs font-medium text-lime-100 border border-lime-500/30">
                                            {tag}
                                            <button onClick={() => handleRemoveTag(tag)} className="ml-1 text-lime-300 hover:text-white"><X className="h-3 w-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add to Goal Action */}
                    {action.type === "addToGoal" && (<>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Seleccionar Meta</label>
                            <div className="relative">
                                <button
                                    onClick={() => { const wasOpen = goalOpen; closeAllSelects(); setGoalOpen(!wasOpen); }}
                                    className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm transition hover:border-zinc-600 ${goalOpen ? "border-lime-400 bg-zinc-800/50" : "border-zinc-700 bg-zinc-800/50"} ${selectedGoal ? "text-zinc-100" : "text-zinc-500"}`}
                                >
                                    <span>{selectedGoal ? selectedGoal.name : "Elegir meta..."}</span>
                                    <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${goalOpen ? "rotate-180" : ""}`} />
                                </button>
                                {goalOpen && (
                                    <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-[#1b1b1d] py-1 shadow-2xl max-h-48 overflow-y-auto">
                                        {goals.map(g => (
                                            <button key={g.id} onClick={() => { onUpdate({ goalId: g.id }); setGoalOpen(false); }} className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-white/5 ${action.goalId === g.id ? "text-lime-400" : "text-zinc-200"}`}>
                                                {g.name}
                                                {action.goalId === g.id && <Check className="h-4 w-4" />}
                                            </button>
                                        ))}
                                        {goals.length === 0 && <p className="px-4 py-3 text-sm text-zinc-500 text-center">No hay metas activas</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Tipo de monto</label>
                            <div className="relative">
                                <button
                                    onClick={() => { const wasOpen = amountTypeOpen; closeAllSelects(); setAmountTypeOpen(!wasOpen); }}
                                    className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm transition hover:border-zinc-600 ${amountTypeOpen ? "border-lime-400 bg-zinc-800/50" : "border-lime-500/50 bg-zinc-800/50"} text-zinc-100`}
                                >
                                    <span>{currentAmountTypeLabel}</span>
                                    <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${amountTypeOpen ? "rotate-180" : ""}`} />
                                </button>
                                {amountTypeOpen && (
                                    <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-[#1b1b1d] py-1 shadow-2xl">
                                        {AMOUNT_TYPES.map(t => (
                                            <button key={t.key} onClick={() => { onUpdate({ amountType: t.key as RuleAction["amountType"] }); setAmountTypeOpen(false); }} className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-white/5 ${action.amountType === t.key || (!action.amountType && t.key === "percentage") ? "text-lime-400" : "text-zinc-200"}`}>
                                                {t.label}
                                                {(action.amountType === t.key || (!action.amountType && t.key === "percentage")) && <Check className="h-4 w-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">{action.amountType === "fixed" ? "Monto" : "Porcentaje"}</label>
                            <div className="relative">
                                <input type="number" value={action.amountValue || ""} onChange={e => onUpdate({ amountValue: parseFloat(e.target.value) || 0 })} placeholder="100" className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 placeholder:text-zinc-500 pr-8" />
                                {(!action.amountType || action.amountType === "percentage") && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">%</span>}
                            </div>
                        </div>
                    </>)}
                </div>

                {/* Footer */}
                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 rounded-lg border border-zinc-700 bg-zinc-800/50 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 rounded-lg bg-[#3a4515] hover:bg-[#4a5518] text-sm font-semibold text-[#b8cc40] transition flex items-center justify-center gap-2 border border-[#4a5518]"
                    >
                        <Save className="h-4 w-4 shrink-0" /> Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Modal Shell ─────────────────────────────────────

function ModalShell({ children, onClose }: { children: ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 px-4 backdrop-blur-[2px]">
            <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-700 bg-[#1b1b1d] shadow-2xl">
                <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"><X className="h-4 w-4" /></button>
                {children}
            </div>
        </div>
    );
}


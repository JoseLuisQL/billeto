"use client";

import { memo, useState } from "react";
import {
    Handle, Position, type NodeProps,
    BaseEdge, getSmoothStepPath, EdgeLabelRenderer, useReactFlow, type EdgeProps,
} from "@xyflow/react";
import { Zap, Tag, AlertTriangle, MoreVertical, Pencil, Copy, Trash2, Settings, Target } from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ─────────────────────────────────────────

export type TriggerNodeData = {
    label: string;
    description: string;
};

export type ConditionNodeData = {
    conditionId: string;
    field: string;
    operator: string;
    value: string;
    caseSensitive: boolean;
    onEdit: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
};

export type ActionNodeData = {
    actionId: string;
    actionType: string;
    categoryName?: string;
    accountName?: string;
    goalName?: string;
    descriptionValue?: string;
    modifyType?: string;
    tags?: string[];
    amountType?: string;
    amountValue?: number;
    configured: boolean;
    onEdit: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
};

// ─── Label maps ────────────────────────────────────

const OPERATOR_LABELS: Record<string, string> = {
    contains: "contiene",
    equals: "igual a",
    startsWith: "empieza con",
    endsWith: "termina con",
    regex: "coincide con regex",
};

const FIELD_LABELS: Record<string, string> = {
    description: "Descripción",
    amount: "Monto",
    account: "Cuenta",
    category: "Categoría",
    type: "Tipo",
    currency: "Moneda",
    origin: "Origen",
    originNumber: "Número de origen",
    name: "Nombre",
};

const ACTION_LABELS: Record<string, string> = {
    setCategory: "Asignar categoría",
    setAccount: "Asignar cuenta",
    modifyDescription: "Modificar descripción",
    addToGoal: "Agregar a meta",
    addTags: "Agregar Tags",
};

// ─── Helpers ───────────────────────────────────────

function buildConditionSummary(d: ConditionNodeData): string {
    const field = FIELD_LABELS[d.field] || d.field;
    const op = OPERATOR_LABELS[d.operator] || d.operator;
    return `Si ${field} ${op} "${d.value}"`;
}

function buildActionSummary(d: ActionNodeData): string {
    switch (d.actionType) {
        case "setCategory":
            return d.categoryName ? `Entonces asignar categoría "${d.categoryName}"` : "Entonces asignar categoría …";
        case "setAccount":
            return d.accountName ? `Entonces asignar cuenta "${d.accountName}"` : "Entonces asignar cuenta …";
        case "modifyDescription": {
            const mType = d.modifyType === "replace" ? "reemplazar con" : d.modifyType === "prepend" ? "agregar al inicio" : "agregar al final";
            return d.descriptionValue ? `Entonces ${mType} "${d.descriptionValue}"` : `Entonces modificar descripción …`;
        }
        case "addToGoal": {
            const pct = d.amountType === "fixed"
                ? (d.amountValue != null ? `(fijo ${d.amountValue})` : "")
                : (d.amountValue != null ? `(${d.amountValue}%)` : "(100%)");
            return d.goalName ? `Entonces agregar a meta "${d.goalName}" ${pct}` : "Entonces agregar a meta …";
        }
        case "addTags":
            return d.tags?.length ? `Entonces agregar tags: ${d.tags.map(t => `"${t}"`).join(", ")}` : "Entonces agregar tags …";
        default:
            return ACTION_LABELS[d.actionType] || d.actionType;
    }
}

// ─── Trigger Node ──────────────────────────────────

export const TriggerNode = memo(function TriggerNode({ data }: NodeProps) {
    const d = data as unknown as TriggerNodeData;
    return (
        <div className="w-[420px] rounded-xl border border-zinc-600 bg-[#1a1a1d] p-4 shadow-xl shadow-black/20">
            <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-[#1a1a1d] !bg-lime-500" />
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                    <Zap className="h-5 w-5 text-lime-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{d.label}</span>
                        <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">Disparador</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{d.description}</p>
                </div>
            </div>
        </div>
    );
});

// ─── Condition Node ────────────────────────────────

export const ConditionNode = memo(function ConditionNode({ data, selected }: NodeProps) {
    const d = data as unknown as ConditionNodeData;
    const isConfigured = !!d.value?.trim();
    const borderClass = selected
        ? "border-lime-400 ring-1 ring-lime-400/30"
        : !isConfigured
            ? "border-red-500/60"
            : "border-zinc-600";

    const conditionLabel = isConfigured
        ? `Condición`
        : "Condición";

    return (
        <div className={`w-[420px] rounded-xl border ${borderClass} bg-[#1a1a1d] p-4 shadow-xl shadow-black/20 transition-all`}>
            <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-[#1a1a1d] !bg-zinc-500" />
            <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-[#1a1a1d] !bg-lime-500" />

            {/* Header row */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <Zap className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{conditionLabel}</span>
                        <span className="rounded bg-zinc-600 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200">IF</span>
                    </div>
                </div>
                <NodeMenu
                    onEdit={() => d.onEdit(d.conditionId)}
                    onDuplicate={() => d.onDuplicate(d.conditionId)}
                    onDelete={() => d.onDelete(d.conditionId)}
                />
            </div>

            {/* Summary box */}
            {isConfigured ? (
                <div className="mt-3 rounded-lg bg-zinc-800/60 px-3.5 py-2.5 font-mono text-[13px] text-zinc-300 leading-relaxed">
                    <span className="text-amber-400 font-semibold">Si</span>{" "}
                    {FIELD_LABELS[d.field] || d.field} {OPERATOR_LABELS[d.operator] || d.operator} <span className="text-lime-400">&quot;{d.value}&quot;</span>
                </div>
            ) : (
                <div className="mt-3 rounded-lg bg-red-950/30 border border-red-500/20 px-3.5 py-2.5">
                    <p className="text-xs text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" /> <em>Falta configurar condición</em>
                    </p>
                </div>
            )}

            {/* Fallback line */}
            {isConfigured && (
                <p className="mt-2 text-[11px] text-zinc-500 pl-1">
                    • Si no se cumple: No hacer nada
                </p>
            )}
        </div>
    );
});

// ─── Action Node ───────────────────────────────────

export const ActionNode = memo(function ActionNode({ data, selected }: NodeProps) {
    const d = data as unknown as ActionNodeData;
    const borderClass = selected
        ? "border-lime-400 ring-1 ring-lime-400/30"
        : !d.configured
            ? "border-red-500/60"
            : "border-zinc-600";

    const actionTitle = d.configured ? buildActionTitle(d) : "Acción";
    const actionSummary = d.configured ? buildActionSummary(d) : "";

    return (
        <div className={`w-[420px] rounded-xl border ${borderClass} bg-[#1a1a1d] p-4 shadow-xl shadow-black/20 transition-all`}>
            <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-[#1a1a1d] !bg-zinc-500" />
            <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-[#1a1a1d] !bg-blue-500" />

            {/* Header row */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-500/10">
                    <Target className="h-5 w-5 text-lime-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm truncate">{actionTitle}</span>
                        <span className="rounded bg-lime-500/20 px-1.5 py-0.5 text-[10px] font-bold text-lime-400 shrink-0">DO</span>
                    </div>
                </div>
                <NodeMenu
                    onEdit={() => d.onEdit(d.actionId)}
                    onDuplicate={() => d.onDuplicate(d.actionId)}
                    onDelete={() => d.onDelete(d.actionId)}
                />
            </div>

            {/* Summary box */}
            {d.configured ? (
                <div className="mt-3 rounded-lg bg-zinc-800/60 px-3.5 py-2.5 font-mono text-[13px] text-zinc-300 leading-relaxed">
                    {actionSummary}
                </div>
            ) : (
                <div className="mt-3 rounded-lg bg-red-950/30 border border-red-500/20 px-3.5 py-2.5">
                    <p className="text-xs text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" /> <em>Falta configurar acción</em>
                    </p>
                </div>
            )}
        </div>
    );
});

function buildActionTitle(d: ActionNodeData): string {
    switch (d.actionType) {
        case "setCategory":
            return d.categoryName ? `Entonces ${d.categoryName}` : "Entonces asignar categoría";
        case "setAccount":
            return d.accountName ? `Entonces ${d.accountName}` : "Entonces asignar cuenta";
        case "modifyDescription":
            return "Entonces modificar desc...";
        case "addToGoal":
            return d.goalName ? `Entonces agregar a me...` : "Entonces agregar a meta";
        case "addTags":
            return d.tags?.length ? `Entonces tags (${d.tags.length})` : "Entonces agregar tags";
        default:
            return ACTION_LABELS[d.actionType] || d.actionType;
    }
}

// ─── Node Menu ─────────────────────────────────────

function NodeMenu({ onEdit, onDuplicate, onDelete }: {
    onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
    const stopPropagation = (e: React.MouseEvent | React.PointerEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="nopan nodrag nowheel" onPointerDown={stopPropagation} onClick={stopPropagation} onMouseDown={stopPropagation}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className="rounded-md border border-zinc-700 p-1.5 text-zinc-500 hover:bg-white/10 hover:text-zinc-200 transition"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="border-zinc-800 bg-zinc-950 text-zinc-100 z-[100]"
                    onPointerDown={stopPropagation}
                    onClick={stopPropagation}
                >
                    <DropdownMenuItem onClick={onEdit} className="cursor-pointer text-xs gap-2"><Pencil className="h-3.5 w-3.5" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer text-xs gap-2"><Copy className="h-3.5 w-3.5" /> Duplicar</DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-xs text-rose-400 gap-2"><Trash2 className="h-3.5 w-3.5" /> Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

// ─── Node type registry ────────────────────────────

export const nodeTypes = {
    trigger: TriggerNode,
    condition: ConditionNode,
    action: ActionNode,
};

// ─── Custom Edge with Selection + Delete ───────────

export function DeletableEdge({
    id, sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition, selected, markerEnd, style,
}: EdgeProps) {
    const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX, sourceY, targetX, targetY,
        sourcePosition, targetPosition,
    });

    const baseStroke = style?.stroke as string || "#84cc16";
    const strokeWidth = selected ? 3 : Number(style?.strokeWidth ?? 2);

    return (
        <>
            {/* Glow layer behind the edge when selected */}
            {selected && (
                <path
                    d={edgePath}
                    fill="none"
                    stroke={baseStroke}
                    strokeWidth={8}
                    strokeOpacity={0.25}
                    className="pointer-events-none"
                    style={{ filter: "blur(4px)" }}
                />
            )}

            {/* Main edge */}
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: selected ? "#facc15" : baseStroke,
                    strokeWidth,
                    strokeDasharray: selected ? "8 4" : style?.strokeDasharray,
                    transition: "stroke 0.15s, stroke-width 0.15s",
                }}
            />

            {/* Delete button — only visible when selected */}
            {selected && (
                <EdgeLabelRenderer>
                    <div
                        className="nodrag nopan"
                        style={{
                            position: "absolute",
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            pointerEvents: "all",
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setEdges((eds) => eds.filter((e) => e.id !== id));
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-red-500/50 bg-red-950/90 text-red-400 shadow-lg shadow-red-950/50 backdrop-blur-sm transition hover:bg-red-900 hover:text-red-300 hover:scale-110"
                            title="Eliminar conexión"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

export const edgeTypes = {
    deletable: DeletableEdge,
};

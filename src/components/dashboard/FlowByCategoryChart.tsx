"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { ResponsiveContainer, Sankey, Tooltip } from "recharts";
import { obtenerFlujoCategorias } from "@/lib/actions/charts";

type FlowNode = { name: string; color: string; rawValue: number };
type FlowLink = { source: number; target: number; value: number };

type RenderNode = FlowNode & { lane: "left" | "center" | "right" | "other" | "hidden" };
type RenderLink = FlowLink & { color: string };

type SankeyLinkProps = {
  sourceX?: number;
  targetX?: number;
  sourceY?: number;
  targetY?: number;
  sourceControlX?: number;
  targetControlX?: number;
  linkWidth?: number;
  payload?: RenderLink;
};

type SankeyNodeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: RenderNode;
  moneda?: string;
};

function SankeyLinkShape({
  sourceX = 0,
  targetX = 0,
  sourceY = 0,
  targetY = 0,
  sourceControlX = 0,
  targetControlX = 0,
  linkWidth = 1,
  payload,
}: SankeyLinkProps) {
  if (payload?.color === "transparent") {
    return <g />;
  }
  const half = linkWidth / 2;
  const path = `M${sourceX},${sourceY - half} C${sourceControlX},${sourceY - half} ${targetControlX},${targetY - half} ${targetX},${targetY - half} L${targetX},${targetY + half} C${targetControlX},${targetY + half} ${sourceControlX},${sourceY + half} ${sourceX},${sourceY + half} Z`;

  return <path d={path} fill={payload?.color || "#7c1f34"} fillOpacity={0.82} stroke="none" />;
}

function SankeyNodeLabel({ x = 0, y = 0, width = 8, height = 8, payload, moneda = "PEN" }: SankeyNodeProps) {
  const name = payload?.name || "Nodo";
  const rawValue = payload?.rawValue ?? 0;
  const lane = payload?.lane || "other";

  const color = lane === "left" ? "#16a34a" : lane === "center" || lane === "right" ? "#ef4444" : payload?.color || "#3f3f46";

  const isCenter = lane === "center";
  const isLeft = lane === "left";
  const textX = isLeft ? x + width + 8 : isCenter ? x + width / 2 : x - 8;
  const textAnchor = isLeft ? "start" : isCenter ? "middle" : "end";

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={4} />
      <text
        x={textX}
        y={y + Math.max(16, Math.min(height / 2, 30))}
        fill="#d4d4d8"
        textAnchor={textAnchor}
        fontSize={12}
        fontWeight={500}
      >
        {name}
      </text>
      <text
        x={textX}
        y={y + Math.max(30, Math.min(height / 2 + 14, 44))}
        fill="#a1a1aa"
        textAnchor={textAnchor}
        fontSize={11}
      >
        {Math.round(rawValue)} {moneda}
      </text>
    </g>
  );
}

export function FlowByCategoryChart({ from, to }: { from?: string; to?: string }) {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [links, setLinks] = useState<FlowLink[]>([]);
  const [moneda, setMoneda] = useState("PEN");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerFlujoCategorias({ from, to }).then((res) => {
      setNodes(res.nodes);
      setLinks(res.links);
      setMoneda(res.moneda);
      setCargando(false);
    });
  }, [from, to]);

  const data = useMemo(() => {
    const centerIndex = nodes.findIndex((n) => n.name.includes("Gastos"));

    const renderNodes: RenderNode[] = nodes.map((n, i) => ({
      ...n,
      lane: centerIndex === -1 ? "other" : i < centerIndex ? "left" : i === centerIndex ? "center" : "right",
    }));

    const renderLinks: RenderLink[] = links.map((l) => {
      const sourceLane = renderNodes[l.source]?.lane;
      const targetLane = renderNodes[l.target]?.lane;

      if (sourceLane === "left" && targetLane === "center") {
        return { ...l, color: "#2b8a67" };
      }
      if (sourceLane === "center" && targetLane === "right") {
        return { ...l, color: "#7c1f34" };
      }
      return { ...l, color: "#52525b" };
    });

    return { nodes: renderNodes, links: renderLinks };
  }, [nodes, links]);

  if (cargando) {
    return <div className="h-72 animate-pulse rounded-lg bg-zinc-900/40" />;
  }

  if (nodes.length === 0 || links.length === 0) {
    return <div className="h-72 flex items-center justify-center text-sm text-zinc-500">Sin datos de flujo</div>;
  }

  return (
    <div className="relative rounded-lg border border-white/5 bg-zinc-900/30 p-3">
      <div className="absolute right-3 top-3 z-10 group">
        <button className="rounded-full border border-white/10 bg-zinc-900/70 p-1.5 text-zinc-400 hover:text-zinc-200">
          <Info className="h-3.5 w-3.5" />
        </button>
        <div className="pointer-events-none absolute right-0 top-8 hidden w-60 rounded-md bg-black px-3 py-2 text-xs text-white shadow-xl group-hover:block">
          Los montos del gráfico están unificados en tu moneda principal: {moneda}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={data}
            nodePadding={16}
            nodeWidth={10}
            node={<SankeyNodeLabel moneda={moneda} />}
            link={<SankeyLinkShape />}
            margin={{ top: 12, bottom: 12, left: 14, right: 14 }}
          >
            <Tooltip
              contentStyle={{
                backgroundColor: "#111217",
                border: "1px solid #2A2B34",
                borderRadius: "10px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#f4f4f5" }}
              itemStyle={{ color: "#f4f4f5" }}
              formatter={(value) => [`${Math.round(Number(value) || 0)} ${moneda}`, "Monto"]}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

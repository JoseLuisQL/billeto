"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import {
    listarSuscripcionesPopulares,
    obtenerCategoriasPopulares,
} from "@/lib/actions/popular-subscriptions";

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

interface PopularSubscriptionsGridProps {
    onSelect: (sub: PopularSub) => void;
}

const categoryColors: Record<string, string> = {
    Todas: "#D3FF0A",
    Streaming: "#E11D48",
    Almacenamiento: "#3B82F6",
    Delivery: "#F97316",
    Deportes: "#10B981",
    Desarrollo: "#6366F1",
    Entretenimiento: "#8B5CF6",
    Finanzas: "#EAB308",
    IA: "#10A37F",
    Internet: "#06B6D4",
    Música: "#EC4899",
    Productividad: "#F59E0B",
    "Redes Sociales": "#3B82F6",
};

const ROWS = 3;

export function PopularSubscriptionsGrid({ onSelect }: PopularSubscriptionsGridProps) {
    const [suscripciones, setSuscripciones] = useState<PopularSub[]>([]);
    const [categorias, setCategorias] = useState<string[]>([]);
    const [filtroActivo, setFiltroActivo] = useState("Todas");
    const [cargando, setCargando] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pillsRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // Drag-to-scroll state for grid
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeftStart = useRef(0);
    const hasDragged = useRef(false);

    // Drag-to-scroll state for pills
    const isPillsDragging = useRef(false);
    const pillsStartX = useRef(0);
    const pillsScrollLeftStart = useRef(0);
    const pillsHasDragged = useRef(false);

    useEffect(() => {
        Promise.all([
            listarSuscripcionesPopulares(),
            obtenerCategoriasPopulares(),
        ]).then(([subsRes, catsRes]) => {
            setSuscripciones(subsRes.suscripciones);
            setCategorias(catsRes.categorias);
            setCargando(false);
        });
    }, []);

    const updateScrollIndicators = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 5);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        updateScrollIndicators();
        el.addEventListener("scroll", updateScrollIndicators, { passive: true });
        const ro = new ResizeObserver(updateScrollIndicators);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", updateScrollIndicators);
            ro.disconnect();
        };
    }, [suscripciones, updateScrollIndicators]);

    async function handleFilterChange(cat: string) {
        if (pillsHasDragged.current) return;
        setFiltroActivo(cat);
        setCargando(true);
        const res = await listarSuscripcionesPopulares(cat === "Todas" ? undefined : cat);
        setSuscripciones(res.suscripciones);
        setCargando(false);
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        }
    }

    function scrollCarousel(direction: "left" | "right") {
        const el = scrollRef.current;
        if (!el) return;
        const scrollAmount = 520;
        el.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    }

    // --- Drag to scroll handlers for GRID ---
    function handleMouseDown(e: React.MouseEvent) {
        const el = scrollRef.current;
        if (!el) return;
        isDragging.current = true;
        hasDragged.current = false;
        startX.current = e.pageX - el.offsetLeft;
        scrollLeftStart.current = el.scrollLeft;
        el.style.cursor = "grabbing";
        el.style.userSelect = "none";
    }

    function handleMouseMove(e: React.MouseEvent) {
        if (!isDragging.current) return;
        const el = scrollRef.current;
        if (!el) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const walk = (x - startX.current) * 1.5;
        if (Math.abs(walk) > 5) hasDragged.current = true;
        el.scrollLeft = scrollLeftStart.current - walk;
    }

    function handleMouseUp() {
        isDragging.current = false;
        const el = scrollRef.current;
        if (el) {
            el.style.cursor = "grab";
            el.style.userSelect = "";
        }
    }

    function handleMouseLeave() {
        if (isDragging.current) {
            isDragging.current = false;
            const el = scrollRef.current;
            if (el) {
                el.style.cursor = "grab";
                el.style.userSelect = "";
            }
        }
    }

    // --- Drag to scroll handlers for PILLS ---
    function handlePillsMouseDown(e: React.MouseEvent) {
        const el = pillsRef.current;
        if (!el) return;
        isPillsDragging.current = true;
        pillsHasDragged.current = false;
        pillsStartX.current = e.pageX - el.offsetLeft;
        pillsScrollLeftStart.current = el.scrollLeft;
        el.style.cursor = "grabbing";
        el.style.userSelect = "none";
    }

    function handlePillsMouseMove(e: React.MouseEvent) {
        if (!isPillsDragging.current) return;
        const el = pillsRef.current;
        if (!el) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const walk = (x - pillsStartX.current) * 1.5;
        if (Math.abs(walk) > 5) pillsHasDragged.current = true;
        el.scrollLeft = pillsScrollLeftStart.current - walk;
    }

    function handlePillsMouseUp() {
        isPillsDragging.current = false;
        const el = pillsRef.current;
        if (el) {
            el.style.cursor = "grab";
            el.style.userSelect = "";
        }
    }

    function handlePillsMouseLeave() {
        if (isPillsDragging.current) {
            isPillsDragging.current = false;
            const el = pillsRef.current;
            if (el) {
                el.style.cursor = "grab";
                el.style.userSelect = "";
            }
        }
    }

    function handleCardClick(sub: PopularSub) {
        // Prevent click after drag
        if (hasDragged.current) return;
        onSelect(sub);
    }

    return (
        <div className="rounded-xl border border-white/5 bg-zinc-900/30 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D3FF0A]/20 to-[#D3FF0A]/5 flex items-center justify-center border border-[#D3FF0A]/10">
                        <Sparkles className="w-4 h-4 text-[#D3FF0A]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-100">
                            Suscripciones populares
                        </h3>
                        <p className="text-[11px] text-zinc-500">
                            Agregalo en un click
                        </p>
                    </div>
                </div>
                {/* Navigation arrows */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => scrollCarousel("left")}
                        disabled={!canScrollLeft}
                        className="w-7 h-7 rounded-md flex items-center justify-center bg-zinc-800/60 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700/60 hover:border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => scrollCarousel("right")}
                        disabled={!canScrollRight}
                        className="w-7 h-7 rounded-md flex items-center justify-center bg-zinc-800/60 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700/60 hover:border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Category filter pills — with drag-to-scroll */}
            <div
                ref={pillsRef}
                className="flex gap-1.5 px-5 pb-3 overflow-x-auto scrollbar-hide"
                style={{ cursor: "grab" }}
                onMouseDown={handlePillsMouseDown}
                onMouseMove={handlePillsMouseMove}
                onMouseUp={handlePillsMouseUp}
                onMouseLeave={handlePillsMouseLeave}
            >
                {["Todas", ...categorias].map((cat) => {
                    const isActive = filtroActivo === cat;
                    const dotColor = categoryColors[cat] || "#6366f1";
                    return (
                        <button
                            key={cat}
                            onClick={() => handleFilterChange(cat)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 select-none ${isActive
                                ? "bg-white/10 text-white border border-white/15 shadow-sm"
                                : "bg-zinc-800/30 text-zinc-500 border border-transparent hover:border-white/5 hover:text-zinc-400"
                                }`}
                        >
                            <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: isActive ? dotColor : `${dotColor}80` }}
                            />
                            {cat}
                        </button>
                    );
                })}
            </div>

            {/* Grid carousel with drag scroll */}
            <div className="relative">
                {/* Left gradient fade */}
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-zinc-900/95 to-transparent z-10 pointer-events-none" />
                )}
                {/* Right gradient fade */}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-zinc-900/95 to-transparent z-10 pointer-events-none" />
                )}

                {cargando ? (
                    <div className="px-5 pb-4">
                        <div className="grid grid-rows-3 grid-flow-col gap-2 overflow-hidden">
                            {Array.from({ length: 18 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-[160px] h-[52px] rounded-lg bg-zinc-800/30 animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                ) : suscripciones.length === 0 ? (
                    <div className="px-5 pb-5 text-center">
                        <p className="text-xs text-zinc-500 py-4">
                            No hay suscripciones en esta categoría
                        </p>
                    </div>
                ) : (
                    <div
                        ref={scrollRef}
                        className="overflow-x-auto scrollbar-hide scroll-smooth px-5 pb-4"
                        style={{ cursor: "grab" }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div
                            className="grid grid-flow-col gap-2"
                            style={{ gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
                        >
                            {suscripciones.map((sub) => (
                                <button
                                    key={sub.id}
                                    onClick={() => handleCardClick(sub)}
                                    className="group relative flex items-center gap-2.5 w-[160px] px-3 py-2.5 rounded-lg bg-zinc-800/25 border border-white/[0.04] hover:border-[#D3FF0A]/20 hover:bg-zinc-800/50 transition-all duration-200 text-left select-none"
                                >
                                    {/* Hover glow */}
                                    <div
                                        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                        style={{
                                            background: `radial-gradient(ellipse at 15% 50%, ${sub.color || "#6366f1"}10 0%, transparent 70%)`,
                                        }}
                                    />

                                    {/* Icon */}
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-transform duration-200 group-hover:scale-105"
                                        style={{
                                            backgroundColor: `${sub.color || "#6366f1"}25`,
                                        }}
                                    >
                                        <span className="drop-shadow-sm">{sub.icon || "📦"}</span>
                                    </div>

                                    {/* Text */}
                                    <div className="min-w-0 relative z-0">
                                        <div className="text-[11px] font-medium text-zinc-300 truncate group-hover:text-white transition-colors leading-tight">
                                            {sub.name}
                                        </div>
                                        <div className="text-[10px] text-zinc-600 mt-0.5">
                                            <span className="text-zinc-500 group-hover:text-[#D3FF0A]/80 transition-colors">
                                                {sub.currency === "USD" ? "US$" : sub.currency}{" "}
                                                {sub.price % 1 === 0 ? sub.price.toFixed(2) : sub.price.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

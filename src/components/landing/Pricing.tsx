"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

/**
 * Sección de Pricing con diseño premium.
 * Plan Pro destacado con borde gradiente y efecto glow.
 */

const planes = [
    {
        nombre: "Free",
        precio: "0",
        periodo: "/mes",
        descripcion: "Para empezar a controlar tus finanzas",
        destacado: false,
        badge: null,
        icon: null,
        caracteristicas: [
            "50 transacciones/mes",
            "1 cuenta financiera",
            "Dashboard básico",
            "Categorización automática",
            "Metas financieras (1 activa)",
        ],
        ctaTexto: "Empezar gratis",
    },
    {
        nombre: "Pro",
        precio: "9",
        periodo: "/mes",
        descripcion: "Para quienes quieren el control total",
        destacado: true,
        badge: "Más Popular",
        icon: Sparkles,
        caracteristicas: [
            "Transacciones ilimitadas",
            "5 cuentas financieras",
            "Dashboard completo + analytics",
            "Asistente IA ilimitado",
            "OCR de comprobantes",
            "Reglas y recurrentes",
            "Presupuestos y metas ilimitadas",
            "Multi-moneda con FX rates",
        ],
        ctaTexto: "Probar 7 días gratis",
    },
    {
        nombre: "Premium",
        precio: "19",
        periodo: "/mes",
        descripcion: "Para negocios y power users",
        destacado: false,
        badge: "Next Level",
        icon: Zap,
        caracteristicas: [
            "Todo de Pro",
            "Cuentas ilimitadas",
            "API & Webhooks",
            "Integración bancaria",
            "Gastos grupales (Vaquitas)",
            "Soporte prioritario",
            "Exportaciones avanzadas",
            "Agente IA premium",
        ],
        ctaTexto: "Probar 7 días gratis",
    },
];

export function Pricing() {
    return (
        <section id="planes" className="py-24 relative">
            <div className="container mx-auto px-4">
                {/* Encabezado */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase text-lime-400/70 mb-4">Planes</p>
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        Precio justo,{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
                            resultados extraordinarios
                        </span>
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                        Empieza gratis y escala cuando lo necesites. Sin compromisos.
                    </p>
                </motion.div>

                {/* Grilla de planes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
                    {planes.map((plan, i) => {
                        const IconComp = plan.icon;
                        return (
                            <motion.div
                                key={plan.nombre}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12, duration: 0.5 }}
                                className={`relative rounded-2xl transition-all duration-500 ${plan.destacado
                                    ? "md:scale-105 md:-mt-4 md:mb-[-16px]"
                                    : ""
                                    }`}
                            >
                                {/* Borde gradiente para plan destacado */}
                                {plan.destacado && (
                                    <div className="absolute -inset-[1px] bg-gradient-to-b from-lime-400/40 via-lime-400/20 to-lime-400/5 rounded-2xl" />
                                )}

                                <div className={`relative rounded-2xl p-7 ${plan.destacado
                                    ? "bg-zinc-900 shadow-2xl shadow-lime-400/5"
                                    : "bg-zinc-900/50 border border-white/[0.06] hover:border-white/15"
                                    }`}>

                                    {/* Badge */}
                                    {plan.badge && (
                                        <div className="mb-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${plan.destacado
                                                ? "bg-lime-400/15 text-lime-400"
                                                : "bg-white/5 text-zinc-400"
                                                }`}>
                                                {IconComp && <IconComp className="w-3 h-3" />}
                                                {plan.badge}
                                            </span>
                                        </div>
                                    )}

                                    {/* Nombre y precio */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-white mb-1">{plan.nombre}</h3>
                                        <p className="text-sm text-zinc-500 mb-5">{plan.descripcion}</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm text-zinc-400">$</span>
                                            <span className="text-5xl font-bold text-white tracking-tight">{plan.precio}</span>
                                            <span className="text-zinc-500 text-sm">{plan.periodo}</span>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <Link href="/register" className="block mb-7">
                                        <Button
                                            className={`w-full font-semibold rounded-xl h-11 transition-all duration-300 ${plan.destacado
                                                ? "bg-lime-400 text-zinc-950 hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(163,230,53,0.2)]"
                                                : "bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10"
                                                }`}
                                        >
                                            {plan.ctaTexto}
                                        </Button>
                                    </Link>

                                    {/* Separador */}
                                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

                                    {/* Lista de características */}
                                    <ul className="space-y-3.5">
                                        {plan.caracteristicas.map((feat) => (
                                            <li key={feat} className="flex items-start gap-3 text-sm">
                                                <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.destacado
                                                    ? "bg-lime-400/15 text-lime-400"
                                                    : "bg-white/5 text-zinc-500"
                                                    }`}>
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                                <span className="text-zinc-400">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Garantía */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="text-center text-xs text-zinc-500 mt-10"
                >
                    ✦ Cancela cuando quieras · Sin compromisos · Garantía de 30 días
                </motion.p>
            </div>
        </section>
    );
}

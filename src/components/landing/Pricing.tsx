"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

/**
 * Sección de Planes y Precios.
 * 3 tarjetas verticales: Free, Pro (destacado), Premium.
 * El plan Pro tiene borde neón y badge "Más Popular".
 */

const planes = [
    {
        nombre: "Free",
        precio: "$0",
        periodo: "/mes",
        descripcion: "Para empezar a controlar tus finanzas",
        destacado: false,
        caracteristicas: [
            "50 transacciones/mes",
            "1 cuenta",
            "Dashboard básico",
            "WhatsApp (5 mensajes/día)",
            "Categorización automática",
        ],
    },
    {
        nombre: "Pro",
        precio: "$9",
        periodo: "/mes",
        descripcion: "Para quienes quieren el control total",
        destacado: true,
        caracteristicas: [
            "Transacciones ilimitadas",
            "5 cuentas",
            "Dashboard completo + gráficos",
            "WhatsApp ilimitado",
            "OCR de comprobantes",
            "Reglas y recurrentes",
            "Presupuestos y metas",
            "Multi-moneda",
        ],
    },
    {
        nombre: "Premium",
        precio: "$19",
        periodo: "/mes",
        descripcion: "Para negocios y usuarios avanzados",
        destacado: false,
        caracteristicas: [
            "Todo de Pro",
            "Cuentas ilimitadas",
            "API & Webhooks",
            "Integración bancaria",
            "GasTag + Vaquitas",
            "Soporte prioritario",
            "Exportaciones avanzadas",
            "Agente IA premium",
        ],
    },
];

export function Pricing() {
    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                {/* Encabezado */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Planes simples,{" "}
                        <span className="text-lime-400">resultados extraordinarios</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Empieza gratis y escala cuando lo necesites
                    </p>
                </div>

                {/* Grilla de planes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {planes.map((plan, i) => (
                        <motion.div
                            key={plan.nombre}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            className={`relative rounded-xl p-6 border transition-all duration-300 ${plan.destacado
                                    ? "bg-zinc-900 border-lime-400/50 shadow-[0_0_40px_rgba(211,255,10,0.1)] scale-105"
                                    : "bg-zinc-900/50 border-white/10 hover:border-white/20"
                                }`}
                        >
                            {/* Badge "Más Popular" */}
                            {plan.destacado && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-1 text-xs font-semibold rounded-full bg-lime-400 text-black">
                                        Más Popular
                                    </span>
                                </div>
                            )}

                            {/* Nombre y precio */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-white mb-1">{plan.nombre}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{plan.descripcion}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">{plan.precio}</span>
                                    <span className="text-muted-foreground">{plan.periodo}</span>
                                </div>
                            </div>

                            {/* CTA */}
                            <Link href="/register" className="block mb-6">
                                <Button
                                    className={`w-full font-medium ${plan.destacado
                                            ? "bg-[#D3FF0A] text-black hover:bg-[#c5f000]"
                                            : "bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10"
                                        }`}
                                >
                                    {plan.precio === "$0" ? "Empezar gratis" : "Probar 7 días gratis"}
                                </Button>
                            </Link>

                            {/* Lista de características */}
                            <ul className="space-y-3">
                                {plan.caracteristicas.map((feat) => (
                                    <li key={feat} className="flex items-start gap-3 text-sm">
                                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.destacado ? "text-lime-400" : "text-muted-foreground"
                                            }`} />
                                        <span className="text-muted-foreground">{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

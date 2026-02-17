"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Sección Hero de la Landing Page.
 * Diseño inspirado en Gasti.pro con fondo oscuro, gradientes radiales
 * y CTA principal en Verde Neón (#D3FF0A).
 * Incluye un gráfico simulado animado para transmitir la propuesta de valor.
 */
export function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Gradiente radial de fondo */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/40 via-zinc-950 to-zinc-950" />

            {/* Partículas decorativas (círculos borrosos) */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lime-400/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />

            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Badge superior */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-muted-foreground"
                    >
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                        Nuevo: Asistente IA por WhatsApp
                    </motion.div>

                    {/* Título principal */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
                        Toma el control de{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
                            tus finanzas
                        </span>
                    </h1>

                    {/* Subtítulo */}
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        Registra gastos en segundos desde WhatsApp. Analiza con IA.
                        Automatiza tu vida financiera sin fricción.
                    </p>

                    {/* Botones CTA */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register">
                            <Button
                                size="lg"
                                className="bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000] hover:shadow-[0_0_30px_rgba(211,255,10,0.3)] transition-all duration-300 text-base px-8 py-6"
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Empezar gratis
                            </Button>
                        </Link>
                        <Link href="/product">
                            <Button
                                variant="ghost"
                                size="lg"
                                className="text-muted-foreground hover:text-white group text-base"
                            >
                                Ver funcionalidades
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Gráfico simulado de dashboard */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mt-20 max-w-5xl mx-auto"
                >
                    <div className="relative rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm p-6 shadow-2xl">
                        {/* Barra superior de la "ventana" */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            <span className="ml-4 text-xs text-muted-foreground">Dashboard — Febrero 2026</span>
                        </div>

                        {/* Gráfico simulado con barras */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: "Balance", value: "$12,450", color: "text-white" },
                                { label: "Ingresos", value: "$8,200", color: "text-emerald-400" },
                                { label: "Gastos", value: "$5,750", color: "text-rose-400" },
                                { label: "Ahorro", value: "+18%", color: "text-lime-400" },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-zinc-800/50 rounded-lg p-4 border border-white/5">
                                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Barras animadas simulando actividad */}
                        <div className="flex items-end gap-1.5 h-32">
                            {Array.from({ length: 24 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${25 + ((i * 17) % 70)}%` }}
                                    transition={{ delay: 0.8 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                                    className="flex-1 rounded-t-sm bg-gradient-to-t from-lime-500/40 to-lime-400/80"
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

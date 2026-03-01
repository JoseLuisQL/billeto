"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

/**
 * Sección Hero de la Landing Page — Diseño premium con imagen de fondo,
 * animaciones suaves y dashboard mockup interactivo.
 */

const floatingCards = [
    { icon: "📊", label: "Balance", value: "S/ 12,450.00", color: "text-white", delay: 1.2 },
    { icon: "📈", label: "Ingresos", value: "+S/ 8,200", color: "text-emerald-400", delay: 1.4 },
    { icon: "📉", label: "Gastos", value: "-S/ 5,750", color: "text-rose-400", delay: 1.6 },
    { icon: "🎯", label: "Ahorro", value: "+18.2%", color: "text-lime-400", delay: 1.8 },
];

export function Hero() {
    return (
        <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Imagen de fondo con overlay */}
            <Image
                src="/hero-bg.png"
                alt=""
                fill
                className="object-cover opacity-40"
                priority
                quality={90}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950" />

            {/* Orbes de luz animados */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.03, 0.08, 0.03],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-lime-400 rounded-full blur-[120px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.04, 0.07, 0.04],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-violet-500 rounded-full blur-[120px]"
            />

            {/* Patrón de rejilla sutil */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(211,255,10,0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(211,255,10,0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: "80px 80px",
                }}
            />

            <div className="relative z-10 container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
                    {/* Contenido principal */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-1 text-center lg:text-left max-w-2xl"
                    >
                        {/* Badge superior */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-lime-400/20 bg-lime-400/5 backdrop-blur-sm text-sm"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                            <span className="text-lime-300/90 font-medium">Potenciado por Inteligencia Artificial</span>
                        </motion.div>

                        {/* Título principal */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                            Tu dinero,{" "}
                            <span className="relative">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400">
                                    bajo control
                                </span>
                                <motion.span
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 1, duration: 0.6 }}
                                    className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-lime-400/0 via-lime-400 to-lime-400/0 origin-left"
                                />
                            </span>
                            <br />
                            <span className="text-zinc-400 text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-medium">
                                inteligente y automático
                            </span>
                        </h1>

                        {/* Subtítulo */}
                        <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                            Registra gastos en segundos con IA. Visualiza tus finanzas con dashboards potentes.
                            Toma decisiones financieras inteligentes sin esfuerzo.
                        </p>

                        {/* Botones CTA */}
                        <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
                            <Link href="/register">
                                <Button
                                    size="lg"
                                    className="bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(163,230,53,0.25)] transition-all duration-300 text-base px-8 py-6 rounded-xl"
                                >
                                    Empezar gratis
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/product">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="text-zinc-400 hover:text-white group text-base rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 px-8 py-6"
                                >
                                    Explorar funciones
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>

                        {/* Indicadores de confianza */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            className="flex items-center gap-6 mt-10 text-xs text-zinc-500 justify-center lg:justify-start"
                        >
                            <div className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Datos encriptados</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-lime-500" />
                                <span>Setup en 30 segundos</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                                <span>100% gratuito</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Dashboard Preview Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 40, rotateY: -5 }}
                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                        transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                        className="flex-1 max-w-lg w-full perspective-[1200px]"
                    >
                        <div className="relative">
                            {/* Glow efecto detrás de la card */}
                            <div className="absolute -inset-4 bg-gradient-to-br from-lime-400/10 via-transparent to-violet-500/10 rounded-3xl blur-2xl" />

                            <div className="relative rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
                                {/* Barra de ventana */}
                                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5 bg-zinc-900/50">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                                    </div>
                                    <span className="ml-3 text-[11px] text-zinc-500 font-medium tracking-wide">app.billeto.pro — Dashboard</span>
                                </div>

                                {/* KPI Cards */}
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {floatingCards.map((card, idx) => (
                                            <motion.div
                                                key={card.label}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: card.delay, duration: 0.5 }}
                                                className="group relative rounded-xl bg-zinc-800/60 border border-white/5 p-4 hover:border-lime-400/20 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-base">{card.icon}</span>
                                                    <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">{card.label}</span>
                                                </div>
                                                <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Mini chart animado */}
                                    <div className="rounded-xl bg-zinc-800/40 border border-white/5 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Actividad del mes</span>
                                            <span className="text-[10px] text-lime-400 font-medium px-2 py-0.5 rounded-full bg-lime-400/10">En vivo</span>
                                        </div>
                                        <div className="flex items-end gap-[3px] h-24">
                                            {Array.from({ length: 28 }).map((_, i) => {
                                                const h = 15 + Math.sin(i * 0.5) * 25 + Math.cos(i * 0.3) * 20 + (i / 28) * 15;
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${Math.min(h, 95)}%` }}
                                                        transition={{ delay: 2 + i * 0.04, duration: 0.4, ease: "easeOut" }}
                                                        className="flex-1 rounded-t bg-gradient-to-t from-lime-500/30 to-lime-400/70 hover:from-lime-500/50 hover:to-lime-300 transition-colors"
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Transacciones recientes simuladas */}
                                    <div className="space-y-2">
                                        {[
                                            { emoji: "🛒", desc: "Wong Supermercado", amount: "-S/ 145.90", time: "Hace 2h" },
                                            { emoji: "💼", desc: "Depósito nómina", amount: "+S/ 4,200.00", time: "Hoy" },
                                            { emoji: "☕", desc: "Starbucks Reserve", amount: "-S/ 18.50", time: "Ayer" },
                                        ].map((tx, i) => (
                                            <motion.div
                                                key={tx.desc}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 2.5 + i * 0.15 }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/30 border border-white/5"
                                            >
                                                <span className="text-lg">{tx.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white font-medium truncate">{tx.desc}</p>
                                                    <p className="text-[10px] text-zinc-500">{tx.time}</p>
                                                </div>
                                                <span className={`text-sm font-semibold ${tx.amount.startsWith("+") ? "text-emerald-400" : "text-zinc-300"}`}>
                                                    {tx.amount}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

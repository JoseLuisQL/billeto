"use client";

import { motion } from "framer-motion";
import {
    Bot,
    BarChart3,
    PiggyBank,
    Target,
    RefreshCw,
    Shield,
} from "lucide-react";
import Image from "next/image";

/**
 * Sección de Features con diseño Bento Grid premium.
 * Cada tarjeta tiene micro-interacciones, efectos de brillo y contenido rico.
 * La tarjeta principal (IA) es más grande con una demo simulada.
 */

const funcionalidades = [
    {
        icono: Bot,
        titulo: "Asistente IA",
        descripcion:
            "Registra gastos con lenguaje natural. Di 'Gasté 30 en almuerzo' y la IA se encarga del resto.",
        clase: "md:col-span-2 md:row-span-2",
        destacado: true,
        gradient: "from-lime-400/10 via-transparent to-emerald-400/5",
    },
    {
        icono: BarChart3,
        titulo: "Analíticas avanzadas",
        descripcion:
            "Dashboards con gráficos de actividad, distribución por categoría, tendencias y balances en tiempo real.",
        clase: "md:col-span-1",
        destacado: false,
        gradient: "from-violet-400/10 to-transparent",
    },
    {
        icono: Target,
        titulo: "Metas financieras",
        descripcion:
            "Define metas de ahorro con deadlines y trackea tu progreso con contribuciones automáticas.",
        clase: "md:col-span-1",
        destacado: false,
        gradient: "from-amber-400/10 to-transparent",
    },
    {
        icono: PiggyBank,
        titulo: "Presupuestos inteligentes",
        descripcion:
            "Crea presupuestos por categoría con alertas al 80% y 100%. Nunca más te pases de tu límite.",
        clase: "md:col-span-1",
        destacado: false,
        gradient: "from-cyan-400/10 to-transparent",
    },
    {
        icono: RefreshCw,
        titulo: "Recurrentes y suscripciones",
        descripcion:
            "Trackea Netflix, Spotify y todos tus pagos periódicos. Automatiza registros con un clic.",
        clase: "md:col-span-1",
        destacado: false,
        gradient: "from-rose-400/10 to-transparent",
    },
    {
        icono: Shield,
        titulo: "Seguridad de nivel bancario",
        descripcion:
            "Auditoría completa, cifrado end-to-end, rate limiting y protección contra inyección de prompts. Tu data está segura.",
        clase: "md:col-span-2",
        destacado: false,
        gradient: "from-emerald-400/10 via-transparent to-lime-400/5",
    },
];

export function Features() {
    return (
        <section id="funcionalidades" className="py-24 relative overflow-hidden">
            {/* Imagen de fondo */}
            <Image
                src="/features-bg.png"
                alt=""
                fill
                className="object-cover opacity-20"
                quality={80}
            />
            <div className="absolute inset-0 bg-zinc-950/80" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Encabezado de sección */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase text-lime-400/70 mb-4">Funcionalidades</p>
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        Todo para controlar{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
                            tu dinero
                        </span>
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        Herramientas potentes diseñadas para eliminar la fricción del control financiero
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {funcionalidades.map((feat, i) => {
                        const Icono = feat.icono;
                        return (
                            <motion.div
                                key={feat.titulo}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                className={`${feat.clase} group relative rounded-2xl border border-white/[0.06] bg-zinc-900/60 backdrop-blur-sm p-6 md:p-7 hover:border-white/15 transition-all duration-500 overflow-hidden`}
                            >
                                {/* Efecto de gradiente en hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                {/* Brillo esquina superior derecha */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/[0.02] rounded-full group-hover:bg-white/[0.04] transition-colors duration-500" />

                                <div className="relative z-10">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 transition-all duration-300 ${feat.destacado
                                        ? "bg-lime-400/15 text-lime-400 shadow-lg shadow-lime-400/5"
                                        : "bg-white/5 text-zinc-400 group-hover:text-white group-hover:bg-white/10"
                                        }`}>
                                        <Icono className="w-5 h-5" />
                                    </div>

                                    <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-lime-50 transition-colors">
                                        {feat.titulo}
                                    </h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        {feat.descripcion}
                                    </p>

                                    {/* Contenido extra para la tarjeta destacada (IA) */}
                                    {feat.destacado && (
                                        <div className="mt-6 space-y-3">
                                            {/* Chat simulado */}
                                            <div className="rounded-xl bg-zinc-800/60 border border-white/5 p-4 space-y-3">
                                                {/* Mensaje del usuario */}
                                                <div className="flex justify-end">
                                                    <div className="bg-lime-400/10 border border-lime-400/20 rounded-xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                                                        <p className="text-sm text-lime-100">Gasté 45 soles en almuerzo en Wong</p>
                                                    </div>
                                                </div>
                                                {/* Respuesta de la IA */}
                                                <div className="flex justify-start">
                                                    <div className="bg-zinc-700/40 border border-white/5 rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                                                        <p className="text-sm text-zinc-300">
                                                            ✅ Registrado: <strong className="text-white">S/ 45.00</strong> en <span className="text-lime-400">🍔 Alimentación</span>
                                                        </p>
                                                        <p className="text-xs text-zinc-500 mt-1">Cuenta: Efectivo · Hoy</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Badge de auto-categorización */}
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/40 border border-white/5">
                                                <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                                                <span className="text-xs text-zinc-400">
                                                    Categorización automática por IA con 98% de precisión
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

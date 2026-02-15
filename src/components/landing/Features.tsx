"use client";

import { motion } from "framer-motion";
import {
    ScanLine,
    MessageSquare,
    PiggyBank,
    Users,
    BarChart3,
    Shield,
} from "lucide-react";

/**
 * Sección de Funcionalidades (Features) con diseño Bento Grid.
 * Cada tarjeta representa una funcionalidad clave de Billeto.
 * Las tarjetas tienen tamaños distintos para crear una grilla irregular.
 */

const funcionalidades = [
    {
        icono: ScanLine,
        titulo: "OCR Inteligente",
        descripcion:
            "Envía una foto de tu ticket o recibo y la IA extrae automáticamente el monto, fecha y comercio.",
        clase: "md:col-span-2 md:row-span-2",
        destacado: true,
    },
    {
        icono: MessageSquare,
        titulo: "WhatsApp Nativo",
        descripcion:
            "\"Gasté 30 en almuerzo\" — registra gastos por texto, audio o foto directamente desde WhatsApp.",
        clase: "md:col-span-1",
        destacado: false,
    },
    {
        icono: BarChart3,
        titulo: "Analítica IA",
        descripcion:
            "Pregunta \"¿cuánto gasté este mes?\" y obtén resúmenes inteligentes con gráficos.",
        clase: "md:col-span-1",
        destacado: false,
    },
    {
        icono: PiggyBank,
        titulo: "Presupuestos Inteligentes",
        descripcion:
            "Crea presupuestos por categoría con alertas al 80% y 100% de uso.",
        clase: "md:col-span-1",
        destacado: false,
    },
    {
        icono: Users,
        titulo: "Gastos Grupales",
        descripcion:
            "Divide gastos con amigos usando Vaquitas. Reparto automático y seguimiento en tiempo real.",
        clase: "md:col-span-1",
        destacado: false,
    },
    {
        icono: Shield,
        titulo: "Seguridad Total",
        descripcion:
            "Cifrado end-to-end, auditoría completa y control total sobre tus datos financieros.",
        clase: "md:col-span-2",
        destacado: false,
    },
];

export function Features() {
    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                {/* Encabezado de sección */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Todo lo que necesitas para{" "}
                        <span className="text-lime-400">controlar tu dinero</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Funcionalidades diseñadas para eliminar la fricción del control financiero
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {funcionalidades.map((feat, i) => {
                        const Icono = feat.icono;
                        return (
                            <motion.div
                                key={feat.titulo}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`${feat.clase} group relative rounded-xl border border-white/10 bg-zinc-900 p-6 hover:border-white/20 hover:scale-[1.02] transition-all duration-300 overflow-hidden`}
                            >
                                {/* Efecto de brillo en hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-lime-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${feat.destacado
                                            ? "bg-lime-400/10 text-lime-400"
                                            : "bg-white/5 text-muted-foreground group-hover:text-white"
                                        } transition-colors`}>
                                        <Icono className="w-6 h-6" />
                                    </div>

                                    <h3 className="text-lg font-semibold mb-2 text-white">
                                        {feat.titulo}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {feat.descripcion}
                                    </p>

                                    {/* Contenido extra para la tarjeta destacada (OCR) */}
                                    {feat.destacado && (
                                        <div className="mt-6 p-4 rounded-lg bg-zinc-800/50 border border-white/5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-lime-400/20 flex items-center justify-center text-lg">
                                                    🧾
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Comercio detectado</p>
                                                    <p className="text-sm font-medium text-white">Café Artesanal</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div className="bg-zinc-900 rounded p-2">
                                                    <p className="text-muted-foreground">Monto</p>
                                                    <p className="text-white font-medium">$1,250</p>
                                                </div>
                                                <div className="bg-zinc-900 rounded p-2">
                                                    <p className="text-muted-foreground">Fecha</p>
                                                    <p className="text-white font-medium">15 Feb</p>
                                                </div>
                                                <div className="bg-zinc-900 rounded p-2">
                                                    <p className="text-muted-foreground">Categoría</p>
                                                    <p className="text-lime-400 font-medium">☕ Café</p>
                                                </div>
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

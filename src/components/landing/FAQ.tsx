"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";

/**
 * Sección de FAQ con acordeón animado y diseño premium.
 * Bordes sutiles, animaciones suaves y diseño limpio.
 */

const preguntas = [
    {
        pregunta: "¿Qué es Billeto y cómo funciona?",
        respuesta:
            "Billeto es una plataforma de finanzas personales potenciada por IA. Puedes registrar gastos desde el chat con IA o desde la web. La IA categoriza automáticamente, y tienes dashboards, presupuestos, metas y reglas de automatización para tener control total de tu dinero.",
    },
    {
        pregunta: "¿Cómo funciona el asistente de IA?",
        respuesta:
            "El asistente usa Google Gemini para entender lenguaje natural. Simplemente escribe algo como 'Gasté 30 en almuerzo' y la IA registra la transacción, la categoriza, identifica la cuenta correcta y actualiza tu balance automáticamente.",
    },
    {
        pregunta: "¿Puedo usar Billeto gratis?",
        respuesta:
            "¡Sí! El plan Free incluye hasta 50 transacciones mensuales, 1 cuenta, y acceso al asistente IA. Puedes actualizar a Pro o Premium cuando quieras para desbloquear todas las funciones.",
    },
    {
        pregunta: "¿Mis datos financieros están seguros?",
        respuesta:
            "Absolutamente. Implementamos seguridad de nivel bancario: cifrado end-to-end, auditoría completa de todas las operaciones, rate limiting multinivel y protección avanzada contra inyección de prompts para el chat IA.",
    },
    {
        pregunta: "¿Soporta múltiples monedas?",
        respuesta:
            "Sí. Billeto soporta multi-moneda con tipos de cambio. Puedes tener cuentas en diferentes monedas (PEN, USD, EUR...) y ver reportes unificados en tu moneda base.",
    },
    {
        pregunta: "¿Qué pasa si cancelo mi suscripción?",
        respuesta:
            "Tus datos permanecen accesibles en modo Free. Si decides eliminar tu cuenta, tienes 5 días de gracia para revertir la decisión. Después de ese período, se eliminan permanentemente.",
    },
];

export function FAQ() {
    const [abierto, setAbierto] = useState<number | null>(null);

    return (
        <section id="faq" className="py-24 relative">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Encabezado */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase text-lime-400/70 mb-4">FAQ</p>
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        Preguntas{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
                            frecuentes
                        </span>
                    </h2>
                    <p className="text-zinc-400 text-lg">
                        Todo lo que necesitas saber para empezar
                    </p>
                </motion.div>

                {/* Acordeón */}
                <div className="space-y-3">
                    {preguntas.map((item, i) => {
                        const isOpen = abierto === i;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                className={`rounded-xl border transition-all duration-300 overflow-hidden ${isOpen
                                    ? "border-lime-400/20 bg-zinc-900/80"
                                    : "border-white/[0.06] bg-zinc-900/40 hover:border-white/10"
                                    }`}
                            >
                                <button
                                    onClick={() => setAbierto(isOpen ? null : i)}
                                    className="w-full flex items-center justify-between p-5 text-left group"
                                >
                                    <span className={`text-sm font-medium pr-4 transition-colors ${isOpen ? "text-white" : "text-zinc-300 group-hover:text-white"
                                        }`}>
                                        {item.pregunta}
                                    </span>
                                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen
                                        ? "bg-lime-400/15 text-lime-400 rotate-180"
                                        : "bg-white/5 text-zinc-500"
                                        }`}>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                        >
                                            <div className="px-5 pb-5">
                                                <div className="h-px bg-gradient-to-r from-lime-400/10 via-white/5 to-transparent mb-4" />
                                                <p className="text-sm text-zinc-400 leading-relaxed">
                                                    {item.respuesta}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* CTA de soporte */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-10 p-6 rounded-xl border border-white/[0.06] bg-zinc-900/30"
                >
                    <MessageCircle className="w-5 h-5 text-lime-400 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400">
                        ¿No encuentras lo que buscas?{" "}
                        <a href="/contact" className="text-lime-400 hover:text-lime-300 font-medium transition-colors">
                            Contáctanos
                        </a>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}

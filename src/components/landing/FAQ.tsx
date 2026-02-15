"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

/**
 * Sección de Preguntas Frecuentes (FAQ).
 * Acordeón con animación suave para expandir/contraer respuestas.
 * Diseño minimalista con interacciones de framer-motion.
 */

const preguntas = [
    {
        pregunta: "¿Qué es Billeto y cómo funciona?",
        respuesta:
            "Billeto es una plataforma de finanzas personales potenciada por IA. Podés registrar gastos desde WhatsApp (texto, audio, foto de ticket) o desde la web. La IA categoriza automáticamente, y tenés dashboards, presupuestos y metas para tener control total.",
    },
    {
        pregunta: "¿Es seguro conectar mi WhatsApp?",
        respuesta:
            "Sí. Usamos la API oficial de WhatsApp Business. No tenemos acceso a tus conversaciones privadas. Solo procesamos los mensajes que vos nos enviás directamente a nuestro número.",
    },
    {
        pregunta: "¿Puedo usar Billeto gratis?",
        respuesta:
            "¡Sí! El plan Free incluye hasta 50 transacciones mensuales, 1 cuenta, y acceso básico al asistente de WhatsApp. Podés actualizar a Pro o Premium cuando quieras.",
    },
    {
        pregunta: "¿Qué pasa con mis datos si cancelo mi suscripción?",
        respuesta:
            "Tus datos permanecen accesibles. Si decidís eliminar tu cuenta, tenés 5 días de gracia para revertir la decisión. Después de ese período, se eliminan permanentemente.",
    },
    {
        pregunta: "¿Soporta múltiples monedas?",
        respuesta:
            "Sí. Billeto soporta multi-moneda con tipos de cambio actualizados. Podés tener cuentas en diferentes monedas y ver reportes unificados en tu moneda base.",
    },
    {
        pregunta: "¿Cómo funciona el OCR de comprobantes?",
        respuesta:
            "Enviá una foto de tu ticket o recibo por WhatsApp o subilo en la web. Nuestra IA extrae automáticamente el monto, fecha, comercio y moneda. Si no está segura, te pide confirmar antes de guardar.",
    },
];

export function FAQ() {
    const [abierto, setAbierto] = useState<number | null>(null);

    return (
        <section className="py-20">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Encabezado */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Preguntas frecuentes
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Todo lo que necesitás saber para empezar
                    </p>
                </div>

                {/* Acordeón */}
                <div className="space-y-3">
                    {preguntas.map((item, i) => (
                        <div
                            key={i}
                            className="rounded-lg border border-white/10 bg-zinc-900/50 overflow-hidden"
                        >
                            <button
                                onClick={() => setAbierto(abierto === i ? null : i)}
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                            >
                                <span className="text-sm font-medium text-white pr-4">
                                    {item.pregunta}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${abierto === i ? "rotate-180" : ""
                                        }`}
                                />
                            </button>

                            <AnimatePresence>
                                {abierto === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="px-5 pb-5">
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {item.respuesta}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

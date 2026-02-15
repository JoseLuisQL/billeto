"use client";

import { motion } from "framer-motion";

/**
 * Sección de estadísticas de la plataforma.
 * Muestra métricas clave con números grandes en color neón
 * y etiquetas descriptivas debajo.
 */

const estadisticas = [
    { valor: "50K+", etiqueta: "Usuarios activos", icono: "👥" },
    { valor: "$2M+", etiqueta: "Procesados mensualmente", icono: "💰" },
    { valor: "< 15s", etiqueta: "Registro de gasto", icono: "⚡" },
    { valor: "98%", etiqueta: "Satisfacción del usuario", icono: "🎯" },
];

export function Stats() {
    return (
        <section className="py-20 border-y border-white/5">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {estadisticas.map((stat, i) => (
                        <motion.div
                            key={stat.etiqueta}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="text-center"
                        >
                            <span className="text-3xl mb-2 block">{stat.icono}</span>
                            <p className="text-3xl md:text-4xl font-bold text-lime-400 mb-1">
                                {stat.valor}
                            </p>
                            <p className="text-sm text-muted-foreground">{stat.etiqueta}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

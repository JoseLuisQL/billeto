"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Sección de estadísticas con contadores animados y diseño premium.
 * Los números se animan al entrar en viewport con efecto de conteo.
 */

const estadisticas = [
    { valorFinal: 50000, prefijo: "", sufijo: "+", etiqueta: "Usuarios activos", descripcion: "confían en Billeto" },
    { valorFinal: 2, prefijo: "$", sufijo: "M+", etiqueta: "Procesados", descripcion: "mensualmente" },
    { valorFinal: 15, prefijo: "<", sufijo: "s", etiqueta: "Registro de gasto", descripcion: "tiempo promedio" },
    { valorFinal: 98, prefijo: "", sufijo: "%", etiqueta: "Satisfacción", descripcion: "de aprobación" },
];

function AnimatedCounter({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (v) => {
        if (value >= 1000) return `${prefix}${Math.round(v).toLocaleString("es-PE")}${suffix}`;
        return `${prefix}${Math.round(v)}${suffix}`;
    });
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    animate(count, value, { duration: 2, ease: "easeOut" });
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [count, value]);

    return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function Stats() {
    return (
        <section id="estadisticas" className="py-24 relative">
            {/* Línea decorativa con gradiente */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {estadisticas.map((stat, i) => (
                        <motion.div
                            key={stat.etiqueta}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="text-center group"
                        >
                            {/* Número grande con gradiente */}
                            <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 mb-2">
                                <AnimatedCounter value={stat.valorFinal} prefix={stat.prefijo} suffix={stat.sufijo} />
                            </div>

                            {/* Barra decorativa */}
                            <div className="w-8 h-0.5 bg-lime-400/40 mx-auto mb-3 group-hover:w-12 transition-all duration-300" />

                            <p className="text-sm font-semibold text-white mb-0.5">{stat.etiqueta}</p>
                            <p className="text-xs text-zinc-500">{stat.descripcion}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

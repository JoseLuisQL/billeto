"use client";

import { motion } from "framer-motion";

/**
 * Sección de Social Proof con marquee infinito bidireccional.
 * Dos filas de testimonios moviéndose en direcciones opuestas
 * con efecto de desvanecimiento en los bordes.
 */

const testimoniosRow1 = [
    { nombre: "María G.", rol: "Freelancer", avatar: "👩‍💼", texto: "Billeto me salvó. Ahora sé exactamente a dónde va mi plata cada mes.", rating: 5 },
    { nombre: "Carlos R.", rol: "Desarrollador", avatar: "👨‍💻", texto: "Lo uso desde el chat y en 5 segundos ya tengo el gasto registrado. Increíble.", rating: 5 },
    { nombre: "Ana P.", rol: "Diseñadora", avatar: "👩‍🎨", texto: "Los dashboards son increíbles. Mi contador está impresionado con los reportes.", rating: 5 },
    { nombre: "Luis M.", rol: "Ingeniero", avatar: "🧑‍🔧", texto: "Las reglas automáticas me ahorran horas de categorización manual.", rating: 4 },
    { nombre: "Sofía T.", rol: "Doctora", avatar: "👩‍⚕️", texto: "La IA categoriza todo automáticamente. Es como tener un asistente personal.", rating: 5 },
    { nombre: "Diego F.", rol: "Emprendedor", avatar: "👨‍🍳", texto: "Mi negocio creció 30% desde que empecé a controlar los gastos con Billeto.", rating: 5 },
];

const testimoniosRow2 = [
    { nombre: "Valentina R.", rol: "Contadora", avatar: "👩‍💻", texto: "Como contadora, puedo decir que la organización financiera es de primer nivel.", rating: 5 },
    { nombre: "Pedro S.", rol: "Abogado", avatar: "👨‍⚖️", texto: "Mis presupuestos por categoría me ayudaron a reducir gastos innecesarios un 25%.", rating: 5 },
    { nombre: "Camila V.", rol: "Estudiante", avatar: "👩‍🎓", texto: "Perfecto para estudiantes. El plan gratuito tiene todo lo que necesito.", rating: 4 },
    { nombre: "Andrés L.", rol: "Consultor", avatar: "🧑‍💼", texto: "Las metas financieras me mantienen motivado. Ya completé 3 este año.", rating: 5 },
    { nombre: "Isabella M.", rol: "Arquitecta", avatar: "👷‍♀️", texto: "La vista de transacciones recurrentes me ahorra sorpresas a fin de mes.", rating: 5 },
    { nombre: "Roberto C.", rol: "Vendedor", avatar: "🧑‍💻", texto: "Multi-moneda fue clave para mí. Trabajo con dólares y soles sin problemas.", rating: 5 },
];

function StarRating({ count }: { count: number }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className={`w-3.5 h-3.5 ${i < count ? "text-lime-400" : "text-zinc-700"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

function TestimonialCard({ t }: { t: typeof testimoniosRow1[0] }) {
    return (
        <div className="flex-shrink-0 w-[340px] p-5 rounded-2xl bg-zinc-900/80 backdrop-blur-sm border border-white/[0.06] hover:border-white/15 transition-all duration-300 group">
            <StarRating count={t.rating} />
            <p className="text-sm text-zinc-300 leading-relaxed mt-3 mb-4">&ldquo;{t.texto}&rdquo;</p>
            <div className="flex items-center gap-3">
                <span className="text-2xl">{t.avatar}</span>
                <div>
                    <p className="text-sm font-semibold text-white">{t.nombre}</p>
                    <p className="text-xs text-zinc-500">{t.rol}</p>
                </div>
            </div>
        </div>
    );
}

export function SocialProof() {
    const row1Duplicado = [...testimoniosRow1, ...testimoniosRow1, ...testimoniosRow1];
    const row2Duplicado = [...testimoniosRow2, ...testimoniosRow2, ...testimoniosRow2];

    return (
        <section id="testimonios" className="py-24 overflow-hidden relative">
            {/* Decorador de linea superior */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-lime-400/30 to-transparent" />

            <div className="container mx-auto px-4 mb-14 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase text-lime-400/70 mb-4">Testimonios</p>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Miles de personas ya controlan{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
                            sus finanzas
                        </span>
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                        Descubre por qué nuestros usuarios aman Billeto
                    </p>
                </motion.div>
            </div>

            {/* Marquee Fila 1 — izquierda */}
            <div className="relative mb-4">
                <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-zinc-950 to-transparent z-10" />

                <motion.div
                    animate={{ x: [0, -340 * testimoniosRow1.length] }}
                    transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                    className="flex gap-4"
                >
                    {row1Duplicado.map((t, i) => (
                        <TestimonialCard key={`r1-${i}`} t={t} />
                    ))}
                </motion.div>
            </div>

            {/* Marquee Fila 2 — derecha */}
            <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-zinc-950 to-transparent z-10" />

                <motion.div
                    animate={{ x: [-340 * testimoniosRow2.length, 0] }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                    className="flex gap-4"
                >
                    {row2Duplicado.map((t, i) => (
                        <TestimonialCard key={`r2-${i}`} t={t} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

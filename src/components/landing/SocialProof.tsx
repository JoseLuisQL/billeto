"use client";

import { motion } from "framer-motion";

/**
 * Sección de Social Proof (Wall of Love).
 * Carrusel infinito con testimonios en tarjetas estilo glassmorphism.
 * Los testimonios se duplican para crear el efecto de marquee continuo.
 */

// Testimonios estáticos para el MVP
const testimonios = [
    { nombre: "María G.", avatar: "🧑‍💼", texto: "Billeto me salvó. Ahora sé exactamente a dónde va mi plata." },
    { nombre: "Carlos R.", avatar: "👨‍💻", texto: "Lo uso desde WhatsApp y en 5 segundos ya tengo el gasto registrado." },
    { nombre: "Ana P.", avatar: "👩‍🎨", texto: "Los gráficos son increíbles. Mi contador está impresionado." },
    { nombre: "Luis M.", avatar: "🧑‍🔧", texto: "Las vaquitas me solucionaron la vida con los gastos compartidos." },
    { nombre: "Sofía T.", avatar: "👩‍⚕️", texto: "La IA categoriza todo automáticamente. Mágico." },
    { nombre: "Diego F.", avatar: "👨‍🍳", texto: "Mi negocio creció 30% desde que empecé a controlar los gastos." },
];

export function SocialProof() {
    // Duplicamos los testimonios para el efecto de marquee infinito
    const duplicados = [...testimonios, ...testimonios];

    return (
        <section className="py-20 overflow-hidden">
            <div className="container mx-auto px-4 mb-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Lo que dicen nuestros usuarios
                </h2>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                    Miles de personas ya controlan sus finanzas con Billeto
                </p>
            </div>

            {/* Marquee infinito - Fila 1 (izquierda a derecha) */}
            <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10" />

                <motion.div
                    animate={{ x: [0, -50 * testimonios.length] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="flex gap-4"
                >
                    {duplicados.map((t, i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 w-80 p-5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">{t.avatar}</span>
                                <span className="text-sm font-medium text-white">{t.nombre}</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{t.texto}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

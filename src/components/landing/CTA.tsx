"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

/**
 * Sección CTA final con imagen de fondo, efecto glow dramático
 * y diseño centrado premium.
 */
export function CTA() {
    return (
        <section id="cta-final" className="py-24">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative rounded-3xl overflow-hidden"
                >
                    {/* Imagen de fondo */}
                    <Image
                        src="/cta-bg.png"
                        alt=""
                        fill
                        className="object-cover opacity-50"
                        quality={80}
                    />

                    {/* Capas de gradiente adicionales */}
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-transparent to-zinc-950/60" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(163,230,53,0.08)_0%,_transparent_60%)]" />

                    {/* Border glow sutil */}
                    <div className="absolute inset-0 rounded-3xl border border-lime-400/10" />

                    <div className="relative z-10 text-center py-20 md:py-28 px-8">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-lime-400/20 bg-lime-400/5 backdrop-blur-sm"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                            <span className="text-sm text-lime-300/90 font-medium">Sin tarjeta de crédito</span>
                        </motion.div>

                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 max-w-3xl mx-auto leading-tight">
                            Empieza a controlar tu dinero{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400">
                                hoy mismo
                            </span>
                        </h2>

                        <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                            Crea tu cuenta en 30 segundos. Configura tus cuentas y empieza a registrar tus transacciones con IA.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/register">
                                <Button
                                    size="lg"
                                    className="bg-lime-400 text-zinc-950 font-bold hover:bg-lime-300 hover:shadow-[0_0_50px_rgba(163,230,53,0.3)] transition-all duration-300 text-base px-10 py-7 rounded-xl"
                                >
                                    Crear cuenta gratis
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </div>

                        {/* Micro texto de confianza */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center justify-center gap-6 mt-8 text-xs text-zinc-500"
                        >
                            <span>✦ Setup instantáneo</span>
                            <span>✦ Sin compromisos</span>
                            <span>✦ Datos encriptados</span>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Sección CTA final antes del footer.
 * Diseño centrado con gradiente de fondo y CTA principal.
 */
export function CTA() {
    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative rounded-2xl overflow-hidden"
                >
                    {/* Fondo con gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-br from-lime-400/10 via-zinc-900 to-violet-600/10" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime-400/5 to-transparent" />

                    <div className="relative z-10 text-center py-16 px-8">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">
                            Empezá a controlar tu dinero{" "}
                            <span className="text-lime-400">hoy</span>
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                            Creá tu cuenta en segundos. Sin tarjeta de crédito.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/register">
                                <Button
                                    size="lg"
                                    className="bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000] hover:shadow-[0_0_30px_rgba(211,255,10,0.3)] transition-all text-base px-8 py-6"
                                >
                                    Crear cuenta gratis
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

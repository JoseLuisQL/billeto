"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Sección de Soluciones para Negocios.
 * Inspirada en "Gasti Business" — una sección dedicada a PyMEs y autónomos
 * con un CTA a una lista de espera o contacto.
 */
export function Business() {
    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative rounded-2xl border border-white/10 bg-zinc-900/50 p-8 md:p-12 overflow-hidden"
                >
                    {/* Efecto decorativo de fondo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/5 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-lime-400/10 text-lime-400 text-xs font-medium">
                                <Building2 className="w-3.5 h-3.5" />
                                Próximamente
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Billeto para tu Negocio
                            </h2>
                            <p className="text-muted-foreground text-lg mb-6 max-w-lg">
                                Gestión financiera avanzada para equipos y crecimiento.
                                Multi-usuario, reportes contables e integraciones empresariales.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link href="/contact">
                                    <Button className="bg-[#D3FF0A] text-black hover:bg-[#c5f000] font-medium">
                                        Unirme a la lista de espera
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button variant="ghost" className="text-muted-foreground hover:text-white">
                                        Contactar ventas
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Tarjeta visual decorativa */}
                        <div className="flex-shrink-0 w-full md:w-80">
                            <div className="rounded-xl border border-white/10 bg-zinc-800/50 p-5 space-y-3">
                                {[
                                    { label: "Facturación mensual", value: "$45,200", trend: "+12%" },
                                    { label: "Gastos operativos", value: "$18,900", trend: "-5%" },
                                    { label: "Margen neto", value: "58%", trend: "+3%" },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50"
                                    >
                                        <div>
                                            <p className="text-xs text-muted-foreground">{item.label}</p>
                                            <p className="text-sm font-semibold text-white">{item.value}</p>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.trend.startsWith("+")
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-rose-500/10 text-rose-400"
                                            }`}>
                                            {item.trend}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

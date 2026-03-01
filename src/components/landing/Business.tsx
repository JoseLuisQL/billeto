"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, Users, Globe, Briefcase } from "lucide-react";
import Link from "next/link";

/**
 * Sección de Soluciones para Negocios — Diseño premium con mock de métricas
 * y lista de features empresariales.
 */
export function Business() {
    return (
        <section id="negocios" className="py-24">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative rounded-3xl border border-white/[0.06] bg-zinc-900/40 backdrop-blur-sm overflow-hidden"
                >
                    {/* Decoradores de fondo */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-lime-400/[0.03] rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-violet-500/[0.03] rounded-full blur-[80px]" />

                    <div className="relative z-10 p-8 md:p-14 flex flex-col lg:flex-row items-center gap-12">
                        {/* Contenido textual */}
                        <div className="flex-1">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-lime-400/10 border border-lime-400/20">
                                    <Building2 className="w-3.5 h-3.5 text-lime-400" />
                                    <span className="text-xs font-semibold text-lime-400 tracking-wide">Próximamente</span>
                                </div>

                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                                    Billeto para{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
                                        tu Negocio
                                    </span>
                                </h2>

                                <p className="text-zinc-400 text-lg mb-8 max-w-lg leading-relaxed">
                                    Gestión financiera avanzada para equipos. Multi-usuario, reportes contables e integraciones empresariales.
                                </p>

                                {/* Mini features */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                    {[
                                        { icon: Users, label: "Multi-usuario", desc: "Roles y permisos" },
                                        { icon: Globe, label: "Multi-moneda", desc: "FX automatizado" },
                                        { icon: Briefcase, label: "Reportes", desc: "Contabilidad pro" },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/40 border border-white/5">
                                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                                <item.icon className="w-4 h-4 text-zinc-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{item.label}</p>
                                                <p className="text-xs text-zinc-500">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link href="/contact">
                                        <Button className="bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(163,230,53,0.2)] transition-all rounded-xl">
                                            Unirme a la lista de espera
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                    <Link href="/contact">
                                        <Button variant="ghost" className="text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl">
                                            Contactar ventas
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>

                        {/* Card de métricas */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="flex-shrink-0 w-full lg:w-[380px]"
                        >
                            <div className="rounded-2xl border border-white/[0.06] bg-zinc-800/40 backdrop-blur-sm p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-xs text-zinc-500 font-medium">Dashboard Empresarial</span>
                                </div>

                                {[
                                    { label: "Facturación mensual", value: "S/ 145,200", trend: "+12%", positive: true },
                                    { label: "Gastos operativos", value: "S/ 58,900", trend: "-5%", positive: false },
                                    { label: "Margen neto", value: "59.4%", trend: "+3.2%", positive: true },
                                    { label: "Cuentas por cobrar", value: "S/ 23,400", trend: "-18%", positive: false },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.04]"
                                    >
                                        <div>
                                            <p className="text-[11px] text-zinc-500 mb-0.5">{item.label}</p>
                                            <p className="text-sm font-bold text-white">{item.value}</p>
                                        </div>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.positive
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-rose-500/10 text-rose-400"
                                            }`}>
                                            {item.trend}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

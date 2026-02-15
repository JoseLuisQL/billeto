import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

/**
 * Página de Blog con artículos estáticos.
 * Contenido educativo financiero definido en código (sin CMS para MVP).
 * Cada artículo es una tarjeta con título, resumen y fecha.
 */

const articulos = [
    {
        slug: "mantener-control-gastos",
        titulo: "5 hábitos para mantener el control de tus gastos",
        resumen: "Descubrí cómo pequeños cambios diarios pueden transformar tu relación con el dinero.",
        fecha: "12 Feb 2026",
        categoria: "Educación Financiera",
        emoji: "💡",
    },
    {
        slug: "automatizar-finanzas",
        titulo: "Automatizá tus finanzas: la guía completa",
        resumen: "Desde reglas automáticas hasta presupuestos inteligentes, todo lo que necesitás saber.",
        fecha: "8 Feb 2026",
        categoria: "Productividad",
        emoji: "🤖",
    },
    {
        slug: "dividir-gastos-amigos",
        titulo: "Dividir gastos con amigos sin drama",
        resumen: "Cómo usar Vaquitas para dividir cuentas y mantener la armonía.",
        fecha: "3 Feb 2026",
        categoria: "Tips",
        emoji: "👥",
    },
    {
        slug: "whatsapp-finanzas",
        titulo: "Tu WhatsApp, tu asistente financiero",
        resumen: "Cómo registrar gastos en 15 segundos directamente desde WhatsApp.",
        fecha: "28 Ene 2026",
        categoria: "Producto",
        emoji: "📱",
    },
];

export default function BlogPage() {
    return (
        <section className="py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Encabezado */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
                    <p className="text-muted-foreground text-lg">
                        Artículos, guías y consejos para mejorar tus finanzas personales.
                    </p>
                </div>

                {/* Grilla de artículos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articulos.map((art) => (
                        <article
                            key={art.slug}
                            className="group rounded-xl border border-white/10 bg-zinc-900/50 p-6 hover:border-white/20 hover:scale-[1.01] transition-all duration-300"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{art.emoji}</span>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-lime-400/10 text-lime-400">
                                    {art.categoria}
                                </span>
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-lime-400 transition-colors">
                                {art.titulo}
                            </h2>
                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                {art.resumen}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {art.fecha}
                                </div>
                                <span className="text-xs text-lime-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Leer más <ArrowRight className="w-3 h-3" />
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

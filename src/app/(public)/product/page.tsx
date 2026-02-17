import { Features } from "@/components/landing/Features";
import { CTA } from "@/components/landing/CTA";

/**
 * Página de Producto.
 * Muestra las funcionalidades detalladas de Billeto.
 * Reutiliza el componente Features y agrega un CTA final.
 */
export default function ProductPage() {
    return (
        <>
            {/* Encabezado de sección */}
            <section className="py-20 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Conocé todo lo que{" "}
                        <span className="text-lime-400">Billeto</span> puede hacer
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Desde el registro de gastos por WhatsApp hasta analítica avanzada con IA.
                        Todo en una plataforma diseñada para simplificar tus finanzas.
                    </p>
                </div>
            </section>
            <Features />
            <CTA />
        </>
    );
}

/**
 * Página de Manifiesto de Billeto.
 * Contenido estático que explica la filosofía y misión de la marca.
 * Diseño tipográfico centrado para generar confianza.
 */
export default function ManifestoPage() {
    return (
        <section className="py-20">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Título principal */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        Nuestro <span className="text-lime-400">Manifiesto</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Por qué construimos Billeto y qué nos mueve.
                    </p>
                </div>

                {/* Contenido del manifiesto */}
                <div className="prose prose-invert prose-lg mx-auto space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">El problema es real</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            La mayoría de las personas no tiene idea de cuánto gasta cada mes.
                            Las apps financieras existentes son complicadas, aburridas, y requieren
                            demasiado esfuerzo. El resultado: la gente abandona antes de empezar.
                        </p>
                    </div>

                    <div className="border-l-2 border-lime-400 pl-6 py-2">
                        <p className="text-white text-xl font-medium italic">
                            &ldquo;Creemos que el control financiero debe ser tan natural como
                            enviar un mensaje de WhatsApp.&rdquo;
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">Nuestra solución</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Billeto elimina la fricción. Registrás un gasto en 15 segundos
                            desde WhatsApp. La IA se encarga del resto: categoriza, analiza y
                            te alerta cuando estás por pasarte del presupuesto.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">Nuestros principios</h2>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <span className="text-lime-400 font-bold">01.</span>
                                <span><strong className="text-white">Cero fricción.</strong> Si lleva más de 15 segundos, fallamos.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-lime-400 font-bold">02.</span>
                                <span><strong className="text-white">Privacidad primero.</strong> Tus datos son tuyos. Siempre.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-lime-400 font-bold">03.</span>
                                <span><strong className="text-white">IA al servicio.</strong> La tecnología debe servir, no complicar.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-lime-400 font-bold">04.</span>
                                <span><strong className="text-white">Transparencia total.</strong> Sin letra chica, sin sorpresas.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-xl bg-zinc-900/50 border border-white/10 p-8 text-center">
                        <p className="text-white text-lg font-medium">
                            Construimos Billeto para que nunca más digas{" "}
                            <span className="text-lime-400">&ldquo;no sé a dónde se fue mi plata&rdquo;</span>.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

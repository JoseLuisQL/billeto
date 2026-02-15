"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Send, Mail, MessageSquare } from "lucide-react";

/**
 * Página de Contacto.
 * Formulario simple para enviar mensajes al equipo.
 * Incluye información de contacto alternativa (email, WhatsApp).
 */
export default function ContactPage() {
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);

    /**
     * Maneja el envío del formulario de contacto.
     * Simula envío con loading state para el MVP.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setEnviando(false);
        setEnviado(true);
    };

    return (
        <section className="py-20">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Encabezado */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Contacto</h1>
                    <p className="text-muted-foreground text-lg">
                        ¿Tenés alguna pregunta? Estamos acá para ayudarte.
                    </p>
                </div>

                {/* Formulario */}
                <Card className="bg-zinc-900 border-white/10 shadow-xl">
                    <CardContent className="pt-6">
                        {enviado ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">✅</div>
                                <h3 className="text-xl font-semibold text-white mb-2">¡Mensaje enviado!</h3>
                                <p className="text-muted-foreground">
                                    Te responderemos lo antes posible. Revisá tu email.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nombre" className="text-xs uppercase tracking-wider text-zinc-500">
                                            Nombre
                                        </Label>
                                        <Input
                                            id="nombre"
                                            placeholder="Tu nombre"
                                            className="bg-zinc-900/50 border-zinc-800 focus:border-lime-400"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs uppercase tracking-wider text-zinc-500">
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="tu@email.com"
                                            className="bg-zinc-900/50 border-zinc-800 focus:border-lime-400"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="asunto" className="text-xs uppercase tracking-wider text-zinc-500">
                                        Asunto
                                    </Label>
                                    <Input
                                        id="asunto"
                                        placeholder="¿En qué podemos ayudarte?"
                                        className="bg-zinc-900/50 border-zinc-800 focus:border-lime-400"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mensaje" className="text-xs uppercase tracking-wider text-zinc-500">
                                        Mensaje
                                    </Label>
                                    <textarea
                                        id="mensaje"
                                        rows={5}
                                        placeholder="Contanos más..."
                                        className="w-full rounded-md bg-zinc-900/50 border border-zinc-800 focus:border-lime-400 focus:ring-1 focus:ring-lime-400/20 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none resize-none"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={enviando}
                                    className="w-full bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000] transition-all disabled:opacity-50"
                                >
                                    {enviando ? "Enviando..." : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Enviar mensaje
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Información de contacto alternativa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-zinc-900/50">
                        <Mail className="w-5 h-5 text-lime-400" />
                        <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm text-white">hola@billeto.app</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-zinc-900/50">
                        <MessageSquare className="w-5 h-5 text-lime-400" />
                        <div>
                            <p className="text-xs text-muted-foreground">WhatsApp</p>
                            <p className="text-sm text-white">+54 9 11 1234-5678</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

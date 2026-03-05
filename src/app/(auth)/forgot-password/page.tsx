"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { solicitarResetPassword } from "@/lib/actions/password-reset";

import { BilletoLogo } from "@/components/ui/logo";

/**
 * Página de "Olvidé mi contraseña".
 * Solicita el email y envía un enlace de restablecimiento.
 */
export default function ForgotPasswordPage() {
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enviado, setEnviado] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCargando(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const resultado = await solicitarResetPassword(formData);

        if (resultado.error) {
            setError(resultado.error);
            setCargando(false);
        } else {
            setEnviado(true);
            setCargando(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-950/20 via-zinc-950 to-zinc-950 -z-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
            >
                <Card className="bg-zinc-900 border-white/10 shadow-xl">
                    <CardHeader className="text-center space-y-2 pb-2">
                        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
                            <BilletoLogo className="justify-center text-white" />
                        </Link>
                        <p className="text-muted-foreground text-sm">
                            {enviado
                                ? "Revisá tu bandeja de entrada."
                                : "Ingresá tu email para restablecer tu contraseña."
                            }
                        </p>
                    </CardHeader>

                    <CardContent className="pt-4">
                        {enviado ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-4"
                            >
                                <div className="flex justify-center">
                                    <CheckCircle2 className="w-16 h-16 text-lime-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">
                                        Email enviado
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Si existe una cuenta con ese email, recibirás un enlace
                                        para restablecer tu contraseña. El enlace expira en 1 hora.
                                    </p>
                                </div>
                                <div className="pt-4 space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full bg-transparent border-white/10 hover:bg-white/5 text-white"
                                        onClick={() => {
                                            setEnviado(false);
                                            setError(null);
                                        }}
                                    >
                                        Enviar de nuevo
                                    </Button>
                                    <Link href="/login" className="block">
                                        <Button
                                            variant="ghost"
                                            className="w-full text-zinc-400 hover:text-white"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Volver al login
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs uppercase tracking-wider text-zinc-500">
                                            Email
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="tu@email.com"
                                                className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-lime-400 focus:ring-lime-400/20"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={cargando}
                                        className="w-full bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000] hover:shadow-[0_0_20px_rgba(211,255,10,0.2)] transition-all disabled:opacity-50"
                                    >
                                        {cargando ? "Enviando..." : "Enviar enlace de restablecimiento"}
                                    </Button>
                                </form>

                                <Link href="/login" className="block mt-6">
                                    <Button
                                        variant="ghost"
                                        className="w-full text-zinc-400 hover:text-white"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Volver al login
                                    </Button>
                                </Link>
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-center gap-4 mt-6 text-xs text-muted-foreground">
                    <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
                    <Link href="#" className="hover:text-white transition-colors">Ayuda</Link>
                </div>
            </motion.div>
        </div>
    );
}

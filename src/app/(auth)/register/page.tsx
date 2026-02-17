"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import { registrarUsuario } from "@/lib/actions/auth";
import { useToast } from "@/components/ui/toast";

/**
 * Página de Registro con integración real de server actions.
 * Crea usuario + workspace + categorías + cuenta por defecto.
 */
export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCargando(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const resultado = await registrarUsuario(formData);

        if (resultado.error) {
            setError(resultado.error);
            toast({ title: "No se pudo registrar", description: resultado.error, variant: "error" });
            setCargando(false);
        } else {
            // Redirigir al dashboard después del registro exitoso
            router.push("/dashboard");
            router.refresh();
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-lime-950/20 via-zinc-950 to-zinc-950 -z-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
            >
                <Card className="bg-zinc-900 border-white/10 shadow-xl">
                    <CardHeader className="text-center space-y-2 pb-2">
                        <Link href="/" className="text-2xl font-bold tracking-tighter text-white block">
                            BILLETO
                        </Link>
                        <p className="text-muted-foreground text-sm">
                            Creá tu cuenta y tomá el control de tus finanzas.
                        </p>
                    </CardHeader>

                    <CardContent className="pt-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Error message */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {/* Campo Nombre */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-zinc-500">
                                    Nombre
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Tu nombre"
                                        className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-lime-400 focus:ring-lime-400/20"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Campo Email */}
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
                                    />
                                </div>
                            </div>

                            {/* Campo Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-zinc-500">
                                    Contraseña
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={mostrarPassword ? "text" : "password"}
                                        placeholder="Mínimo 8 caracteres"
                                        className="pl-10 pr-10 bg-zinc-900/50 border-zinc-800 focus:border-lime-400 focus:ring-lime-400/20"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarPassword(!mostrarPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={cargando}
                                className="w-full bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000] hover:shadow-[0_0_20px_rgba(211,255,10,0.2)] transition-all disabled:opacity-50"
                            >
                                {cargando ? "Creando cuenta..." : "Crear cuenta gratis"}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground leading-relaxed">
                                Al registrarte, aceptás nuestros{" "}
                                <Link href="/terms" className="text-lime-400 hover:text-lime-300">
                                    Términos de Servicio
                                </Link>{" "}
                                y{" "}
                                <Link href="/privacy" className="text-lime-400 hover:text-lime-300">
                                    Política de Privacidad
                                </Link>
                                .
                            </p>
                        </form>

                        {/* Separador */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-zinc-900 px-3 text-muted-foreground">O continuar con</span>
                            </div>
                        </div>

                        {/* Social Auth */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="bg-transparent border-white/10 hover:bg-white/5 text-white"
                                onClick={() => {/* signIn('google') */ }}
                            >
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </Button>
                            <Button
                                variant="outline"
                                className="bg-transparent border-white/10 hover:bg-white/5 text-white"
                            >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                                Apple
                            </Button>
                        </div>

                        <p className="text-center text-sm text-muted-foreground mt-6">
                            ¿Ya tenés cuenta?{" "}
                            <Link href="/login" className="text-lime-400 hover:text-lime-300 font-medium">
                                Ingresar
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { iniciarSesion } from "@/lib/actions/auth";
import { getOnboardingStatus } from "@/lib/actions/onboarding";
import { signIn as nextAuthSignIn } from "next-auth/react";

import { BilletoLogo } from "@/components/ui/logo";

/**
 * Página de Login con integración real de NextAuth.
 * Usa server actions para iniciar sesión con credenciales.
 */
export default function LoginPage() {
    const router = useRouter();
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCargando(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const resultado = await iniciarSesion(formData);

        if (resultado.error) {
            setError(resultado.error);
            setCargando(false);
        } else {
            // Check if user needs onboarding
            const onboarding = await getOnboardingStatus();
            if (onboarding.needsOnboarding) {
                router.push("/onboarding");
            } else {
                router.push("/dashboard");
            }
            router.refresh();
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
                            Bienvenido de vuelta. Ingresá a tu cuenta.
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
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs uppercase tracking-wider text-zinc-500">
                                        Contraseña
                                    </Label>
                                    <Link href="/forgot-password" className="text-xs text-lime-400 hover:text-lime-300">
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={mostrarPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10 bg-zinc-900/50 border-zinc-800 focus:border-lime-400 focus:ring-lime-400/20"
                                        required
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
                                {cargando ? "Ingresando..." : "Ingresar"}
                            </Button>
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
                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                variant="outline"
                                className="bg-transparent border-white/10 hover:bg-white/5 text-white"
                                onClick={() => nextAuthSignIn('google', { callbackUrl: '/dashboard' })}
                            >
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continuar con Google
                            </Button>
                        </div>

                        <p className="text-center text-sm text-muted-foreground mt-6">
                            ¿No tenés cuenta?{" "}
                            <Link href="/register" className="text-lime-400 hover:text-lime-300 font-medium">
                                Crear cuenta
                            </Link>
                        </p>
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

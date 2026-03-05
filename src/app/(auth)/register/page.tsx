"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { registrarUsuario } from "@/lib/actions/auth";
import { signIn as nextAuthSignIn } from "next-auth/react";

import { BilletoLogo } from "@/components/ui/logo";

/**
 * Página de Registro con integración real de server actions.
 * Crea usuario + workspace + categorías + cuenta por defecto.
 */

type PasswordCheck = {
    label: string;
    test: (pw: string) => boolean;
};

const PASSWORD_CHECKS: PasswordCheck[] = [
    { label: "Mínimo 8 caracteres", test: (pw) => pw.length >= 8 },
    { label: "Una mayúscula", test: (pw) => /[A-Z]/.test(pw) },
    { label: "Una minúscula", test: (pw) => /[a-z]/.test(pw) },
    { label: "Un número", test: (pw) => /[0-9]/.test(pw) },
];

export default function RegisterPage() {
    const router = useRouter();
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarConfirm, setMostrarConfirm] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showChecks, setShowChecks] = useState(false);

    const allChecksPassed = PASSWORD_CHECKS.every((c) => c.test(password));
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCargando(true);
        setError(null);

        if (!allChecksPassed) {
            setError("La contraseña no cumple los requisitos mínimos.");
            setCargando(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            setCargando(false);
            return;
        }

        const formData = new FormData(e.currentTarget);
        const resultado = await registrarUsuario(formData);

        if (resultado.error) {
            setError(resultado.error);
            setCargando(false);
        } else {
            // Redirigir al onboarding después del registro exitoso
            router.push("/onboarding");
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
                        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
                            <BilletoLogo className="justify-center text-white" />
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
                                        maxLength={100}
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
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setShowChecks(true)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarPassword(!mostrarPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Password strength indicator */}
                                {showChecks && password.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="space-y-1 pt-1"
                                    >
                                        {PASSWORD_CHECKS.map((check) => {
                                            const passed = check.test(password);
                                            return (
                                                <div
                                                    key={check.label}
                                                    className={`flex items-center gap-2 text-xs transition-colors ${passed ? "text-lime-400" : "text-zinc-500"
                                                        }`}
                                                >
                                                    {passed ? (
                                                        <Check className="w-3 h-3" />
                                                    ) : (
                                                        <X className="w-3 h-3" />
                                                    )}
                                                    {check.label}
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </div>

                            {/* Campo Confirmar Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-zinc-500">
                                    Confirmar contraseña
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={mostrarConfirm ? "text" : "password"}
                                        placeholder="Repetí tu contraseña"
                                        className={`pl-10 pr-10 bg-zinc-900/50 border-zinc-800 focus:border-lime-400 focus:ring-lime-400/20 ${confirmPassword.length > 0
                                            ? passwordsMatch
                                                ? "border-lime-400/50"
                                                : "border-red-500/50"
                                            : ""
                                            }`}
                                        required
                                        minLength={8}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarConfirm(!mostrarConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {mostrarConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword.length > 0 && !passwordsMatch && (
                                    <p className="text-xs text-red-400">Las contraseñas no coinciden</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={cargando || !allChecksPassed || !passwordsMatch}
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
                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                variant="outline"
                                className="bg-transparent border-white/10 hover:bg-white/5 text-white"
                                onClick={() => nextAuthSignIn('google', { callbackUrl: '/onboarding' })}
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

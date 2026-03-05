"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle2, AlertCircle, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { verificarTokenReset, restablecerPassword } from "@/lib/actions/password-reset";

import { BilletoLogo } from "@/components/ui/logo";

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

/**
 * Página de restablecimiento de contraseña.
 * Se accede mediante el enlace enviado por email con un token.
 */
export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [estado, setEstado] = useState<"loading" | "invalid" | "form" | "success">("loading");
    const [errorToken, setErrorToken] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarConfirm, setMostrarConfirm] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const allChecksPassed = PASSWORD_CHECKS.every((c) => c.test(password));
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const verificar = useCallback(async () => {
        if (!token) {
            setEstado("invalid");
            setErrorToken("Enlace inválido. No contiene un token de verificación.");
            return;
        }

        const result = await verificarTokenReset(token);
        if (result.valid) {
            setEstado("form");
        } else {
            setEstado("invalid");
            setErrorToken(result.error || "El enlace no es válido.");
        }
    }, [token]);

    useEffect(() => {
        verificar();
    }, [verificar]);

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
        formData.set("token", token);
        const resultado = await restablecerPassword(formData);

        if (resultado.error) {
            setError(resultado.error);
            setCargando(false);
        } else {
            setEstado("success");
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
                            {estado === "success"
                                ? "¡Tu contraseña fue actualizada!"
                                : estado === "form"
                                    ? "Creá tu nueva contraseña."
                                    : estado === "invalid"
                                        ? "No se pudo verificar el enlace."
                                        : "Verificando enlace..."}
                        </p>
                    </CardHeader>

                    <CardContent className="pt-4">
                        {/* Loading state */}
                        {estado === "loading" && (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        {/* Invalid token */}
                        {estado === "invalid" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-4"
                            >
                                <div className="flex justify-center">
                                    <AlertCircle className="w-16 h-16 text-red-400" />
                                </div>
                                <p className="text-sm text-muted-foreground">{errorToken}</p>
                                <div className="pt-2 space-y-3">
                                    <Link href="/forgot-password" className="block">
                                        <Button className="w-full bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]">
                                            Solicitar nuevo enlace
                                        </Button>
                                    </Link>
                                    <Link href="/login" className="block">
                                        <Button variant="ghost" className="w-full text-zinc-400 hover:text-white">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Volver al login
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {/* Success */}
                        {estado === "success" && (
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
                                        Contraseña actualizada
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Tu contraseña fue cambiada exitosamente. Ya podés iniciar sesión con tu nueva contraseña.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <Link href="/login" className="block">
                                        <Button className="w-full bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]">
                                            Ir al login
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {/* Reset form */}
                        {estado === "form" && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                {/* Nueva contraseña */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-xs uppercase tracking-wider text-zinc-500">
                                        Nueva contraseña
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
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMostrarPassword(!mostrarPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                        >
                                            {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Password strength */}
                                    {password.length > 0 && (
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
                                                        className={`flex items-center gap-2 text-xs transition-colors ${passed ? "text-lime-400" : "text-zinc-500"}`}
                                                    >
                                                        {passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                        {check.label}
                                                    </div>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Confirmar contraseña */}
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
                                                ? passwordsMatch ? "border-lime-400/50" : "border-red-500/50"
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
                                    {cargando ? "Actualizando..." : "Actualizar contraseña"}
                                </Button>
                            </form>
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

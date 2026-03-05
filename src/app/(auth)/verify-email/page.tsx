"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { verificarEmail, enviarEmailVerificacion } from "@/lib/actions/email-verification";

import { BilletoLogo } from "@/components/ui/logo";

/**
 * Página de verificación de email.
 * Verifica el token y muestra el resultado.
 */
export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [estado, setEstado] = useState<"loading" | "success" | "error" | "resent">("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const [email, setEmail] = useState("");
    const [reenviando, setReenviando] = useState(false);

    const verificar = useCallback(async () => {
        if (!token) {
            setEstado("error");
            setErrorMsg("Enlace inválido. No contiene un token de verificación.");
            return;
        }

        const result = await verificarEmail(token);
        if (result.success) {
            setEstado("success");
            if (result.email) setEmail(result.email);
        } else {
            setEstado("error");
            setErrorMsg(result.error || "Error al verificar el email.");
        }
    }, [token]);

    useEffect(() => {
        verificar();
    }, [verificar]);

    const handleResend = async () => {
        if (!email) return;
        setReenviando(true);
        const result = await enviarEmailVerificacion(email);
        if (result.success) {
            setEstado("resent");
        }
        setReenviando(false);
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
                    </CardHeader>

                    <CardContent className="pt-4">
                        {/* Loading */}
                        {estado === "loading" && (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-muted-foreground">Verificando tu email...</p>
                            </div>
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
                                        ¡Email verificado!
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Tu cuenta está activa. Ya podés utilizar todas las funcionalidades de Billeto.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <Link href="/dashboard" className="block">
                                        <Button className="w-full bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]">
                                            Ir al dashboard
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {/* Error */}
                        {estado === "error" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-4"
                            >
                                <div className="flex justify-center">
                                    <AlertCircle className="w-16 h-16 text-red-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">
                                        No se pudo verificar
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{errorMsg}</p>
                                </div>
                                <div className="pt-2 space-y-3">
                                    <Link href="/login" className="block">
                                        <Button className="w-full bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000]">
                                            Ir al login
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {/* Resent success */}
                        {estado === "resent" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-4"
                            >
                                <div className="flex justify-center">
                                    <Mail className="w-16 h-16 text-lime-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">
                                        Nuevo email enviado
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Revisá tu bandeja de entrada para el nuevo enlace de verificación.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <Link href="/login" className="block">
                                        <Button variant="ghost" className="w-full text-zinc-400 hover:text-white">
                                            Ir al login
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

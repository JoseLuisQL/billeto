"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Activity,
} from "lucide-react";

/**
 * Página principal del Dashboard.
 * Componente client que usa useSession para acceder a datos del usuario.
 * Los datos financieros se cargarán vía API cuando se implemente el CRUD.
 */
export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Loading state
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-muted-foreground">Cargando...</div>
            </div>
        );
    }

    // No autenticado → redirigir
    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    const user = session!.user;

    // Formateador de moneda
    const formatearMoneda = (monto: number) => {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN",
        }).format(monto);
    };

    // Tarjetas de resumen (placeholders — se llenarán con datos reales de la API)
    const tarjetas = [
        {
            label: "Balance Total",
            valor: formatearMoneda(0),
            icon: Wallet,
            color: "text-lime-400",
            bgColor: "bg-lime-400/10",
        },
        {
            label: "Ingresos (mes)",
            valor: formatearMoneda(0),
            icon: TrendingUp,
            color: "text-emerald-400",
            bgColor: "bg-emerald-400/10",
        },
        {
            label: "Gastos (mes)",
            valor: formatearMoneda(0),
            icon: TrendingDown,
            color: "text-rose-400",
            bgColor: "bg-rose-400/10",
        },
        {
            label: "Transacciones",
            valor: "0",
            icon: Activity,
            color: "text-blue-400",
            bgColor: "bg-blue-400/10",
        },
    ];

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <DashboardSidebar user={user} />

            {/* Contenido principal */}
            <main className="flex-1 ml-64 p-6">
                {/* Header del dashboard */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">
                        Hola, {user.name?.split(" ")[0]} 👋
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Acá tenés un resumen de tus finanzas
                    </p>
                </div>

                {/* Tarjetas de resumen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {tarjetas.map((tarjeta) => {
                        const Icon = tarjeta.icon;
                        return (
                            <div
                                key={tarjeta.label}
                                className="rounded-xl border border-white/10 bg-zinc-900/50 p-5"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                        {tarjeta.label}
                                    </span>
                                    <div className={`p-2 rounded-lg ${tarjeta.bgColor}`}>
                                        <Icon className={`w-4 h-4 ${tarjeta.color}`} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-white">{tarjeta.valor}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Secciones de contenido */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Gráfico de actividad (placeholder) */}
                    <div className="lg:col-span-2 rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                        <h3 className="text-sm font-medium text-white mb-4">Actividad mensual</h3>
                        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                            Gráfico de actividad — se implementará con Recharts
                        </div>
                    </div>

                    {/* Lista de cuentas */}
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                        <h3 className="text-sm font-medium text-white mb-4">Tus cuentas</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                                <div>
                                    <p className="text-sm font-medium text-white">Efectivo</p>
                                    <p className="text-xs text-muted-foreground capitalize">cash</p>
                                </div>
                                <p className="text-sm font-semibold text-white">
                                    {formatearMoneda(0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transacciones recientes (placeholder) */}
                <div className="mt-6 rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                    <h3 className="text-sm font-medium text-white mb-4">Transacciones recientes</h3>
                    <div className="text-center py-12 text-muted-foreground text-sm">
                        <p>No hay transacciones aún.</p>
                        <p className="mt-1">Registrá tu primer gasto para empezar.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

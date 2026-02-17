"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Activity,
} from "lucide-react";
import { obtenerResumenDashboard } from "@/lib/actions/transactions";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { BalanceTrendChart } from "@/components/dashboard/BalanceTrendChart";

type DashboardCuenta = {
    id: string;
    name: string;
    type: string;
    currentBalance: number;
};

type DashboardTx = {
    id: string;
    description: string;
    amount: number;
    type: string;
    date: string;
    account?: string;
    category?: { icon?: string | null; name?: string; color?: string | null } | null;
};

type DashboardResumen = {
    balanceTotal: number;
    ingresosMes: number;
    gastosMes: number;
    totalTransacciones: number;
    moneda: string;
    cuentas: DashboardCuenta[];
    ultimasTransacciones: DashboardTx[];
};

/**
 * Página principal del Dashboard.
 * Obtiene resumen financiero en tiempo real vía server action.
 */
export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [resumen, setResumen] = useState<DashboardResumen | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (status === "authenticated") {
            obtenerResumenDashboard().then((data) => {
                setResumen(data);
                setCargando(false);
            });
        }
    }, [status]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-muted-foreground">Cargando...</div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    const user = session!.user;
    const moneda = resumen?.moneda || "PEN";

    const formatearMoneda = (monto: number) => {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: moneda,
        }).format(monto);
    };

    const tarjetas = [
        {
            label: "Balance Total",
            valor: formatearMoneda(resumen?.balanceTotal ?? 0),
            icon: Wallet,
            color: "text-lime-400",
            bgColor: "bg-lime-400/10",
        },
        {
            label: "Ingresos (mes)",
            valor: formatearMoneda(resumen?.ingresosMes ?? 0),
            icon: TrendingUp,
            color: "text-emerald-400",
            bgColor: "bg-emerald-400/10",
        },
        {
            label: "Gastos (mes)",
            valor: formatearMoneda(resumen?.gastosMes ?? 0),
            icon: TrendingDown,
            color: "text-rose-400",
            bgColor: "bg-rose-400/10",
        },
        {
            label: "Transacciones",
            valor: String(resumen?.totalTransacciones ?? 0),
            icon: Activity,
            color: "text-blue-400",
            bgColor: "bg-blue-400/10",
        },
    ];

    return (
        <div className="flex min-h-screen">
            <DashboardSidebar user={user} />
            <main className="flex-1 ml-64 p-6">
                {/* Header */}
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
                    {tarjetas.map((tarjeta, index) => {
                        const Icon = tarjeta.icon;
                        return (
                            <motion.div
                                key={tarjeta.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.04 }}
                                className={`rounded-xl border border-white/10 bg-zinc-900/50 p-5 transition-colors hover:border-lime-400/20 ${cargando ? "animate-pulse" : ""
                                    }`}
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
                            </motion.div>
                        );
                    })}
                </div>

                {/* Secciones de contenido */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Gráfico de actividad mensual */}
                    <div className="lg:col-span-2 rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                        <h3 className="text-sm font-medium text-white mb-4">Actividad mensual</h3>
                        <ActivityChart />
                    </div>

                    {/* Distribución por categoría */}
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                        <h3 className="text-sm font-medium text-white mb-4">Gastos por categoría</h3>
                        <CategoryPieChart />
                    </div>
                </div>

                {/* Fila 2: Balance trend + Cuentas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Balance trend */}
                    <div className="lg:col-span-2 rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                        <h3 className="text-sm font-medium text-white mb-4">Tendencia de balance</h3>
                        <BalanceTrendChart />
                    </div>

                    {/* Lista de cuentas */}
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                        <h3 className="text-sm font-medium text-white mb-4">Tus cuentas</h3>
                        {cargando ? (
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-14 rounded-lg bg-zinc-800/50 animate-pulse" />
                                ))}
                            </div>
                        ) : (resumen?.cuentas?.length ?? 0) === 0 ? (
                            <p className="text-sm text-muted-foreground">No tenés cuentas aún.</p>
                        ) : (
                            <div className="space-y-3">
                                {resumen?.cuentas?.map((cuenta) => (
                                    <div
                                        key={cuenta.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-white">{cuenta.name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{cuenta.type}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-white">
                                            {formatearMoneda(cuenta.currentBalance)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Transacciones recientes */}
                <div className="mt-6 rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                    <h3 className="text-sm font-medium text-white mb-4">Transacciones recientes</h3>
                    {cargando ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-10 rounded-lg bg-zinc-800/50 animate-pulse" />
                            ))}
                        </div>
                    ) : (resumen?.ultimasTransacciones?.length ?? 0) === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            <p>No hay transacciones aún.</p>
                            <p className="mt-1">Registrá tu primer gasto para empezar.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {resumen?.ultimasTransacciones?.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-zinc-800/30">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{tx.category?.icon || "📋"}</span>
                                        <div>
                                            <p className="text-sm text-white">{tx.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {tx.account} • {new Date(tx.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-medium ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                                        }`}>
                                        {tx.type === "income" ? "+" : "-"}{formatearMoneda(tx.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

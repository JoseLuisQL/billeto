"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Server Actions para datos de visualización del Dashboard.
 * Provee datos formateados para gráficos de Recharts.
 */

async function obtenerWorkspace() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");

    const membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
        include: { workspace: true },
    });

    if (!membership) throw new Error("Sin workspace asignado");
    return { userId: session.user.id, workspace: membership.workspace };
}

/**
 * Datos para el gráfico de actividad diaria del mes actual.
 * Retorna ingresos y gastos agrupados por día.
 */
export async function obtenerActividadMensual() {
    try {
        const { workspace } = await obtenerWorkspace();

        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
        const diasEnMes = finMes.getDate();

        // Obtener transacciones del mes
        const transacciones = await prisma.transaction.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
                date: { gte: inicioMes, lte: finMes },
            },
            select: { date: true, type: true, amountBase: true },
        });

        // Agrupar por día
        const datosPorDia: Record<number, { ingresos: number; gastos: number }> = {};
        for (let d = 1; d <= diasEnMes; d++) {
            datosPorDia[d] = { ingresos: 0, gastos: 0 };
        }

        for (const tx of transacciones) {
            const dia = tx.date.getDate();
            const monto = Number(tx.amountBase);
            if (tx.type === "income") {
                datosPorDia[dia].ingresos += monto;
            } else {
                datosPorDia[dia].gastos += monto;
            }
        }

        // Formatear para Recharts
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const mesActual = meses[ahora.getMonth()];

        const datos = Object.entries(datosPorDia).map(([dia, valores]) => ({
            dia: `${dia} ${mesActual}`,
            ingresos: Math.round(valores.ingresos * 100) / 100,
            gastos: Math.round(valores.gastos * 100) / 100,
        }));

        return { datos };
    } catch {
        return { datos: [] };
    }
}

/**
 * Datos para el gráfico de distribución por categoría.
 * Retorna gastos agrupados por categoría del mes actual.
 */
export async function obtenerDistribucionCategorias() {
    try {
        const { workspace } = await obtenerWorkspace();

        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

        const transacciones = await prisma.transaction.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
                type: "expense",
                date: { gte: inicioMes, lte: finMes },
            },
            include: {
                category: { select: { name: true, icon: true, color: true } },
            },
        });

        // Agrupar por categoría
        const porCategoria: Record<string, { nombre: string; icon: string; color: string; total: number }> = {};

        for (const tx of transacciones) {
            const catName = tx.category?.name || "Sin categoría";
            const catIcon = tx.category?.icon || "📋";
            const catColor = tx.category?.color || "#71717A";

            if (!porCategoria[catName]) {
                porCategoria[catName] = { nombre: catName, icon: catIcon, color: catColor, total: 0 };
            }
            porCategoria[catName].total += Number(tx.amountBase);
        }

        // Ordenar por total descendente
        const datos = Object.values(porCategoria)
            .sort((a, b) => b.total - a.total)
            .map((cat) => ({
                name: `${cat.icon} ${cat.nombre}`,
                value: Math.round(cat.total * 100) / 100,
                fill: cat.color,
            }));

        return { datos };
    } catch {
        return { datos: [] };
    }
}

/**
 * Datos para el gráfico de tendencia de balance (últimos 6 meses).
 * Calcula el balance acumulado mes a mes.
 */
export async function obtenerTendenciaBalance() {
    try {
        const { workspace } = await obtenerWorkspace();

        const ahora = new Date();
        const meses = [];
        const mesesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        // Últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
            const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59);

            meses.push({
                label: `${mesesLabels[fecha.getMonth()]} ${fecha.getFullYear().toString().slice(-2)}`,
                inicio: new Date(fecha.getFullYear(), fecha.getMonth(), 1),
                fin,
            });
        }

        const datos = [];

        for (const mes of meses) {
            const transacciones = await prisma.transaction.findMany({
                where: {
                    workspaceId: workspace.id,
                    deletedAt: null,
                    date: { lte: mes.fin },
                },
                select: { type: true, amountBase: true },
            });

            let balance = 0;
            // Sumar balance inicial de cuentas
            const cuentas = await prisma.account.findMany({
                where: { workspaceId: workspace.id, deletedAt: null },
                select: { initialBalance: true },
            });

            for (const c of cuentas) {
                balance += Number(c.initialBalance);
            }

            for (const tx of transacciones) {
                if (tx.type === "income") balance += Number(tx.amountBase);
                else balance -= Number(tx.amountBase);
            }

            datos.push({
                mes: mes.label,
                balance: Math.round(balance * 100) / 100,
            });
        }

        return { datos };
    } catch {
        return { datos: [] };
    }
}

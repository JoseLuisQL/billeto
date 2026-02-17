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
export async function obtenerActividadMensual(rango?: { from?: string; to?: string }) {
    try {
        const { workspace } = await obtenerWorkspace();

        const ahora = new Date();
        const inicioMes = rango?.from ? new Date(rango.from) : new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = rango?.to ? new Date(rango.to) : new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
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
export async function obtenerDistribucionCategorias(rango?: { from?: string; to?: string; type?: "income" | "expense" }) {
    try {
        const { workspace } = await obtenerWorkspace();

        const ahora = new Date();
        const inicioMes = rango?.from ? new Date(rango.from) : new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = rango?.to ? new Date(rango.to) : new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
        const tipo = rango?.type || "expense";

        const transacciones = await prisma.transaction.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
                type: tipo,
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

export async function obtenerPanelBalanceSeries(rango?: { from?: string; to?: string }) {
    try {
        const { workspace } = await obtenerWorkspace();
        const ahora = new Date();
        const from = rango?.from ? new Date(rango.from) : new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const to = rango?.to ? new Date(rango.to) : new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

        const durationMs = to.getTime() - from.getTime();
        const prevTo = new Date(from.getTime() - 1);
        const prevFrom = new Date(prevTo.getTime() - durationMs);

        const [cuentas, txCurrent, txBeforeCurrent, txPrev, txBeforePrev] = await Promise.all([
            prisma.account.findMany({
                where: { workspaceId: workspace.id, deletedAt: null },
                select: { initialBalance: true },
            }),
            prisma.transaction.findMany({
                where: {
                    workspaceId: workspace.id,
                    deletedAt: null,
                    date: { gte: from, lte: to },
                },
                select: { date: true, type: true, amountBase: true },
                orderBy: { date: "asc" },
            }),
            prisma.transaction.findMany({
                where: {
                    workspaceId: workspace.id,
                    deletedAt: null,
                    date: { lt: from },
                },
                select: { type: true, amountBase: true },
            }),
            prisma.transaction.findMany({
                where: {
                    workspaceId: workspace.id,
                    deletedAt: null,
                    date: { gte: prevFrom, lte: prevTo },
                },
                select: { type: true, amountBase: true },
            }),
            prisma.transaction.findMany({
                where: {
                    workspaceId: workspace.id,
                    deletedAt: null,
                    date: { lt: prevFrom },
                },
                select: { type: true, amountBase: true },
            }),
        ]);

        const baseInicial = cuentas.reduce((s, c) => s + Number(c.initialBalance), 0);

        const netBeforeCurrent = txBeforeCurrent.reduce((s, tx) => {
            const m = Number(tx.amountBase);
            return s + (tx.type === "income" ? m : -m);
        }, 0);
        const startBalanceCurrent = baseInicial + netBeforeCurrent;

        const netBeforePrev = txBeforePrev.reduce((s, tx) => {
            const m = Number(tx.amountBase);
            return s + (tx.type === "income" ? m : -m);
        }, 0);
        const startBalancePrev = baseInicial + netBeforePrev;

        let incomeCurrent = 0;
        let expenseCurrent = 0;
        let runningBalance = startBalanceCurrent;

        const mesesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const points: Array<{ mes: string; balance: number; income: number; expense: number }> = [];

        const monthCursor = new Date(from.getFullYear(), from.getMonth(), 1);
        const endMonth = new Date(to.getFullYear(), to.getMonth(), 1);

        while (monthCursor <= endMonth) {
            const start = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
            const end = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0, 23, 59, 59, 999);

            const monthIncome = txCurrent
                .filter((t) => t.date >= start && t.date <= end && t.type === "income")
                .reduce((s, t) => s + Number(t.amountBase), 0);
            const monthExpense = txCurrent
                .filter((t) => t.date >= start && t.date <= end && t.type === "expense")
                .reduce((s, t) => s + Number(t.amountBase), 0);

            incomeCurrent += monthIncome;
            expenseCurrent += monthExpense;
            runningBalance += monthIncome - monthExpense;

            points.push({
                mes: `${mesesLabels[monthCursor.getMonth()]} ${monthCursor.getFullYear().toString().slice(-2)}`,
                balance: Math.round(runningBalance * 100) / 100,
                income: Math.round(monthIncome * 100) / 100,
                expense: Math.round(monthExpense * 100) / 100,
            });

            monthCursor.setMonth(monthCursor.getMonth() + 1);
        }

        const incomePrev = txPrev
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + Number(t.amountBase), 0);
        const expensePrev = txPrev
            .filter((t) => t.type === "expense")
            .reduce((s, t) => s + Number(t.amountBase), 0);
        const balancePrev = startBalancePrev + incomePrev - expensePrev;

        return {
            points,
            totals: {
                balance: Math.round(runningBalance * 100) / 100,
                income: Math.round(incomeCurrent * 100) / 100,
                expense: Math.round(expenseCurrent * 100) / 100,
            },
            previous: {
                balance: Math.round(balancePrev * 100) / 100,
                income: Math.round(incomePrev * 100) / 100,
                expense: Math.round(expensePrev * 100) / 100,
            },
            moneda: workspace.baseCurrency,
        };
    } catch {
        return {
            points: [],
            totals: { balance: 0, income: 0, expense: 0 },
            previous: { balance: 0, income: 0, expense: 0 },
            moneda: "PEN",
        };
    }
}

export async function obtenerFlujoCategorias(rango?: { from?: string; to?: string }) {
    try {
        const { workspace } = await obtenerWorkspace();
        const ahora = new Date();
        const inicio = rango?.from ? new Date(rango.from) : new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const fin = rango?.to ? new Date(rango.to) : new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

        const txs = await prisma.transaction.findMany({
            where: {
                workspaceId: workspace.id,
                deletedAt: null,
                date: { gte: inicio, lte: fin },
                type: { in: ["income", "expense"] },
            },
            include: {
                category: {
                    select: { name: true, icon: true, color: true },
                },
            },
        });

        const incomeMap = new Map<string, { name: string; color: string; value: number }>();
        const expenseMap = new Map<string, { name: string; color: string; value: number }>();

        for (const tx of txs) {
            const name = `${tx.category?.icon || "📋"} ${tx.category?.name || "General"}`;
            const color = tx.category?.color || (tx.type === "income" ? "#22c55e" : "#ef4444");
            const amount = Number(tx.amountBase);

            if (tx.type === "income") {
                const prev = incomeMap.get(name) ?? { name, color, value: 0 };
                prev.value += amount;
                incomeMap.set(name, prev);
            } else {
                const prev = expenseMap.get(name) ?? { name, color, value: 0 };
                prev.value += amount;
                expenseMap.set(name, prev);
            }
        }

        const ingresos = [...incomeMap.values()].sort((a, b) => b.value - a.value).slice(0, 6);
        const gastos = [...expenseMap.values()].sort((a, b) => b.value - a.value).slice(0, 6);

        const totalIngresos = ingresos.reduce((s, i) => s + i.value, 0);
        const totalGastos = gastos.reduce((s, g) => s + g.value, 0);

        const nodes: Array<{ name: string; color: string; rawValue: number }> = [];
        const links: Array<{ source: number; target: number; value: number }> = [];

        ingresos.forEach((i) => nodes.push({ name: i.name, color: i.color, rawValue: i.value }));

        const ajusteNecesario = Math.max(0, totalGastos - totalIngresos);

        if (ajusteNecesario > 0) {
            nodes.push({ name: "⚖️ Ajuste", color: "#52525b", rawValue: ajusteNecesario });
        }

        const gastosNodeIndex = nodes.length;
        nodes.push({ name: "💸 Gastos", color: "#ca8a04", rawValue: totalIngresos });

        gastos.forEach((g) => nodes.push({ name: g.name, color: g.color, rawValue: g.value }));

        let sourceIdx = 0;
        if (totalIngresos > 0) {
            ingresos.forEach((i) => {
                if (i.value > 0) {
                    links.push({ source: sourceIdx, target: gastosNodeIndex, value: Number(i.value.toFixed(2)) });
                }
                sourceIdx += 1;
            });
        } else {
            sourceIdx = ingresos.length;
        }

        if (ajusteNecesario > 0) {
            links.push({ source: sourceIdx, target: gastosNodeIndex, value: Number(ajusteNecesario.toFixed(2)) });
        }

        let targetIdx = gastosNodeIndex + 1;
        gastos.forEach((g) => {
            links.push({ source: gastosNodeIndex, target: targetIdx, value: g.value });
            targetIdx += 1;
        });

        return {
            nodes,
            links,
            moneda: workspace.baseCurrency,
        };
    } catch {
        return {
            nodes: [],
            links: [],
            moneda: "PEN",
        };
    }
}

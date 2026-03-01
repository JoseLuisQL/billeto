"use server";

import { prisma } from "@/lib/prisma";

/**
 * Servicio de tipos de cambio (FX) para multi-moneda.
 *
 * - Fuente: Frankfurter API (ECB, gratuita, sin API key)
 * - Caché in-memory con TTL de 1 hora
 * - Persistencia en tabla FXRate de la DB
 * - Fallback a 1.0 si la API falla (nunca bloquear transacciones)
 */

// ─── Types ───────────────────────────────────────────

type CachedRate = {
    rate: number;
    fetchedAt: number;
};

// ─── Config ──────────────────────────────────────────

const FRANKFURTER_BASE = "https://api.frankfurter.dev";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
const FETCH_TIMEOUT_MS = 8_000;

// ─── In-Memory Cache ─────────────────────────────────

const rateCache = new Map<string, CachedRate>();

function cacheKey(from: string, to: string): string {
    return `${from}→${to}`;
}

function getCachedRate(from: string, to: string): number | null {
    const entry = rateCache.get(cacheKey(from, to));
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
        rateCache.delete(cacheKey(from, to));
        return null;
    }
    return entry.rate;
}

function setCachedRate(from: string, to: string, rate: number): void {
    rateCache.set(cacheKey(from, to), { rate, fetchedAt: Date.now() });
}

// ─── Currency Mapping ────────────────────────────────

/**
 * Mapea códigos internos especiales a códigos ISO estándar
 * que la API de Frankfurter entiende.
 */
const CURRENCY_ALIAS: Record<string, string> = {
    "ARS-BLUE": "ARS",
    "ARS-UVA": "ARS",
    "NONE": "__SKIP__", // Sin moneda → rate 1.0
};

function resolveISOCode(code: string): string {
    return CURRENCY_ALIAS[code] || code;
}

// ─── Frankfurter API ─────────────────────────────────

/**
 * Obtiene el tipo de cambio desde Frankfurter API.
 * Retorna null si falla.
 */
async function fetchRateFromAPI(from: string, to: string): Promise<number | null> {
    try {
        const url = `${FRANKFURTER_BASE}/v1/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`;

        const res = await fetch(url, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: { "User-Agent": "Billeto/1.0" },
            // Evitar que Next.js cachée esta request internamente
            cache: "no-store",
        });

        if (!res.ok) {
            console.warn(`[fx-service] API error ${res.status} for ${from}→${to}`);
            return null;
        }

        const data = await res.json();
        const rate = data?.rates?.[to];

        if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
            console.warn(`[fx-service] Invalid rate for ${from}→${to}:`, rate);
            return null;
        }

        return rate;
    } catch (error) {
        console.warn(`[fx-service] Fetch failed for ${from}→${to}:`, error instanceof Error ? error.message : error);
        return null;
    }
}

// ─── DB Persistence ──────────────────────────────────

/**
 * Guarda un tipo de cambio en la tabla FXRate y retorna el ID.
 */
async function persistFXRate(pair: string, rate: number): Promise<string | null> {
    try {
        const record = await prisma.fXRate.create({
            data: {
                provider: "frankfurter",
                pair,
                rate,
                fetchedAt: new Date(),
            },
        });
        return record.id;
    } catch (error) {
        console.warn("[fx-service] Failed to persist FX rate:", error instanceof Error ? error.message : error);
        return null;
    }
}

// ─── Public API ──────────────────────────────────────

/**
 * Obtiene el tipo de cambio entre dos monedas.
 * Usa caché in-memory (1h TTL) y fallback a 1.0 si falla.
 *
 * @returns El rate (1 unidad de `from` = `rate` unidades de `to`)
 */
export async function getRate(from: string, to: string): Promise<number> {
    const isoFrom = resolveISOCode(from);
    const isoTo = resolveISOCode(to);

    // Moneda idéntica o NONE → sin conversión
    if (isoFrom === isoTo || isoFrom === "__SKIP__" || isoTo === "__SKIP__") {
        return 1.0;
    }

    // Verificar caché
    const cached = getCachedRate(isoFrom, isoTo);
    if (cached !== null) {
        return cached;
    }

    // Fetch desde API
    const rate = await fetchRateFromAPI(isoFrom, isoTo);

    if (rate !== null) {
        setCachedRate(isoFrom, isoTo, rate);
        // También cachear el inverso
        setCachedRate(isoTo, isoFrom, 1 / rate);
        return rate;
    }

    // Fallback: nunca bloquear transacciones
    console.warn(`[fx-service] Using fallback rate 1.0 for ${from}→${to}`);
    return 1.0;
}

/**
 * Convierte un monto de una moneda a otra.
 * Retorna el monto convertido y el rate usado.
 */
export async function convertAmount(
    amount: number,
    from: string,
    to: string
): Promise<{ converted: number; rate: number }> {
    const rate = await getRate(from, to);
    const converted = Number((amount * rate).toFixed(2));
    return { converted, rate };
}

/**
 * Convierte un monto y persiste el FX rate usado en la DB.
 * Retorna { converted, rate, fxRateId }.
 *
 * Si from === to, no persiste FXRate (fxRateId = null).
 */
export async function convertAndSave(
    amount: number,
    from: string,
    to: string
): Promise<{ converted: number; rate: number; fxRateId: string | null }> {
    const isoFrom = resolveISOCode(from);
    const isoTo = resolveISOCode(to);

    // Sin conversión necesaria
    if (isoFrom === isoTo || isoFrom === "__SKIP__" || isoTo === "__SKIP__") {
        return { converted: amount, rate: 1.0, fxRateId: null };
    }

    const { converted, rate } = await convertAmount(amount, from, to);

    // Persistir en DB
    const pair = `${isoFrom}/${isoTo}`;
    const fxRateId = await persistFXRate(pair, rate);

    return { converted, rate, fxRateId };
}

/**
 * Pre-carga rates para un conjunto de monedas contra una base.
 * Útil para dashboards que necesitan convertir múltiples cuentas.
 */
export async function preloadRates(
    baseCurrency: string,
    currencies: string[]
): Promise<Map<string, number>> {
    const rates = new Map<string, number>();
    const uniqueCurrencies = [...new Set(currencies)];

    await Promise.all(
        uniqueCurrencies.map(async (currency) => {
            const rate = await getRate(currency, baseCurrency);
            rates.set(currency, rate);
        })
    );

    return rates;
}

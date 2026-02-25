/**
 * Mapeo de código de país ISO → código de moneda por defecto.
 * Usado en el onboarding para sugerir la moneda según el país detectado.
 */
export const countryCurrencyMap: Record<string, string> = {
    AR: "ARS",
    BO: "BOB",
    BR: "BRL",
    CA: "CAD",
    CL: "CLP",
    CO: "COP",
    CR: "CRC",
    CU: "CUP",
    DO: "DOP",
    EC: "USD",
    SV: "USD",
    ES: "EUR",
    US: "USD",
    GT: "GTQ",
    HN: "HNL",
    MX: "MXN",
    NI: "NIO",
    PA: "PAB",
    PY: "PYG",
    PE: "PEN",
    PR: "USD",
    PT: "EUR",
    UY: "UYU",
    VE: "VES",
    DE: "EUR",
    FR: "EUR",
    GB: "GBP",
    IT: "EUR",
    JP: "JPY",
    KR: "KRW",
    CN: "CNY",
    IN: "INR",
    AU: "AUD",
};

/**
 * Obtener la moneda por defecto para un país dado.
 * Si no se encuentra, retorna "USD".
 */
export function getDefaultCurrency(countryCode: string): string {
    return countryCurrencyMap[countryCode.toUpperCase()] || "USD";
}

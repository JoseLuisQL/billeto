/**
 * Lista de países con código ISO, nombre y emoji de bandera.
 * Enfocado en Latinoamérica + países comunes.
 */
export type Country = {
    code: string;
    name: string;
    flag: string;
};

export const countries: Country[] = [
    { code: "AR", name: "Argentina", flag: "🇦🇷" },
    { code: "BO", name: "Bolivia", flag: "🇧🇴" },
    { code: "BR", name: "Brasil", flag: "🇧🇷" },
    { code: "CA", name: "Canadá", flag: "🇨🇦" },
    { code: "CL", name: "Chile", flag: "🇨🇱" },
    { code: "CO", name: "Colombia", flag: "🇨🇴" },
    { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
    { code: "CU", name: "Cuba", flag: "🇨🇺" },
    { code: "DO", name: "República Dominicana", flag: "🇩🇴" },
    { code: "EC", name: "Ecuador", flag: "🇪🇨" },
    { code: "SV", name: "El Salvador", flag: "🇸🇻" },
    { code: "ES", name: "España", flag: "🇪🇸" },
    { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
    { code: "GT", name: "Guatemala", flag: "🇬🇹" },
    { code: "HN", name: "Honduras", flag: "🇭🇳" },
    { code: "MX", name: "México", flag: "🇲🇽" },
    { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
    { code: "PA", name: "Panamá", flag: "🇵🇦" },
    { code: "PY", name: "Paraguay", flag: "🇵🇾" },
    { code: "PE", name: "Perú", flag: "🇵🇪" },
    { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
    { code: "PT", name: "Portugal", flag: "🇵🇹" },
    { code: "UY", name: "Uruguay", flag: "🇺🇾" },
    { code: "VE", name: "Venezuela", flag: "🇻🇪" },
    { code: "DE", name: "Alemania", flag: "🇩🇪" },
    { code: "FR", name: "Francia", flag: "🇫🇷" },
    { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
    { code: "IT", name: "Italia", flag: "🇮🇹" },
    { code: "JP", name: "Japón", flag: "🇯🇵" },
    { code: "KR", name: "Corea del Sur", flag: "🇰🇷" },
    { code: "CN", name: "China", flag: "🇨🇳" },
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
];

export function getCountryByCode(code: string): Country | undefined {
    return countries.find((c) => c.code === code);
}

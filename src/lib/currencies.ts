export type Currency = {
    code: string;
    name: string;
    flag: string;
    region: 'Favorita' | 'Latinoamérica' | 'Norteamérica' | 'Europa' | 'Asia' | 'Mundial' | 'Global';
};

export const currencies: Currency[] = [
    // Ninguna
    { code: "NONE", name: "Ninguna", flag: "🌍", region: "Global" },

    // Favorita
    { code: "PEN", name: "Sol", flag: "🇵🇪", region: "Favorita" },

    // Latinoamérica
    { code: "ARS", name: "Peso argentino", flag: "🇦🇷", region: "Latinoamérica" },
    { code: "ARS-BLUE", name: "Peso argentino - Blue", flag: "🇦🇷", region: "Latinoamérica" },
    { code: "ARS-UVA", name: "Unidad de Valor Adquisitivo", flag: "🇦🇷", region: "Latinoamérica" },
    { code: "BOB", name: "Boliviano", flag: "🇧🇴", region: "Latinoamérica" },
    { code: "BRL", name: "Real brasileño", flag: "🇧🇷", region: "Latinoamérica" },
    { code: "CLP", name: "Peso chileno", flag: "🇨🇱", region: "Latinoamérica" },
    { code: "COP", name: "Peso colombiano", flag: "🇨🇴", region: "Latinoamérica" },
    { code: "CRC", name: "Colón costarricense", flag: "🇨🇷", region: "Latinoamérica" },
    { code: "DOP", name: "Peso dominicano", flag: "🇩🇴", region: "Latinoamérica" },
    { code: "MXN", name: "Peso mexicano", flag: "🇲🇽", region: "Latinoamérica" },
    { code: "NIO", name: "Córdoba nicaragüense", flag: "🇳🇮", region: "Latinoamérica" },
    { code: "PAB", name: "Balboa panameño", flag: "🇵🇦", region: "Latinoamérica" },
    { code: "PYG", name: "Guaraní paraguayo", flag: "🇵🇾", region: "Latinoamérica" },
    { code: "UYU", name: "Peso uruguayo", flag: "🇺🇾", region: "Latinoamérica" },
    { code: "VES", name: "Bolívar venezolano", flag: "🇻🇪", region: "Latinoamérica" },

    // Norteamérica
    { code: "USD", name: "Dólar estadounidense", flag: "🇺🇸", region: "Norteamérica" },
    { code: "CAD", name: "Dólar canadiense", flag: "🇨🇦", region: "Norteamérica" },

    // Europa
    { code: "EUR", name: "Euro", flag: "🇪🇺", region: "Europa" },
    { code: "GBP", name: "Libra esterlina", flag: "🇬🇧", region: "Europa" },
    { code: "CHF", name: "Franco suizo", flag: "🇨🇭", region: "Europa" },
    { code: "SEK", name: "Corona sueca", flag: "🇸🇪", region: "Europa" },
    { code: "NOK", name: "Corona noruega", flag: "🇳🇴", region: "Europa" },

    // Asia/Oceanía
    { code: "JPY", name: "Yen japonés", flag: "🇯🇵", region: "Asia" },
    { code: "CNY", name: "Yuan chino", flag: "🇨🇳", region: "Asia" },
    { code: "INR", name: "Rupia india", flag: "🇮🇳", region: "Asia" },
    { code: "AUD", name: "Dólar australiano", flag: "🇦🇺", region: "Asia" },
    { code: "NZD", name: "Dólar neozelandés", flag: "🇳🇿", region: "Asia" },

    // Mundial (Otros)
    { code: "ZAR", name: "Rand sudafricano", flag: "🇿🇦", region: "Mundial" },
    { code: "AED", name: "Dírham emiratí", flag: "🇦🇪", region: "Mundial" },
];

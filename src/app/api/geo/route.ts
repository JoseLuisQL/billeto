import { NextResponse } from "next/server";
import { countries } from "@/lib/countries";
import { getDefaultCurrency } from "@/lib/country-currency";

/**
 * GET /api/geo
 * Detect user's country by IP using ipapi.co.
 * Returns the detected country code, name, flag, and default currency.
 * Falls back to PE (Peru) if detection fails.
 */
export async function GET() {
    const fallback = {
        countryCode: "PE",
        countryName: "Perú",
        flag: "🇵🇪",
        currencyCode: "PEN",
    };

    try {
        const res = await fetch("https://ipapi.co/json/", {
            signal: AbortSignal.timeout(5000),
            headers: { "User-Agent": "Billeto/1.0" },
        });

        if (!res.ok) {
            return NextResponse.json(fallback);
        }

        const data = await res.json();
        const code = (data.country_code || "PE").toUpperCase();

        const country = countries.find((c) => c.code === code);

        return NextResponse.json({
            countryCode: code,
            countryName: country?.name || data.country_name || fallback.countryName,
            flag: country?.flag || "🌍",
            currencyCode: getDefaultCurrency(code),
        });
    } catch {
        return NextResponse.json(fallback);
    }
}

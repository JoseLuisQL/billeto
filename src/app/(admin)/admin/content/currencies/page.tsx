import { Globe } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

export default function AdminCurrenciesPage() {
    const currencies = [
        { code: "PEN", name: "Sol Peruano", symbol: "S/", flag: "🇵🇪" },
        { code: "USD", name: "Dólar Estadounidense", symbol: "$", flag: "🇺🇸" },
        { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
        { code: "MXN", name: "Peso Mexicano", symbol: "$", flag: "🇲🇽" },
        { code: "COP", name: "Peso Colombiano", symbol: "$", flag: "🇨🇴" },
        { code: "ARS", name: "Peso Argentino", symbol: "$", flag: "🇦🇷" },
        { code: "CLP", name: "Peso Chileno", symbol: "$", flag: "🇨🇱" },
        { code: "BRL", name: "Real Brasileño", symbol: "R$", flag: "🇧🇷" },
        { code: "BOB", name: "Boliviano", symbol: "Bs", flag: "🇧🇴" },
        { code: "GBP", name: "Libra Esterlina", symbol: "£", flag: "🇬🇧" },
    ];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Países y Monedas"
                description="Monedas soportadas oficialmente por el sistema."
                icon={Globe}
                tone="info"
                backHref="/admin/content"
            />

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/80">
                <table className="w-full min-w-[620px] text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03]">
                            <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.14em] uppercase text-zinc-500">País</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.14em] uppercase text-zinc-500">Código</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.14em] uppercase text-zinc-500">Nombre</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.14em] uppercase text-zinc-500">Símbolo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {currencies.map((c) => (
                            <tr key={c.code} className="transition-colors hover:bg-white/[0.04]">
                                <td className="px-4 py-3 text-lg">{c.flag}</td>
                                <td className="px-4 py-3 font-mono font-medium text-zinc-200">{c.code}</td>
                                <td className="px-4 py-3 text-zinc-300">{c.name}</td>
                                <td className="px-4 py-3 text-zinc-400 font-mono">{c.symbol}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

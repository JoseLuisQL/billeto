import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";

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
            <div className="flex items-center gap-4">
                <Link href="/admin/content" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-zinc-900/50 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Países y Monedas</h1>
                    <p className="mt-1 text-sm text-zinc-500">Monedas soportadas por el sistema</p>
                </div>
                <div className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
                    <Globe className="h-5 w-5 text-blue-400" />
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-zinc-900/50">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">País</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Código</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Nombre</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Símbolo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {currencies.map((c) => (
                            <tr key={c.code} className="transition-colors hover:bg-white/[0.02]">
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

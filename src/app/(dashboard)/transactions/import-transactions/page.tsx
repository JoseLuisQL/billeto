"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Upload, Leaf, Zap, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImportTransactionsPage() {
    const router = useRouter();
    const [selectedProvider, setSelectedProvider] = useState<string>("ynab");

    const steps = [
        { num: 1, title: "Proveedor", subtitle: "YNAB", status: "active" },
        { num: 2, title: "Archivo", subtitle: "Pendiente", status: "pending" },
        { num: 3, title: "Preview", subtitle: "Pendiente", status: "pending" },
        { num: 4, title: "Mapeo e importar", subtitle: "Pendiente", status: "pending" },
        { num: 5, title: "Resumen", subtitle: "Pendiente", status: "pending" }
    ];

    const providers = [
        { id: "ynab", name: "YNAB", description: "TSV export", status: "Disponible", badgeClass: "bg-[#D3FF0A]/10 text-[#D3FF0A] border-[#D3FF0A]/20", activeClass: "border-[#D3FF0A] bg-[#18181b]", available: true, icon: <div className="w-5 h-5 bg-blue-500 rounded-sm"></div> },
        { id: "mint", name: "Mint", description: "Próximamente", status: "Próximamente", badgeClass: "text-zinc-500 border-zinc-800", activeClass: "border-zinc-800 bg-[#18181b] opacity-60", available: false, icon: <Leaf className="w-5 h-5 text-emerald-500" /> },
        { id: "quicken", name: "Quicken", description: "Próximamente", status: "Próximamente", badgeClass: "text-zinc-500 border-zinc-800", activeClass: "border-zinc-800 bg-[#18181b] opacity-60", available: false, icon: <Zap className="w-5 h-5 text-purple-500" /> },
        { id: "csv", name: "Excel/CSV", description: "Próximamente", status: "Próximamente", badgeClass: "text-zinc-500 border-zinc-800", activeClass: "border-zinc-800 bg-[#18181b] opacity-60", available: false, icon: <FileSpreadsheet className="w-5 h-5 text-rose-400" /> },
    ];

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-[#D3FF0A]/20 pb-20">
            <main className="max-w-4xl mx-auto pt-16 px-6">
                {/* Header Card */}
                <div className="bg-[#18181b] rounded-2xl p-8 border border-zinc-800/80 mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#D3FF0A]/40 group-hover:bg-[#D3FF0A] transition-colors"></div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-[13px] font-medium text-zinc-400 hover:text-white transition-colors mb-4 gap-2 w-fit bg-zinc-900/50 py-1.5 px-3 rounded-full border border-zinc-800"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Migración de proveedores
                    </button>
                    <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Importar transacciones desde otro proveedor</h1>
                    <p className="text-sm text-zinc-400">Flujo guiado por pasos: proveedor, archivo, preview, mapeo y resumen final.</p>
                </div>

                {/* Steps */}
                <div className="flex flex-wrap items-center gap-3 mb-12">
                    {steps.map((step) => (
                        <div
                            key={step.num}
                            className={`flex flex-col px-4 py-3 rounded-xl border ${step.status === "active"
                                    ? "border-[#D3FF0A] bg-[#18181b] min-w-[140px]"
                                    : "border-zinc-800/60 bg-[#18181b]/50 min-w-[140px]"
                                } transition-all`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${step.status === "active" ? "bg-[#D3FF0A] text-black" : "bg-zinc-800 text-zinc-400"
                                    }`}>
                                    {step.num}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[13px] font-semibold ${step.status === 'active' ? 'text-white' : 'text-zinc-400'}`}>
                                        {step.title}
                                    </span>
                                    <span className="text-[11px] font-medium text-zinc-500">
                                        {step.subtitle}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-2">Elegí proveedor</h2>
                    <p className="text-[13px] text-zinc-400 mb-6">Solo podés seleccionar proveedores disponibles para continuar.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {providers.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => p.available && setSelectedProvider(p.id)}
                                className={`rounded-2xl p-5 border relative transition-all group ${p.id === selectedProvider ? p.activeClass : p.activeClass.replace('border-[#D3FF0A]', 'border-zinc-800')
                                    } ${p.available ? 'cursor-pointer hover:border-zinc-600' : 'cursor-not-allowed'}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-2 bg-zinc-900 rounded-lg">
                                        {p.icon}
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${p.badgeClass}`}>
                                        {p.status}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-semibold text-white mb-0.5">{p.name}</h3>
                                    <p className="text-[12px] text-zinc-500 font-medium">{p.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between mt-12 pt-6 border-t border-zinc-800/50">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="bg-[#18181b] border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-[13px] font-medium h-10 px-6 rounded-lg shadow-none"
                    >
                        Atrás
                    </Button>
                    <Button
                        className="bg-[#D3FF0A]/20 text-[#D3FF0A] border border-[#D3FF0A]/30 hover:bg-[#D3FF0A]/30 text-[13px] font-semibold h-10 px-6 rounded-lg gap-2 shadow-none transition-all"
                    >
                        Siguiente <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </main>
        </div>
    );
}

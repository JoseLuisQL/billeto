"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
    Plus,
    Search,
    Wallet,
    MoreVertical,
    Trash2,
    Edit,
    X,
    LayoutGrid,
    List,
    ArrowUpDown,
    CreditCard
} from "lucide-react";
import {
    listarCuentas,
    crearCuenta,
    eliminarCuenta,
} from "@/lib/actions/accounts";
import { useToast } from "@/components/ui/toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AccountItem = {
    id: string;
    name: string;
    currency: string;
    balance: number;
    icon?: string;
    type?: string;
    accountNumber?: string;
};

export default function AccountsPage() {
    const { status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    // Data
    const [cuentas, setCuentas] = useState<AccountItem[]>([]);
    const [cargando, setCargando] = useState(true);

    // UI State
    const [modal, setModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // New Account Form State
    const [selectedIcon, setSelectedIcon] = useState("💰");
    const [showIconPicker, setShowIconPicker] = useState(false);

    const icons = ["💰", "💳", "🏦", "💵", "🪙", "📱", "🏠", "🚗", "🎓", "✈️", "🛒", "💊"];

    const cargarCuentas = async () => {
        setCargando(true);
        try {
            const res = await listarCuentas();
            setCuentas((res.cuentas as AccountItem[]) || []);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudieron cargar las cuentas", variant: "destructive" });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            void cargarCuentas();
        }
    }, [status]);

    const handleCrear = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set("icon", selectedIcon); // Add customized icon

        const result = await crearCuenta(formData);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            setModal(false);
            toast({ title: "Éxito", description: "Cuenta creada correctamente.", className: "bg-[#09090b] border-zinc-800 text-white" });
            cargarCuentas();
        }
    };

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar esta cuenta? Se perderán las transacciones asociadas.")) return;
        const result = await eliminarCuenta(id);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Eliminada", description: "Cuenta eliminada correctamente.", className: "bg-[#09090b] border-zinc-800 text-white" });
            cargarCuentas(); // Reload list
        }
    };

    if (status === "loading") return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500">Cargando...</div>;
    if (status === "unauthenticated") { router.push("/login"); return null; }

    const filteredAccounts = cuentas.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const safeBalance = (balance: any) => {
        const num = Number(balance);
        return isNaN(num) ? 0 : num;
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-[#D3FF0A]/20">
            {/* Header - Exact Match */}
            <header className="flex h-16 items-center justify-between px-6 border-b border-zinc-800/40 sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-40">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <Wallet className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-white">Cuentas</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar cuentas..."
                            className="w-64 pl-8 pr-3 h-8 bg-zinc-900/50 border border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-600"
                        />
                    </div>

                    <Button variant="outline" size="sm" className="h-8 border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs hidden sm:flex">
                        GasTag
                    </Button>

                    <Button
                        onClick={() => setModal(true)}
                        className="bg-[#D3FF0A] text-black hover:bg-[#b8e600] text-xs font-semibold h-8 px-4"
                    >
                        Nueva cuenta
                    </Button>
                </div>
            </header>

            <main className="p-6 space-y-6 max-w-[1920px] mx-auto">

                {/* Account Actions Bar */}
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-zinc-400">Mis Cuentas</h2>
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-md border border-zinc-800">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded ${viewMode === "list" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                            <List className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {cargando ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-zinc-900/50 rounded-xl animate-pulse" />)}
                    </div>
                ) : filteredAccounts.length === 0 ? (
                    <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-16 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                            <CreditCard className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Aún no tienes cuentas</h3>
                        <p className="text-zinc-500 text-sm max-w-sm mb-6">
                            Comienza creando tu primera cuenta para organizar tus balances.
                        </p>
                        <Button
                            onClick={() => setModal(true)}
                            className="bg-[#D3FF0A] text-black hover:bg-[#b8e600] text-xs font-semibold h-9 px-6"
                        >
                            Crear cuenta
                        </Button>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredAccounts.map(account => (
                            <Card key={account.id} className="bg-[#18181b] border-transparent hover:border-zinc-800 transition-all group relative overflow-hidden shadow-none">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#18181b] border-zinc-800 text-zinc-300">
                                            <DropdownMenuItem className="text-xs focus:bg-zinc-800 focus:text-white cursor-pointer">
                                                <Edit className="w-3.5 h-3.5 mr-2" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEliminar(account.id)} className="text-xs text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 cursor-pointer">
                                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shadow-sm">
                                            {account.icon || "💰"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-zinc-100 truncate text-base">{account.name}</h3>
                                            <p className="text-xs text-zinc-500 font-mono mt-1">{account.accountNumber || account.currency}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Balance disponible</span>
                                        <div className={`text-2xl font-bold mt-1 ${safeBalance(account.balance) >= 0 ? 'text-white' : 'text-rose-500'}`}>
                                            {new Intl.NumberFormat("es-PE", { style: "currency", currency: account.currency }).format(safeBalance(account.balance))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Add New Card (Ghost) */}
                        <button
                            onClick={() => setModal(true)}
                            className="border border-dashed border-zinc-800 bg-zinc-900/20 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all min-h-[180px]"
                        >
                            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium uppercase tracking-wide">Nueva cuenta</span>
                        </button>
                    </div>
                ) : (
                    <div className="bg-[#09090b] rounded-lg overflow-hidden border border-zinc-900">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-zinc-800/50 bg-[#18181b]/50">
                                    <th className="py-3 px-4 font-medium text-zinc-500">Cuenta</th>
                                    <th className="py-3 px-4 font-medium text-zinc-500 text-right">Balance</th>
                                    <th className="py-3 px-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {filteredAccounts.map(account => (
                                    <tr key={account.id} className="group hover:bg-zinc-900/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-sm border border-zinc-700/50">
                                                    {account.icon || "💰"}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-zinc-200">{account.name}</div>
                                                    <div className="text-[10px] text-zinc-500">{account.currency}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className={`font-medium ${safeBalance(account.balance) >= 0 ? 'text-white' : 'text-rose-500'}`}>
                                                {new Intl.NumberFormat("es-PE", { style: "currency", currency: account.currency }).format(safeBalance(account.balance))}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button onClick={() => handleEliminar(account.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* History Section Placeholder - Styled to match Transactions table container */}
                <div className="space-y-4">
                    <h2 className="text-sm font-medium text-zinc-400">Historial reciente</h2>
                    <div className="bg-[#09090b] border border-zinc-900 rounded-lg p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                            <List className="w-5 h-5 text-zinc-600" />
                        </div>
                        <p className="text-sm text-zinc-500">Selecciona una cuenta para ver sus movimientos.</p>
                    </div>
                </div>

            </main>

            {/* Modal Nueva Cuenta */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                    <div className="bg-[#18181b] w-full max-w-md border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                        <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-base font-semibold text-white">Nueva cuenta</h2>
                                <p className="text-xs text-zinc-500">Organiza tus finanzas por cuentas separadas</p>
                            </div>
                            <button onClick={() => setModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <form id="account-form" onSubmit={handleCrear} className="space-y-5">
                                {/* Icon Picker & Name */}
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowIconPicker(!showIconPicker)}
                                                className="w-10 h-10 rounded-lg bg-[#27272a] hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-lg transition-colors focus:ring-1 focus:ring-[#D3FF0A]/50"
                                            >
                                                {selectedIcon}
                                            </button>
                                            {showIconPicker && (
                                                <div className="absolute top-12 left-0 z-20 bg-[#27272a] border border-zinc-700 p-2 rounded-lg grid grid-cols-4 gap-1 w-48 shadow-xl">
                                                    {icons.map(icon => (
                                                        <button
                                                            key={icon}
                                                            type="button"
                                                            onClick={() => { setSelectedIcon(icon); setShowIconPicker(false); }}
                                                            className="w-9 h-9 flex items-center justify-center hover:bg-zinc-600 rounded text-lg transition-colors"
                                                        >
                                                            {icon}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <Label className="text-xs text-zinc-400 font-medium">Nombre de la cuenta</Label>
                                            <Input
                                                name="name"
                                                placeholder="Ej. Efectivo, Banco BCP"
                                                className="bg-[#27272a] border-transparent text-zinc-200 placeholder:text-zinc-600 focus:ring-1 focus:ring-[#D3FF0A]/50"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Init Balance */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-400 font-medium">Balance inicial</Label>
                                    <div className="relative">
                                        <Input
                                            name="initialBalance"
                                            type="number"
                                            step="0.01"
                                            defaultValue="0.00"
                                            className="bg-[#27272a] border-transparent text-zinc-200 placeholder:text-zinc-600 focus:ring-1 focus:ring-[#D3FF0A]/50 pr-12 font-mono"
                                            required
                                        />
                                        <div className="absolute right-3 top-2.5 text-xs text-zinc-500 font-medium">PEN</div>
                                    </div>
                                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                                        <input type="checkbox" name="createTransaction" defaultChecked className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-[#D3FF0A] focus:ring-[#D3FF0A]/30" />
                                        <span className="text-xs text-zinc-500">Crear transacción del saldo inicial</span>
                                    </label>
                                </div>

                                {/* Currency */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-400 font-medium">Moneda</Label>
                                    <select
                                        name="currency"
                                        className="w-full bg-[#27272a] border-transparent rounded-md py-2 px-3 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#D3FF0A]/50 appearance-none"
                                    >
                                        <option value="PEN">S/ Sol Peruano</option>
                                        <option value="USD">$ Dólar Americano</option>
                                        <option value="EUR">€ Euro</option>
                                    </select>
                                </div>

                                {/* Optional Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-zinc-400 font-medium">Número (Opcional)</Label>
                                        <Input
                                            name="accountNumber"
                                            placeholder="**** 1234"
                                            className="bg-[#27272a] border-transparent text-zinc-200 placeholder:text-zinc-600 focus:ring-1 focus:ring-[#D3FF0A]/50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-zinc-400 font-medium">Tipo (Opcional)</Label>
                                        <Input
                                            name="type"
                                            placeholder="Ej. Débito"
                                            className="bg-[#27272a] border-transparent text-zinc-200 placeholder:text-zinc-600 focus:ring-1 focus:ring-[#D3FF0A]/50"
                                        />
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="p-5 border-t border-zinc-800/50 flex justify-end gap-3 bg-[#18181b]">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setModal(false)}
                                className="text-zinc-500 hover:text-white hover:bg-zinc-800 text-xs h-9"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                form="account-form"
                                className="bg-[#D3FF0A] text-black hover:bg-[#c5f000] font-semibold text-xs h-9 px-6"
                            >
                                Crear cuenta
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

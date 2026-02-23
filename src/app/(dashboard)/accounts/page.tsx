"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    Wallet,
    Trash2,
    X,
    CreditCard,
    ChevronDown,
    ImageIcon,
    Smile,
    MoreVertical,
    Star,
    Pencil,
    ArrowRightLeft,
    RefreshCw,
} from "lucide-react";
import {
    listarCuentas,
    crearCuenta,
    eliminarCuenta,
    editarCuenta,
    marcarCuentaFavorita,
    obtenerHistorialCuenta,
} from "@/lib/actions/accounts";
import { crearTransferenciaEntreCuentas } from "@/lib/actions/transactions";
import { useToast } from "@/components/ui/toast";
import { currencies } from "@/lib/currencies";

type AccountItem = {
    id: string;
    name: string;
    currency: string;
    initialBalance: number;
    currentBalance: number;
    balance: number;
    createdAt?: string;
    icon?: string | null;
    type?: string | null;
    accountNumber?: string | null;
    isFavorite?: boolean;
    favoriteRank?: number | null;
};

type HistoryItem = {
    id: string;
    date: string | Date;
    description: string;
    amountOriginal: number;
    type: "income" | "expense" | string;
    source: string;
    account?: { id?: string; name?: string; currency?: string } | null;
    category?: { id?: string; name?: string; icon?: string | null } | null;
};

type AccountFormState = {
    name: string;
    type: string;
    accountNumber: string;
    initialBalance: string;
    currentBalance: string;
    currency: string;
    icon: string;
    createTransaction: boolean;
};

type TransferFormState = {
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    date: string;
    description: string;
};

const bancosPeru = [
    { id: "bcp", nombre: "BCP", color: "bg-blue-700" },
    { id: "bbva", nombre: "BBVA", color: "bg-blue-900" },
    { id: "interbank", nombre: "Interbank", color: "bg-lime-600" },
    { id: "scotiabank", nombre: "Scotiabank", color: "bg-red-600" },
    { id: "banbif", nombre: "BanBif", color: "bg-emerald-600" },
    { id: "pichincha", nombre: "Pichincha", color: "bg-yellow-500" },
    { id: "falabella", nombre: "Falabella", color: "bg-green-600" },
    { id: "ripley", nombre: "Banco Ripley", color: "bg-purple-600" },
    { id: "cencosud", nombre: "Cencosud", color: "bg-indigo-600" },
    { id: "mi-banco", nombre: "Mibanco", color: "bg-orange-600" },
    { id: "crediscotia", nombre: "CrediScotia", color: "bg-red-700" },
    { id: "bn", nombre: "Banco de la Nación", color: "bg-slate-600" },
];

const bancosInternacionales = [
    { id: "chase", nombre: "Chase", color: "bg-blue-700" },
    { id: "boa", nombre: "Bank of America", color: "bg-red-700" },
    { id: "wells", nombre: "Wells Fargo", color: "bg-red-800" },
    { id: "citi", nombre: "Citi", color: "bg-blue-600" },
    { id: "hsbc", nombre: "HSBC", color: "bg-red-600" },
    { id: "santander", nombre: "Santander", color: "bg-red-500" },
    { id: "itau", nombre: "Itaú", color: "bg-orange-600" },
    { id: "bradesco", nombre: "Bradesco", color: "bg-rose-700" },
    { id: "nubank", nombre: "Nubank", color: "bg-violet-700" },
    { id: "revolut", nombre: "Revolut", color: "bg-zinc-800" },
    { id: "wise", nombre: "Wise", color: "bg-emerald-600" },
    { id: "paypal", nombre: "PayPal", color: "bg-sky-700" },
];

const emojis = ["💰", "💳", "🏦", "💵", "🪙", "📱", "🏠", "🚗", "🎓", "✈️", "🛒", "💊", "🍔", "🎮", "🎬", "🧾", "🚌", "⛽", "🛍️", "📈"];

const emptyAccountForm: AccountFormState = {
    name: "",
    type: "cash",
    accountNumber: "",
    initialBalance: "0.00",
    currentBalance: "0.00",
    currency: "PEN",
    icon: "💰",
    createTransaction: false,
};

export default function AccountsPage() {
    const { status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [cuentas, setCuentas] = useState<AccountItem[]>([]);
    const [historial, setHistorial] = useState<HistoryItem[]>([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");

    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openTransfer, setOpenTransfer] = useState(false);

    const [createForm, setCreateForm] = useState<AccountFormState>(emptyAccountForm);
    const [editForm, setEditForm] = useState<AccountFormState>(emptyAccountForm);
    const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);

    const [transferForm, setTransferForm] = useState<TransferFormState>({
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        description: "",
    });

    const [showIconPicker, setShowIconPicker] = useState(false);
    const [iconTab, setIconTab] = useState<"icons" | "emojis">("icons");
    const [iconSearch, setIconSearch] = useState("");
    const [iconTarget, setIconTarget] = useState<"create" | "edit">("create");

    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [currencySearch, setCurrencySearch] = useState("");
    const [currencyTarget, setCurrencyTarget] = useState<"create" | "edit">("create");

    const cargarCuentas = useCallback(async () => {
        setCargando(true);
        try {
            const res = await listarCuentas();
            const list = (res.cuentas as AccountItem[]) || [];
            setCuentas(list);
            return list;
        } catch {
            toast({ title: "Error", description: "No se pudieron cargar las cuentas", variant: "error" });
            return [] as AccountItem[];
        } finally {
            setCargando(false);
        }
    }, [toast]);

    const cargarHistorial = useCallback(async (accountId: string) => {
        if (!accountId) return;
        setCargandoHistorial(true);
        try {
            const res = await obtenerHistorialCuenta(accountId, { page: 1, pageSize: 20 });
            setHistorial((res.transacciones as HistoryItem[]) || []);
        } catch {
            toast({ title: "Error", description: "No se pudo cargar el historial", variant: "error" });
        } finally {
            setCargandoHistorial(false);
        }
    }, [toast]);

    useEffect(() => {
        if (status === "authenticated") {
            void cargarCuentas();
        }
    }, [status, cargarCuentas]);

    useEffect(() => {
        if (!selectedAccountId && cuentas.length > 0) {
            setSelectedAccountId(cuentas[0].id);
        }
    }, [cuentas, selectedAccountId]);

    useEffect(() => {
        if (selectedAccountId) void cargarHistorial(selectedAccountId);
    }, [selectedAccountId, cargarHistorial]);

    if (status === "loading") return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500">Cargando...</div>;
    if (status === "unauthenticated") { router.push("/login"); return null; }

    const filteredAccounts = cuentas.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const selectedAccount = cuentas.find((c) => c.id === selectedAccountId) ?? null;

    const updateFormByTarget = (target: "create" | "edit", updater: (prev: AccountFormState) => AccountFormState) => {
        if (target === "create") setCreateForm(updater);
        else setEditForm(updater);
    };

    const bankList = [...bancosPeru, ...bancosInternacionales];

    const getBankByIcon = (iconValue?: string | null) => {
        if (!iconValue?.startsWith("bank:")) return null;
        const id = iconValue.replace("bank:", "");
        return bankList.find((b) => b.id === id) ?? null;
    };

    const getIconPreviewLabel = (iconValue: string) => {
        const bank = getBankByIcon(iconValue);
        if (bank) return bank.nombre.slice(0, 2).toUpperCase();
        return iconValue || "💰";
    };

    const renderIcon = (iconValue?: string | null, className = "w-10 h-10") => {
        const bank = getBankByIcon(iconValue);
        if (bank) {
            const initials = bank.nombre.slice(0, 2).toUpperCase();
            return <div className={`${className} rounded-md border border-zinc-700 ${bank.color} flex items-center justify-center text-[10px] font-bold text-white`}>{initials}</div>;
        }
        return <div className={`${className} rounded-md border border-zinc-800 bg-zinc-900 flex items-center justify-center text-lg`}>{iconValue || "💰"}</div>;
    };

    const filteredPeruBanks = bancosPeru.filter((b) => b.nombre.toLowerCase().includes(iconSearch.toLowerCase()));
    const filteredIntlBanks = bancosInternacionales.filter((b) => b.nombre.toLowerCase().includes(iconSearch.toLowerCase()));
    const filteredEmojis = emojis.filter((e) => e.includes(iconSearch.trim()) || iconSearch.trim().length === 0);

    const filteredCurrencies = currencies.filter((c) => {
        const term = currencySearch.trim().toLowerCase();
        if (!term) return true;
        return c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term);
    });

    const formatMoney = (amount: number, currency: string) =>
        new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(Number(amount || 0));

    const fallbackSaldoInicial = selectedAccount
        ? {
            fecha: selectedAccount.createdAt ? new Date(selectedAccount.createdAt) : new Date(),
            descripcion: "Balance inicial",
            monto: Number(selectedAccount.initialBalance || 0),
            categoria: "Saldo inicial",
            cuenta: selectedAccount.name,
            origen: "Saldo inicial",
        }
        : null;

    const openCreateModal = () => {
        setCreateForm(emptyAccountForm);
        setOpenCreate(true);
        setShowIconPicker(false);
        setShowCurrencyPicker(false);
    };

    const handleCrearCuenta = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData();
        formData.set("name", createForm.name);
        formData.set("type", createForm.type);
        formData.set("icon", createForm.icon);
        formData.set("accountNumber", createForm.accountNumber);
        formData.set("currency", createForm.currency);
        formData.set("initialBalance", createForm.initialBalance || "0");
        if (createForm.createTransaction) formData.set("createTransaction", "on");

        const result = await crearCuenta(formData);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
            return;
        }

        toast({ title: "Éxito", description: "Cuenta creada correctamente.", variant: "success" });
        setOpenCreate(false);
        const list = await cargarCuentas();
        if (list.length > 0 && !selectedAccountId) setSelectedAccountId(list[0].id);
    };

    const openEditModal = (account: AccountItem) => {
        setEditingAccount(account);
        setEditForm({
            name: account.name,
            type: account.type || "cash",
            icon: account.icon || "💰",
            accountNumber: account.accountNumber || "",
            currency: account.currency || "PEN",
            initialBalance: String(account.initialBalance ?? 0),
            currentBalance: String(account.currentBalance ?? 0),
            createTransaction: false,
        });
        setOpenEdit(true);
        setShowIconPicker(false);
        setShowCurrencyPicker(false);
    };

    const handleEditarCuenta = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingAccount) return;

        const formData = new FormData();
        formData.set("name", editForm.name);
        formData.set("type", editForm.type);
        formData.set("icon", editForm.icon);
        formData.set("accountNumber", editForm.accountNumber);
        formData.set("currency", editForm.currency);
        formData.set("currentBalance", editForm.currentBalance || "0");

        const result = await editarCuenta(editingAccount.id, formData);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
            return;
        }

        toast({ title: "Éxito", description: "Cuenta actualizada.", variant: "success" });
        setOpenEdit(false);
        await cargarCuentas();
    };

    const handleEliminarCuenta = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar esta cuenta?")) return;
        const result = await eliminarCuenta(id);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
            return;
        }

        toast({ title: "Eliminada", description: "Cuenta eliminada correctamente.", variant: "success" });
        const list = await cargarCuentas();
        if (selectedAccountId === id) {
            setSelectedAccountId(list[0]?.id || "");
            setHistorial([]);
        }
    };

    const handleToggleFavorito = async (account: AccountItem) => {
        const result = await marcarCuentaFavorita(account.id, !account.isFavorite);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
            return;
        }
        await cargarCuentas();
    };

    const openTransferModal = (account: AccountItem) => {
        setTransferForm({
            fromAccountId: account.id,
            toAccountId: "",
            amount: "",
            date: new Date().toISOString().slice(0, 10),
            description: "",
        });
        setOpenTransfer(true);
    };

    const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("fromAccountId", transferForm.fromAccountId);
        fd.set("toAccountId", transferForm.toAccountId);
        fd.set("amount", transferForm.amount);
        fd.set("date", transferForm.date);
        fd.set("description", transferForm.description);

        const result = await crearTransferenciaEntreCuentas(fd);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
            return;
        }

        toast({ title: "Transferencia creada", description: "La transferencia se registró correctamente.", variant: "success" });
        setOpenTransfer(false);
        await cargarCuentas();
        if (selectedAccountId) await cargarHistorial(selectedAccountId);
    };

    const handleRebalancear = () => {
        toast({ title: "Próximamente", description: "La opción de rebalanceo estará disponible en una próxima versión.", variant: "success" });
    };

    const renderAccountActions = (account: AccountItem) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-100">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#18181b] border-zinc-800 text-zinc-200 w-56">
                <DropdownMenuItem onClick={() => void handleToggleFavorito(account)} className="cursor-pointer text-sm">
                    <Star className={`w-4 h-4 mr-2 ${account.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-zinc-300"}`} /> {account.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openEditModal(account)} className="cursor-pointer text-sm">
                    <Pencil className="w-4 h-4 mr-2" /> Editar cuenta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openTransferModal(account)} className="cursor-pointer text-sm">
                    <ArrowRightLeft className="w-4 h-4 mr-2" /> Transferir desde esta cuenta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRebalancear} className="cursor-pointer text-sm">
                    <RefreshCw className="w-4 h-4 mr-2" /> Rebalancear
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleEliminarCuenta(account.id)} className="cursor-pointer text-sm text-rose-500 focus:text-rose-500">
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar cuenta
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const renderPickers = (target: "create" | "edit") => (
        <>
            <div className="space-y-1">
                <Label className="text-[11px] text-zinc-300">Ícono</Label>
                <div className="relative">
                    <div className="flex items-center gap-2 rounded border border-zinc-600 bg-zinc-700/40 px-2 h-10">
                        <Input
                            value={iconSearch}
                            onChange={(e) => setIconSearch(e.target.value)}
                            placeholder="Buscar ícono o emoji..."
                            className="h-8 border-0 bg-transparent p-0 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0"
                        />
                        <button type="button" onClick={() => { setIconTarget(target); setShowIconPicker((v) => !v); }} className="h-8 min-w-14 rounded border border-zinc-600 bg-zinc-700/60 px-2 text-sm text-zinc-200 flex items-center justify-center gap-1">
                            <span>{getIconPreviewLabel(target === "create" ? createForm.icon : editForm.icon)}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    {showIconPicker && iconTarget === target && (
                        <div className="absolute top-12 left-0 z-40 w-full rounded-md border border-zinc-700 bg-[#1f2023] shadow-2xl overflow-hidden">
                            <div className="grid grid-cols-2 gap-2 p-2 border-b border-zinc-700">
                                <button type="button" onClick={() => setIconTab("icons")} className={`h-9 rounded text-sm font-medium flex items-center justify-center gap-2 ${iconTab === "icons" ? "bg-zinc-900 text-[#D3FF0A]" : "bg-zinc-800/50 text-zinc-400"}`}>
                                    <ImageIcon className="w-4 h-4" /> Iconos
                                </button>
                                <button type="button" onClick={() => setIconTab("emojis")} className={`h-9 rounded text-sm font-medium flex items-center justify-center gap-2 ${iconTab === "emojis" ? "bg-zinc-900 text-[#D3FF0A]" : "bg-zinc-800/50 text-zinc-400"}`}>
                                    <Smile className="w-4 h-4" /> Emojis
                                </button>
                            </div>

                            <div className="max-h-72 overflow-y-auto p-3">
                                {iconTab === "icons" ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-zinc-400 mb-2">Bancos del Perú</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {filteredPeruBanks.map((bank) => (
                                                    <button key={bank.id} type="button" onClick={() => { updateFormByTarget(target, (prev) => ({ ...prev, icon: `bank:${bank.id}` })); setShowIconPicker(false); }} className={`h-10 rounded border border-zinc-700 ${bank.color} text-[11px] font-semibold text-white`}>
                                                        {bank.nombre.slice(0, 2).toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-400 mb-2">Bancos internacionales</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {filteredIntlBanks.map((bank) => (
                                                    <button key={bank.id} type="button" onClick={() => { updateFormByTarget(target, (prev) => ({ ...prev, icon: `bank:${bank.id}` })); setShowIconPicker(false); }} className={`h-10 rounded border border-zinc-700 ${bank.color} text-[11px] font-semibold text-white`}>
                                                        {bank.nombre.slice(0, 2).toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-6 gap-2">
                                        {filteredEmojis.map((emoji) => (
                                            <button key={emoji} type="button" onClick={() => { updateFormByTarget(target, (prev) => ({ ...prev, icon: emoji })); setShowIconPicker(false); }} className="h-9 rounded border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700 text-lg">
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-1">
                <Label className="text-[11px] text-zinc-300">Moneda</Label>
                <div className="relative">
                    <button type="button" onClick={() => { setCurrencyTarget(target); setShowCurrencyPicker((v) => !v); }} className="h-10 w-full rounded-md border border-lime-500/80 bg-zinc-700/50 px-3 text-sm text-zinc-100 flex items-center justify-between">
                        <span className="font-medium">{target === "create" ? createForm.currency : editForm.currency}</span>
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                    </button>

                    {showCurrencyPicker && currencyTarget === target && (
                        <div className="absolute top-11 left-0 z-40 w-full rounded-md border border-zinc-700 bg-[#1f2023] shadow-2xl overflow-hidden">
                            <div className="p-3 border-b border-zinc-700">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-zinc-500 absolute left-2.5 top-2.5" />
                                    <Input value={currencySearch} onChange={(e) => setCurrencySearch(e.target.value)} placeholder="Buscar moneda por código o nombre..." className="h-9 pl-8 border-zinc-700 bg-zinc-800/60 text-zinc-200 placeholder:text-zinc-500" />
                                </div>
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {filteredCurrencies.map((currency) => (
                                    <button key={currency.code} type="button" onClick={() => {
                                        if (target === "create") setCreateForm((prev) => ({ ...prev, currency: currency.code }));
                                        else setEditForm((prev) => ({ ...prev, currency: currency.code }));
                                        setShowCurrencyPicker(false);
                                    }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-zinc-800/80">
                                        <span className="text-zinc-100 min-w-14">{currency.code}</span>
                                        <span className="text-zinc-400 truncate">- {currency.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-[#D3FF0A]/20">
            <header className="flex h-14 items-center px-6 border-b border-zinc-800/40 sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-40">
                <div className="flex items-center gap-2 text-zinc-400"><Wallet className="w-4 h-4" /><span className="text-sm font-medium text-zinc-200">Cuentas</span></div>
            </header>

            <main className="p-6 space-y-7 max-w-[1920px] mx-auto">
                <section className="rounded-xl border border-zinc-800/70 bg-[#111114]">
                    <div className="flex items-center justify-end gap-2 p-4 border-b border-zinc-800/60">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar cuentas..." className="h-8 w-full rounded-md border border-zinc-800 bg-zinc-900/60 pl-8 pr-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700" />
                        </div>
                        <Button variant="outline" size="sm" className="h-8 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs">GasTag</Button>
                        <Button onClick={openCreateModal} className="h-8 px-3 text-xs font-semibold bg-[#D3FF0A] text-black hover:bg-[#b8e600]">Nueva cuenta</Button>
                    </div>

                    {cargando ? (
                        <div className="p-6 space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 rounded-md bg-zinc-900/60 animate-pulse" />)}</div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center"><CreditCard className="w-5 h-5 text-zinc-600" /></div>
                            <h2 className="text-2xl font-semibold text-zinc-100">Aún no tienes cuentas</h2>
                            <p className="mt-1 text-sm text-zinc-500">Crea tu primera cuenta para empezar a registrar tus movimientos</p>
                            <div className="mt-8 border-t border-zinc-800/60 pt-6"><Button onClick={openCreateModal} className="h-9 px-6 text-xs font-semibold bg-[#D3FF0A] text-black hover:bg-[#b8e600]"><Plus className="w-3.5 h-3.5 mr-2" />Crear cuenta</Button></div>
                        </div>
                    ) : (
                        <div className="space-y-3 p-3">
                            {filteredAccounts.map((account) => (
                                <div key={account.id} onClick={() => setSelectedAccountId(account.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedAccountId(account.id); }} className={`w-full rounded-xl border p-4 text-left transition-colors cursor-pointer ${selectedAccountId === account.id ? "border-lime-500" : "border-zinc-800 hover:border-zinc-700"}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {renderIcon(account.icon, "w-9 h-9")}
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-zinc-100 truncate">{account.name}</p>
                                                <p className="text-xs text-zinc-500 truncate">{account.type || "Cuenta"}: {account.accountNumber || "-"}</p>
                                            </div>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()}>{renderAccountActions(account)}</div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-3">
                                        <span className="text-2xl font-semibold text-emerald-400">{formatMoney(account.currentBalance, account.currency)}</span>
                                        <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">Balance inicial</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="text-[22px] leading-none font-semibold text-zinc-100">Historial de cuentas</h2>
                    <div className="rounded-xl border border-zinc-800/70 bg-[#111114] overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-zinc-800/60 text-zinc-500">
                                    <th className="py-3 px-4 font-medium">Fecha</th>
                                    <th className="py-3 px-4 font-medium">Descripción</th>
                                    <th className="py-3 px-4 font-medium">Monto</th>
                                    <th className="py-3 px-4 font-medium">Categoría</th>
                                    <th className="py-3 px-4 font-medium">Cuenta</th>
                                    <th className="py-3 px-4 font-medium">Origen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!selectedAccount ? (
                                    <tr><td colSpan={6} className="py-10 text-center text-zinc-500">Selecciona una cuenta para ver sus últimas transacciones</td></tr>
                                ) : cargandoHistorial ? (
                                    <tr><td colSpan={6} className="py-10 text-center text-zinc-500">Cargando historial...</td></tr>
                                ) : historial.length === 0 ? (
                                    fallbackSaldoInicial && fallbackSaldoInicial.monto > 0 ? (
                                        <tr className="border-b border-zinc-900/70 last:border-0">
                                            <td className="py-3 px-4 text-zinc-400">{fallbackSaldoInicial.fecha.toLocaleDateString("es-PE", { month: "short", day: "numeric" })}</td>
                                            <td className="py-3 px-4 text-zinc-300">{fallbackSaldoInicial.descripcion}</td>
                                            <td className="py-3 px-4 font-medium text-emerald-400">{formatMoney(fallbackSaldoInicial.monto, selectedAccount.currency)}</td>
                                            <td className="py-3 px-4 text-zinc-400">{fallbackSaldoInicial.categoria}</td>
                                            <td className="py-3 px-4 text-zinc-400">{fallbackSaldoInicial.cuenta}</td>
                                            <td className="py-3 px-4 text-zinc-500">{fallbackSaldoInicial.origen}</td>
                                        </tr>
                                    ) : (
                                        <tr><td colSpan={6} className="py-10 text-center text-zinc-500">Esta cuenta aún no tiene movimientos</td></tr>
                                    )
                                ) : historial.map((tx) => (
                                    <tr key={tx.id} className="border-b border-zinc-900/70 last:border-0">
                                        <td className="py-3 px-4 text-zinc-400">{new Date(tx.date).toLocaleDateString("es-PE", { month: "short", day: "numeric" })}</td>
                                        <td className="py-3 px-4 text-zinc-300">{tx.description}</td>
                                        <td className={`py-3 px-4 font-medium ${tx.type === "income" ? "text-emerald-400" : "text-zinc-200"}`}>{formatMoney(tx.amountOriginal, tx.account?.currency || selectedAccount.currency)}</td>
                                        <td className="py-3 px-4 text-zinc-400">{tx.category?.name || "Sin categoría"}</td>
                                        <td className="py-3 px-4 text-zinc-400">{tx.account?.name || selectedAccount.name}</td>
                                        <td className="py-3 px-4 text-zinc-500">{tx.source === "initial_balance" ? "Saldo inicial" : tx.source === "transfer" ? "Transferencia" : "Web"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {openCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[1px] px-4">
                    <div className="w-full max-w-[520px] rounded-md border border-zinc-600 bg-[#2a2b2f] shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-zinc-600/70 flex items-start justify-between">
                            <div><h2 className="text-base font-semibold text-zinc-100">Nueva cuenta</h2><p className="text-xs text-zinc-400">Crea una nueva cuenta para organizar tus transacciones</p></div>
                            <button onClick={() => setOpenCreate(false)} className="text-zinc-400 hover:text-zinc-200"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleCrearCuenta} className="p-4 space-y-3.5">
                            {renderPickers("create")}
                            <div className="space-y-1"><Label className="text-[11px] text-zinc-300">Nombre de la cuenta</Label><Input value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} className="h-9 border border-zinc-600 bg-zinc-700/40 text-zinc-100" required /></div>
                            <div className="space-y-1"><Label className="text-[11px] text-zinc-300">Balance inicial</Label><Input value={createForm.initialBalance} onChange={(e) => setCreateForm((p) => ({ ...p, initialBalance: e.target.value }))} type="number" step="0.01" className="h-9 border border-zinc-600 bg-zinc-700/40 text-zinc-100" required /></div>
                            <div className="space-y-1"><Label className="text-[11px] text-zinc-300">Número de cuenta (opcional)</Label><Input value={createForm.accountNumber} onChange={(e) => setCreateForm((p) => ({ ...p, accountNumber: e.target.value }))} className="h-9 border border-zinc-600 bg-zinc-700/40 text-zinc-100" /></div>
                            <div className="space-y-1"><Label className="text-[11px] text-zinc-300">Tipo de cuenta (opcional)</Label><Input value={createForm.type} onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))} className="h-9 border border-zinc-600 bg-zinc-700/40 text-zinc-100" /></div>
                            <div className="space-y-1.5"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={createForm.createTransaction} onChange={(e) => setCreateForm((p) => ({ ...p, createTransaction: e.target.checked }))} className="w-3.5 h-3.5" /><span className="text-xs text-zinc-300">Crear transacción del saldo inicial</span></label><p className="text-[11px] text-zinc-500 pl-5">Se creará automáticamente una transacción de ingreso con el monto del saldo inicial.</p></div>
                            <div className="pt-2 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpenCreate(false)} className="h-8 px-3 text-xs">Cancelar</Button><Button type="submit" className="h-8 px-4 text-xs font-semibold bg-[#b6e117] text-black hover:bg-[#c5f000]">Crear cuenta</Button></div>
                        </form>
                    </div>
                </div>
            )}

            {openEdit && editingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[1px] px-4">
                    <div className="w-full max-w-[520px] rounded-md border border-zinc-600 bg-[#2a2b2f] shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-zinc-600/70 flex items-start justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-zinc-100">Editar cuenta</h2>
                                <p className="text-xs text-zinc-400">Modifica los detalles de tu cuenta</p>
                            </div>
                            <button onClick={() => setOpenEdit(false)} className="text-zinc-400 hover:text-zinc-200"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleEditarCuenta} className="p-4 space-y-3.5">
                            {renderPickers("edit")}
                            <div className="space-y-1">
                                <Label className="text-[11px] text-zinc-300">Nombre de la cuenta</Label>
                                <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="h-9 border border-zinc-600 bg-zinc-700/40 text-zinc-100" required />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-zinc-300">Balance</Label>
                                <Input type="number" step="0.01" value={editForm.currentBalance} onChange={(e) => setEditForm((p) => ({ ...p, currentBalance: e.target.value }))} className="h-9 border border-zinc-600 bg-zinc-700/40 text-zinc-100" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-zinc-300">Número de cuenta</Label>
                                <Input value={editForm.accountNumber} onChange={(e) => setEditForm((p) => ({ ...p, accountNumber: e.target.value }))} className="h-9 border border-zinc-600 bg-zinc-700/40 text-zinc-100" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-zinc-300">Tipo de cuenta</Label>
                                <Input value={editForm.type} onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))} className="h-9 border border-zinc-600 bg-zinc-700/40 text-zinc-100" />
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setOpenEdit(false)} className="h-8 px-3 text-xs">Cancelar</Button>
                                <Button type="submit" className="h-8 px-4 text-xs font-semibold bg-[#b6e117] text-black hover:bg-[#c5f000]">Guardar cambios</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {openTransfer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[1px] px-4">
                    <div className="w-full max-w-[520px] rounded-md border border-zinc-600 bg-[#2a2b2f] shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-zinc-600/70 flex items-start justify-between">
                            <div><h2 className="text-base font-semibold text-zinc-100">Transferir desde esta cuenta</h2><p className="text-xs text-zinc-400">Se crearán 2 transacciones enlazadas automáticamente</p></div>
                            <button onClick={() => setOpenTransfer(false)} className="text-zinc-400 hover:text-zinc-200"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleTransfer} className="p-4 space-y-3.5">
                            <div className="space-y-1"><Label className="text-[11px] text-zinc-300">Cuenta origen</Label><select value={transferForm.fromAccountId} onChange={(e) => setTransferForm((p) => ({ ...p, fromAccountId: e.target.value }))} className="h-9 w-full rounded border border-zinc-600 bg-zinc-700/40 px-2 text-sm text-zinc-200">{cuentas.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select></div>
                            <div className="space-y-1"><Label className="text-[11px] text-zinc-300">Cuenta destino</Label><select value={transferForm.toAccountId} onChange={(e) => setTransferForm((p) => ({ ...p, toAccountId: e.target.value }))} className="h-9 w-full rounded border border-zinc-600 bg-zinc-700/40 px-2 text-sm text-zinc-200" required><option value="">Selecciona cuenta destino</option>{cuentas.filter((a) => a.id !== transferForm.fromAccountId).map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select></div>
                            <div className="space-y-1"><Label className="text-[11px] text-zinc-300">Monto</Label><Input type="number" step="0.01" value={transferForm.amount} onChange={(e) => setTransferForm((p) => ({ ...p, amount: e.target.value }))} className="h-9 border border-zinc-600 bg-zinc-700/40 text-zinc-100" required /></div>
                            <div className="space-y-1"><Label className="text-[11px] text-zinc-300">Fecha</Label><Input type="date" value={transferForm.date} onChange={(e) => setTransferForm((p) => ({ ...p, date: e.target.value }))} className="h-9 border border-zinc-600 bg-zinc-700/40 text-zinc-100" required /></div>
                            <div className="space-y-1"><Label className="text-[11px] text-zinc-300">Descripción (opcional)</Label><Input value={transferForm.description} onChange={(e) => setTransferForm((p) => ({ ...p, description: e.target.value }))} className="h-9 border border-zinc-600 bg-zinc-700/40 text-zinc-100" /></div>
                            <div className="pt-2 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpenTransfer(false)} className="h-8 px-3 text-xs">Cancelar</Button><Button type="submit" className="h-8 px-4 text-xs font-semibold bg-[#b6e117] text-black hover:bg-[#c5f000]">Crear transferencia</Button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

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
    Copy,
    Clock,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
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
    const [totalHistorial, setTotalHistorial] = useState(0);
    const [historialPage, setHistorialPage] = useState(1);
    const [historialTotalPages, setHistorialTotalPages] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

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

    const cargarHistorial = useCallback(async (accountIds: string[], page = 1) => {
        if (accountIds.length === 0) {
            setHistorial([]);
            setTotalHistorial(0);
            setHistorialTotalPages(1);
            return;
        }
        setCargandoHistorial(true);
        try {
            const allTx: HistoryItem[] = [];
            for (const id of accountIds) {
                const res = await obtenerHistorialCuenta(id, { page, pageSize: 50 });
                const txs = (res.transacciones as HistoryItem[]) || [];
                allTx.push(...txs);
            }
            // Sort by date descending
            allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const pageSize = 20;
            const total = allTx.length;
            const pages = Math.max(1, Math.ceil(total / pageSize));
            const start = (page - 1) * pageSize;
            setHistorial(allTx.slice(start, start + pageSize));
            setTotalHistorial(total);
            setHistorialTotalPages(pages);
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
        void cargarHistorial(selectedAccountIds, historialPage);
    }, [selectedAccountIds, historialPage, cargarHistorial]);

    const toggleAccountSelection = (accountId: string) => {
        setSelectedAccountIds(prev => {
            if (prev.includes(accountId)) {
                return prev.filter(id => id !== accountId);
            }
            return [...prev, accountId];
        });
        setHistorialPage(1);
    };

    const getCurrencyFlag = (code: string) => {
        const c = currencies.find(cur => cur.code === code);
        return c?.flag || "💰";
    };

    const copyToClipboard = (text: string) => {
        void navigator.clipboard.writeText(text);
        toast({ title: "Copiado", description: "Número copiado al portapapeles", variant: "success" });
    };

    if (status === "loading") return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500">Cargando...</div>;
    if (status === "unauthenticated") { router.push("/login"); return null; }

    const filteredAccounts = cuentas.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

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

    const selectedAccounts = cuentas.filter(c => selectedAccountIds.includes(c.id));

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
        if (list.length > 0 && selectedAccountIds.length === 0) setSelectedAccountIds(list.map(c => c.id));
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
        setSelectedAccountIds(prev => prev.filter(aid => aid !== id));
        if (list.length === 0) setHistorial([]);
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
        if (selectedAccountIds.length > 0) await cargarHistorial(selectedAccountIds, historialPage);
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
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-[140px] rounded-xl bg-zinc-900/60 animate-pulse" />)}</div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center"><CreditCard className="w-5 h-5 text-zinc-600" /></div>
                            <h2 className="text-2xl font-semibold text-zinc-100">Aún no tienes cuentas</h2>
                            <p className="mt-1 text-sm text-zinc-500">Crea tu primera cuenta para empezar a registrar tus movimientos</p>
                            <div className="mt-8 border-t border-zinc-800/60 pt-6"><Button onClick={openCreateModal} className="h-9 px-6 text-xs font-semibold bg-[#D3FF0A] text-black hover:bg-[#b8e600]"><Plus className="w-3.5 h-3.5 mr-2" />Crear cuenta</Button></div>
                        </div>
                    ) : (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAccounts.map((account) => {
                                const isSelected = selectedAccountIds.includes(account.id);
                                return (
                                    <div
                                        key={account.id}
                                        onClick={() => toggleAccountSelection(account.id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleAccountSelection(account.id); }}
                                        className={`rounded-xl border p-5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] ${isSelected
                                            ? "border-lime-500 bg-[#0d0f0a]/40 shadow-[0_0_12px_rgba(211,255,10,0.06)]"
                                            : "border-zinc-800 hover:border-zinc-600 bg-transparent"
                                            }`}
                                    >
                                        {/* Top: Icon + Name + Actions */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-lg leading-none">{getCurrencyFlag(account.currency)}</span>
                                                <p className="text-[14px] font-semibold text-zinc-100 truncate">{account.name}</p>
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()}>{renderAccountActions(account)}</div>
                                        </div>

                                        {/* Middle: Account type + number */}
                                        {account.accountNumber && (
                                            <div className="mt-3 flex items-center gap-1.5">
                                                <span className="text-xs text-zinc-500">
                                                    {account.type === "credit_card" ? "Tarjeta de crédito" : account.type === "debit_card" ? "Tarjeta de débito" : account.type === "savings" ? "Ahorro" : account.type || "Número"}: {account.accountNumber}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(account.accountNumber || ""); }}
                                                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Bottom: Balance + Badge */}
                                        <div className="mt-auto pt-3 flex items-center gap-2.5">
                                            <span className={`text-xl font-semibold ${Number(account.currentBalance) >= 0 ? "text-emerald-400" : "text-red-400"
                                                }`}>
                                                {new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(account.currentBalance))}
                                            </span>
                                            <span className="text-[9px] text-zinc-500 font-medium uppercase">{account.currency}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">Balance inicial</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ─── Historial de cuentas ─── */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4.5 h-4.5 text-zinc-400" />
                            <h2 className="text-[22px] leading-none font-semibold text-zinc-100">Historial de cuentas</h2>
                        </div>

                        {/* Filter chips */}
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {selectedAccounts.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => toggleAccountSelection(acc.id)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-xs text-zinc-300 hover:bg-zinc-700/80 hover:border-zinc-600 transition-colors group"
                                >
                                    <span className="text-[11px] leading-none">{getCurrencyFlag(acc.currency)}</span>
                                    <span className="font-medium">{acc.name}</span>
                                    <X className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800/70 bg-[#111114] overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-zinc-800/60 text-zinc-500">
                                    <th className="py-3 px-4 font-medium">Fecha ↓</th>
                                    <th className="py-3 px-4 font-medium">Descripción</th>
                                    <th className="py-3 px-4 font-medium">Monto</th>
                                    <th className="py-3 px-4 font-medium">Categoría</th>
                                    <th className="py-3 px-4 font-medium">Cuenta</th>
                                    <th className="py-3 px-4 font-medium">Origen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedAccountIds.length === 0 ? (
                                    <tr><td colSpan={6} className="py-10 text-center text-zinc-500">Selecciona una o más cuentas para ver su historial</td></tr>
                                ) : cargandoHistorial ? (
                                    <tr><td colSpan={6} className="py-10 text-center text-zinc-500 animate-pulse">Cargando historial...</td></tr>
                                ) : historial.length === 0 ? (
                                    <tr><td colSpan={6} className="py-10 text-center text-zinc-500">No hay transacciones registradas en las cuentas seleccionadas</td></tr>
                                ) : historial.map((tx) => (
                                    <tr key={tx.id} className="border-b border-zinc-900/70 last:border-0 hover:bg-zinc-900/30 transition-colors">
                                        <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">{new Date(tx.date).toLocaleDateString("es-PE", { month: "short", day: "numeric" })}</td>
                                        <td className="py-3 px-4 text-zinc-300">{tx.description}</td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className={`font-medium ${tx.type === "income" ? "text-emerald-400" : "text-zinc-200"}`}>
                                                {formatMoney(tx.amountOriginal, tx.account?.currency || "PEN")}
                                            </span>
                                            <span className="text-[9px] text-zinc-500 font-medium uppercase ml-1">{tx.account?.currency || "PEN"}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {tx.category ? (
                                                <span className="inline-flex items-center gap-1 text-zinc-400">
                                                    <span className="text-[11px]">{tx.category.icon}</span>
                                                    <span>{tx.category.name}</span>
                                                </span>
                                            ) : <span className="text-zinc-600">—</span>}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center gap-1.5 text-zinc-400">
                                                <span className="text-[11px]">{getCurrencyFlag(tx.account?.currency || "PEN")}</span>
                                                {tx.account?.name || "—"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-zinc-500">
                                                {tx.source === "initial_balance" ? <CreditCard className="w-3.5 h-3.5 inline" /> : tx.source === "transfer" ? <ArrowRightLeft className="w-3.5 h-3.5 inline" /> : <Wallet className="w-3.5 h-3.5 inline" />}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {historial.length > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/60">
                                <span className="text-[11px] text-zinc-500">{totalHistorial} transacciones</span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setHistorialPage(1)} disabled={historialPage <= 1} className="w-7 h-7 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                        <ChevronsLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setHistorialPage(p => Math.max(1, p - 1))} disabled={historialPage <= 1} className="w-7 h-7 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-[11px] text-zinc-400 px-2">Página {historialPage} de {historialTotalPages}</span>
                                    <button onClick={() => setHistorialPage(p => Math.min(historialTotalPages, p + 1))} disabled={historialPage >= historialTotalPages} className="w-7 h-7 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setHistorialPage(historialTotalPages)} disabled={historialPage >= historialTotalPages} className="w-7 h-7 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                        <ChevronsRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
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

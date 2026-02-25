"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Mail,
    Pencil,
    Check,
    MapPin,
    CalendarDays,
    Users,
    Zap,
    MousePointerClick,
    Link2,
    Copy,
    AlertTriangle,
    Trash2,
    RotateCcw,
    ArrowRight,
    ChevronDown,
    Camera,
    X,
    User,
    Shield,
    Clock,
} from "lucide-react";
import {
    obtenerPerfil,
    actualizarNombre,
    actualizarPais,
    actualizarAvatar,
    resetearDatos,
    contarDatosParaResetear,
    eliminarCuenta,
    cancelarEliminacion,
    type ResetOptions,
    type ResetCounts,
} from "@/lib/actions/profile";
import { countries, getCountryByCode } from "@/lib/countries";
import { useToast } from "@/components/ui/toast";

type ProfileData = {
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        avatar: string | null;
        country: string | null;
        createdAt: string;
        scheduledForDeletionAt: string | null;
    };
    workspace: {
        id: string;
        name: string;
        country: string;
        baseCurrency: string;
    } | null;
    referralStats: {
        referidos: number;
        actualizados: number;
        clicks: number;
    };
};

const resetItems = [
    {
        key: "transactions" as const,
        icon: Zap,
        label: "Transacciones",
        desc: "Elimina todas tus transacciones registradas",
    },
    {
        key: "accounts" as const,
        icon: Shield,
        label: "Cuentas",
        desc: "Elimina todas tus cuentas bancarias y de efectivo",
    },
    {
        key: "budgets" as const,
        icon: RotateCcw,
        label: "Presupuestos",
        desc: "Elimina todos tus presupuestos configurados",
    },
    {
        key: "customCategories" as const,
        icon: Users,
        label: "Categorías personalizadas",
        desc: "Elimina solo las categorías personalizadas que creaste",
    },
    {
        key: "settings" as const,
        icon: RotateCcw,
        label: "Configuraciones",
        desc: "Restablece tus preferencias y configuraciones",
    },
    {
        key: "recurringTransactions" as const,
        icon: Clock,
        label: "Transacciones recurrentes",
        desc: "Elimina tus gastos e ingresos recurrentes programados",
    },
];

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit name state
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState("");
    const [savingName, setSavingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Country picker
    const [countryOpen, setCountryOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");

    // Avatar upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Referral link copy
    const [copiedLink, setCopiedLink] = useState(false);

    // Reset data
    const [resetSelections, setResetSelections] = useState<ResetOptions>({
        transactions: false,
        accounts: false,
        budgets: false,
        customCategories: false,
        settings: false,
        recurringTransactions: false,
    });
    const [resetting, setResetting] = useState(false);

    // Reset confirmation modal
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetCounts, setResetCounts] = useState<ResetCounts | null>(null);
    const [loadingCounts, setLoadingCounts] = useState(false);

    // Delete account
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            const result = await obtenerPerfil();
            if ("error" in result && result.error) {
                toast({ title: "Error", description: result.error, variant: "error" });
                setLoading(false);
                return;
            }
            if ("user" in result && result.user) {
                const data: ProfileData = {
                    user: {
                        id: result.user.id,
                        name: result.user.name,
                        email: result.user.email,
                        image: result.user.image,
                        avatar: result.user.avatar,
                        country: (result.user as Record<string, unknown>).country as string | null ?? null,
                        createdAt: result.user.createdAt as string,
                        scheduledForDeletionAt: result.user.scheduledForDeletionAt as string | null ?? null,
                    },
                    workspace: result.workspace ?? null,
                    referralStats: result.referralStats,
                };
                setProfile(data);
                setNameValue(data.user.name || "");
            }
        } catch (err) {
            console.error("Error loading profile:", err);
            toast({ title: "Error", description: "Error al cargar el perfil", variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (status === "authenticated") {
            void loadProfile();
        }
    }, [status, loadProfile]);

    useEffect(() => {
        if (editingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [editingName]);

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="animate-pulse text-zinc-500">Cargando perfil...</div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    if (!session?.user || !profile) {
        return null;
    }

    const userCountryCode = profile.user.country || profile.workspace?.country || "PE";
    const userCountry = getCountryByCode(userCountryCode);
    const referralLink = typeof window !== "undefined"
        ? `${window.location.origin}/register?ref=ref_${profile.user.id.slice(0, 10)}`
        : "";

    const createdAt = new Date(profile.user.createdAt);
    const formattedDate = createdAt.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const userInitial = (profile.user.name || profile.user.email)?.charAt(0)?.toUpperCase() || "U";
    const avatarSrc = profile.user.avatar || profile.user.image;

    // ─── Handlers ──────────────────────────────────────────────────────

    const handleSaveName = async () => {
        setSavingName(true);
        const result = await actualizarNombre(nameValue);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
        } else {
            toast({ title: "Actualizado", description: "Tu nombre ha sido actualizado", variant: "success" });
            setEditingName(false);
            await loadProfile();
            window.dispatchEvent(new Event("profile-updated"));
        }
        setSavingName(false);
    };

    const handleCountryChange = async (code: string) => {
        setCountryOpen(false);
        const result = await actualizarPais(code);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
        } else {
            toast({ title: "Actualizado", description: "Tu país ha sido actualizado", variant: "success" });
            await loadProfile();
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "Error", description: "La imagen no puede exceder 2MB", variant: "error" });
            return;
        }

        setUploadingAvatar(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const dataUrl = reader.result as string;
                const result = await actualizarAvatar(dataUrl);
                if (result.error) {
                    toast({ title: "Error", description: result.error, variant: "error" });
                } else {
                    toast({ title: "Actualizado", description: "Tu foto de perfil ha sido actualizada", variant: "success" });
                    await update(); // Refresh session so Sidebar avatar updates
                    await loadProfile();
                    window.dispatchEvent(new Event("profile-updated"));
                }
                setUploadingAvatar(false);
            };
            reader.readAsDataURL(file);
        } catch {
            toast({ title: "Error", description: "Error al subir la imagen", variant: "error" });
            setUploadingAvatar(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch {
            toast({ title: "Error", description: "No se pudo copiar el enlace", variant: "error" });
        }
    };

    const selectedResetCount = Object.values(resetSelections).filter(Boolean).length;
    const allSelected = selectedResetCount === resetItems.length;

    const handleToggleAll = () => {
        const newVal = !allSelected;
        setResetSelections({
            transactions: newVal,
            accounts: newVal,
            budgets: newVal,
            customCategories: newVal,
            settings: newVal,
            recurringTransactions: newVal,
        });
    };

    const handleOpenResetModal = async () => {
        if (selectedResetCount === 0) return;
        setShowResetModal(true);
        setLoadingCounts(true);
        setResetCounts(null);
        const result = await contarDatosParaResetear(resetSelections);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
            setShowResetModal(false);
        } else {
            setResetCounts(result.counts ?? null);
        }
        setLoadingCounts(false);
    };

    const handleConfirmReset = async () => {
        setResetting(true);
        const result = await resetearDatos(resetSelections);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
        } else {
            toast({ title: "Datos eliminados", description: "Los datos seleccionados han sido eliminados", variant: "success" });
            setResetSelections({
                transactions: false,
                accounts: false,
                budgets: false,
                customCategories: false,
                settings: false,
                recurringTransactions: false,
            });
        }
        setResetting(false);
        setShowResetModal(false);
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        const result = await eliminarCuenta();
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
        } else {
            toast({ title: "Cuenta programada para eliminación", description: "Tu cuenta será eliminada en 5 días", variant: "success" });
            setShowDeleteModal(false);
            setDeleteConfirmText("");
            await loadProfile();
        }
        setDeleting(false);
    };

    const handleCancelDeletion = async () => {
        const result = await cancelarEliminacion();
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "error" });
        } else {
            toast({ title: "Cancelado", description: "La eliminación de tu cuenta ha sido cancelada", variant: "success" });
            await loadProfile();
        }
    };

    const filteredCountries = countries.filter((c) => {
        const term = countrySearch.toLowerCase().trim();
        if (!term) return true;
        return c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term);
    });

    const isDeletionScheduled = !!profile.user.scheduledForDeletionAt;

    // ─── Render ────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-[#D3FF0A]/20">
            <main className="p-6 space-y-8 max-w-3xl mx-auto pb-20">
                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Perfil</h1>
                    <p className="text-sm text-zinc-500 mt-1">Gestiona tu información personal y preferencias de cuenta.</p>
                </div>

                {/* ── Email & Avatar Section ── */}
                <section className="rounded-xl border border-zinc-800/70 bg-[#111114] p-5 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                            <Mail className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-100">Correo electrónico</h2>
                            <p className="text-xs text-zinc-500">Tu correo electrónico es necesario para iniciar sesión y recibir notificaciones importantes.</p>
                        </div>
                    </div>

                    {/* Animated certified banner */}
                    <div className="overflow-hidden rounded-lg border border-lime-500/20 bg-lime-500/5 py-1.5">
                        <div className="animate-marquee whitespace-nowrap text-[10px] font-bold tracking-[0.25em] text-lime-400/80 uppercase">
                            BILLETO CERTIFIED • BILLETO CERTIFIED • BILLETO CERTIFIED • BILLETO CERTIFIED • BILLETO CERTIFIED • BILLETO CERTIFIED • BILLETO CERTIFIED • BILLETO CERTIFIED •
                        </div>
                    </div>

                    {/* Avatar + Email */}
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="h-14 w-14 rounded-full border-2 border-lime-500/30 bg-zinc-800 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(163,230,53,0.15)]">
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover rounded-full" />
                                ) : (
                                    <span className="text-xl font-bold text-lime-400">{userInitial}</span>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            >
                                <Camera className="h-4 w-4 text-white" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                        </div>
                        <span className="text-sm text-blue-400 font-medium">{profile.user.email}</span>
                    </div>
                </section>

                {/* ── Name Section ── */}
                <section className="rounded-xl border border-zinc-800/70 bg-[#111114] p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                            <Pencil className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-100">Tu nombre</h2>
                            <p className="text-xs text-zinc-500">Lo usaremos para saber como decirte!</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        {editingName ? (
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    ref={nameInputRef}
                                    value={nameValue}
                                    onChange={(e) => setNameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") void handleSaveName();
                                        if (e.key === "Escape") {
                                            setEditingName(false);
                                            setNameValue(profile.user.name || "");
                                        }
                                    }}
                                    className="h-9 flex-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-zinc-100 focus:outline-none focus:border-lime-500/50"
                                    maxLength={50}
                                />
                                <button
                                    onClick={() => void handleSaveName()}
                                    disabled={savingName}
                                    className="h-9 px-4 rounded-md bg-lime-500/10 text-lime-400 text-xs font-medium hover:bg-lime-500/20 transition-colors flex items-center gap-1.5"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    {savingName ? "Guardando..." : "Guardar"}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingName(false);
                                        setNameValue(profile.user.name || "");
                                    }}
                                    className="h-9 px-2 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-lime-400" />
                                    <span className="text-sm text-zinc-200">{profile.user.name || "Sin nombre"}</span>
                                </div>
                                <button
                                    onClick={() => setEditingName(true)}
                                    className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/40 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                                >
                                    <Pencil className="h-3 w-3" />
                                    Editar
                                </button>
                            </>
                        )}
                    </div>
                </section>

                {/* ── Country Section ── */}
                <section className="rounded-xl border border-zinc-800/70 bg-[#111114] p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                            <MapPin className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-100">País</h2>
                            <p className="text-xs text-zinc-500">Selecciona tu país de residencia</p>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setCountryOpen(!countryOpen)}
                            className="w-full flex items-center justify-between h-10 rounded-md border border-zinc-700 bg-zinc-800/40 px-3 text-sm text-zinc-200 hover:border-zinc-600 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-base">{userCountry?.flag || "🌐"}</span>
                                <span>{userCountry?.name || "Seleccionar país"}</span>
                            </span>
                            <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${countryOpen ? "rotate-180" : ""}`} />
                        </button>

                        {countryOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setCountryOpen(false)} />
                                <div className="absolute top-12 left-0 z-40 w-full rounded-lg border border-zinc-700 bg-[#18181b] shadow-2xl overflow-hidden">
                                    <div className="p-2 border-b border-zinc-800">
                                        <input
                                            value={countrySearch}
                                            onChange={(e) => setCountrySearch(e.target.value)}
                                            placeholder="Buscar país..."
                                            className="w-full h-8 rounded-md border border-zinc-700 bg-zinc-800/60 px-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredCountries.map((country) => (
                                            <button
                                                key={country.code}
                                                onClick={() => void handleCountryChange(country.code)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-zinc-800/80 transition-colors ${country.code === userCountryCode ? "bg-lime-500/5 text-lime-400" : "text-zinc-300"
                                                    }`}
                                            >
                                                <span className="text-base">{country.flag}</span>
                                                <span>{country.name}</span>
                                                {country.code === userCountryCode && (
                                                    <Check className="h-3.5 w-3.5 ml-auto text-lime-400" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* ── Registration Date Section ── */}
                <section className="rounded-xl border border-zinc-800/70 bg-[#111114] p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                            <CalendarDays className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-100">Fecha de registro</h2>
                            <p className="text-xs text-zinc-500">Tu fecha de registro en Billeto</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-lime-400" />
                        <span className="text-sm text-zinc-200">{formattedDate}</span>
                    </div>
                </section>

                {/* ── Referral Program ── */}
                <div>
                    <h2 className="text-lg font-bold text-zinc-100 mb-1">Programa de Referidos</h2>
                    <p className="text-xs text-zinc-500 mb-4">Comparte tu link y gana beneficios cuando tus amigos se registren y actualicen</p>

                    <section className="rounded-xl border border-zinc-800/70 bg-[#111114] p-5 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-500/10">
                                <Users className="h-4 w-4 text-lime-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-100">Programa de Referidos</h3>
                                <p className="text-xs text-zinc-500">Comparte tu link y gana beneficios cuando tus amigos se registren y actualicen</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-0 divide-y divide-zinc-800/50">
                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <Users className="h-4 w-4 text-zinc-500" />
                                    <span className="text-sm text-zinc-300">Referidos</span>
                                </div>
                                <span className="text-sm font-semibold text-lime-400">{profile.referralStats.referidos}</span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <Zap className="h-4 w-4 text-zinc-500" />
                                    <span className="text-sm text-zinc-300">Actualizados</span>
                                </div>
                                <span className="text-sm font-semibold text-lime-400">{profile.referralStats.actualizados}</span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <MousePointerClick className="h-4 w-4 text-zinc-500" />
                                    <span className="text-sm text-zinc-300">Clicks</span>
                                </div>
                                <span className="text-sm font-semibold text-lime-400">{profile.referralStats.clicks}</span>
                            </div>
                        </div>

                        {/* Referral link */}
                        <div className="space-y-2">
                            <p className="text-xs text-zinc-500">Tu link de referido</p>
                            <div className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/40 px-3 py-2">
                                <Link2 className="h-4 w-4 text-zinc-500 shrink-0" />
                                <span className="text-xs text-zinc-400 truncate flex-1">{referralLink}</span>
                                <button
                                    onClick={() => void handleCopyLink()}
                                    className="shrink-0 p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                                >
                                    {copiedLink ? <Check className="h-3.5 w-3.5 text-lime-400" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Ver detalles */}
                        <button className="w-full flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/30 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors">
                            Ver detalles del programa
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </section>
                </div>

                {/* ── Danger Zone ── */}
                <div>
                    <h2 className="text-lg font-bold text-red-400 mb-1">Zona de peligro</h2>
                    <p className="text-xs text-zinc-500 mb-4">Acciones irreversibles para tu cuenta</p>

                    {/* Reset Data */}
                    <section className="rounded-xl border border-red-500/20 bg-[#111114] p-5 space-y-5 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                                <RotateCcw className="h-4 w-4 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-100">Resetear datos de la cuenta</h3>
                                <p className="text-xs text-zinc-500">Limpia selectivamente los datos de tu cuenta sin eliminarla. Esto te permite empezar de cero cuando lo necesites.</p>
                            </div>
                        </div>

                        {/* Select all */}
                        <button
                            onClick={handleToggleAll}
                            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                            <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${allSelected ? "bg-lime-500 border-lime-500" : "border-zinc-600 bg-zinc-800"
                                }`}>
                                {allSelected && <Check className="h-3 w-3 text-black" />}
                            </div>
                            Seleccionar todo
                        </button>

                        {/* Checkboxes */}
                        <div className="space-y-0 divide-y divide-zinc-800/30">
                            {resetItems.map((item) => {
                                const ItemIcon = item.icon;
                                const checked = resetSelections[item.key];
                                return (
                                    <button
                                        key={item.key}
                                        onClick={() =>
                                            setResetSelections((prev) => ({
                                                ...prev,
                                                [item.key]: !prev[item.key],
                                            }))
                                        }
                                        className="w-full flex items-start gap-3 py-3 text-left hover:bg-zinc-800/20 transition-colors rounded-sm px-1"
                                    >
                                        <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-lime-500 border-lime-500" : "border-zinc-600 bg-zinc-800"
                                            }`}>
                                            {checked && <Check className="h-3 w-3 text-black" />}
                                        </div>
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <ItemIcon className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-zinc-200 font-medium">{item.label}</p>
                                                <p className="text-xs text-zinc-500">{item.desc}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40">
                            <span className="text-xs text-zinc-500">
                                {selectedResetCount === 0
                                    ? "Ningún elemento seleccionado"
                                    : `${selectedResetCount} elemento${selectedResetCount > 1 ? "s" : ""} seleccionado${selectedResetCount > 1 ? "s" : ""}`
                                }
                            </span>
                            <button
                                onClick={() => void handleOpenResetModal()}
                                disabled={selectedResetCount === 0 || resetting}
                                className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors ${selectedResetCount === 0
                                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                    : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                    }`}
                            >
                                Continuar con la eliminación
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </section>

                    {/* Delete Account */}
                    <section className="rounded-xl border border-red-500/20 bg-[#111114] p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                                <Trash2 className="h-4 w-4 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-100">Eliminar cuenta</h3>
                                <p className="text-xs text-zinc-500">Elimina permanentemente tu cuenta y todos tus datos</p>
                            </div>
                        </div>

                        {isDeletionScheduled ? (
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-400">Eliminación programada</p>
                                        <p className="text-xs text-zinc-400 mt-1">
                                            Tu cuenta está programada para eliminarse el{" "}
                                            <span className="text-zinc-200 font-medium">
                                                {new Date(profile.user.scheduledForDeletionAt!).toLocaleDateString("es-PE", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => void handleCancelDeletion()}
                                    className="w-full rounded-md border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                                >
                                    Cancelar eliminación
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start gap-2 text-xs text-zinc-500">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium text-zinc-300">Período de gracia de 5 días</p>
                                        <p className="mt-0.5">Después de solicitar la eliminación, tendrás 5 días para cancelar antes de que sea permanente</p>
                                    </div>
                                </div>
                                <p className="text-xs text-red-400/70">Esta acción es irreversible</p>

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(""); }}
                                        className="flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Eliminar cuenta
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !resetting && setShowResetModal(false)} />

                    {/* Modal */}
                    <div className="relative w-full max-w-md mx-4 rounded-2xl border border-zinc-700/50 bg-[#18181b] shadow-2xl p-6 space-y-5">
                        {/* Close */}
                        <button
                            onClick={() => !resetting && setShowResetModal(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
                            disabled={resetting}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Header */}
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="text-base font-semibold text-zinc-100">¿Confirmar esta acción?</h3>
                                <p className="text-sm text-zinc-400 mt-1">
                                    Estás a punto de eliminar permanentemente los siguientes datos. Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>

                        {/* Content: loading or counts */}
                        {loadingCounts ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                <div className="h-8 w-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
                                <p className="text-sm text-zinc-400">Calculando datos a eliminar...</p>
                            </div>
                        ) : resetCounts ? (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                    <p className="text-sm font-medium text-zinc-200">Se eliminarán permanentemente:</p>
                                </div>
                                <div className="space-y-0">
                                    {resetCounts.transactions !== undefined && (
                                        <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                                            <span className="text-sm text-zinc-300">Transacciones</span>
                                            <span className="text-sm font-semibold text-red-400">{resetCounts.transactions}</span>
                                        </div>
                                    )}
                                    {resetCounts.accounts !== undefined && (
                                        <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                                            <span className="text-sm text-zinc-300">Cuentas</span>
                                            <span className="text-sm font-semibold text-red-400">{resetCounts.accounts}</span>
                                        </div>
                                    )}
                                    {resetCounts.budgets !== undefined && (
                                        <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                                            <span className="text-sm text-zinc-300">Presupuestos</span>
                                            <span className="text-sm font-semibold text-red-400">{resetCounts.budgets}</span>
                                        </div>
                                    )}
                                    {resetCounts.customCategories !== undefined && (
                                        <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                                            <span className="text-sm text-zinc-300">Categorías personalizadas</span>
                                            <span className="text-sm font-semibold text-red-400">{resetCounts.customCategories}</span>
                                        </div>
                                    )}
                                    {resetCounts.settings !== undefined && (
                                        <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                                            <span className="text-sm text-zinc-300">Configuraciones</span>
                                            <span className="text-sm font-semibold text-red-400">{resetCounts.settings}</span>
                                        </div>
                                    )}
                                    {resetCounts.recurringTransactions !== undefined && (
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm text-zinc-300">Transacciones recurrentes</span>
                                            <span className="text-sm font-semibold text-red-400">{resetCounts.recurringTransactions}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {/* Reminder */}
                        {!loadingCounts && resetCounts && (
                            <div className="rounded-lg bg-zinc-800/50 px-4 py-3">
                                <p className="text-xs text-zinc-400">
                                    Recuerda: Tu cuenta permanecerá activa y podrás seguir usando la aplicación normalmente.
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-1">
                            <button
                                onClick={() => setShowResetModal(false)}
                                disabled={resetting}
                                className="rounded-lg border border-zinc-600 bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => void handleConfirmReset()}
                                disabled={resetting || loadingCounts}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="h-4 w-4" />
                                {resetting ? "Eliminando..." : "Sí, eliminar definitivamente"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)} />

                    {/* Modal */}
                    <div className="relative w-full max-w-md mx-4 rounded-2xl border border-zinc-700/50 bg-[#18181b] shadow-2xl p-6 space-y-5">
                        {/* Close */}
                        <button
                            onClick={() => !deleting && setShowDeleteModal(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
                            disabled={deleting}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Header */}
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="text-base font-semibold text-zinc-100">Confirmar eliminaci&oacute;n de cuenta</h3>
                                <p className="text-sm text-zinc-400 mt-1">
                                    Tu cuenta ser&aacute; eliminada despu&eacute;s de 5 d&iacute;as. Recibir&aacute;s un email de confirmaci&oacute;n.
                                </p>
                            </div>
                        </div>

                        {/* What will be deleted */}
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                                <p className="text-sm font-medium text-zinc-200">Se eliminar&aacute; permanentemente:</p>
                            </div>
                            <ul className="space-y-2 pl-1">
                                <li className="flex items-center gap-2 text-sm text-red-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                    Todas tus transacciones
                                </li>
                                <li className="flex items-center gap-2 text-sm text-red-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                    Todas tus cuentas y presupuestos
                                </li>
                                <li className="flex items-center gap-2 text-sm text-red-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                    Tu perfil y configuraciones
                                </li>
                                <li className="flex items-center gap-2 text-sm text-red-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                    Historial de integraciones
                                </li>
                            </ul>
                        </div>

                        {/* Confirmation input */}
                        <div className="space-y-2">
                            <p className="text-sm text-zinc-300">
                                Escribe <span className="font-bold text-zinc-100">&quot;ELIMINAR MI CUENTA&quot;</span> para confirmar:
                            </p>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="ELIMINAR MI CUENTA"
                                className="w-full rounded-lg border border-lime-500/30 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-lime-500/60 focus:ring-1 focus:ring-lime-500/30 transition-colors"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-1">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                                disabled={deleting}
                                className="rounded-lg border border-zinc-600 bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => void handleDeleteAccount()}
                                disabled={deleting || deleteConfirmText !== "ELIMINAR MI CUENTA"}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="h-4 w-4" />
                                {deleting ? "Procesando..." : "Confirmar eliminaci\u00f3n"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Marquee animation styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 15s linear infinite;
                    display: inline-block;
                }
            ` }} />
        </div>
    );
}

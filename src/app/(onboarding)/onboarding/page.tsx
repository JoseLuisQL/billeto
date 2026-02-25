"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Copy, Check, ArrowRight, Sparkles, PartyPopper } from "lucide-react";
import { useSession } from "next-auth/react";
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    AreaChart, Area,
    RadialBarChart, RadialBar,
} from "recharts";
import { countries } from "@/lib/countries";
import { currencies } from "@/lib/currencies";
import { getDefaultCurrency } from "@/lib/country-currency";
import {
    completeOnboarding,
    getOnboardingStatus,
    generateWhatsAppCode,
    type OnboardingData,
} from "@/lib/actions/onboarding";

// ─── Types ─────────────────────────────────────────────────────────────

type ChatMessage = {
    id: string;
    role: "bot" | "user";
    content: React.ReactNode;
    textContent?: string;
};

type OnboardingStep =
    | "welcome"
    | "ask-name"
    | "confirm-country"
    | "pick-avatar"
    | "whatsapp-code"
    | "survey-pain"
    | "survey-method"
    | "survey-complications"
    | "survey-goal"
    | "survey-companion"
    | "feature-intro"
    | "feature-expenses"
    | "feature-budgets"
    | "feature-goals"
    | "trial-expense"
    | "success"
    | "done";

// ─── Data ──────────────────────────────────────────────────────────────

const AVATARS = [
    "🐱", "🐕", "🐻", "🐼", "🦊", "🦁", "🦄", "🐲",
    "🦉", "🐧", "🐨", "🐰", "🐵", "🐯", "🐺", "🐸",
];

const SURVEY_PAIN = [
    { emoji: "🤷", label: "No sé a dónde va mi plata" },
    { emoji: "🐷", label: "No logro ahorrar" },
    { emoji: "🏦", label: "Plata dispersa en todos lados" },
    { emoji: "👥", label: "Los gastos compartidos son un caos" },
    { emoji: "😰", label: "Las deudas me abruman" },
    { emoji: "🌪️", label: "Todo lo anterior" },
];

const SURVEY_METHOD = [
    { emoji: "🙈", label: "No la controlo" },
    { emoji: "📊", label: "Planillas" },
    { emoji: "📱", label: "Otra app" },
    { emoji: "📓", label: "Cuaderno o papel" },
    { emoji: "🧠", label: "Todo en mi cabeza" },
];

const SURVEY_COMPLICATIONS = [
    { emoji: "💱", label: "Múltiples monedas" },
    { emoji: "🔄", label: "Muchos pagos recurrentes" },
    { emoji: "👫", label: "Cuentas compartidas" },
    { emoji: "📈", label: "Inversiones" },
    { emoji: "💳", label: "Pagos de deudas" },
    { emoji: "✨", label: "Nada especial, mantenelo simple" },
];

const SURVEY_GOAL = [
    { emoji: "💰", label: "Ahorrar más" },
    { emoji: "✂️", label: "Gastar menos" },
    { emoji: "🔍", label: "Entender a dónde va la plata" },
    { emoji: "🎯", label: "Pagar deudas más rápido" },
    { emoji: "📋", label: "Organizarme" },
];

const SURVEY_COMPANION = [
    { emoji: "🙋", label: "Solo yo" },
    { emoji: "💑", label: "Con mi pareja" },
    { emoji: "👨‍👩‍👧‍👦", label: "Finanzas familiares" },
    { emoji: "🏠", label: "Compañeros de piso" },
    { emoji: "👯", label: "Amigos (viajes, eventos)" },
    { emoji: "💼", label: "Mi emprendimiento / trabajo" },
];

const TRIAL_EXPENSES = [
    { emoji: "☕", label: "Gasté $1500 en café" },
    { emoji: "🍕", label: "Gasté $5000 en delivery" },
    { emoji: "🚗", label: "Gasté $2000 en Uber" },
    { emoji: "🛒", label: "Gasté $8000 en el super" },
];

// Donut chart data
const EXPENSE_CHART_DATA = [
    { name: "Comida", value: 850, color: "#3B82F6" },
    { name: "Hogar", value: 620, color: "#6366F1" },
    { name: "Compras", value: 530, color: "#EF4444" },
    { name: "Transporte", value: 445, color: "#10B981" },
    { name: "Educación", value: 380, color: "#22D3EE" },
    { name: "Salud", value: 320, color: "#A855F7" },
    { name: "Suscripciones", value: 280, color: "#EC4899" },
    { name: "Entretenimiento", value: 220, color: "#F59E0B" },
];

const EXPENSE_CATEGORIES = [
    { emoji: "🍔", label: "Comida", color: "#3B82F6" },
    { emoji: "🏠", label: "Hogar", color: "#6366F1" },
    { emoji: "🛒", label: "Compras", color: "#EF4444" },
    { emoji: "🚗", label: "Transporte", color: "#10B981" },
    { emoji: "📚", label: "Educación", color: "#22D3EE" },
    { emoji: "💊", label: "Salud", color: "#A855F7" },
    { emoji: "📱", label: "Suscripciones", color: "#EC4899" },
    { emoji: "🎬", label: "Entretenimiento", color: "#F59E0B" },
];

const BUDGET_AREA_DATA = [
    { v: 40 }, { v: 55 }, { v: 45 }, { v: 65 },
    { v: 50 }, { v: 70 }, { v: 60 }, { v: 80 },
    { v: 75 }, { v: 85 }, { v: 78 }, { v: 90 },
];

// ─── Confetti Component ────────────────────────────────────────────────

function Confetti() {
    const colors = ["#D3FF0A", "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#A855F7", "#EC4899", "#22D3EE"];
    const pieces = Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.5 + Math.random() * 2,
        color: colors[i % colors.length],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
    }));

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
                    animate={{
                        y: "110vh",
                        rotate: p.rotation + 720,
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        ease: "easeIn",
                    }}
                    className="absolute"
                    style={{
                        width: p.size,
                        height: p.size * 0.6,
                        backgroundColor: p.color,
                        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                    }}
                />
            ))}
        </div>
    );
}

// ─── Feature Cards ─────────────────────────────────────────────────────

function ExpenseChartCard({ onContinue }: { onContinue?: () => void }) {
    const [clicked, setClicked] = useState(false);
    return (
        <div className="my-3 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/90">
            <div className="px-5 pt-4 pb-2">
                <p className="text-sm text-zinc-400 mb-4">
                    Billeto auto-categoriza cada gasto para que veas exactamente a dónde va tu plata.
                </p>
                <div className="rounded-xl border border-white/5 bg-zinc-800/50 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">📊</span>
                        <span className="font-semibold text-white text-sm">Control de Gastos</span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">¿A dónde se va tu plata cada mes?</p>

                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white text-sm">Gastos por categoría</span>
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">8 categorías</span>
                        </div>
                        <p className="text-xs text-zinc-500">Distribución de gastos por categoría</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                        {EXPENSE_CATEGORIES.map((cat) => (
                            <span key={cat.label} className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                {cat.emoji} {cat.label}
                            </span>
                        ))}
                    </div>

                    <div className="flex justify-center my-2">
                        <ResponsiveContainer width={200} height={200}>
                            <PieChart>
                                <Pie
                                    data={EXPENSE_CHART_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {EXPENSE_CHART_DATA.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">$3.645,00</p>
                        <p className="text-xs text-zinc-500">Total gastos</p>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {onContinue && !clicked && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-5 pb-4 pt-2"
                    >
                        <button
                            onClick={() => { setClicked(true); onContinue(); }}
                            className="w-full py-2.5 rounded-xl bg-[#D3FF0A] text-black font-semibold text-sm hover:bg-[#c5f000] transition-all"
                        >
                            Continuar →
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function BudgetCard({ onContinue }: { onContinue?: () => void }) {
    const [clicked, setClicked] = useState(false);
    const radialData = [{ value: 62, fill: "#2DD4BF" }];
    return (
        <div className="my-3 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/90">
            <div className="px-5 pt-4 pb-2">
                <p className="text-sm text-zinc-400 mb-4">
                    Recibí alertas antes de pasarte, no después. Billeto vigila tus presupuestos por vos.
                </p>
                <div className="rounded-xl border border-white/5 bg-zinc-800/50 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">📈</span>
                        <span className="font-semibold text-white text-sm">Presupuestos Inteligentes</span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">¿Te enterás que te pasaste recién cuando ya es tarde?</p>

                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs bg-lime-400/20 text-lime-400 px-2 py-0.5 rounded-full">Fijo</span>
                        <span className="text-lg">⛽</span>
                        <span className="font-semibold text-white text-sm">Combustible</span>
                    </div>

                    <div className="flex justify-center my-2">
                        <ResponsiveContainer width={120} height={120}>
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="70%"
                                outerRadius="100%"
                                startAngle={90}
                                endAngle={90 - 360 * 0.62}
                                data={radialData}
                            >
                                <RadialBar dataKey="value" fill="#2DD4BF" background={{ fill: "rgba(255,255,255,0.05)" }} cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-center -mt-2 mb-3">
                        <span className="text-lg font-bold text-teal-400">62%</span>
                    </div>

                    <div className="text-center mb-4">
                        <p className="text-sm text-white font-medium">US$ 74 de US$ 120</p>
                        <p className="text-xs text-zinc-500">Límite mensual</p>
                    </div>

                    <div className="h-20 -mx-1 mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={BUDGET_AREA_DATA}>
                                <defs>
                                    <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="v" stroke="#2DD4BF" strokeWidth={2} fill="url(#budgetGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-zinc-500 text-center">sep 25 - feb 26</p>
                </div>
            </div>
            <AnimatePresence>
                {onContinue && !clicked && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-5 pb-4 pt-2"
                    >
                        <button
                            onClick={() => { setClicked(true); onContinue(); }}
                            className="w-full py-2.5 rounded-xl bg-[#D3FF0A] text-black font-semibold text-sm hover:bg-[#c5f000] transition-all"
                        >
                            Continuar →
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function GoalsCard({ onContinue }: { onContinue?: () => void }) {
    const [clicked, setClicked] = useState(false);
    return (
        <div className="my-3 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/90">
            <div className="px-5 pt-4 pb-2">
                <p className="text-sm text-zinc-400 mb-4">
                    Vé exactamente cuándo llegás a tu meta. No más &apos;capaz el mes que viene&apos;.
                </p>
                <div className="rounded-xl border border-white/5 bg-zinc-800/50 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🎯</span>
                        <span className="font-semibold text-white text-sm">Metas de Ahorro</span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">¿Cuándo vas a llegar a esa meta de ahorro que &apos;ya vas a arrancar&apos;?</p>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⊙</span>
                            <span className="font-semibold text-white">Metas</span>
                        </div>
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ✅ 1 de 2 al día
                        </span>
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ⚠ 1 requiere atención
                        </span>
                    </div>

                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>0%</span>
                        <span>100%</span>
                    </div>
                    <div className="h-3 rounded-full bg-zinc-700/50 overflow-hidden mb-3">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "65%" }}
                            transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{
                                background: "linear-gradient(90deg, #D3FF0A, #84CC16)",
                            }}
                        />
                    </div>

                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs text-zinc-500">Ahorrado</p>
                            <p className="text-sm font-bold text-white">US$ 7.683,29</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-zinc-500">Objetivo</p>
                            <p className="text-sm font-bold text-white">US$ 11.755,00</p>
                        </div>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {onContinue && !clicked && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-5 pb-4 pt-2"
                    >
                        <button
                            onClick={() => { setClicked(true); onContinue(); }}
                            className="w-full py-2.5 rounded-xl bg-[#D3FF0A] text-black font-semibold text-sm hover:bg-[#c5f000] transition-all"
                        >
                            Continuar →
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────

export default function OnboardingPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<OnboardingStep>("welcome");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [showInput, setShowInput] = useState(false);
    const [inputPlaceholder, setInputPlaceholder] = useState("");
    const [ready, setReady] = useState(false); // Wait for status check before starting

    // Collected data
    const [displayName, setDisplayName] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("PE");
    const [selectedCurrency, setSelectedCurrency] = useState("PEN");
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [whatsAppCode, setWhatsAppCode] = useState("");
    const [codeCopied, setCodeCopied] = useState(false);
    const [surveyAnswers, setSurveyAnswers] = useState({
        painPoint: "",
        currentMethod: "",
        complications: "",
        mainGoal: "",
        financialCompanion: "",
    });
    const [showConfetti, setShowConfetti] = useState(false);

    // Auto-scroll
    useEffect(() => {
        const t = setTimeout(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }, 100);
        return () => clearTimeout(t);
    }, [messages, isTyping]);

    // Check if already onboarded — must complete before chat starts
    useEffect(() => {
        getOnboardingStatus().then((res) => {
            if (!res.needsOnboarding) {
                router.replace("/dashboard");
            } else {
                setReady(true);
            }
        });
    }, [router]);

    // Add bot message with typing delay
    const addBotMessage = useCallback(
        (content: React.ReactNode, textContent?: string) =>
            new Promise<void>((resolve) => {
                setIsTyping(true);
                setTimeout(() => {
                    setIsTyping(false);
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: `bot-${Date.now()}-${Math.random()}`,
                            role: "bot",
                            content,
                            textContent,
                        },
                    ]);
                    resolve();
                }, 800 + Math.random() * 400);
            }),
        []
    );

    // Add user message
    const addUserMessage = useCallback((text: string) => {
        setMessages((prev) => [
            ...prev,
            {
                id: `user-${Date.now()}`,
                role: "user",
                content: <span>{text}</span>,
                textContent: text,
            },
        ]);
    }, []);

    // ─── Step handlers ─────────────────────────────────────────────

    // Welcome — only starts after status check confirms user needs onboarding
    const hasStarted = useRef(false);
    useEffect(() => {
        if (!ready || step !== "welcome" || hasStarted.current) return;
        hasStarted.current = true;
        const run = async () => {
            await addBotMessage(
                <div>
                    <p className="font-semibold text-white text-base mb-1">Billeto</p>
                    <p className="text-xs text-zinc-500 mb-3">Tu asistente financiero</p>
                    <p>¡Hola! Soy Billeto, tu asistente financiero 👋</p>
                </div>
            );
            await addBotMessage(<p>¿Cómo querés que te llamemos?</p>);
            setShowInput(true);
            setInputPlaceholder("Tu nombre...");
            setStep("ask-name");
        };
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready]);

    // Handle name submission
    const handleNameSubmit = useCallback(async () => {
        if (!inputValue.trim()) return;
        const name = inputValue.trim();
        setInputValue("");
        setShowInput(false);
        setDisplayName(name);
        addUserMessage(name);

        await addBotMessage(
            <p>¡Genial, {name}! Encantado de conocerte 🎉</p>
        );

        // Detect country
        setIsTyping(true);
        try {
            const res = await fetch("/api/geo");
            const geo = await res.json();
            setSelectedCountry(geo.countryCode);
            setSelectedCurrency(geo.currencyCode);
            setIsTyping(false);

            await addBotMessage(
                <p>Detecté tu ubicación. Confirmá o cambiá tu país y moneda principal 👇</p>
            );
            setStep("confirm-country");
        } catch {
            setIsTyping(false);
            setSelectedCountry("PE");
            setSelectedCurrency("PEN");
            await addBotMessage(
                <p>Seleccioná tu país y moneda principal 👇</p>
            );
            setStep("confirm-country");
        }
    }, [inputValue, addBotMessage, addUserMessage]);

    // Country/currency inline picker state
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
    const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const [currencySearch, setCurrencySearch] = useState("");

    const handleCountryChange = useCallback((countryCode: string) => {
        const currency = getDefaultCurrency(countryCode);
        setSelectedCountry(countryCode);
        setSelectedCurrency(currency);
        setCountryDropdownOpen(false);
        setCountrySearch("");
    }, []);

    const handleCurrencyChange = useCallback((currencyCode: string) => {
        setSelectedCurrency(currencyCode);
        setCurrencyDropdownOpen(false);
        setCurrencySearch("");
    }, []);

    const handleConfirmCountry = useCallback(async () => {
        const country = countries.find((c) => c.code === selectedCountry);
        const currency = currencies.find((c) => c.code === selectedCurrency);
        addUserMessage(`${country?.flag || ""} ${country?.name || selectedCountry} — ${currency?.code || selectedCurrency}`);
        await addBotMessage(
            <p>Perfecto, sos de {country?.name || selectedCountry} y tu moneda es {selectedCurrency}. Esto lo guardo para tus transacciones. 👍</p>
        );
        await addBotMessage(<p>¿Te gustaría elegir un avatar? Es opcional, pero así te podemos identificar más fácil.</p>);
        setStep("pick-avatar");
    }, [selectedCountry, selectedCurrency, addBotMessage, addUserMessage]);

    const handleAvatarSelect = useCallback(async (emoji: string | null) => {
        setSelectedAvatar(emoji);
        if (emoji) {
            addUserMessage(emoji);
        } else {
            addUserMessage("Omitir");
        }
        await addBotMessage(<p>¡Perfecto! Tu perfil está listo.</p>);

        // Generate WhatsApp code
        const result = await generateWhatsAppCode();
        setWhatsAppCode(result.code);

        await addBotMessage(
            <div>
                <p className="mb-3">
                    Este es tu código para poder configurar WhatsApp. De esta manera, cuando me hables desde ahí sé donde guardar las transacciones.
                </p>
                <div className="bg-zinc-800/80 rounded-xl border border-white/10 p-4 text-center">
                    <p className="text-2xl font-mono font-bold text-[#D3FF0A] tracking-widest mb-2" id="wa-code">
                        {result.code}
                    </p>
                    <p className="text-xs text-zinc-500">Guardá este código para configurar WhatsApp</p>
                </div>
            </div>
        );
        setStep("whatsapp-code");
    }, [addBotMessage, addUserMessage]);

    const handleCopyCode = useCallback(() => {
        navigator.clipboard.writeText(whatsAppCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    }, [whatsAppCode]);

    const handleWhatsAppContinue = useCallback(async () => {
        addUserMessage("Continuar");
        await addBotMessage(
            <p>Ahora quiero entender un poco cómo manejás tu plata 💰</p>
        );
        await addBotMessage(
            <p>¿Cuál es tu mayor dolor de cabeza con la plata?</p>
        );
        setStep("survey-pain");
    }, [addBotMessage, addUserMessage]);

    // Generic survey handler
    const handleSurveyAnswer = useCallback(async (
        answerKey: keyof typeof surveyAnswers,
        label: string,
        emoji: string,
        nextQuestion: React.ReactNode,
        nextStep: OnboardingStep,
        responseText?: string
    ) => {
        addUserMessage(`${emoji} ${label}`);
        setSurveyAnswers((prev) => ({ ...prev, [answerKey]: label }));

        if (responseText) {
            await addBotMessage(<p>{responseText}</p>);
        }

        await addBotMessage(nextQuestion);
        setStep(nextStep);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addBotMessage, addUserMessage]);

    const handleFeatureIntro = useCallback(async () => {
        addUserMessage(`${surveyAnswers.financialCompanion ? "✅" : "🙋"} ${surveyAnswers.financialCompanion || "Solo yo"}`);
        await addBotMessage(
            <p>Basado en lo que me contaste, estas funciones van a ser clave para vos 🚀</p>
        );
        setStep("feature-expenses");
        await addBotMessage(<ExpenseChartCard onContinue={() => handleFeatureContinue("expenses")} />);
    }, [addBotMessage, addUserMessage, surveyAnswers.financialCompanion]);

    const handleFeatureContinue = useCallback(async (currentFeature: string) => {
        addUserMessage("Continuar");
        await addBotMessage(<p>¡Genial! Veamos la siguiente...</p>);

        if (currentFeature === "expenses") {
            setStep("feature-budgets");
            await addBotMessage(<BudgetCard onContinue={() => handleFeatureContinue("budgets")} />);
        } else if (currentFeature === "budgets") {
            setStep("feature-goals");
            await addBotMessage(<GoalsCard onContinue={() => handleFeatureContinue("goals")} />);
        } else if (currentFeature === "goals") {
            setStep("trial-expense");
            await addBotMessage(<p>¡Última cosa! Probá registrar tu primer gasto 📝</p>);
            await addBotMessage(
                <p>Escribí algo como &quot;Gasté $3000 en el super&quot;</p>
            );
        }
    }, [addBotMessage, addUserMessage]);

    const handleTrialExpense = useCallback(async (text: string) => {
        addUserMessage(text);

        await addBotMessage(
            <p>¿Viste qué fácil es usar Billeto? Podés hacer lo mismo acá o en WhatsApp, vos decidís 🎉</p>
        );

        // Save all data
        const onboardingData: OnboardingData = {
            displayName,
            countryCode: selectedCountry,
            currencyCode: selectedCurrency,
            avatar: selectedAvatar,
            surveyAnswers,
        };

        const result = await completeOnboarding(onboardingData);

        if (result.error) {
            await addBotMessage(
                <p>Hubo un problema al guardar tu configuración. Vamos a intentar de nuevo... ⏳</p>
            );
            // Retry once
            const retry = await completeOnboarding(onboardingData);
            if (retry.error) {
                await addBotMessage(
                    <p>No pudimos guardar tu configuración en este momento. Podés refrescar la página e intentar de nuevo. 😔</p>
                );
                return;
            }
        }

        setShowConfetti(true);
        setStep("success");
    }, [addBotMessage, addUserMessage, displayName, selectedCountry, selectedCurrency, selectedAvatar, surveyAnswers]);

    // Handle Enter key on name input
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleNameSubmit();
        }
    }, [handleNameSubmit]);

    // ─── Render ────────────────────────────────────────────────────

    // Show loading while checking onboarding status
    if (!ready) {
        return (
            <div className="flex flex-col h-screen items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/15 mb-4">
                    <Bot className="h-6 w-6 text-lime-400 animate-pulse" />
                </div>
                <p className="text-sm text-zinc-500">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {showConfetti && <Confetti />}

            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400/15">
                    <Bot className="h-4.5 w-4.5 text-lime-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">Billeto</p>
                    <p className="text-xs text-zinc-500">Tu asistente financiero</p>
                </div>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
                <div className="mx-auto max-w-2xl space-y-4">
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "bot" && (
                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-lime-400/15 mt-1">
                                        <Bot className="h-3.5 w-3.5 text-lime-400" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-[#D3FF0A] text-black font-medium"
                                        : "bg-zinc-800/60 text-zinc-300"
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing indicator */}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3"
                        >
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-lime-400/15 mt-1">
                                <Bot className="h-3.5 w-3.5 text-lime-400" />
                            </div>
                            <div className="bg-zinc-800/60 rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Interactive elements based on current step */}
                    {!isTyping && (
                        <>
                            {/* Country & currency inline picker */}
                            {step === "confirm-country" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
                                    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 overflow-hidden">
                                        <div className="p-4 space-y-3">
                                            {/* Country selector */}
                                            <div className="relative">
                                                <p className="text-xs text-zinc-500 mb-1.5">Tu país</p>
                                                <button
                                                    onClick={() => { setCountryDropdownOpen(!countryDropdownOpen); setCurrencyDropdownOpen(false); setCountrySearch(""); }}
                                                    className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 border transition-all text-left ${countryDropdownOpen
                                                        ? "border-[#D3FF0A]/40 bg-zinc-800/80"
                                                        : "border-white/10 bg-zinc-800/50 hover:border-white/20"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-xl">{countries.find(c => c.code === selectedCountry)?.flag || "🌍"}</span>
                                                        <span className="text-white font-medium text-sm">{countries.find(c => c.code === selectedCountry)?.name || selectedCountry}</span>
                                                    </div>
                                                    <svg className={`w-4 h-4 text-zinc-500 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                                {countryDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        className="mt-1.5 rounded-xl border border-white/10 bg-zinc-800/90 overflow-hidden"
                                                    >
                                                        <div className="p-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar país..."
                                                                value={countrySearch}
                                                                onChange={(e) => setCountrySearch(e.target.value)}
                                                                className="w-full bg-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none border border-white/5 focus:border-[#D3FF0A]/30 mb-1.5"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="max-h-44 overflow-y-auto px-1.5 pb-1.5">
                                                            {countries
                                                                .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase()))
                                                                .map((c) => (
                                                                    <button
                                                                        key={c.code}
                                                                        onClick={() => handleCountryChange(c.code)}
                                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${c.code === selectedCountry
                                                                            ? "bg-[#D3FF0A]/15 text-[#D3FF0A]"
                                                                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                                                            }`}
                                                                    >
                                                                        <span>{c.flag}</span>
                                                                        <span>{c.name}</span>
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>

                                            {/* Currency selector */}
                                            <div className="relative">
                                                <p className="text-xs text-zinc-500 mb-1.5">Tu moneda principal</p>
                                                <button
                                                    onClick={() => { setCurrencyDropdownOpen(!currencyDropdownOpen); setCountryDropdownOpen(false); setCurrencySearch(""); }}
                                                    className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 border transition-all text-left ${currencyDropdownOpen
                                                        ? "border-[#D3FF0A]/40 bg-zinc-800/80"
                                                        : "border-white/10 bg-zinc-800/50 hover:border-white/20"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-xl">{currencies.find(c => c.code === selectedCurrency)?.flag || "💰"}</span>
                                                        <span className="text-white font-medium text-sm">{selectedCurrency}</span>
                                                        <span className="text-zinc-500 text-xs">— {currencies.find(c => c.code === selectedCurrency)?.name || "Moneda"}</span>
                                                    </div>
                                                    <svg className={`w-4 h-4 text-zinc-500 transition-transform ${currencyDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                                {currencyDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        className="mt-1.5 rounded-xl border border-white/10 bg-zinc-800/90 overflow-hidden"
                                                    >
                                                        <div className="p-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar moneda..."
                                                                value={currencySearch}
                                                                onChange={(e) => setCurrencySearch(e.target.value)}
                                                                className="w-full bg-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none border border-white/5 focus:border-[#D3FF0A]/30 mb-1.5"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="max-h-44 overflow-y-auto px-1.5 pb-1.5">
                                                            {currencies
                                                                .filter(c => c.code !== "NONE")
                                                                .filter(c => c.name.toLowerCase().includes(currencySearch.toLowerCase()) || c.code.toLowerCase().includes(currencySearch.toLowerCase()))
                                                                .map((c) => (
                                                                    <button
                                                                        key={c.code}
                                                                        onClick={() => handleCurrencyChange(c.code)}
                                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${c.code === selectedCurrency
                                                                            ? "bg-[#D3FF0A]/15 text-[#D3FF0A]"
                                                                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                                                            }`}
                                                                    >
                                                                        <span>{c.flag}</span>
                                                                        <span className="font-medium">{c.code}</span>
                                                                        <span className="text-xs opacity-70">— {c.name}</span>
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Confirm button */}
                                        <div className="px-4 pb-4 pt-1">
                                            <button
                                                onClick={handleConfirmCountry}
                                                className="w-full py-2.5 rounded-xl bg-[#D3FF0A] text-black font-semibold text-sm hover:bg-[#c5f000] transition-all"
                                            >
                                                Confirmar
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Avatar picker */}
                            {step === "pick-avatar" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
                                    <div className="grid grid-cols-8 gap-2 mb-3">
                                        {AVATARS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleAvatarSelect(emoji)}
                                                className="w-10 h-10 flex items-center justify-center text-xl rounded-xl border border-white/10 bg-zinc-800/50 hover:bg-white/10 hover:border-white/20 hover:scale-110 transition-all"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleAvatarSelect(null)}
                                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        Omitir →
                                    </button>
                                </motion.div>
                            )}

                            {/* WhatsApp code actions */}
                            {step === "whatsapp-code" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10 flex gap-2">
                                    <button
                                        onClick={handleCopyCode}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-zinc-400 text-sm hover:border-white/20 hover:text-zinc-200 transition-all"
                                    >
                                        {codeCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                        {codeCopied ? "¡Copiado!" : "Copiar código"}
                                    </button>
                                    <button
                                        onClick={handleWhatsAppContinue}
                                        className="px-4 py-2 rounded-full bg-[#D3FF0A] text-black font-semibold text-sm hover:bg-[#c5f000] transition-all"
                                    >
                                        Continuar
                                    </button>
                                </motion.div>
                            )}

                            {/* Survey options */}
                            {step === "survey-pain" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
                                    <div className="flex flex-wrap gap-2">
                                        {SURVEY_PAIN.map((opt) => (
                                            <button
                                                key={opt.label}
                                                onClick={() => handleSurveyAnswer("painPoint", opt.label, opt.emoji,
                                                    <p>¿Cómo controlás tu plata ahora?</p>,
                                                    "survey-method",
                                                    "Entendido, eso es muy común."
                                                )}
                                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-white/5 hover:border-white/20 transition-all"
                                            >
                                                <span>{opt.emoji}</span>
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === "survey-method" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
                                    <div className="flex flex-wrap gap-2">
                                        {SURVEY_METHOD.map((opt) => (
                                            <button
                                                key={opt.label}
                                                onClick={() => handleSurveyAnswer("currentMethod", opt.label, opt.emoji,
                                                    <p>¿Qué hace complicadas tus finanzas?</p>,
                                                    "survey-complications",
                                                    "¡Gracias por compartir!"
                                                )}
                                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-white/5 hover:border-white/20 transition-all"
                                            >
                                                <span>{opt.emoji}</span>
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === "survey-complications" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
                                    <div className="flex flex-wrap gap-2">
                                        {SURVEY_COMPLICATIONS.map((opt) => (
                                            <button
                                                key={opt.label}
                                                onClick={() => handleSurveyAnswer("complications", opt.label, opt.emoji,
                                                    <p>¿Cuál es tu objetivo principal con Billeto?</p>,
                                                    "survey-goal",
                                                    "Buena info, la tengo en cuenta."
                                                )}
                                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-white/5 hover:border-white/20 transition-all"
                                            >
                                                <span>{opt.emoji}</span>
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === "survey-goal" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
                                    <div className="flex flex-wrap gap-2">
                                        {SURVEY_GOAL.map((opt) => (
                                            <button
                                                key={opt.label}
                                                onClick={() => {
                                                    handleSurveyAnswer("mainGoal", opt.label, opt.emoji,
                                                        <p>¿Con quién manejás la plata?</p>,
                                                        "survey-companion",
                                                        "¡Gran objetivo!"
                                                    );
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-white/5 hover:border-white/20 transition-all"
                                            >
                                                <span>{opt.emoji}</span>
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === "survey-companion" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
                                    <div className="flex flex-wrap gap-2">
                                        {SURVEY_COMPANION.map((opt) => (
                                            <button
                                                key={opt.label}
                                                onClick={() => {
                                                    setSurveyAnswers((prev) => ({ ...prev, financialCompanion: opt.label }));
                                                    setTimeout(() => handleFeatureIntro(), 0);
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-white/5 hover:border-white/20 transition-all"
                                            >
                                                <span>{opt.emoji}</span>
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}




                            {/* Trial expense */}
                            {step === "trial-expense" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10 space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {TRIAL_EXPENSES.map((opt) => (
                                            <button
                                                key={opt.label}
                                                onClick={() => handleTrialExpense(`${opt.emoji} ${opt.label}`)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-zinc-800/50 text-sm text-zinc-300 hover:bg-white/5 hover:border-white/20 transition-all"
                                            >
                                                <span>{opt.emoji}</span>
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && inputValue.trim()) {
                                                    handleTrialExpense(inputValue.trim());
                                                    setInputValue("");
                                                }
                                            }}
                                            placeholder='Ej: Gasté $3000 en el super'
                                            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/20"
                                        />
                                        <button
                                            onClick={() => {
                                                if (inputValue.trim()) {
                                                    handleTrialExpense(inputValue.trim());
                                                    setInputValue("");
                                                }
                                            }}
                                            className="absolute right-2.5 bottom-2 rounded-lg bg-lime-400/20 p-1.5 text-lime-400 hover:bg-lime-400/30 transition-colors"
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Success */}
                            {step === "success" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="flex flex-col items-center text-center py-8"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                                        className="w-20 h-20 rounded-full bg-[#D3FF0A]/20 flex items-center justify-center mb-4"
                                    >
                                        <PartyPopper className="h-10 w-10 text-[#D3FF0A]" />
                                    </motion.div>
                                    <motion.h2
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7 }}
                                        className="text-xl font-bold text-white mb-2"
                                    >
                                        ¡Todo listo, {displayName}! 🎉
                                    </motion.h2>
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.9 }}
                                        className="text-sm text-zinc-400 mb-6 max-w-sm"
                                    >
                                        Tu cuenta está configurada y lista para usar. Empecemos a organizar tus finanzas.
                                    </motion.p>
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.1 }}
                                        onClick={() => router.replace("/dashboard")}
                                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#D3FF0A] text-black font-semibold hover:bg-[#c5f000] hover:shadow-[0_0_30px_rgba(211,255,10,0.3)] transition-all"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Ir al panel principal
                                        <ArrowRight className="h-4 w-4" />
                                    </motion.button>
                                </motion.div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Name input (only shown during ask-name step) */}
            {
                showInput && step === "ask-name" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-4 pb-4 pt-2"
                    >
                        <div className="mx-auto max-w-2xl">
                            <div className="relative rounded-2xl border border-white/10 bg-zinc-800/50">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={inputPlaceholder}
                                    autoFocus
                                    className="w-full bg-transparent px-4 py-3.5 pr-14 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none rounded-2xl"
                                />
                                <button
                                    onClick={handleNameSubmit}
                                    disabled={!inputValue.trim()}
                                    className="absolute right-2.5 bottom-2 rounded-lg bg-[#D3FF0A]/90 p-1.5 text-zinc-950 transition-colors hover:bg-[#D3FF0A] disabled:opacity-30"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )
            }
        </div>
    );
}

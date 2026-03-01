import Link from "next/link";
import { Twitter, Instagram, Github } from "lucide-react";
import { BilletoLogo } from "@/components/ui/logo";

const footerLinks = {
    producto: [
        { href: "/product", label: "Funcionalidades" },
        { href: "/pricing", label: "Planes" },
        { href: "/manifesto", label: "Manifiesto" },
    ],
    recursos: [
        { href: "/blog", label: "Blog" },
        { href: "/faq", label: "Preguntas frecuentes" },
        { href: "/contact", label: "Contacto" },
    ],
    legal: [
        { href: "/privacy", label: "Privacidad" },
        { href: "/terms", label: "Términos" },
        { href: "/security", label: "Seguridad" },
    ],
};

export function Footer() {
    return (
        <footer className="relative border-t border-white/[0.06] bg-zinc-950">
            {/* Línea gradiente superior */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-lime-400/20 to-transparent" />

            <div className="container mx-auto px-4 py-14 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2 space-y-5">
                        <Link href="/" className="inline-block">
                            <BilletoLogo />
                        </Link>
                        <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                            Tu asistente financiero impulsado por inteligencia artificial.
                            Controla tus finanzas con cero fricción.
                        </p>
                        <div className="flex gap-3">
                            {[
                                { Icon: Twitter, href: "#" },
                                { Icon: Instagram, href: "#" },
                                { Icon: Github, href: "#" },
                            ].map(({ Icon, href }) => (
                                <Link
                                    key={href + Icon.displayName}
                                    href={href}
                                    className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <Icon className="w-4 h-4" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Links Producto */}
                    <div>
                        <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-4">Producto</h3>
                        <ul className="space-y-2.5">
                            {footerLinks.producto.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-zinc-500 hover:text-white transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Links Recursos */}
                    <div>
                        <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-4">Recursos</h3>
                        <ul className="space-y-2.5">
                            {footerLinks.recursos.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-zinc-500 hover:text-white transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Links Legal */}
                    <div>
                        <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-4">Legal</h3>
                        <ul className="space-y-2.5">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-zinc-500 hover:text-white transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-14 pt-7 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-zinc-600">
                        © {new Date().getFullYear()} Billeto Finanzas. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-xs text-zinc-600">Todos los sistemas operativos</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BilletoLogo } from "@/components/ui/logo";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
    { href: "/product", label: "Producto" },
    { href: "/pricing", label: "Planes" },
    { href: "/blog", label: "Blog" },
    { href: "/manifesto", label: "Manifiesto" },
];

export function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <>
            <header
                className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                    ? "border-b border-white/[0.06] bg-zinc-950/90 backdrop-blur-xl shadow-lg shadow-black/20"
                    : "bg-transparent"
                    }`}
            >
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity">
                        <BilletoLogo />
                    </Link>

                    {/* Nav Desktop */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="hidden sm:inline-flex text-sm font-medium text-zinc-300 hover:text-white transition-colors px-4 py-2"
                        >
                            Entrar
                        </Link>
                        <Link href="/register">
                            <Button className="bg-lime-400 text-zinc-950 font-semibold hover:bg-lime-300 transition-all rounded-lg text-sm px-5">
                                Empezar ahora
                            </Button>
                        </Link>

                        {/* Hamburger Mobile */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-x-0 top-16 z-40 bg-zinc-950/95 backdrop-blur-xl border-b border-white/[0.06] md:hidden"
                    >
                        <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="h-px bg-white/5 my-2" />
                            <Link
                                href="/login"
                                onClick={() => setMobileOpen(false)}
                                className="px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                            >
                                Entrar
                            </Link>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

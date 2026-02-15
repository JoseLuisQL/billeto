import Link from "next/link";
import { Twitter, Instagram, Linkedin, Github } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-zinc-950 text-muted-foreground">
            <div className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <Link href="/" className="text-xl font-bold tracking-tighter text-white">
                            BILLETO
                        </Link>
                        <p className="text-sm leading-relaxed max-w-xs">
                            Tu asistente financiero impulsado por IA. Controla tus gastos desde WhatsApp con cero fricción.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="hover:text-white transition-colors">
                                <Instagram className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-medium mb-4">Producto</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/features" className="hover:text-white transition-colors">Funcionalidades</Link></li>
                            <li><Link href="/pricing" className="hover:text-white transition-colors">Planes</Link></li>
                            <li><Link href="/integrations" className="hover:text-white transition-colors">Integraciones</Link></li>
                            <li><Link href="/manifesto" className="hover:text-white transition-colors">Manifiesto</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-medium mb-4">Recursos</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link href="/help" className="hover:text-white transition-colors">Centro de Ayuda</Link></li>
                            <li><Link href="/community" className="hover:text-white transition-colors">Comunidad</Link></li>
                            <li><Link href="/status" className="hover:text-white transition-colors">Estado del sistema</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-medium mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">Términos</Link></li>
                            <li><Link href="/security" className="hover:text-white transition-colors">Seguridad</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p>© {new Date().getFullYear()} Billeto Finanzas. Todos los derechos reservados.</p>
                    <div className="flex gap-6">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Sistemas operativos
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

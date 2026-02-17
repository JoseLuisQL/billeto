import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BilletoLogo } from "@/components/ui/logo";

export function Header() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity">
                    <BilletoLogo />
                </Link>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground/80">
                    <Link href="/product" className="hover:text-white transition-colors">
                        Producto
                    </Link>
                    <Link href="/pricing" className="hover:text-white transition-colors">
                        Planes
                    </Link>
                    <Link href="/blog" className="hover:text-white transition-colors">
                        Blog
                    </Link>
                    <Link href="/manifesto" className="hover:text-white transition-colors">
                        Manifiesto
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-medium text-white hover:text-white/80 transition-colors">
                        Entrar
                    </Link>
                    <Link href="/register">
                        <Button className="bg-primary text-black hover:bg-primary/90 font-medium">
                            Empezar ahora
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}

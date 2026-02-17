import { Pricing as PricingSection } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";

/**
 * Página dedicada de Planes y Precios.
 * Reutiliza los componentes Pricing y FAQ del landing.
 */
export default function PricingPage() {
    return (
        <>
            <PricingSection />
            <FAQ />
        </>
    );
}

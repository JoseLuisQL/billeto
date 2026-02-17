import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { Stats } from "@/components/landing/Stats";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Business } from "@/components/landing/Business";
import { CTA } from "@/components/landing/CTA";

/**
 * Página principal (Landing Page) de Billeto.
 * Compuesta por todas las secciones públicas en orden:
 * Hero → Social Proof → Stats → Features → Pricing → Business → FAQ → CTA
 */
export default function Home() {
  return (
    <>
      <Hero />
      <SocialProof />
      <Stats />
      <Features />
      <Pricing />
      <Business />
      <FAQ />
      <CTA />
    </>
  );
}

import { Suspense } from "react";
import { Bot, Cpu, Wrench, FileText, Shield } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ProvidersTableClient } from "@/components/admin/ai/ProvidersTableClient";
import { ToolsTableClient } from "@/components/admin/ai/ToolsTableClient";
import { SystemPromptEditor } from "@/components/admin/ai/SystemPromptEditor";
import { PromptGuardConfigClient } from "@/components/admin/ai/PromptGuardConfigClient";
import {
    listarProveedoresIAAdmin,
    listarToolsIAAdmin,
    obtenerSystemPromptAdmin,
    obtenerPromptGuardConfigAdmin,
} from "@/lib/actions/admin/ai";

export default async function AdminAIPage() {
    return (
        <div className="space-y-8">
            <AdminPageHeader
                title="Inteligencia Artificial"
                description="Gestión de proveedores, system prompts, herramientas y protección anti-inyección."
                icon={Bot}
            />

            <Section icon={Cpu} title="Proveedores de IA" description="Configuración de modelos y API keys">
                <Suspense fallback={<SectionSkeleton />}>
                    <ProvidersSection />
                </Suspense>
            </Section>

            <Section icon={FileText} title="System Prompt" description="Prompt base del asistente de IA">
                <Suspense fallback={<SectionSkeleton />}>
                    <SystemPromptSection />
                </Suspense>
            </Section>

            <Section icon={Wrench} title="Herramientas del Agente" description="Tools disponibles para el agente IA">
                <Suspense fallback={<SectionSkeleton />}>
                    <ToolsSection />
                </Suspense>
            </Section>

            <Section icon={Shield} title="Seguridad de Prompts" description="Configuración del prompt guard">
                <Suspense fallback={<SectionSkeleton />}>
                    <PromptGuardSection />
                </Suspense>
            </Section>
        </div>
    );
}

async function ProvidersSection() {
    const providers = await listarProveedoresIAAdmin();
    return <ProvidersTableClient providers={providers} />;
}

async function SystemPromptSection() {
    const { prompt, updatedAt } = await obtenerSystemPromptAdmin();
    return <SystemPromptEditor initialPrompt={prompt} updatedAt={updatedAt} />;
}

async function ToolsSection() {
    const tools = await listarToolsIAAdmin();
    return <ToolsTableClient tools={tools} />;
}

async function PromptGuardSection() {
    const config = await obtenerPromptGuardConfigAdmin();
    return <PromptGuardConfigClient config={config} />;
}

function Section({ icon: Icon, title, description, children }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-400/10 text-cyan-100">
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
                    <p className="text-xs text-zinc-500">{description}</p>
                </div>
            </div>
            {children}
        </section>
    );
}

function SectionSkeleton() {
    return <div className="h-48 animate-pulse rounded-2xl border border-white/10 bg-[#0b1220]/80" />;
}

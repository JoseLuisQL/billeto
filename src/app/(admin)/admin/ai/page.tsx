import { Suspense } from "react";
import { Bot, Cpu, Wrench, FileText, Shield } from "lucide-react";
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Inteligencia Artificial</h1>
                    <p className="mt-1 text-sm text-zinc-500">Gestión de proveedores, prompts, herramientas y seguridad</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
                    <Bot className="h-5 w-5 text-purple-400" />
                </div>
            </div>

            {/* Providers Section */}
            <Section icon={Cpu} title="Proveedores de IA" description="Configuración de modelos y API keys">
                <Suspense fallback={<SectionSkeleton />}>
                    <ProvidersSection />
                </Suspense>
            </Section>

            {/* System Prompt Section */}
            <Section icon={FileText} title="System Prompt" description="Prompt base del asistente de IA">
                <Suspense fallback={<SectionSkeleton />}>
                    <SystemPromptSection />
                </Suspense>
            </Section>

            {/* Tools Section */}
            <Section icon={Wrench} title="Herramientas del Agente" description="Tools disponibles para el agente IA">
                <Suspense fallback={<SectionSkeleton />}>
                    <ToolsSection />
                </Suspense>
            </Section>

            {/* Prompt Guard Section */}
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
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-zinc-500" />
                <div>
                    <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
                    <p className="text-xs text-zinc-500">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

function SectionSkeleton() {
    return <div className="h-48 animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/50" />;
}

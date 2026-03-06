import { cn } from "@/lib/utils";

export type AdminTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const badgeBaseClass =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.02em]";

const iconBaseClass =
  "flex h-10 w-10 items-center justify-center rounded-2xl border";

const toneClasses: Record<AdminTone, string> = {
  neutral:
    "border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] text-[color:var(--admin-text-muted)]",
  accent:
    "border-[color:var(--admin-accent-soft)] bg-[color:var(--admin-accent-soft)] text-[color:var(--admin-accent-strong)]",
  success:
    "border-[color:var(--admin-success-soft)] bg-[color:var(--admin-success-soft)] text-[color:var(--admin-success)]",
  warning:
    "border-[color:var(--admin-warning-soft)] bg-[color:var(--admin-warning-soft)] text-[color:var(--admin-warning)]",
  danger:
    "border-[color:var(--admin-danger-soft)] bg-[color:var(--admin-danger-soft)] text-[color:var(--admin-danger)]",
  info:
    "border-[color:var(--admin-info-soft)] bg-[color:var(--admin-info-soft)] text-[color:var(--admin-info)]",
};

export const adminPanelClass =
  "rounded-[22px] border border-[color:var(--admin-border)] bg-[color:var(--admin-surface)] shadow-[var(--admin-shadow)]";

export const adminPanelMutedClass = cn(
  adminPanelClass,
  "bg-[color:var(--admin-surface-muted)]",
);

export const adminSectionHeaderClass =
  "flex items-center gap-3 rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-4 py-3";

export const adminInputClass =
  "w-full rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-3 py-2.5 text-sm text-[color:var(--admin-text)] placeholder:text-[color:var(--admin-text-subtle)] outline-none transition-[border-color,background-color,box-shadow,color] focus:border-[color:var(--admin-border-strong)] focus:bg-[color:var(--admin-surface)] focus:ring-4 focus:ring-[color:var(--admin-accent-soft)]";

export const adminIconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] text-[color:var(--admin-text-muted)] transition-[border-color,background-color,color,transform] hover:border-[color:var(--admin-border-strong)] hover:bg-[color:var(--admin-surface)] hover:text-[color:var(--admin-text)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--admin-accent-soft)]";

export const adminTextButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-muted)] px-3 py-2 text-sm font-medium text-[color:var(--admin-text-muted)] transition-[border-color,background-color,color,transform] hover:border-[color:var(--admin-border-strong)] hover:bg-[color:var(--admin-surface)] hover:text-[color:var(--admin-text)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--admin-accent-soft)] disabled:pointer-events-none disabled:opacity-45";

export const adminPrimaryButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-transparent bg-[color:var(--admin-accent)] px-4 py-2 text-sm font-medium text-slate-950 transition-[background-color,transform] hover:bg-[color:var(--admin-accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--admin-accent-soft)] disabled:pointer-events-none disabled:opacity-45";

export const adminLinkClass =
  "font-medium text-[color:var(--admin-accent)] transition-colors hover:text-[color:var(--admin-accent-strong)]";

export function getAdminBadgeClasses(tone: AdminTone) {
  return cn(badgeBaseClass, toneClasses[tone]);
}

export function getAdminIconBadgeClasses(tone: AdminTone) {
  return cn(iconBaseClass, toneClasses[tone]);
}

export function getPlanTone(plan: string | null | undefined): AdminTone {
  switch (plan) {
    case "premium":
      return "warning";
    case "pro":
      return "accent";
    default:
      return "neutral";
  }
}

export function getPlanLabel(plan: string | null | undefined) {
  switch (plan) {
    case "premium":
      return "Premium";
    case "pro":
      return "Pro";
    default:
      return "Free";
  }
}

export function getSubscriptionStatusTone(status: string): AdminTone {
  switch (status) {
    case "active":
      return "success";
    case "cancelled":
      return "danger";
    case "trialing":
      return "info";
    default:
      return "neutral";
  }
}

export function getSubscriptionStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Activa";
    case "cancelled":
      return "Cancelada";
    case "trialing":
      return "Prueba";
    default:
      return status;
  }
}

export function getTransactionTypeTone(type: string): AdminTone {
  switch (type) {
    case "income":
      return "success";
    case "expense":
      return "danger";
    case "transfer":
      return "info";
    default:
      return "neutral";
  }
}

export function getTransactionTypeLabel(type: string) {
  switch (type) {
    case "income":
      return "Ingreso";
    case "expense":
      return "Gasto";
    case "transfer":
      return "Transferencia";
    default:
      return type;
  }
}

export function getBooleanTone(enabled: boolean): AdminTone {
  return enabled ? "success" : "neutral";
}

export function getBinaryStatusTone(active: boolean): AdminTone {
  return active ? "success" : "danger";
}

export function getIncidentSeverityTone(severity: string): AdminTone {
  switch (severity) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "info";
    default:
      return "neutral";
  }
}

export function getIncidentSeverityLabel(severity: string) {
  switch (severity) {
    case "critical":
      return "Crítica";
    case "high":
      return "Alta";
    case "medium":
      return "Media";
    case "low":
      return "Baja";
    default:
      return severity;
  }
}

export function getIncidentStatusLabel(status: string) {
  switch (status) {
    case "open":
      return "Abierto";
    case "resolved":
      return "Resuelto";
    default:
      return status;
  }
}

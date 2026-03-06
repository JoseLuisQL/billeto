"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AdminSwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "role" | "aria-checked"> {
  checked: boolean;
  label: string;
}

export function AdminSwitch({
  checked,
  label,
  className,
  disabled,
  ...props
}: AdminSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-[background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--admin-accent-soft)] disabled:pointer-events-none disabled:opacity-45",
        checked
          ? "border-[color:var(--admin-accent-soft)] bg-[color:var(--admin-accent)]"
          : "border-[color:var(--admin-border)] bg-[color:var(--admin-surface-elevated)]",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

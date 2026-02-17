"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (input: { title: string; description?: string; variant?: ToastVariant }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur",
        item.variant === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
        item.variant === "error" && "border-red-500/30 bg-red-500/10 text-red-100",
        item.variant === "info" && "border-white/10 bg-zinc-900/90 text-zinc-100"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{item.title}</p>
          {item.description ? <p className="mt-1 text-xs opacity-90">{item.description}</p> : null}
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-xs opacity-70 transition hover:opacity-100"
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: { title: string; description?: string; variant?: ToastVariant }) => {
    const id = crypto.randomUUID();
    const next: ToastItem = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "info",
    };

    setItems((prev) => [next, ...prev].slice(0, 4));

    setTimeout(() => {
      dismiss(id);
    }, 4500);
  }, [dismiss]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onClose={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }

  return context;
}

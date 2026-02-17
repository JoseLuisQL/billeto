"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export type DateRange = { from: Date; to: Date };

interface DateRangePickerProps {
  value: DateRange;
  onApply: (range: DateRange) => void;
}

const weekDays = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function sameDay(a: Date, b: Date) {
  return toKey(a) === toKey(b);
}

function inRange(d: Date, from: Date, to: Date) {
  const t = d.getTime();
  return t >= startOfDay(from).getTime() && t <= endOfDay(to).getTime();
}

function monthGrid(monthDate: Date) {
  const first = startOfMonth(monthDate);
  const firstWeekday = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function DateRangePicker({ value, onApply }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState<Date>(value.from);
  const [draftTo, setDraftTo] = useState<Date>(value.to);
  const [monthCursor, setMonthCursor] = useState<Date>(startOfMonth(value.to));
  const [lastDays, setLastDays] = useState("7");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const days = useMemo(() => monthGrid(monthCursor), [monthCursor]);

  const label = `${value.from.toLocaleDateString("es-PE")} ➜ ${value.to.toLocaleDateString("es-PE")}`;

  const applyPreset = (preset: "thisMonth" | "lastMonth" | "thisQuarter" | "lastQuarter" | "thisYear" | "lastYear" | "all") => {
    const now = new Date();
    if (preset === "thisMonth") {
      setDraftFrom(startOfMonth(now));
      setDraftTo(endOfDay(now));
      setMonthCursor(startOfMonth(now));
      return;
    }
    if (preset === "lastMonth") {
      const m = addMonths(now, -1);
      setDraftFrom(startOfMonth(m));
      setDraftTo(endOfMonth(m));
      setMonthCursor(startOfMonth(m));
      return;
    }
    if (preset === "thisQuarter") {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const s = new Date(now.getFullYear(), qStartMonth, 1);
      setDraftFrom(startOfDay(s));
      setDraftTo(endOfDay(now));
      setMonthCursor(startOfMonth(now));
      return;
    }
    if (preset === "lastQuarter") {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
      const s = new Date(now.getFullYear(), qStartMonth, 1);
      const e = new Date(now.getFullYear(), qStartMonth + 3, 0, 23, 59, 59, 999);
      setDraftFrom(startOfDay(s));
      setDraftTo(e);
      setMonthCursor(startOfMonth(s));
      return;
    }
    if (preset === "thisYear") {
      const s = new Date(now.getFullYear(), 0, 1);
      setDraftFrom(startOfDay(s));
      setDraftTo(endOfDay(now));
      setMonthCursor(startOfMonth(now));
      return;
    }
    if (preset === "lastYear") {
      const y = now.getFullYear() - 1;
      setDraftFrom(new Date(y, 0, 1));
      setDraftTo(new Date(y, 11, 31, 23, 59, 59, 999));
      setMonthCursor(new Date(y, 11, 1));
      return;
    }

    setDraftFrom(new Date(2020, 0, 1));
    setDraftTo(endOfDay(now));
    setMonthCursor(startOfMonth(now));
  };

  const applyLastDays = () => {
    const daysNum = Math.max(1, Number(lastDays) || 1);
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - (daysNum - 1));
    setDraftFrom(startOfDay(from));
    setDraftTo(endOfDay(now));
    setMonthCursor(startOfMonth(now));
  };

  const handleDayClick = (day: Date) => {
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(startOfDay(day));
      setDraftTo(startOfDay(day));
      return;
    }

    if (day.getTime() < draftFrom.getTime()) {
      setDraftTo(endOfDay(draftFrom));
      setDraftFrom(startOfDay(day));
    } else {
      setDraftTo(endOfDay(day));
    }
  };

  const cancel = () => {
    setDraftFrom(value.from);
    setDraftTo(value.to);
    setMonthCursor(startOfMonth(value.to));
    setOpen(false);
  };

  const apply = () => {
    onApply({ from: startOfDay(draftFrom), to: endOfDay(draftTo) });
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800/80"
      >
        <CalendarDays className="h-4 w-4" />
        <span>{label}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-[740px] max-w-[92vw] rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-2xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
            <div className="space-y-1 border-b border-white/10 pb-3 md:border-b-0 md:border-r md:pb-0 md:pr-4">
              {[
                ["Este mes", "thisMonth"],
                ["El mes pasado", "lastMonth"],
                ["Este trimestre", "thisQuarter"],
                ["El trimestre pasado", "lastQuarter"],
                ["Lo que va del año", "thisYear"],
                ["El año pasado", "lastYear"],
                ["Todo el historial", "all"],
              ].map(([labelText, key]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key as "thisMonth")}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  {labelText}
                </button>
              ))}

              <div className="mt-2 border-t border-white/10 pt-3">
                <p className="mb-2 text-sm text-zinc-400">Últimos</p>
                <div className="flex items-center gap-2">
                  <input
                    value={lastDays}
                    onChange={(e) => setLastDays(e.target.value)}
                    className="w-16 rounded-md border border-white/10 bg-zinc-800 px-2 py-2 text-sm text-zinc-100"
                  />
                  <span className="rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-300">días</span>
                  <button onClick={applyLastDays} className="text-sm font-medium text-zinc-200 hover:text-white">
                    Aplicar
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <button onClick={() => setMonthCursor((m) => addMonths(m, -1))} className="rounded-md border border-white/10 p-2 text-zinc-300 hover:bg-zinc-800">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="text-sm font-medium text-zinc-100">
                  {monthCursor.toLocaleDateString("es-PE", { month: "long", year: "numeric" })}
                </p>
                <button onClick={() => setMonthCursor((m) => addMonths(m, 1))} className="rounded-md border border-white/10 p-2 text-zinc-300 hover:bg-zinc-800">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs text-zinc-500">
                {weekDays.map((wd) => (
                  <span key={wd}>{wd}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const isCurrentMonth = day.getMonth() === monthCursor.getMonth();
                  const isStart = sameDay(day, draftFrom);
                  const isEnd = sameDay(day, draftTo);
                  const selected = inRange(day, draftFrom, draftTo);

                  return (
                    <button
                      key={toKey(day)}
                      onClick={() => handleDayClick(day)}
                      className={`h-9 rounded-md text-sm transition-colors ${
                        isStart || isEnd
                          ? "bg-lime-400 text-black font-semibold"
                          : selected
                            ? "bg-lime-400/20 text-lime-200"
                            : isCurrentMonth
                              ? "text-zinc-200 hover:bg-zinc-800"
                              : "text-zinc-600"
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={cancel} className="rounded-md px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                  Cancelar
                </button>
                <button onClick={apply} className="rounded-md bg-lime-500 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-400">
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

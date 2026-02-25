"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

type RecurringDate = {
    day: number;
    name: string;
    type?: string;
};

interface RecurringMiniCalendarProps {
    recurringDates?: RecurringDate[];
}

export function RecurringMiniCalendar({ recurringDates = [] }: RecurringMiniCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];

    const dayNames = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

    // Group recurring dates by day for tooltip
    const recurringByDay = useMemo(() => {
        const map = new Map<number, RecurringDate[]>();
        for (const r of recurringDates) {
            const arr = map.get(r.day) || [];
            arr.push(r);
            map.set(r.day, arr);
        }
        return map;
    }, [recurringDates]);

    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startWeekDay = (firstDay.getDay() + 6) % 7; // Monday = 0
        const daysInMonth = lastDay.getDate();

        const days: { day: number; isCurrentMonth: boolean; isToday: boolean; hasRecurring: boolean; isWeekend: boolean }[] = [];

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startWeekDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                isToday: false,
                hasRecurring: false,
                isWeekend: false,
            });
        }

        // Current month days
        const today = new Date();
        const recurringDaySet = new Set(recurringDates.map((r) => r.day));
        for (let d = 1; d <= daysInMonth; d++) {
            const dow = (days.length % 7);
            days.push({
                day: d,
                isCurrentMonth: true,
                isToday:
                    d === today.getDate() &&
                    month === today.getMonth() &&
                    year === today.getFullYear(),
                hasRecurring: recurringDaySet.has(d),
                isWeekend: dow === 5 || dow === 6, // sá, do
            });
        }

        // Next month days to complete the grid
        const remaining = 7 - (days.length % 7);
        if (remaining < 7) {
            for (let d = 1; d <= remaining; d++) {
                const dow = (days.length % 7);
                days.push({
                    day: d,
                    isCurrentMonth: false,
                    isToday: false,
                    hasRecurring: false,
                    isWeekend: dow === 5 || dow === 6,
                });
            }
        }

        return days;
    }, [year, month, recurringDates]);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    return (
        <div className="rounded-xl border border-white/5 bg-zinc-900/30 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">
                        {monthNames[month]} {year}
                    </span>
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {dayNames.map((name, i) => (
                    <div
                        key={name}
                        className={`text-center text-[10px] font-medium uppercase py-1 ${i >= 5 ? "text-red-400/50" : "text-zinc-500"
                            }`}
                    >
                        {name}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, i) => {
                    const dayRecurrings = day.isCurrentMonth ? recurringByDay.get(day.day) : undefined;
                    const isHovered = hoveredDay === i && dayRecurrings && dayRecurrings.length > 0;

                    return (
                        <div
                            key={i}
                            className="relative"
                            onMouseEnter={() => setHoveredDay(i)}
                            onMouseLeave={() => setHoveredDay(null)}
                        >
                            <div
                                className={`
                                    relative text-center text-xs py-1.5 rounded-lg transition-all duration-200
                                    ${!day.isCurrentMonth ? "text-zinc-700" : ""}
                                    ${day.isCurrentMonth && !day.isToday && !day.hasRecurring ? (day.isWeekend ? "text-red-400/60" : "text-zinc-300") : ""}
                                    ${day.isToday ? "bg-[#D3FF0A] text-black font-bold shadow-[0_0_8px_rgba(211,255,10,0.3)]" : ""}
                                    ${day.hasRecurring && !day.isToday ? "text-[#D3FF0A] font-semibold bg-[#D3FF0A]/5 border border-[#D3FF0A]/10" : ""}
                                    ${day.isCurrentMonth && !day.isToday ? "hover:bg-white/5 cursor-default" : ""}
                                `}
                            >
                                {day.day}
                                {day.hasRecurring && !day.isToday && (
                                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D3FF0A] shadow-[0_0_4px_rgba(211,255,10,0.5)]" />
                                )}
                            </div>

                            {/* Tooltip for recurring dates */}
                            {isHovered && dayRecurrings && (
                                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-white/10 shadow-xl whitespace-nowrap">
                                    {dayRecurrings.map((r, j) => (
                                        <div key={j} className="flex items-center gap-1.5 text-[10px]">
                                            <span className="w-1 h-1 rounded-full bg-[#D3FF0A]" />
                                            <span className="text-zinc-200">{r.name}</span>
                                        </div>
                                    ))}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-800" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            {recurringDates.length > 0 && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#D3FF0A]" />
                        <span className="text-[10px] text-zinc-500">Hoy</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm bg-[#D3FF0A]/20 border border-[#D3FF0A]/20" />
                        <span className="text-[10px] text-zinc-500">Cobro programado</span>
                    </div>
                </div>
            )}
        </div>
    );
}

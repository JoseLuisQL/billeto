"use client";

type StreakDay = {
  date: string;
  count: number;
};

interface StreakHeatmapProps {
  days: StreakDay[];
  maxStreak: number;
  totalInWindow: number;
}

function formatRelativeLabel(dateIso: string, lastDateIso: string) {
  const date = new Date(dateIso);
  const last = new Date(lastDateIso);
  const diff = Math.round((last.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const dia = diff === 0 ? "Hoy" : `Hace ${diff} días`;
  return dia;
}

export function StreakHeatmap({ days, maxStreak, totalInWindow }: StreakHeatmapProps) {
  const lastDate = days[days.length - 1]?.date;

  return (
    <div>
      <p className="mb-3 text-sm leading-relaxed text-zinc-300">
        En los últimos 30 días tienes {totalInWindow} transacciones y una racha máxima de
        <span className="font-semibold text-emerald-400"> {maxStreak} días</span>.
      </p>

      <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1 rounded-md bg-zinc-900/30 p-2">
        {days.map((d) => {
          const level = d.count === 0 ? "bg-zinc-800" : d.count === 1 ? "bg-emerald-700/80" : "bg-emerald-500";
          const tooltip = d.count === 0 ? `${formatRelativeLabel(d.date, lastDate)}: No registraste transacciones` : `${formatRelativeLabel(d.date, lastDate)}: ${d.count} transacción${d.count > 1 ? "es" : ""}`;

          return (
            <div key={d.date} className="group relative">
              <div className={`h-8 w-full rounded-[3px] ${level}`} />
              <div className="pointer-events-none absolute -top-11 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-100 px-3 py-1 text-xs text-zinc-900 shadow-lg group-hover:block">
                {tooltip}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>Hace 30 días</span>
        <span>Hoy</span>
      </div>
    </div>
  );
}

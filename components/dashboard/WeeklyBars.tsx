'use client'

import { motion } from 'framer-motion'

const WEEKDAY_SHORT = ['日', '月', '火', '水', '木', '金', '土']

export function WeeklyBars({
  perDay,
}: {
  perDay: Array<{ date: string; minutes: number }>
}) {
  const max = Math.max(60, ...perDay.map((d) => d.minutes))
  const todayIso = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

  return (
    <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-text">この1週間</h2>
        <span className="text-[11px] text-text-dim font-num">最大 {Math.round(max)}分</span>
      </header>
      <div className="flex items-end justify-between gap-1.5 h-32 pt-2">
        {perDay.map((d, idx) => {
          const heightPct = max > 0 ? (d.minutes / max) * 100 : 0
          const dt = new Date(d.date + 'T00:00:00')
          const isToday = d.date === todayIso
          const labelDay = WEEKDAY_SHORT[dt.getDay()]
          return (
            <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1">
              <div className="relative flex-1 w-full flex flex-col justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{
                    duration: 0.7,
                    delay: idx * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`w-full rounded-t-md ${
                    isToday
                      ? 'bg-accent shadow-[0_2px_12px_rgba(30,64,175,0.35)]'
                      : d.minutes > 0
                        ? 'bg-accent/55'
                        : 'bg-surface-overlay'
                  }`}
                  style={{ minHeight: d.minutes > 0 ? 4 : 2 }}
                />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isToday ? 'text-accent' : 'text-text-dim'
                }`}
              >
                {labelDay}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

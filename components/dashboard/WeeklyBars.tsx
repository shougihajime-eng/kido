'use client'

import { motion } from 'framer-motion'

const WEEKDAY_SHORT = ['日', '月', '火', '水', '木', '金', '土']

export type WeeklyBarDay = {
  date: string
  shogi: number
  life: number
}

export function WeeklyBars({ perDay }: { perDay: WeeklyBarDay[] }) {
  // 各日の合計（将棋＋生活）を出し、グラフのスケールはこの合計の最大値で決める
  const totals = perDay.map((d) => d.shogi + d.life)
  const max = Math.max(60, ...totals)
  const todayIso = new Date(new Date().getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const weekShogi = perDay.reduce((s, d) => s + d.shogi, 0)
  const weekLife = perDay.reduce((s, d) => s + d.life, 0)

  return (
    <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-text">この1週間</h2>
        <span className="text-[11px] text-text-dim font-num">最大 {Math.round(max)}分</span>
      </header>

      {/* 凡例（将棋 / 生活）と週合計 */}
      <div className="flex items-center justify-between gap-2 text-[11px] font-mincho">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-text-muted">
            <span className="inline-block w-3 h-3 rounded-sm bg-accent" />
            将棋
            <span className="font-num text-accent">{weekShogi}分</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-dim">
            <span className="inline-block w-3 h-3 rounded-sm bg-cat-life-school/55" />
            生活
            <span className="font-num">{weekLife}分</span>
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1.5 h-32 pt-2">
        {perDay.map((d, idx) => {
          const total = d.shogi + d.life
          const totalPct = max > 0 ? (total / max) * 100 : 0
          // 棒の中で「将棋」が下、その上に「生活」を積む
          const shogiPct = total > 0 ? (d.shogi / total) * 100 : 0
          const lifePct = total > 0 ? (d.life / total) * 100 : 0
          const dt = new Date(d.date + 'T00:00:00')
          const isToday = d.date === todayIso
          const labelDay = WEEKDAY_SHORT[dt.getDay()]
          return (
            <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1">
              <div className="relative flex-1 w-full flex flex-col justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${totalPct}%` }}
                  transition={{
                    duration: 0.7,
                    delay: idx * 0.06,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="w-full flex flex-col-reverse rounded-t-md overflow-hidden"
                  style={{ minHeight: total > 0 ? 4 : 2 }}
                >
                  {/* 将棋（下・濃い藍）*/}
                  {d.shogi > 0 && (
                    <div
                      className={`w-full ${
                        isToday
                          ? 'bg-accent shadow-[0_2px_12px_rgba(30,64,175,0.35)]'
                          : 'bg-accent/75'
                      }`}
                      style={{ height: `${shogiPct}%` }}
                    />
                  )}
                  {/* 生活（上・くすみ色）*/}
                  {d.life > 0 && (
                    <div
                      className="w-full bg-cat-life-school/55"
                      style={{ height: `${lifePct}%` }}
                    />
                  )}
                  {/* どちらも0なら極薄ベース */}
                  {total === 0 && (
                    <div className="w-full bg-surface-overlay" style={{ height: '100%' }} />
                  )}
                </motion.div>
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

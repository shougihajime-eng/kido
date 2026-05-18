'use client'

import { motion } from 'framer-motion'

const COLOR_VAR = (token: string) => `var(--${token})`

export function CategoryBreakdown({
  items,
}: {
  items: Array<{ category_id: string; name_ja: string; color_token: string; minutes: number }>
}) {
  const total = items.reduce((a, b) => a + b.minutes, 0)
  if (total === 0) return null

  return (
    <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-text">今週の内訳</h2>
        <span className="text-[11px] text-text-dim font-num">{total}分</span>
      </header>
      {/* 横長スタックバー */}
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-surface-elevated">
        {items.map((it, idx) => {
          const pct = (it.minutes / total) * 100
          return (
            <motion.div
              key={it.category_id}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{
                duration: 0.7,
                delay: idx * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ backgroundColor: COLOR_VAR(it.color_token) }}
              title={`${it.name_ja} ${it.minutes}分`}
            />
          )
        })}
      </div>
      {/* 凡例 */}
      <ul className="flex flex-col gap-1.5 mt-1">
        {items.map((it) => {
          const pct = total > 0 ? (it.minutes / total) * 100 : 0
          return (
            <li key={it.category_id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: COLOR_VAR(it.color_token) }}
                  aria-hidden
                />
                <span className="text-text">{it.name_ja}</span>
              </div>
              <span className="text-text-muted font-num text-xs">
                {it.minutes}分 <span className="text-text-dim">/ {Math.round(pct)}%</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

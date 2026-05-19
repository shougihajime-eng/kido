'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { setMoodAction } from '@/lib/mood/actions'

type MoodRecord = { date: string; score: number }

interface Props {
  todayScore: number | null
  recent: MoodRecord[] // 直近7日（古→新）
}

const MOODS = [
  { score: 1, emoji: '😩', label: 'つらい', color: 'text-rose-400' },
  { score: 2, emoji: '😕', label: 'まあまあ', color: 'text-orange-300' },
  { score: 3, emoji: '😐', label: 'ふつう', color: 'text-amber-300' },
  { score: 4, emoji: '🙂', label: 'いい', color: 'text-lime-300' },
  { score: 5, emoji: '😄', label: '絶好調', color: 'text-emerald-300' }
]

export function MoodQuickLog({ todayScore, recent }: Props) {
  const [selected, setSelected] = useState<number | null>(todayScore)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onPick = (score: number) => {
    setError(null)
    setSelected(score)
    startTransition(async () => {
      const res = await setMoodAction({ score })
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-text-muted">今日の調子</span>
        {selected != null && (
          <span className="text-xs text-text-dim font-num">
            {MOODS.find((m) => m.score === selected)?.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {MOODS.map((m) => {
          const isActive = selected === m.score
          return (
            <motion.button
              key={m.score}
              type="button"
              whileTap={{ scale: 0.92 }}
              animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              onClick={() => onPick(m.score)}
              disabled={isPending}
              className="hover-lift flex flex-col items-center gap-1 rounded-xl border py-3 min-h-[52px] transition-colors disabled:opacity-60"
              style={{
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--surface-elevated)'
              }}
              aria-label={`${m.label}（${m.score}/5）`}
            >
              <span className={`text-2xl ${isActive ? '' : 'grayscale-[20%] opacity-80'}`}>
                {m.emoji}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* 直近7日の波 */}
      {recent.length > 0 && (
        <div className="flex items-end gap-1 h-10 mt-1">
          {recent.map((r) => {
            const m = MOODS.find((x) => x.score === r.score)
            return (
              <div
                key={r.date}
                className="flex-1 flex flex-col items-center justify-end gap-0.5"
                title={`${r.date}: ${m?.label ?? ''}`}
              >
                <span className="text-base leading-none">{m?.emoji ?? '·'}</span>
              </div>
            )
          })}
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </section>
  )
}

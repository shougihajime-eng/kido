'use client'

import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/app/components/AnimatedNumber'

export function StatTiles({
  streakDays,
  weekTotalMinutes,
}: {
  streakDays: number
  weekTotalMinutes: number
}) {
  const onFire = streakDays >= 3
  const weekHours = Math.floor(weekTotalMinutes / 60)
  const weekMins = weekTotalMinutes % 60

  return (
    <section className="grid grid-cols-2 gap-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2"
      >
        <span className="text-xs text-text-muted">連続日数</span>
        <div className="flex items-baseline gap-2">
          <AnimatedNumber
            value={streakDays}
            className={`text-4xl font-bold font-num ${
              onFire ? 'text-fire' : streakDays > 0 ? 'text-text' : 'text-text-dim'
            }`}
          />
          <span
            className={`text-2xl ${onFire ? 'flame-flicker' : streakDays > 0 ? '' : 'opacity-40 grayscale'}`}
            aria-hidden
          >
            🔥
          </span>
        </div>
        <span className="text-[11px] text-text-dim">{streakDays === 0 ? 'まだ始めてない' : '日'}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2"
      >
        <span className="text-xs text-text-muted">今週合計</span>
        <div className="flex items-baseline gap-1">
          {weekHours > 0 ? (
            <>
              <AnimatedNumber value={weekHours} className="text-4xl font-bold font-num text-text" />
              <span className="text-xl text-text-muted font-num">h</span>
              {weekMins > 0 && (
                <>
                  <AnimatedNumber value={weekMins} className="text-2xl font-bold font-num text-text-muted ml-1" />
                  <span className="text-sm text-text-muted font-num">分</span>
                </>
              )}
            </>
          ) : (
            <>
              <AnimatedNumber value={weekMins} className="text-4xl font-bold font-num text-text" />
              <span className="text-xl text-text-muted font-num">分</span>
            </>
          )}
        </div>
        <span className="text-[11px] text-text-dim">月〜日</span>
      </motion.div>
    </section>
  )
}

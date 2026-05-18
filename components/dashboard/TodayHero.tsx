'use client'

import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/app/components/AnimatedNumber'

export function TodayHero({
  totalMinutes,
  recordCount,
}: {
  totalMinutes: number
  recordCount: number
}) {
  const hasRecord = totalMinutes > 0
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-2 overflow-hidden"
    >
      {/* 背景の薄いグロー */}
      {hasRecord && (
        <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,162,76,0.25)_0%,transparent_60%)]" />
        </div>
      )}

      <span className="text-sm text-text-muted relative">今日の合計</span>

      <div className="flex items-baseline gap-2 relative">
        {hours > 0 && (
          <>
            <AnimatedNumber value={hours} className="text-7xl font-bold font-num gold-glow leading-none" />
            <span className="text-2xl text-accent font-num">h</span>
          </>
        )}
        {(mins > 0 || hours === 0) && (
          <>
            <AnimatedNumber
              value={mins || (hours === 0 ? 0 : mins)}
              className={`text-7xl font-bold font-num leading-none ${
                hasRecord ? 'gold-glow pulse-glow' : 'text-text-dim'
              }`}
            />
            <span className={`text-2xl font-num ${hasRecord ? 'text-accent' : 'text-text-dim'}`}>
              分
            </span>
          </>
        )}
      </div>

      {hasRecord ? (
        <span className="text-xs text-text-muted relative">
          {recordCount}回の記録
        </span>
      ) : (
        <span className="text-xs text-text-dim relative">まだ記録なし — 始めよう</span>
      )}
    </motion.section>
  )
}

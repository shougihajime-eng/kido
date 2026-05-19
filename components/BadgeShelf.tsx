'use client'

import { motion } from 'framer-motion'
import { Flame, Star, Crown, Check, type LucideIcon } from 'lucide-react'
import { getCategoryIcon } from '@/lib/category-icon'

type IconMapKey = 'flame' | 'star' | 'crown' | 'check' | string

const BUILTIN: Record<string, LucideIcon> = {
  flame: Flame,
  star: Star,
  crown: Crown,
  check: Check,
}

export type BadgeView = {
  id: string
  name: string
  description: string
  icon_key: IconMapKey
  earned: boolean
  earned_at: string | null
}

export function BadgeShelf({ badges }: { badges: BadgeView[] }) {
  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-text">バッジ</h2>
        <span className="text-xs text-text-dim font-num">
          {earnedCount} / {badges.length}
        </span>
      </header>

      <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {badges.map((b, i) => {
          const Icon = BUILTIN[b.icon_key] ?? getCategoryIcon(b.icon_key)
          return (
            <motion.li
              key={b.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 p-2 ${
                b.earned
                  ? 'bg-accent-soft border-accent shadow-[0_2px_12px_rgba(30,64,175,0.18)]'
                  : 'bg-surface-elevated border-border opacity-50'
              }`}
              title={b.description}
            >
              {/* ロックグレースケール */}
              <Icon
                className={`w-8 h-8 ${b.earned ? 'text-accent' : 'text-text-dim'}`}
                strokeWidth={b.earned ? 2.4 : 1.6}
                fill={b.earned && b.icon_key === 'flame' ? 'currentColor' : 'none'}
              />
              <span
                className={`text-[10px] font-medium text-center leading-tight ${
                  b.earned ? 'text-text' : 'text-text-dim'
                }`}
              >
                {b.name}
              </span>
              {b.earned && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.03, type: 'spring', stiffness: 280 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </motion.div>
              )}
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}

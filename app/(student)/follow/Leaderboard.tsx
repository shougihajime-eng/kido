'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Trophy, UsersRound, Flame } from 'lucide-react'
import { toggleRivalAction } from './actions'

export interface LeaderRow {
  userId: string
  displayName: string
  levelLabel: string
  shogiMinutes: number
  totalMinutes: number
  activeDays: number
  isMe: boolean
  isRival: boolean
}

interface Props {
  rows: LeaderRow[]
  myShogiMinutes: number
  maxShogiMinutes: number
  myRank: number
  totalStudents: number
  weekStart: string
  weekEnd: string
}

type Tab = 'all' | 'rivals'

function formatRange(start: string, end: string): string {
  const s = start.slice(5).replace('-', '/')
  const e = end.slice(5).replace('-', '/')
  return `${s} 〜 ${e}`
}

export function Leaderboard({
  rows,
  myShogiMinutes,
  maxShogiMinutes,
  myRank,
  totalStudents,
  weekStart,
  weekEnd
}: Props) {
  const [tab, setTab] = useState<Tab>('all')

  const visible = tab === 'all' ? rows : rows.filter((r) => r.isRival || r.isMe)
  const rivalCount = rows.filter((r) => r.isRival).length

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">仲間・ライバル</h1>
        <p className="text-base text-text-muted mt-1">
          みんなの今週の練習時間（{formatRange(weekStart, weekEnd)}）
        </p>
      </header>

      {/* 自分のヒーローカード */}
      <section className="bg-surface border-2 border-accent rounded-3xl p-6 md:p-8 flex flex-col items-center gap-3 card-shadow">
        <span className="text-sm text-text-muted">あなたの今週（将棋のみ）</span>
        <div className="flex items-baseline gap-2">
          <span className="font-num text-display font-bold gold-glow tabular-nums">
            {Math.round(myShogiMinutes / 60)}
          </span>
          <span className="text-2xl text-accent font-num">h</span>
          <span className="text-2xl font-num text-text-muted">
            {myShogiMinutes % 60}
          </span>
          <span className="text-base text-text-muted">分</span>
        </div>
        {totalStudents > 0 && (
          <div className="text-sm text-text-muted flex items-center gap-2">
            <Trophy className="w-4 h-4 text-sakura" />
            <span>
              {totalStudents}人中 <span className="font-num font-bold text-accent text-xl">{myRank}</span>位
            </span>
          </div>
        )}
      </section>

      {/* タブ */}
      <div className="inline-flex self-start rounded-full border-2 border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`h-10 px-5 inline-flex items-center gap-1.5 rounded-full text-base font-semibold transition-colors ${
            tab === 'all' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
          }`}
        >
          <UsersRound className="w-4 h-4" />
          みんな（{totalStudents}）
        </button>
        <button
          type="button"
          onClick={() => setTab('rivals')}
          className={`h-10 px-5 inline-flex items-center gap-1.5 rounded-full text-base font-semibold transition-colors ${
            tab === 'rivals' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
          }`}
        >
          <Star className="w-4 h-4" />
          ライバル（{rivalCount}）
        </button>
      </div>

      {/* ランキング */}
      {visible.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center text-base text-text-muted">
          {tab === 'rivals'
            ? 'まだライバルがいません。「みんな」タブで気になる人の ★ をタップしよう'
            : 'まだ誰も記録していません。あなたが一番乗り！'}
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {visible.map((row, i) => (
              <LeaderRowCard
                key={row.userId}
                row={row}
                rank={
                  tab === 'all' ? i + 1 : rows.findIndex((r) => r.userId === row.userId) + 1
                }
                maxMinutes={Math.max(1, maxShogiMinutes)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <p className="text-center text-sm text-text-dim">
        誰かが記録すると、すぐに反映されます
      </p>
    </div>
  )
}

function LeaderRowCard({
  row,
  rank,
  maxMinutes
}: {
  row: LeaderRow
  rank: number
  maxMinutes: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticRival, setOptimisticRival] = useState(row.isRival)

  const ratio = Math.min(1, row.shogiMinutes / maxMinutes)
  const widthPct = `${Math.round(ratio * 100)}%`

  const handleToggleRival = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (row.isMe) return
    const nextValue = !optimisticRival
    setOptimisticRival(nextValue)
    startTransition(async () => {
      const result = await toggleRivalAction(row.userId, nextValue)
      if (!result.ok) {
        setOptimisticRival(!nextValue) // rollback
      }
      router.refresh()
    })
  }

  const hours = Math.floor(row.shogiMinutes / 60)
  const mins = row.shogiMinutes % 60

  const isTop3 = rank <= 3
  const rankBadgeColor =
    rank === 1
      ? 'bg-gold text-white'
      : rank === 2
        ? 'bg-text-muted text-white'
        : rank === 3
          ? 'bg-gold-deep text-white'
          : 'bg-surface-overlay text-text-muted'

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl border-2 p-4 transition-all overflow-hidden ${
        row.isMe
          ? 'border-accent bg-accent-soft shadow-[0_2px_12px_rgba(30,64,175,0.15)]'
          : 'border-border bg-surface hover:border-border-strong'
      }`}
    >
      {/* 背景の棒グラフ */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: widthPct }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 * Math.min(rank, 10) }}
        className="absolute inset-y-0 left-0 pointer-events-none"
        style={{
          backgroundColor: row.isMe ? 'rgba(30,64,175,0.12)' : 'rgba(30,64,175,0.06)'
        }}
      />

      <div className="relative flex items-center gap-3">
        {/* 順位 */}
        <span
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-num text-base shrink-0 ${rankBadgeColor}`}
        >
          {rank}
        </span>

        {/* 名前 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-bold truncate">
              {row.displayName}
            </span>
            {row.isMe && (
              <span className="text-[11px] font-bold text-white bg-accent px-2 py-0.5 rounded-full">
                あなた
              </span>
            )}
            {row.activeDays > 0 && (
              <span className="text-xs text-text-muted flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-fire" fill="currentColor" />
                <span className="font-num font-semibold">{row.activeDays}</span>日
              </span>
            )}
          </div>
          {row.levelLabel && (
            <div className="text-xs font-semibold text-accent mt-0.5">
              {row.levelLabel}
            </div>
          )}
        </div>

        {/* 時間表示 */}
        <div className="flex items-baseline gap-0.5 shrink-0">
          {hours > 0 && (
            <>
              <span className="font-num text-xl font-bold text-accent tabular-nums">
                {hours}
              </span>
              <span className="text-xs text-text-muted">h</span>
            </>
          )}
          {(mins > 0 || hours === 0) && (
            <>
              <span className={`font-num font-bold tabular-nums ${hours > 0 ? 'text-base text-text-muted ml-1' : 'text-xl text-accent'}`}>
                {mins}
              </span>
              <span className="text-xs text-text-muted">分</span>
            </>
          )}
        </div>

        {/* ライバル★ボタン */}
        {!row.isMe && (
          <button
            type="button"
            onClick={handleToggleRival}
            disabled={isPending}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              optimisticRival
                ? 'bg-sakura-soft text-sakura'
                : 'bg-surface-overlay text-text-dim hover:text-sakura hover:bg-sakura-soft'
            }`}
            aria-label={optimisticRival ? 'ライバルから外す' : 'ライバルにする'}
          >
            <Star
              className="w-5 h-5"
              fill={optimisticRival ? 'currentColor' : 'none'}
              strokeWidth={2}
            />
          </button>
        )}
      </div>
    </motion.li>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Plus,
  Target,
  Trash2,
  X
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { createGoalAction, deleteGoalAction } from './actions'
import { categoryColorVar } from '@/lib/category-icon'
import { daysRemaining } from '@/lib/dates'

interface CategoryRow {
  id: string
  name_ja: string
  color_token: string
}

interface GoalWithProgress {
  id: string
  period: 'weekly' | 'monthly'
  categoryId: string | null
  categoryName: string | null
  colorToken: string | null
  targetMinutes: number
  currentMinutes: number
  startDate: string
  endDate: string
  isActive: boolean
}

interface GoalsManagerProps {
  goals: GoalWithProgress[]
  categories: CategoryRow[]
  today: string
}

const QUICK_HOURS = [5, 10, 15, 20, 30, 40, 60, 80, 100]

export function GoalsManager({ goals, categories, today }: GoalsManagerProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // フォームの状態
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [targetHours, setTargetHours] = useState<number>(10)

  const activeGoals = goals.filter((g) => g.isActive)
  const pastGoals = goals.filter((g) => !g.isActive).slice(0, 6)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createGoalAction({
        period,
        categoryId,
        targetMinutes: Math.round(targetHours * 60)
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      // 達成時の演出は進捗ベースなのでここではなし、登録完了の控えめな祝福
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1e40af', '#b8893a', '#ec4899']
      })
      setShowForm(false)
      setCategoryId(null)
      setTargetHours(10)
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('この目標を削除しますか？')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteGoalAction(id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* 新規追加ボタン or フォーム */}
      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleCreate}
            className="bg-surface border border-accent/30 rounded-2xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" />
                新しい目標を立てる
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 期間 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-muted">期間</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPeriod('weekly')}
                  className={`h-11 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                    period === 'weekly'
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border bg-surface-elevated text-text-muted hover:border-border-strong'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-semibold">今週</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('monthly')}
                  className={`h-11 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                    period === 'monthly'
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border bg-surface-elevated text-text-muted hover:border-border-strong'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-sm font-semibold">今月</span>
                </button>
              </div>
            </div>

            {/* カテゴリ */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-muted">カテゴリ（全体 or 特定）</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCategoryId(null)}
                  className={`text-xs h-8 px-3 rounded-full border transition-colors ${
                    categoryId === null
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border bg-surface-elevated text-text-muted hover:border-border-strong'
                  }`}
                >
                  全体
                </button>
                {categories.map((c) => {
                  const color = categoryColorVar(c.color_token)
                  const active = categoryId === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`text-xs h-8 px-3 rounded-full border transition-colors`}
                      style={{
                        borderColor: active ? color : 'var(--border)',
                        backgroundColor: active ? color + '20' : 'var(--surface-elevated)',
                        color: active ? color : 'var(--text-muted)'
                      }}
                    >
                      {c.name_ja}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 目標時間 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-muted">目標時間（時間）</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setTargetHours(h)}
                    className={`text-xs h-8 px-3 rounded-full border transition-colors font-num ${
                      targetHours === h
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-border bg-surface-elevated text-text-muted hover:border-border-strong'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={0.5}
                max={period === 'weekly' ? 168 : 720}
                step={0.5}
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value) || 0)}
                className="h-11 px-3 rounded-lg bg-surface-elevated border border-border text-text font-num focus:border-accent focus:outline-none transition-colors"
              />
              <span className="text-[11px] text-text-dim">
                = {Math.round(targetHours * 60)} 分
              </span>
            </div>

            <button
              type="submit"
              disabled={isPending || targetHours <= 0}
              className="h-14 rounded-full bg-accent text-white text-lg font-semibold shadow-[0_4px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep hover:shadow-[0_8px_28px_rgba(30,64,175,0.35)] transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {isPending ? '登録中…' : '目標を立てる'}
            </button>
          </motion.form>
        ) : (
          <motion.button
            key="open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={() => setShowForm(true)}
            className="group flex items-center gap-3 bg-surface border border-border hover:border-accent rounded-2xl p-4 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold">目標を立てる</div>
              <div className="text-xs text-text-dim mt-0.5">週間 or 月間の目標時間を設定</div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* アクティブな目標 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-muted flex items-center gap-2">
          <Target className="w-4 h-4" />
          アクティブな目標
        </h2>
        {activeGoals.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl px-4 py-10 text-center text-sm text-text-dim">
            まだ目標がありません。上のボタンから立ててみよう
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {activeGoals.map((g) => (
              <GoalCard key={g.id} goal={g} onDelete={handleDelete} today={today} />
            ))}
          </ul>
        )}
      </section>

      {/* 過去の目標 */}
      {pastGoals.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-muted">過去の目標</h2>
          <ul className="flex flex-col gap-2">
            {pastGoals.map((g) => (
              <li
                key={g.id}
                className="bg-surface/60 border border-border/60 rounded-2xl p-3 flex items-center gap-3 text-sm"
              >
                <span className="text-xs text-text-dim font-num">
                  {g.startDate} 〜 {g.endDate}
                </span>
                <span className="flex-1 truncate">
                  {g.categoryName ?? '全体'}・{Math.round(g.targetMinutes / 60)}h
                </span>
                <span
                  className={`text-xs font-num font-bold ${
                    g.currentMinutes >= g.targetMinutes ? 'text-success' : 'text-text-muted'
                  }`}
                >
                  {Math.round((g.currentMinutes / g.targetMinutes) * 100)}%
                </span>
                {g.currentMinutes >= g.targetMinutes && (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

interface GoalCardProps {
  goal: GoalWithProgress
  onDelete: (id: string) => void
  today: string
}

function GoalCard({ goal, onDelete, today }: GoalCardProps) {
  const ratio = Math.min(1, goal.currentMinutes / goal.targetMinutes)
  const percent = Math.round(ratio * 100)
  const achieved = goal.currentMinutes >= goal.targetMinutes
  const days = daysRemaining(goal.endDate, today)
  const color = goal.colorToken ? categoryColorVar(goal.colorToken) : 'var(--accent)'
  const remainingMinutes = Math.max(0, goal.targetMinutes - goal.currentMinutes)

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center font-bold font-num text-sm"
          style={{
            backgroundColor: achieved ? 'var(--success)' + '22' : color + '22',
            color: achieved ? 'var(--success)' : color
          }}
        >
          {achieved ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-semibold">
              {goal.period === 'weekly' ? '今週' : '今月'}の
              {goal.categoryName ?? '合計'}
            </span>
            <span className="text-xs text-text-dim">
              {goal.startDate.slice(5)} 〜 {goal.endDate.slice(5)}
            </span>
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            あと {days}日 ・ 目標 {Math.round(goal.targetMinutes / 60)}h
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(goal.id)}
          className="text-text-dim hover:text-danger"
          aria-label="削除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* プログレスバー */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-1">
            <span
              className="font-num text-2xl font-bold"
              style={{ color: achieved ? 'var(--success)' : color }}
            >
              {Math.round(goal.currentMinutes / 60)}
            </span>
            <span className="text-xs text-text-dim font-num">/ {Math.round(goal.targetMinutes / 60)}h</span>
          </div>
          <span
            className={`text-sm font-num font-bold ${
              achieved ? 'text-success' : 'text-text-muted'
            }`}
          >
            {percent}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-surface-elevated overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full"
            style={{
              backgroundColor: achieved ? 'var(--success)' : color,
              boxShadow: achieved
                ? '0 0 12px rgba(5, 150, 105, 0.35)'
                : `0 0 10px ${color}33`
            }}
          />
        </div>
        {!achieved && days > 0 && (
          <div className="text-[11px] text-text-dim mt-1.5 font-num">
            あと {Math.ceil(remainingMinutes / 60)}h（1日あたり{' '}
            {Math.ceil(remainingMinutes / 60 / days)}h ペース）
          </div>
        )}
        {achieved && (
          <div className="text-[11px] text-success mt-1.5 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            達成おめでとう！
          </div>
        )}
      </div>
    </motion.li>
  )
}

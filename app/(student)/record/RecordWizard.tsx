'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, Minus, PencilLine, Plus, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import { categoryColorVar, getCategoryIcon } from '@/lib/category-icon'
import { saveRecordAction } from './actions'

type CategoryRow = {
  id: string
  name_ja: string
  icon_key: string
  color_token: string
  sort_order: number
  is_preset: boolean
}

interface Props {
  categories: CategoryRow[]
}

const PRESET_MINUTES = [10, 15, 20, 30, 45, 60, 90, 120, 180]

type Step = 'category' | 'minutes' | 'confirm' | 'done'

function todayLocalISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fireConfetti(): void {
  const defaults = {
    spread: 70,
    ticks: 80,
    gravity: 1.0,
    decay: 0.94,
    startVelocity: 32,
    colors: ['#d4a24c', '#ffd87a', '#ffeab8', '#fff8e6', '#b8893a']
  }
  // 中央
  confetti({ ...defaults, particleCount: 80, origin: { x: 0.5, y: 0.4 } })
  // 左から
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 50, angle: 60, origin: { x: 0, y: 0.6 } })
  }, 150)
  // 右から
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 50, angle: 120, origin: { x: 1, y: 0.6 } })
  }, 300)
}

export function RecordWizard({ categories }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [minutes, setMinutes] = useState<number>(30)
  const [memo, setMemo] = useState('')
  const [date, setDate] = useState<string>(todayLocalISO())
  const [showMemo, setShowMemo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedCategory = categoryId ? categories.find((c) => c.id === categoryId) : null

  const onSelectCategory = (id: string) => {
    setCategoryId(id)
    // 自動で次のステップへ（タップ1回で進む = 3タップ実現の核）
    setTimeout(() => setStep('minutes'), 220)
  }

  const onSelectMinutes = (m: number) => {
    setMinutes(m)
    setStep('confirm')
  }

  const onSave = () => {
    if (!categoryId) return
    setError(null)
    startTransition(async () => {
      const result = await saveRecordAction({
        categoryId,
        durationMinutes: minutes,
        date,
        memo: memo || undefined
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      fireConfetti()
      setStep('done')
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1600)
    })
  }

  return (
    <div className="relative">
      {/* ステップインジケータ */}
      <div className="mb-6 flex items-center gap-2">
        {(['category', 'minutes', 'confirm'] as Step[]).map((s, i) => {
          const isPast =
            (s === 'category' && step !== 'category') ||
            (s === 'minutes' && (step === 'confirm' || step === 'done')) ||
            (s === 'confirm' && step === 'done')
          const isCurrent = step === s
          return (
            <div
              key={s}
              className="flex-1 h-1.5 rounded-full transition-colors"
              style={{
                background: isPast
                  ? 'var(--accent)'
                  : isCurrent
                    ? 'var(--accent-soft)'
                    : 'var(--border)'
              }}
            >
              {isCurrent && (
                <motion.div
                  layoutId="stepActive"
                  className="h-full rounded-full"
                  style={{ background: 'var(--accent)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </div>
          )
        })}
        <span className="ml-2 text-xs text-text-dim font-num">
          {step === 'category' ? '1' : step === 'minutes' ? '2' : '3'} / 3
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* ステップ1：カテゴリ選択 */}
        {step === 'category' && (
          <motion.div
            key="step-category"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-4 text-text-muted text-sm">なにに時間を使った？</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat, i) => {
                const Icon = getCategoryIcon(cat.icon_key)
                const color = categoryColorVar(cat.color_token)
                const isSelected = categoryId === cat.id
                return (
                  <motion.button
                    key={cat.id}
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onSelectCategory(cat.id)}
                    className="group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border bg-surface p-3 transition-colors"
                    style={{
                      borderColor: isSelected ? color : 'var(--border)',
                      boxShadow: isSelected ? `0 0 24px ${color}55` : undefined
                    }}
                  >
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
                      style={{
                        backgroundColor: isSelected ? `${color}33` : 'var(--surface-elevated)',
                        color
                      }}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2.2} />
                    </span>
                    <span className="text-sm font-semibold text-text">{cat.name_ja}</span>
                    {isSelected && (
                      <motion.span
                        layoutId="checkBadge"
                        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: color }}
                      >
                        <Check className="h-3 w-3 text-background" strokeWidth={3} />
                      </motion.span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ステップ2：分入力 */}
        {step === 'minutes' && selectedCategory && (
          <motion.div
            key="step-minutes"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <CategoryChip cat={selectedCategory} onChange={() => setStep('category')} />

            <div className="flex flex-col items-center gap-3 py-4">
              <span className="text-sm text-text-muted">どのくらいやった？</span>
              <div className="flex items-baseline gap-3">
                <button
                  type="button"
                  onClick={() => setMinutes((m) => Math.max(1, m - 5))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-muted hover:bg-surface-elevated active:scale-95"
                  aria-label="5分減らす"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-num text-display gold-glow tabular-nums" style={{ minWidth: '4ch', textAlign: 'center' }}>
                  {minutes}
                </span>
                <button
                  type="button"
                  onClick={() => setMinutes((m) => Math.min(1440, m + 5))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-muted hover:bg-surface-elevated active:scale-95"
                  aria-label="5分増やす"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-text-muted">分</span>
            </div>

            <div>
              <p className="mb-2 text-xs text-text-dim uppercase tracking-widest font-num">プリセット</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {PRESET_MINUTES.map((m) => {
                  const isActive = minutes === m
                  return (
                    <motion.button
                      key={m}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSelectMinutes(m)}
                      className="h-12 rounded-xl border font-num font-semibold transition-colors"
                      style={{
                        borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                        backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--surface)',
                        color: isActive ? 'var(--accent)' : 'var(--text)'
                      }}
                    >
                      {m}分
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('category')}
                className="h-11 px-5 inline-flex items-center justify-center gap-1 rounded-full border border-border text-text-muted hover:bg-surface-elevated"
              >
                <ChevronLeft className="h-4 w-4" />
                戻る
              </button>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className="flex-1 h-11 rounded-full bg-accent text-background font-semibold shadow-[0_0_24px_rgba(212,162,76,0.3)] hover:bg-accent-deep transition-colors"
              >
                次へ
              </button>
            </div>
          </motion.div>
        )}

        {/* ステップ3：確認・保存 */}
        {step === 'confirm' && selectedCategory && (
          <motion.div
            key="step-confirm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5"
          >
            {/* サマリーカード */}
            <div
              className="rounded-3xl border bg-surface p-6 flex flex-col items-center gap-4"
              style={{
                borderColor: categoryColorVar(selectedCategory.color_token) + '55'
              }}
            >
              <CategorySummary cat={selectedCategory} minutes={minutes} />
            </div>

            {/* 日付 */}
            <label className="flex flex-col gap-2">
              <span className="text-sm text-text-muted">日付</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={todayLocalISO()}
                className="h-11 px-3 rounded-lg bg-surface-elevated border border-border text-text focus:border-accent focus:outline-none font-num"
              />
            </label>

            {/* メモ（任意・折りたたみ） */}
            {!showMemo ? (
              <button
                type="button"
                onClick={() => setShowMemo(true)}
                className="self-start inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent"
              >
                <PencilLine className="h-4 w-4" />
                メモを追加（任意）
              </button>
            ) : (
              <label className="flex flex-col gap-2">
                <span className="text-sm text-text-muted">メモ（任意）</span>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  placeholder="戦型・気づき・対局相手などをひとこと"
                  className="px-3 py-2 rounded-lg bg-surface-elevated border border-border text-text focus:border-accent focus:outline-none resize-none"
                  maxLength={500}
                />
              </label>
            )}

            {error && (
              <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('minutes')}
                className="h-12 px-5 inline-flex items-center justify-center gap-1 rounded-full border border-border text-text-muted hover:bg-surface-elevated"
                disabled={isPending}
              >
                <ChevronLeft className="h-4 w-4" />
                戻る
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={onSave}
                disabled={isPending}
                className="flex-1 h-12 rounded-full bg-accent text-background font-semibold shadow-[0_0_32px_rgba(212,162,76,0.4)] hover:bg-accent-deep transition-colors disabled:opacity-50"
              >
                {isPending ? '保存中…' : '記録する'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 完了：紙吹雪オーバーレイ */}
        {step === 'done' && selectedCategory && (
          <motion.div
            key="step-done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center gap-6 py-12"
          >
            <motion.div
              initial={{ rotate: -8, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Sparkles className="h-12 w-12 text-background" strokeWidth={2.4} />
            </motion.div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-2xl font-bold gold-glow">記録しました！</p>
              <p className="text-text-muted text-sm font-num">
                {selectedCategory.name_ja} · {minutes}分
              </p>
            </div>
            <p className="text-xs text-text-dim">ダッシュボードに戻ります…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CategoryChip({ cat, onChange }: { cat: CategoryRow; onChange: () => void }) {
  const Icon = getCategoryIcon(cat.icon_key)
  const color = categoryColorVar(cat.color_token)
  return (
    <button
      type="button"
      onClick={onChange}
      className="self-start inline-flex items-center gap-2 px-3 h-9 rounded-full border bg-surface hover:bg-surface-elevated transition-colors"
      style={{ borderColor: color + '55' }}
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-md"
        style={{ backgroundColor: color + '33', color }}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
      <span className="text-sm font-medium">{cat.name_ja}</span>
      <span className="text-xs text-text-dim">変更</span>
    </button>
  )
}

function CategorySummary({ cat, minutes }: { cat: CategoryRow; minutes: number }) {
  const Icon = getCategoryIcon(cat.icon_key)
  const color = categoryColorVar(cat.color_token)
  return (
    <>
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: color + '22', color }}
      >
        <Icon className="h-8 w-8" strokeWidth={2.2} />
      </span>
      <span className="text-lg font-semibold">{cat.name_ja}</span>
      <div className="flex items-baseline gap-2">
        <span
          className="font-num text-6xl font-bold tabular-nums"
          style={{ color: 'var(--accent)' }}
        >
          {minutes}
        </span>
        <span className="text-sm text-text-muted">分</span>
      </div>
    </>
  )
}

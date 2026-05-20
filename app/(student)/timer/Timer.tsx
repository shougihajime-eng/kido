'use client'

import { createElement, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Timer as TimerIcon, Watch } from 'lucide-react'
import confetti from 'canvas-confetti'
import { categoryColorVar, getCategoryIcon } from '@/lib/category-icon'
import { saveRecordAction } from '../record/actions'

type CategoryRow = {
  id: string
  key: string | null
  name_ja: string
  icon_key: string
  color_token: string
  sort_order: number
  is_preset: boolean
  kind: string
}

type Mode = 'stopwatch' | 'timer'

const TIMER_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90]

const STORAGE_KEY = 'kido.timer.v1'

interface SavedState {
  categoryId: string
  mode: Mode
  startedAtMs: number
  targetMs?: number // タイマーのときの目標ミリ秒
}

function loadState(): SavedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedState
    if (typeof parsed.startedAtMs !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function saveState(state: SavedState | null): void {
  if (typeof window === 'undefined') return
  if (state === null) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
}

function formatHMS(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) {
    return `${h}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

function todayLocalISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface Props {
  categories: CategoryRow[]
}

export function Timer({ categories }: Props) {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const [running, setRunning] = useState<SavedState | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('stopwatch')
  const [targetMin, setTargetMin] = useState<number>(30)
  const [completedNotified, setCompletedNotified] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const tickRef = useRef<number | null>(null)

  // hydrate（localStorage は SSR で使えないのでマウント後に読み込み → state を復元）
  useEffect(() => {
    const s = loadState()
    if (s) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRunning(s)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategoryId(s.categoryId)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(s.mode)
      if (s.mode === 'timer' && s.targetMs) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTargetMin(Math.round(s.targetMs / 60000))
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true)
  }, [])

  // tick (1s)
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    tickRef.current = id
    return () => {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current)
        tickRef.current = null
      }
    }
  }, [running])

  // タイマーが満了した瞬間に一度だけ通知（外部のタイマー進行に同期して紙吹雪を出す）
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!running || running.mode !== 'timer' || !running.targetMs) return
    const elapsed = now - running.startedAtMs
    if (elapsed >= running.targetMs && !completedNotified) {
      setCompletedNotified(true)
      // 控えめな完了演出: confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#1e40af', '#b8893a', '#ec4899']
        })
      } catch {
        /* noop */
      }
    }
  }, [now, running, completedNotified])

  if (!hydrated) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-10 text-center text-text-muted">
        準備中…
      </div>
    )
  }

  // ===== 計測中の表示 =====
  if (running) {
    const elapsedMs = Math.max(0, now - running.startedAtMs)
    const isTimer = running.mode === 'timer'
    const target = running.targetMs ?? 0
    const remainingMs = isTimer ? Math.max(0, target - elapsedMs) : 0
    const overMs = isTimer && elapsedMs > target ? elapsedMs - target : 0
    const ratio = isTimer && target > 0 ? Math.min(1, elapsedMs / target) : 0

    const cat = categories.find((c) => c.id === running.categoryId)
    const catColor = cat ? categoryColorVar(cat.color_token) : 'var(--accent)'

    const isCompleted = isTimer && elapsedMs >= target

    const onStop = () => {
      // 経過時間（分・四捨五入・最低1分）
      const elapsedMin = Math.max(1, Math.round(elapsedMs / 60000))
      setError(null)
      startTransition(async () => {
        const result = await saveRecordAction({
          categoryId: running.categoryId,
          durationMinutes: elapsedMin,
          date: todayLocalISO()
        })
        if (!result.ok) {
          setError(result.error)
          return
        }
        saveState(null)
        setRunning(null)
        setCompletedNotified(false)
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.4 },
            colors: ['#1e40af', '#3b82f6', '#b8893a', '#ec4899', '#f9a8d4']
          })
        } catch {
          /* noop */
        }
        router.push('/dashboard')
        router.refresh()
      })
    }

    const onCancel = () => {
      if (!confirm('やめる？ 計測中の内容は保存されません')) return
      saveState(null)
      setRunning(null)
      setCompletedNotified(false)
    }

    return (
      <div className="flex flex-col gap-6">
        {/* 現在計測中のカテゴリ */}
        {cat && (
          <div
            className="flex items-center gap-3 bg-surface border border-border rounded-2xl p-4"
            style={{ borderColor: isCompleted ? 'var(--success)' : undefined }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${catColor}1A`, color: catColor }}
            >
              {cat && createElement(getCategoryIcon(cat.icon_key), { className: 'w-6 h-6' })}
            </div>
            <div className="flex-1">
              <div className="text-xs text-text-muted">
                {isTimer ? 'タイマー中' : 'ストップウォッチ計測中'}
              </div>
              <div className="text-lg font-bold">{cat.name_ja}</div>
            </div>
            {isTimer && (
              <div className="text-xs text-text-muted">
                目標 <span className="font-num font-bold text-text">{targetMin}</span> 分
              </div>
            )}
          </div>
        )}

        {/* 大きな時計表示 */}
        <div
          className={`relative rounded-3xl p-10 flex flex-col items-center gap-3 overflow-hidden border-2 ${
            isCompleted
              ? 'border-success bg-success/5'
              : 'border-accent bg-surface'
          }`}
        >
          {/* タイマー進捗バー（背景） */}
          {isTimer && (
            <motion.div
              className="absolute inset-y-0 left-0 pointer-events-none"
              style={{ backgroundColor: 'rgba(30, 64, 175, 0.08)' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(ratio * 100)}%` }}
              transition={{ duration: 0.4 }}
            />
          )}

          <div className="relative flex flex-col items-center gap-2">
            {isTimer ? (
              isCompleted ? (
                <>
                  <div className="text-2xl">🎉</div>
                  <div className="font-num text-display font-bold text-success tabular-nums">
                    完了！
                  </div>
                  <div className="text-sm text-success">
                    +{formatHMS(overMs)} 超過中（止めるまで計測続きます）
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs text-text-muted">残り</div>
                  <div className="font-num text-[5rem] sm:text-[6rem] font-bold gold-glow tabular-nums leading-none">
                    {formatHMS(remainingMs)}
                  </div>
                  <div className="text-xs text-text-dim">
                    経過 <span className="font-num">{formatHMS(elapsedMs)}</span>
                  </div>
                </>
              )
            ) : (
              <>
                <div className="text-xs text-text-muted">経過時間</div>
                <div className="font-num text-[5rem] sm:text-[6rem] font-bold gold-glow tabular-nums leading-none">
                  {formatHMS(elapsedMs)}
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 h-14 rounded-full border-2 border-border text-text-muted hover:text-text hover:border-text-muted transition-colors"
          >
            やめる
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={isPending}
            className="flex-[2] h-14 rounded-full bg-accent text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-accent-deep transition-colors disabled:opacity-60"
          >
            <Square className="w-5 h-5" fill="currentColor" />
            {isPending ? '保存中…' : '終わる（記録する）'}
          </button>
        </div>

        <p className="text-xs text-text-dim text-center leading-relaxed">
          このページを閉じても計測は続きます。
          <br />
          終わったら同じ画面に戻って「終わる」で保存できます。
        </p>
      </div>
    )
  }

  // ===== セットアップ画面 =====
  const shogiCats = categories.filter((c) => c.kind === 'shogi')
  const lifeCats = categories.filter((c) => c.kind === 'life')
  const canStart = !!categoryId

  const onStart = () => {
    if (!categoryId) return
    const state: SavedState = {
      categoryId,
      mode,
      startedAtMs: Date.now(),
      targetMs: mode === 'timer' ? targetMin * 60 * 1000 : undefined
    }
    saveState(state)
    setRunning(state)
    setNow(Date.now())
    setCompletedNotified(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ステップ1: カテゴリ選択 */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted mb-3">
          1. なにに時間を使う？
        </h2>
        {[
          { label: '将棋', list: shogiCats },
          { label: '生活', list: lifeCats }
        ].map((group) =>
          group.list.length === 0 ? null : (
            <div key={group.label} className="mb-3">
              <div className="text-[10px] text-text-dim mb-1.5 tracking-wider">
                {group.label}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {group.list.map((c) => {
                  const Icon = getCategoryIcon(c.icon_key)
                  const color = categoryColorVar(c.color_token)
                  const isSelected = categoryId === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`relative aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-accent shadow-[0_4px_18px_rgba(30,64,175,0.25)] scale-[1.02]'
                          : 'border-border bg-surface hover:border-border-strong'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${color}14` : undefined
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color }} />
                      <span className="text-xs font-semibold">{c.name_ja}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        )}
      </section>

      {/* ステップ2: モード選択 */}
      <section>
        <h2 className="text-sm font-semibold text-text-muted mb-3">2. モード</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('stopwatch')}
            className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-2 transition-all ${
              mode === 'stopwatch'
                ? 'border-accent bg-accent-soft/40'
                : 'border-border bg-surface hover:border-border-strong'
            }`}
          >
            <Watch className="w-7 h-7 text-accent" />
            <div className="text-base font-semibold">ストップウォッチ</div>
            <div className="text-[11px] text-text-dim text-center leading-relaxed">
              0から数えて経過時間を計測。「いつ終わるか」未定の練習向け
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode('timer')}
            className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-2 transition-all ${
              mode === 'timer'
                ? 'border-accent bg-accent-soft/40'
                : 'border-border bg-surface hover:border-border-strong'
            }`}
          >
            <TimerIcon className="w-7 h-7 text-accent" />
            <div className="text-base font-semibold">タイマー</div>
            <div className="text-[11px] text-text-dim text-center leading-relaxed">
              「あと◯分」を計測。集中タイムを区切りたい時に
            </div>
          </button>
        </div>
      </section>

      {/* ステップ3: 目標時間（タイマーのみ） */}
      <AnimatePresence>
        {mode === 'timer' && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <h2 className="text-sm font-semibold text-text-muted mb-3">
              3. 何分にする？
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {TIMER_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTargetMin(m)}
                  className={`h-12 rounded-xl border-2 font-num font-bold transition-colors ${
                    targetMin === m
                      ? 'border-accent bg-accent text-white'
                      : 'border-border bg-surface hover:border-border-strong'
                  }`}
                >
                  {m}<span className="text-xs ml-0.5 font-normal">分</span>
                </button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 開始ボタン */}
      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className="h-14 rounded-full bg-accent text-white font-bold text-lg shadow-[0_4px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep hover:shadow-[0_8px_28px_rgba(30,64,175,0.35)] transition-all disabled:opacity-40 disabled:shadow-none inline-flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5" fill="currentColor" />
        {canStart ? '計測スタート' : 'カテゴリを選んでね'}
      </button>

      <p className="text-xs text-text-dim leading-relaxed text-center">
        計測中はページを閉じても続きます（同じ端末・同じブラウザに限る）。
      </p>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { addCountdownAction } from './actions'

const PRESET_EMOJI = ['📅', '🏆', '🎯', '⚔️', '🌸', '🔥', '⭐', '🎌', '📝']

export function AddCountdownForm({ todayIso }: { todayIso: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [emoji, setEmoji] = useState('📅')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('タイトルを入れてください')
      return
    }
    if (!targetDate) {
      setError('日付を選んでください')
      return
    }
    if (targetDate < todayIso) {
      setError('今日より後の日付を選んでください')
      return
    }
    startTransition(async () => {
      const result = await addCountdownAction({ title: title.trim(), targetDate, emoji })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setTitle('')
      setTargetDate('')
      setEmoji('📅')
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-12 w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border hover:border-accent hover:text-accent text-text-muted transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>カウントダウンを追加</span>
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-text-muted">何の日？（タイトル）</span>
        <input
          type="text"
          required
          maxLength={40}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：奨励会試験、◯◯杯、進級試験"
          className="h-11 px-3 rounded-lg bg-surface-elevated border border-border text-text focus:border-accent focus:outline-none transition-colors"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-text-muted">日付</span>
        <input
          type="date"
          required
          min={todayIso}
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="h-11 px-3 rounded-lg bg-surface-elevated border border-border text-text focus:border-accent focus:outline-none transition-colors font-num"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-text-muted">アイコン（絵文字）</span>
        <div className="flex flex-wrap gap-2">
          {PRESET_EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                emoji === e
                  ? 'bg-accent text-white scale-110'
                  : 'bg-surface-elevated hover:bg-accent-soft'
              }`}
              aria-label={`絵文字 ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          className="h-11 px-5 rounded-full border border-border text-text-muted hover:text-text hover:border-text-muted transition-colors"
        >
          やめる
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 h-11 rounded-full bg-accent text-white font-semibold hover:bg-accent-deep transition-colors disabled:opacity-60"
        >
          {isPending ? '追加中…' : '追加する'}
        </button>
      </div>
    </form>
  )
}

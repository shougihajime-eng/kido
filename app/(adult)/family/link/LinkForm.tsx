'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { formatInviteCode, normalizeInviteCode } from '@/lib/invite-code'
import { redeemInviteCodeAction } from '../actions'

export function LinkForm() {
  const router = useRouter()
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ name: string; kind: 'parent' | 'teacher' } | null>(null)
  const [isPending, startTransition] = useTransition()

  const display = formatInviteCode(normalizeInviteCode(raw))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await redeemInviteCodeAction(raw)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSuccess({ name: result.studentDisplayName, kind: result.kind })
      // 自動遷移は2秒後
      setTimeout(() => {
        router.push('/family')
        router.refresh()
      }, 2000)
    })
  }

  if (success) {
    return (
      <div className="bg-surface border border-success/40 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <div>
          <p className="text-xl font-bold">紐づきました！</p>
          <p className="text-sm text-text-muted mt-2">
            <span className="font-semibold text-accent">{success.name}</span>{' '}
            さんと（{success.kind === 'parent' ? '親' : '先生'}として）紐づきました
          </p>
        </div>
        <p className="text-xs text-text-dim">「見守り」画面に戻ります…</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4"
    >
      <label className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">招待コード（8文字）</span>
        <div className="relative">
          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <input
            type="text"
            required
            value={display}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="ABCD-1234"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            className="h-14 w-full pl-12 pr-4 rounded-xl bg-surface-elevated border border-border text-text font-num text-2xl tracking-[0.2em] uppercase focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <span className="text-xs text-text-dim">大文字小文字は区別しません。ハイフンも自動で入ります</span>
      </label>

      {error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || normalizeInviteCode(raw).length !== 8}
        className="h-12 rounded-full bg-accent text-background font-semibold shadow-[0_0_24px_rgba(212,162,76,0.3)] hover:bg-accent-deep disabled:opacity-50 transition-colors"
      >
        {isPending ? '紐づけ中…' : '紐づける'}
      </button>
    </form>
  )
}

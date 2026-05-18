'use client'

import { useState, useTransition, use } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithPinAction } from './actions'

export function LoginForm({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = use(searchParams)
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(params.error ?? null)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await loginWithPinAction({
        displayName,
        pin
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      const defaultHome = result.role === 'student' ? '/dashboard' : '/family'
      router.push(params.next ?? defaultHome)
      router.refresh()
    })
  }

  const canSubmit = displayName.trim().length > 0 && /^\d{4}$/.test(pin) && !isPending

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6"
    >
      <label className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">なまえ</span>
        <input
          type="text"
          required
          autoComplete="off"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="登録した呼び名"
          className="h-11 px-3 rounded-lg bg-surface-elevated border border-border text-text focus:border-accent focus:outline-none transition-colors"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">あいことば（4桁）</span>
        <input
          type="password"
          required
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="0000"
          className="h-14 px-3 rounded-lg bg-surface-elevated border border-border text-text font-num text-3xl tracking-[0.5em] text-center focus:border-accent focus:outline-none transition-colors"
        />
      </label>

      {error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="h-12 rounded-full bg-accent text-background font-semibold shadow-[0_0_24px_rgba(212,162,76,0.3)] hover:bg-accent-deep transition-colors disabled:opacity-50"
      >
        {isPending ? 'ログイン中…' : 'ログイン'}
      </button>
    </form>
  )
}

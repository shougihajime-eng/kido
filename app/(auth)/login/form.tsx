'use client'

import { useState, useTransition, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = use(searchParams)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(params.error ?? null)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) {
        setError(error.message)
        return
      }
      router.push(params.next ?? '/dashboard')
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6"
    >
      <label className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">メールアドレス</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 px-3 rounded-lg bg-surface-elevated border border-border text-text focus:border-accent focus:outline-none transition-colors"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">パスワード</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 px-3 rounded-lg bg-surface-elevated border border-border text-text focus:border-accent focus:outline-none transition-colors"
        />
      </label>
      {error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-full bg-accent text-background font-semibold shadow-[0_0_24px_rgba(212,162,76,0.3)] hover:bg-accent-deep transition-colors disabled:opacity-50"
      >
        {isPending ? 'ログイン中…' : 'ログイン'}
      </button>
    </form>
  )
}

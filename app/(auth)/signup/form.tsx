'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Role = 'student' | 'parent' | 'teacher'

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'student', label: '生徒', desc: '練習を記録して、自分の成長を見える化する' },
  { value: 'parent', label: '親', desc: 'お子さんの練習の様子を見守る' },
  { value: 'teacher', label: '先生・指導者', desc: '生徒の練習を確認してコメントする' }
]

export function SignupForm() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            app: 'kido',
            role,
            display_name: displayName
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(error.message)
        return
      }

      // セッションが即時取得できる設定の場合（メール確認OFFのとき）
      if (data.session) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      // メール確認待ち
      setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6 text-center">
        <p className="text-accent text-lg font-semibold">確認メールを送りました</p>
        <p className="text-text-muted text-sm">
          メールに記載されたリンクをクリックして、登録を完了してください。
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6"
    >
      {/* ロール選択 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">役割を選んでください</span>
        <div className="flex flex-col gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`text-left p-3 rounded-lg border transition-all ${
                role === r.value
                  ? 'border-accent bg-accent-soft shadow-[0_0_16px_rgba(212,162,76,0.15)]'
                  : 'border-border bg-surface-elevated hover:border-border-strong'
              }`}
            >
              <div className="font-semibold text-text">{r.label}</div>
              <div className="text-xs text-text-muted mt-0.5">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">表示名（ニックネーム）</span>
        <input
          type="text"
          required
          maxLength={40}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="h-11 px-3 rounded-lg bg-surface-elevated border border-border text-text focus:border-accent focus:outline-none transition-colors"
        />
      </label>

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
        <span className="text-sm text-text-muted">パスワード（8文字以上）</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {isPending ? '登録中…' : 'アカウントを作る'}
      </button>
    </form>
  )
}

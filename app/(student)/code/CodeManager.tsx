'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Plus, Trash2, UserMinus, UsersRound } from 'lucide-react'
import { formatInviteCode } from '@/lib/invite-code'
import {
  createInviteCodeAction,
  deleteInviteCodeAction,
  removeRelationshipAction
} from './actions'

interface ActiveCode {
  code: string
  kind: 'parent' | 'teacher'
  expiresAt: string
  createdAt: string
}

interface LinkedAdult {
  id: string
  kind: 'parent' | 'teacher'
  adultId: string
  displayName: string
  createdAt: string
}

interface CodeManagerProps {
  initialCodes: ActiveCode[]
  linkedAdults: LinkedAdult[]
}

const KIND_LABEL: Record<'parent' | 'teacher', string> = {
  parent: '親',
  teacher: '先生'
}

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
}

export function CodeManager({ initialCodes, linkedAdults }: CodeManagerProps) {
  const router = useRouter()
  const [codes, setCodes] = useState<ActiveCode[]>(initialCodes)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingKind, setPendingKind] = useState<'parent' | 'teacher' | null>(null)

  const handleCreate = (kind: 'parent' | 'teacher') => {
    setError(null)
    setPendingKind(kind)
    startTransition(async () => {
      const result = await createInviteCodeAction({ kind, expiresInDays: 7 })
      setPendingKind(null)
      if (!result.ok) {
        setError(result.error)
        return
      }
      // 発行直後はクライアント状態に追加（サーバーからも再フェッチされる）
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      setCodes((prev) => [
        {
          code: result.code,
          kind,
          expiresAt,
          createdAt: new Date().toISOString()
        },
        ...prev
      ])
      router.refresh()
    })
  }

  const handleDelete = (code: string) => {
    setError(null)
    startTransition(async () => {
      const result = await deleteInviteCodeAction(code)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setCodes((prev) => prev.filter((c) => c.code !== code))
      router.refresh()
    })
  }

  const handleRemoveRel = (id: string) => {
    if (!confirm('この紐づけを解除してもよいですか？相手はあなたの記録を見られなくなります。')) {
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await removeRelationshipAction(id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(formatInviteCode(code))
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 1800)
    } catch {
      /* clipboard 拒否は無視 */
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* 発行ボタン */}
      <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Plus className="w-4 h-4 text-accent" />
          <span>新しい招待コードを発行</span>
        </div>
        <p className="text-xs text-text-muted">
          コードは 7日間有効・1回だけ使えます。親と先生で別々に発行できます。
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleCreate('parent')}
            disabled={isPending}
            className="h-11 rounded-xl border border-border bg-surface-elevated hover:border-accent disabled:opacity-50 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
          >
            {pendingKind === 'parent' ? '発行中…' : '親用のコードを発行'}
          </button>
          <button
            type="button"
            onClick={() => handleCreate('teacher')}
            disabled={isPending}
            className="h-11 rounded-xl border border-border bg-surface-elevated hover:border-accent disabled:opacity-50 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
          >
            {pendingKind === 'teacher' ? '発行中…' : '先生用のコードを発行'}
          </button>
        </div>
      </section>

      {/* 有効なコード */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-muted">有効な招待コード</h2>
        {codes.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl px-4 py-6 text-center text-sm text-text-dim">
            まだコードがありません
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {codes.map((c) => {
              const days = daysUntil(c.expiresAt)
              const copied = copiedCode === c.code
              return (
                <li
                  key={c.code}
                  className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-num text-2xl font-bold tracking-wider gold-glow">
                        {formatInviteCode(c.code)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-soft text-accent">
                        {KIND_LABEL[c.kind]}用
                      </span>
                    </div>
                    <div className="text-xs text-text-dim mt-1">
                      あと {days}日有効
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(c.code)}
                    className="h-9 w-9 rounded-lg border border-border hover:border-accent flex items-center justify-center transition-colors"
                    aria-label="コードをコピー"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.code)}
                    disabled={isPending}
                    className="h-9 w-9 rounded-lg border border-border hover:border-danger flex items-center justify-center transition-colors disabled:opacity-50"
                    aria-label="このコードを削除"
                  >
                    <Trash2 className="w-4 h-4 text-text-muted" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 紐づいた親・先生 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-muted flex items-center gap-2">
          <UsersRound className="w-4 h-4" />
          紐づいた親・先生
        </h2>
        {linkedAdults.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl px-4 py-6 text-center text-sm text-text-dim">
            まだ誰とも紐づいていません
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {linkedAdults.map((a) => (
              <li
                key={a.id}
                className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold truncate">{a.displayName}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted">
                      {KIND_LABEL[a.kind]}
                    </span>
                  </div>
                  <div className="text-xs text-text-dim mt-1">
                    紐づき開始 {new Date(a.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRel(a.id)}
                  disabled={isPending}
                  className="h-9 px-3 rounded-lg border border-border hover:border-danger text-xs text-text-muted hover:text-danger transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  解除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-text-dim leading-relaxed">
        親や先生は、サインアップしたあと「コードを入力」画面に進んで、ここで発行したコードを入力します。
        コードを使うと自動で紐づきます（コードは1回で消えます）。
      </p>
    </div>
  )
}

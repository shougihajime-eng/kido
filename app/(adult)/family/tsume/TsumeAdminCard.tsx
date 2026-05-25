'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { setTsumePublished, deleteTsumeProblem } from './actions'

type Props = {
  id: string
  title: string | null
  tesuu: number
  levelLabel: string
  levelBg: string
  levelText: string
  published: boolean
  source: string | null
  firstMove: string
}

export function TsumeAdminCard({
  id,
  title,
  tesuu,
  levelLabel,
  levelBg,
  levelText,
  published,
  source,
  firstMove
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const togglePublish = () => {
    setError(null)
    startTransition(async () => {
      const res = await setTsumePublished(id, !published)
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  const onDelete = () => {
    setError(null)
    startTransition(async () => {
      const res = await deleteTsumeProblem(id)
      if (!res.ok) {
        setError(res.error)
        setConfirming(false)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <li className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-accent text-white font-num">
              {tesuu}手詰
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mincho ${levelBg} ${levelText}`}
            >
              {levelLabel}
            </span>
            {published ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-success/15 text-success">
                <Eye className="w-3 h-3" /> 公開中
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-surface-elevated text-text-muted">
                <EyeOff className="w-3 h-3" /> 下書き
              </span>
            )}
          </div>
          <div className="mt-1.5 font-mincho font-semibold truncate">
            {title || '（無題の詰将棋）'}
          </div>
          <div className="text-xs text-text-dim font-mincho mt-0.5">
            {firstMove && <span className="font-num text-accent-deep mr-2">{firstMove}…</span>}
            {source && <span>出どころ：{source}</span>}
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-fire font-mincho">{error}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href={`/family/tsume/${id}`}
          className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full bg-white border border-border text-text-muted hover:text-accent hover:border-accent font-mincho text-sm active:scale-95"
        >
          <Pencil className="w-4 h-4" /> 直す・見る
        </Link>

        <button
          type="button"
          onClick={togglePublish}
          disabled={pending}
          className={`inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full font-mincho text-sm font-bold active:scale-95 disabled:opacity-50 ${
            published
              ? 'bg-white border border-border text-text-muted hover:border-accent'
              : 'bg-accent text-white hover:bg-accent-deep'
          }`}
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : published ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {published ? '下書きにもどす' : '公開する'}
        </button>

        {confirming ? (
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full bg-fire text-white font-mincho text-sm font-bold active:scale-95 disabled:opacity-50"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              本当に消す
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-sm text-text-muted underline font-mincho"
            >
              やめる
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full bg-white border border-border text-fire/80 hover:text-fire hover:border-fire/40 font-mincho text-sm active:scale-95 ml-auto"
          >
            <Trash2 className="w-4 h-4" /> 消す
          </button>
        )}
      </div>
    </li>
  )
}

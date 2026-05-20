'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pause, Play, Trash2 } from 'lucide-react'
import { deleteBookAction, setBookStatusAction } from './actions'

type Status = 'reading' | 'done' | 'paused'

interface Props {
  id: string
  title: string
  status: Status
}

export function BookActions({ id, title, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const onStatus = (next: Status) => {
    if (next === status) return
    startTransition(async () => {
      await setBookStatusAction(id, next)
      router.refresh()
    })
  }

  const onDelete = () => {
    if (!confirm(`「${title}」を本棚から消しますか？\nこの本に紐づいた記録は残ります（本との紐づきだけ外れます）`)) return
    startTransition(async () => {
      await deleteBookAction(id)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-1 shrink-0">
      {status === 'reading' && (
        <button
          type="button"
          onClick={() => onStatus('done')}
          disabled={isPending}
          className="w-9 h-9 rounded-lg text-success hover:bg-success/10 transition-colors flex items-center justify-center disabled:opacity-50"
          aria-label="読了にする"
          title="読了にする"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
      {status === 'reading' && (
        <button
          type="button"
          onClick={() => onStatus('paused')}
          disabled={isPending}
          className="w-9 h-9 rounded-lg text-text-muted hover:bg-surface-elevated transition-colors flex items-center justify-center disabled:opacity-50"
          aria-label="一旦休む"
          title="一旦休む"
        >
          <Pause className="w-4 h-4" />
        </button>
      )}
      {status !== 'reading' && (
        <button
          type="button"
          onClick={() => onStatus('reading')}
          disabled={isPending}
          className="w-9 h-9 rounded-lg text-accent hover:bg-accent-soft transition-colors flex items-center justify-center disabled:opacity-50"
          aria-label="再開する"
          title="再開する"
        >
          <Play className="w-4 h-4" fill="currentColor" />
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={isPending}
        className="w-9 h-9 rounded-lg text-text-dim hover:text-danger hover:bg-danger/10 transition-colors flex items-center justify-center disabled:opacity-50"
        aria-label={`${title} を消す`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

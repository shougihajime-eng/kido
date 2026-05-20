'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteCountdownAction } from './actions'

export function DeleteCountdownButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const onClick = () => {
    if (!confirm(`「${title}」を消しますか？`)) return
    startTransition(async () => {
      await deleteCountdownAction(id)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="w-10 h-10 rounded-xl text-text-dim hover:text-danger hover:bg-danger/10 transition-colors flex items-center justify-center disabled:opacity-50"
      aria-label={`${title} を消す`}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}

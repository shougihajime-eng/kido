'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserMinus } from 'lucide-react'
import { removeRelationshipAction } from '@/app/(student)/code/actions'

interface RemoveLinkButtonProps {
  relationshipId: string
  displayName: string
}

export function RemoveLinkButton({ relationshipId, displayName }: RemoveLinkButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handle = () => {
    if (
      !confirm(
        `${displayName} さんとの紐づきを解除します。これ以降、その生徒の記録は見られなくなります。よろしいですか？`
      )
    ) {
      return
    }
    startTransition(async () => {
      const result = await removeRelationshipAction(relationshipId)
      if (!result.ok) {
        alert(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      className="h-9 w-9 rounded-lg border border-border hover:border-danger text-text-muted hover:text-danger transition-colors disabled:opacity-50 flex items-center justify-center"
      aria-label={`${displayName} との紐づきを解除`}
    >
      <UserMinus className="w-3.5 h-3.5" />
    </button>
  )
}

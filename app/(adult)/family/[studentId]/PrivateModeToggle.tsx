'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EyeOff } from 'lucide-react'
import { setStudentPrivateModeAction } from './privateMode-actions'

interface Props {
  studentId: string
  studentName: string
  initialPrivateMode: boolean
}

export function PrivateModeToggle({ studentId, studentName, initialPrivateMode }: Props) {
  const router = useRouter()
  const [privateMode, setPrivateMode] = useState(initialPrivateMode)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onToggle = () => {
    const next = !privateMode
    setError(null)
    setPrivateMode(next) // optimistic
    startTransition(async () => {
      const result = await setStudentPrivateModeAction(studentId, next)
      if (!result.ok) {
        setPrivateMode(!next) // rollback
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center text-text-muted shrink-0">
          <EyeOff className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold">プライベートモード</div>
          <p className="text-xs text-text-dim mt-1 leading-relaxed">
            ONにすると、{studentName} さんの名前は「仲間ランキング」で「ひみつの仲間」と表示されます。
            時間（がんばった分）は仲間にも見えます。見守り画面では今まで通り名前と時間が見えます。
          </p>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          onClick={onToggle}
          disabled={isPending}
          aria-pressed={privateMode}
          className={`relative w-14 h-8 rounded-full transition-colors shrink-0 disabled:opacity-60 ${
            privateMode ? 'bg-accent' : 'bg-surface-overlay border border-border'
          }`}
        >
          <span
            className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
              privateMode ? 'left-7' : 'left-1'
            }`}
          />
        </button>
        <span className="text-sm font-semibold">
          {isPending
            ? '切り替え中…'
            : privateMode
              ? 'ON（プライベート）'
              : 'OFF（みんなに名前が見える）'}
        </span>
      </label>

      {error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </section>
  )
}

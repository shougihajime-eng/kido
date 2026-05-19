'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, MessageCircle, Pencil, Save } from 'lucide-react'
import { getCategoryIcon, categoryColorVar } from '@/lib/category-icon'
import { CommentThread } from '@/components/comments/CommentThread'
import { saveSelfMemoAction } from '@/app/_actions/comments'
import type { CommentItemView } from '@/lib/comments'

interface RecordViewModel {
  id: string
  date: string
  duration_minutes: number
  memo: string | null
  self_memo: string | null
  category: {
    name_ja: string
    icon_key: string
    color_token: string
  } | null
}

interface Props {
  record: RecordViewModel
  comments: CommentItemView[]
  defaultOpen?: boolean
}

export function StudentRecordCard({ record, comments, defaultOpen }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen ?? comments.length > 0)
  const [memoEditing, setMemoEditing] = useState(false)
  const [memoDraft, setMemoDraft] = useState(record.self_memo ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const cat = record.category
  const Icon = getCategoryIcon(cat?.icon_key ?? 'plus')
  const color = categoryColorVar(cat?.color_token ?? 'cat-other')
  const commentCount = comments.length

  const handleSaveMemo = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await saveSelfMemoAction({
        recordId: record.id,
        selfMemo: memoDraft
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMemoEditing(false)
      router.refresh()
    })
  }

  return (
    <li className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full p-3 flex items-center gap-3 text-left hover:bg-surface-elevated/50 transition-colors"
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: color + '22', color }}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text truncate">{cat?.name_ja ?? '—'}</div>
          {record.memo && (
            <div className="text-xs text-text-muted truncate">{record.memo}</div>
          )}
        </div>
        {commentCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-accent bg-accent-soft px-2 py-1 rounded-full">
            <MessageCircle className="w-3 h-3" />
            <span className="font-num font-bold">{commentCount}</span>
          </span>
        ) : (
          <MessageCircle className="w-4 h-4 text-text-dim" />
        )}
        <div className="flex items-baseline gap-0.5 shrink-0">
          <span className="font-num font-bold tabular-nums">{record.duration_minutes}</span>
          <span className="text-xs text-text-muted">分</span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-border"
          >
            <div className="p-3 flex flex-col gap-3">
              {/* 自己メモ（自分だけ見える） */}
              <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-gold font-semibold">
                  <Lock className="w-3 h-3" />
                  自分だけのメモ
                </div>
                {memoEditing ? (
                  <form onSubmit={handleSaveMemo} className="flex flex-col gap-2">
                    <textarea
                      value={memoDraft}
                      onChange={(e) => setMemoDraft(e.target.value)}
                      rows={3}
                      maxLength={4000}
                      placeholder="今日の気づき・反省・自分宛のひとこと"
                      className="w-full resize-none rounded-lg bg-surface border border-border px-2.5 py-2 text-sm text-text placeholder:text-text-dim focus:border-gold focus:outline-none"
                    />
                    {error && (
                      <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-2 py-1">
                        {error}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMemoEditing(false)
                          setMemoDraft(record.self_memo ?? '')
                          setError(null)
                        }}
                        disabled={isPending}
                        className="h-8 px-3 rounded-full bg-surface text-text-muted text-xs border border-border hover:text-text disabled:opacity-50"
                      >
                        やめる
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-gold text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        {isPending ? '保存中…' : '保存'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMemoEditing(true)}
                    className="text-left text-sm text-text-muted hover:text-text whitespace-pre-wrap break-words leading-relaxed flex items-start gap-2"
                  >
                    <span className="flex-1">
                      {record.self_memo ?? 'タップして自分宛のひとことを書く'}
                    </span>
                    <Pencil className="w-3.5 h-3.5 text-text-dim shrink-0 mt-0.5" />
                  </button>
                )}
              </div>

              {/* 会話 */}
              <CommentThread
                recordId={record.id}
                comments={comments}
                canPost={true}
                defaultOpen={true}
                placeholder="親・先生に伝えたいこと、返信を書こう"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

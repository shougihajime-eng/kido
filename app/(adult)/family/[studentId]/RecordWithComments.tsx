'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, MessageCirclePlus, Send, Trash2 } from 'lucide-react'
import { addCommentAction, deleteCommentAction } from './actions'

export interface CategoryInfo {
  id: string
  name_ja: string
  color_token: string
}

export interface CommentItem {
  id: string
  author_id: string | null
  author_role: 'student' | 'parent' | 'teacher' | 'ai'
  author_display_name: string
  content: string
  created_at: string
  isMine: boolean
}

export interface RecordItem {
  id: string
  date: string
  duration_minutes: number
  memo: string | null
  category: CategoryInfo | null
}

interface RecordWithCommentsProps {
  record: RecordItem
  studentId: string
  comments: CommentItem[]
  canComment: boolean
}

const ROLE_LABEL: Record<'parent' | 'teacher' | 'ai' | 'student', string> = {
  parent: '親',
  teacher: '先生',
  ai: 'AI',
  student: '生徒'
}

const ROLE_COLOR: Record<'parent' | 'teacher' | 'ai' | 'student', string> = {
  parent: 'text-indigo bg-indigo/15 border-indigo/30',
  teacher: 'text-accent bg-accent-soft border-accent/30',
  ai: 'text-cat-ai bg-cat-ai/15 border-cat-ai/30',
  student: 'text-text-muted bg-surface-elevated border-border'
}

function formatRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'たった今'
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}日前`
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export function RecordWithComments({
  record,
  studentId,
  comments,
  canComment
}: RecordWithCommentsProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(comments.length > 0 && comments.length <= 2)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const cat = record.category
  const colorVar = `var(--color-${cat?.color_token ?? 'cat-other'})`
  const commentCount = comments.length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await addCommentAction({
        recordId: record.id,
        studentId,
        content
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setContent('')
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('このコメントを削除しますか？')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteCommentAction({ commentId: id, studentId })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <li className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* 記録ヘッダー */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-surface-elevated/50 transition-colors"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
          style={{ backgroundColor: colorVar }}
        >
          {cat?.name_ja?.slice(0, 1) ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-semibold">{cat?.name_ja ?? '不明'}</span>
            <span className="text-xs text-text-dim">
              {new Date(record.date).toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              })}
            </span>
          </div>
          {record.memo && (
            <div className="text-xs text-text-muted mt-1 truncate">{record.memo}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-num text-xl font-bold text-accent">
            {record.duration_minutes}
          </div>
          <div className="text-[10px] text-text-dim">分</div>
        </div>
        <div className="ml-2 flex items-center gap-1 shrink-0 text-text-muted">
          {commentCount > 0 ? (
            <span className="flex items-center gap-1 text-xs">
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="font-num">{commentCount}</span>
            </span>
          ) : canComment ? (
            <span className="text-xs flex items-center gap-1">
              <MessageCirclePlus className="w-3.5 h-3.5" />
            </span>
          ) : null}
        </div>
      </button>

      {/* 展開時：コメント一覧 + 入力フォーム */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-border"
          >
            <div className="p-4 flex flex-col gap-3">
              {comments.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {comments.map((c) => (
                    <li
                      key={c.id}
                      className="bg-surface-elevated/60 border border-border/60 rounded-xl p-3 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">
                          {c.author_display_name}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${ROLE_COLOR[c.author_role]}`}
                        >
                          {ROLE_LABEL[c.author_role]}
                        </span>
                        <span className="ml-auto text-[10px] text-text-dim">
                          {formatRelative(c.created_at)}
                        </span>
                        {c.isMine && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            disabled={isPending}
                            className="text-text-dim hover:text-danger transition-colors disabled:opacity-50"
                            aria-label="このコメントを削除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {c.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {canComment && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="励まし・気づき・アドバイスを書こう"
                    rows={2}
                    maxLength={2000}
                    className="w-full resize-none rounded-xl bg-surface-elevated border border-border px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none transition-colors"
                  />
                  {error && (
                    <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-2 py-1">
                      {error}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-dim font-num">
                      {content.length}/2000
                    </span>
                    <button
                      type="submit"
                      disabled={isPending || !content.trim()}
                      className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-accent text-white text-sm font-semibold shadow-[0_2px_12px_rgba(30,64,175,0.2)] hover:bg-accent-deep hover:shadow-[0_4px_16px_rgba(30,64,175,0.3)] disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isPending ? '送信中…' : 'コメントする'}
                    </button>
                  </div>
                </form>
              )}

              {!canComment && comments.length === 0 && (
                <p className="text-xs text-text-dim text-center py-4">
                  まだコメントはありません
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

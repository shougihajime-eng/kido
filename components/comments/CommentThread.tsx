'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Pencil, Send, Smile, Trash2, X } from 'lucide-react'
import {
  ROLE_BADGE_CLASS,
  ROLE_LABEL,
  REACTION_EMOJIS,
  formatRelativeTime,
  isEdited,
  type CommentItemView
} from '@/lib/comments'
import {
  addCommentAction,
  deleteCommentAction,
  toggleReactionAction,
  updateCommentAction
} from '@/app/_actions/comments'

interface Props {
  recordId: string
  comments: CommentItemView[]
  /** 書き込み可能か。基本は true。閲覧専用にしたい場合のみ false。 */
  canPost: boolean
  /** 初期表示で展開するか */
  defaultOpen?: boolean
  /** プレースホルダ（ロール別に差し替え） */
  placeholder?: string
}

export function CommentThread({
  recordId,
  comments,
  canPost,
  defaultOpen,
  placeholder = '励まし・気づき・アドバイスを書こう'
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen ?? (comments.length > 0 && comments.length <= 3))
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    setError(null)
    startTransition(async () => {
      const result = await addCommentAction({ recordId, content: trimmed })
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
      const result = await deleteCommentAction({ commentId: id })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const handleStartEdit = (c: CommentItemView) => {
    setEditingId(c.id)
    setEditingDraft(c.content)
    setError(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingDraft('')
  }

  const handleSaveEdit = (id: string) => {
    const trimmed = editingDraft.trim()
    if (!trimmed) return
    setError(null)
    startTransition(async () => {
      const result = await updateCommentAction({ commentId: id, content: trimmed })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setEditingId(null)
      setEditingDraft('')
      router.refresh()
    })
  }

  const handleToggleReaction = (commentId: string, emoji: string) => {
    setError(null)
    setPickerFor(null)
    startTransition(async () => {
      const result = await toggleReactionAction({ commentId, emoji })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const summary = comments.length === 0 ? '会話を始めよう' : `${comments.length}件のコメント`

  return (
    <div className="flex flex-col gap-2">
      {/* ヘッダ：開閉トグル */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between text-xs text-text-muted hover:text-text px-1 py-1.5 rounded-lg transition-colors"
      >
        <span className="font-semibold">{summary}</span>
        <span className="text-[10px]">{open ? '閉じる' : 'ひらく'}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 pt-1">
              {comments.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {comments.map((c) => {
                    const edited = isEdited(c.created_at, c.updated_at)
                    const isEditing = editingId === c.id
                    return (
                      <li
                        key={c.id}
                        className="bg-surface-elevated/60 border border-border/60 rounded-xl p-3 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold truncate">
                            {c.author_display_name}
                          </span>
                          <span
                            className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-full border ${ROLE_BADGE_CLASS[c.author_role]}`}
                          >
                            {ROLE_LABEL[c.author_role]}
                          </span>
                          <span className="ml-auto text-[10px] text-text-dim">
                            {formatRelativeTime(c.created_at)}
                            {edited && (
                              <span className="ml-1 text-text-dim">（編集済み）</span>
                            )}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={editingDraft}
                              onChange={(e) => setEditingDraft(e.target.value)}
                              rows={3}
                              maxLength={2000}
                              className="w-full resize-none rounded-lg bg-surface border border-border px-2.5 py-2 text-sm text-text focus:border-accent focus:outline-none transition-colors"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-surface text-text-muted text-xs border border-border hover:text-text disabled:opacity-50"
                              >
                                <X className="w-3 h-3" />
                                やめる
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(c.id)}
                                disabled={isPending || !editingDraft.trim()}
                                className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-accent text-white text-xs font-semibold hover:bg-accent-deep disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                {isPending ? '保存中…' : '保存'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {c.content}
                          </p>
                        )}

                        {/* リアクション + 操作ボタン */}
                        {!isEditing && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {c.reactions.map((r) => (
                              <button
                                key={r.emoji}
                                type="button"
                                onClick={() => handleToggleReaction(c.id, r.emoji)}
                                disabled={isPending}
                                className={`inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs border transition-colors disabled:opacity-50 ${
                                  r.mine
                                    ? 'bg-accent-soft border-accent/40 text-accent'
                                    : 'bg-surface border-border text-text-muted hover:border-accent/40'
                                }`}
                                aria-pressed={r.mine}
                              >
                                <span className="text-sm leading-none">{r.emoji}</span>
                                <span className="font-num font-semibold">{r.count}</span>
                              </button>
                            ))}

                            {/* 絵文字ピッカートグル */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setPickerFor((id) => (id === c.id ? null : c.id))
                                }
                                disabled={isPending}
                                className="inline-flex items-center justify-center h-7 w-7 rounded-full text-text-dim border border-dashed border-border hover:text-accent hover:border-accent/40 transition-colors disabled:opacity-50"
                                aria-label="絵文字でリアクション"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>
                              {pickerFor === c.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute z-10 mt-1 left-0 bg-surface border border-border rounded-2xl shadow-lg px-2 py-1.5 flex items-center gap-1"
                                >
                                  {REACTION_EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => handleToggleReaction(c.id, emoji)}
                                      disabled={isPending}
                                      className="h-9 w-9 text-lg leading-none rounded-lg hover:bg-surface-elevated transition-colors disabled:opacity-50"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </div>

                            {/* 自分のコメントのみ：編集・削除 */}
                            {c.isMine && (
                              <div className="ml-auto flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(c)}
                                  disabled={isPending}
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-full text-text-dim hover:text-accent transition-colors disabled:opacity-50"
                                  aria-label="このコメントを編集"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(c.id)}
                                  disabled={isPending}
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-full text-text-dim hover:text-danger transition-colors disabled:opacity-50"
                                  aria-label="このコメントを削除"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}

              {canPost && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
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
                      {isPending ? '送信中…' : '送る'}
                    </button>
                  </div>
                </form>
              )}

              {!canPost && comments.length === 0 && (
                <p className="text-xs text-text-dim text-center py-4">
                  まだコメントはありません
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

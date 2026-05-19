'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Pencil, Save, Trash2 } from 'lucide-react'
import {
  addDiaryEntryAction,
  deleteDiaryEntryAction,
  updateDiaryEntryAction
} from './actions'
import { formatRelativeTime, isEdited } from '@/lib/comments'

interface DiaryEntry {
  id: string
  date: string
  content: string
  created_at: string
  // updated_at は diary_entries にまだ無い場合があるためオプショナル
  updated_at?: string
}

interface SelfMemoEntry {
  recordId: string
  date: string
  categoryName: string
  selfMemo: string
}

interface Props {
  todayIso: string
  diaryEntries: DiaryEntry[]
  selfMemos: SelfMemoEntry[]
}

export function DiaryClient({ todayIso, diaryEntries, selfMemos }: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return
    setError(null)
    startTransition(async () => {
      const result = await addDiaryEntryAction({ date: todayIso, content })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDraft('')
      router.refresh()
    })
  }

  const handleSaveEdit = (id: string) => {
    const content = editingDraft.trim()
    if (!content) return
    setError(null)
    startTransition(async () => {
      const result = await updateDiaryEntryAction({ id, content })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setEditingId(null)
      setEditingDraft('')
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('この日記を消しますか？')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteDiaryEntryAction({ id })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 新規入力 */}
      <section className="bg-gold/5 border border-gold/30 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gold-deep">
          <Lock className="w-3.5 h-3.5" />
          自分だけが見える日記
        </div>
        <form onSubmit={handleAdd} className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="今日の気持ち・反省・目標・気づき…なんでも"
            rows={5}
            maxLength={6000}
            className="w-full resize-none rounded-xl bg-surface border border-border px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-gold focus:outline-none transition-colors"
          />
          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-2 py-1">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-dim font-num">
              {draft.length}/6000
            </span>
            <button
              type="submit"
              disabled={isPending || !draft.trim()}
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-gold text-white text-sm font-semibold hover:bg-gold-deep disabled:opacity-50 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {isPending ? '保存中…' : '今日の日記を保存'}
            </button>
          </div>
        </form>
      </section>

      {/* 過去の日記 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-muted">これまでの日記</h2>
        {diaryEntries.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl px-4 py-8 text-center text-sm text-text-dim">
            まだ日記はありません
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {diaryEntries.map((d) => {
                const isEditing = editingId === d.id
                const edited = d.updated_at ? isEdited(d.created_at, d.updated_at) : false
                return (
                  <motion.li
                    key={d.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold font-num">
                        {formatDateJa(d.date)}
                      </span>
                      <span className="ml-auto text-[10px] text-text-dim">
                        {formatRelativeTime(d.created_at)}
                        {edited && <span className="ml-1">（編集済み）</span>}
                      </span>
                      {!isEditing && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(d.id)
                              setEditingDraft(d.content)
                            }}
                            disabled={isPending}
                            className="text-text-dim hover:text-accent disabled:opacity-50"
                            aria-label="この日記を編集"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            disabled={isPending}
                            className="text-text-dim hover:text-danger disabled:opacity-50"
                            aria-label="この日記を削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editingDraft}
                          onChange={(e) => setEditingDraft(e.target.value)}
                          rows={5}
                          maxLength={6000}
                          className="w-full resize-none rounded-lg bg-surface-elevated border border-border px-2.5 py-2 text-sm text-text focus:border-gold focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null)
                              setEditingDraft('')
                            }}
                            disabled={isPending}
                            className="h-8 px-3 rounded-full bg-surface text-text-muted text-xs border border-border disabled:opacity-50"
                          >
                            やめる
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(d.id)}
                            disabled={isPending || !editingDraft.trim()}
                            className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-gold text-white text-xs font-semibold hover:bg-gold-deep disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            {isPending ? '保存中…' : '保存'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {d.content}
                      </p>
                    )}
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {/* 自己メモ（記録ごとに残したもの）一覧 */}
      {selfMemos.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-muted">
            最近の練習に残したひとこと（自分だけのメモ）
          </h2>
          <ul className="flex flex-col gap-2">
            {selfMemos.map((m) => (
              <li
                key={m.recordId}
                className="bg-surface border border-border rounded-2xl p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-num text-text-muted">{formatDateJa(m.date)}</span>
                  <span className="text-text">{m.categoryName}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {m.selfMemo}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-text-dim leading-relaxed">
        ここに書いたことは <strong>自分以外には絶対に表示されません</strong>
        。親も先生も AI も読めません。
      </p>
    </div>
  )
}

function formatDateJa(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dows = ['日', '月', '火', '水', '木', '金', '土']
  return `${m}月${day}日（${dows[d.getDay()]}）`
}

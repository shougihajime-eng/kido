'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { CommentThread } from '@/components/comments/CommentThread'
import type { CommentItemView } from '@/lib/comments'

export interface CategoryInfo {
  id: string
  name_ja: string
  color_token: string
}

export interface RecordItem {
  id: string
  date: string
  duration_minutes: number
  memo: string | null
  category: CategoryInfo | null
}

interface Props {
  record: RecordItem
  comments: CommentItemView[]
  canComment: boolean
}

export function RecordWithComments({ record, comments, canComment }: Props) {
  const [expanded, setExpanded] = useState(comments.length > 0 && comments.length <= 2)
  const cat = record.category
  const colorVar = `var(--color-${cat?.color_token ?? 'cat-other'})`
  const commentCount = comments.length

  return (
    <li className="bg-surface border border-border rounded-2xl overflow-hidden">
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
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-num">{commentCount}</span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-border"
          >
            <div className="p-4">
              <CommentThread
                recordId={record.id}
                comments={comments}
                canPost={canComment}
                defaultOpen={true}
                placeholder="励まし・気づき・アドバイスを書こう"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

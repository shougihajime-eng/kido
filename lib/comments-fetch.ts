// 記録IDの配列に対し、コメント・リアクション・著者表示名を一括取得する共通ヘルパ。
// 親・先生・生徒・スーパー先生の全画面から呼ばれる。

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { CommentItemView, ReactionSummaryItem, CommentAuthorRole } from '@/lib/comments'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database, 'kido', any>

export async function fetchCommentsForRecords(
  supabase: Client,
  recordIds: string[],
  viewerUserId: string
): Promise<{
  byRecord: Map<string, CommentItemView[]>
  total: number
}> {
  if (recordIds.length === 0) {
    return { byRecord: new Map(), total: 0 }
  }

  const { data: comments, error } = await supabase
    .from('comments')
    .select('id, record_id, author_id, author_role, content, created_at, updated_at')
    .in('record_id', recordIds)
    .order('created_at', { ascending: true })

  if (error || !comments || comments.length === 0) {
    return { byRecord: new Map(), total: 0 }
  }

  const commentIds = comments.map((c) => c.id)
  const authorIds = Array.from(
    new Set(comments.map((c) => c.author_id).filter((id): id is string => !!id))
  )

  // 著者名
  const authorMap = new Map<string, string>()
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', authorIds)
    for (const a of authors ?? []) {
      authorMap.set(a.id, a.display_name)
    }
  }

  // リアクション一括取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reactionRows } = await ((supabase as any)
    .from('comment_reactions')
    .select('id, comment_id, user_id, emoji')
    .in('comment_id', commentIds))

  const reactionsByComment = new Map<string, ReactionSummaryItem[]>()
  for (const r of (reactionRows ?? []) as Array<{
    id: string
    comment_id: string
    user_id: string
    emoji: string
  }>) {
    const list = reactionsByComment.get(r.comment_id) ?? []
    const existing = list.find((e) => e.emoji === r.emoji)
    if (existing) {
      existing.count += 1
      if (r.user_id === viewerUserId) existing.mine = true
    } else {
      list.push({ emoji: r.emoji, count: 1, mine: r.user_id === viewerUserId })
    }
    reactionsByComment.set(r.comment_id, list)
  }

  // 集約
  const byRecord = new Map<string, CommentItemView[]>()
  for (const c of comments) {
    const list = byRecord.get(c.record_id) ?? []
    list.push({
      id: c.id,
      record_id: c.record_id,
      author_id: c.author_id,
      author_role: c.author_role as CommentAuthorRole,
      author_display_name: c.author_id
        ? (authorMap.get(c.author_id) ?? '不明')
        : c.author_role === 'ai'
          ? 'AI コーチ'
          : '不明',
      content: c.content,
      created_at: c.created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updated_at: (c as any).updated_at ?? c.created_at,
      isMine: c.author_id === viewerUserId,
      reactions: reactionsByComment.get(c.id) ?? []
    })
    byRecord.set(c.record_id, list)
  }

  return { byRecord, total: comments.length }
}

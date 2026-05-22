// 指定生徒 × 日付範囲 の day_comments を一括取得して日付ごとに束ねるヘルパ。
// 生徒ダッシュボード（/dashboard）と親・先生の生徒詳細（/family/[studentId]）の両方から呼ばれる。

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { CommentAuthorRole } from '@/lib/comments'
import type { DayCommentItemView } from '@/lib/day-comments'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database, 'kido', any>

interface DayCommentRow {
  id: string
  student_id: string
  date: string
  author_id: string | null
  author_role: string
  content: string
  created_at: string
  updated_at: string
}

/**
 * 指定生徒の day_comments を [fromDate, toDate] の範囲で取得。
 * 戻り値は date(YYYY-MM-DD) をキーにしたコメント配列。
 */
export async function fetchDayCommentsForStudent(
  supabase: Client,
  studentId: string,
  fromDate: string,
  toDate: string,
  viewerUserId: string
): Promise<{
  byDate: Map<string, DayCommentItemView[]>
  total: number
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await ((supabase as any)
    .from('day_comments')
    .select('id, student_id, date, author_id, author_role, content, created_at, updated_at')
    .eq('student_id', studentId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('created_at', { ascending: true })) as { data: DayCommentRow[] | null; error: unknown }

  if (error || !rows || rows.length === 0) {
    return { byDate: new Map(), total: 0 }
  }

  const authorIds = Array.from(
    new Set(rows.map((r) => r.author_id).filter((id): id is string => !!id))
  )

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

  const byDate = new Map<string, DayCommentItemView[]>()
  for (const c of rows) {
    const list = byDate.get(c.date) ?? []
    list.push({
      id: c.id,
      student_id: c.student_id,
      date: c.date,
      author_id: c.author_id,
      author_role: c.author_role as CommentAuthorRole,
      author_display_name: c.author_id
        ? (authorMap.get(c.author_id) ?? '不明')
        : '不明',
      content: c.content,
      created_at: c.created_at,
      updated_at: c.updated_at ?? c.created_at,
      isMine: c.author_id === viewerUserId
    })
    byDate.set(c.date, list)
  }

  return { byDate, total: rows.length }
}

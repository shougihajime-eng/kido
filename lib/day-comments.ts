// 日コメント（記録がない日でも残せる声かけ）の共有型 & ヘルパ
//
// 既存の「記録に対するコメント」(comments テーブル) とは別の day_comments テーブル。
// student_id × date × author_id の組み合わせで複数件残せる。

import type { CommentAuthorRole } from './comments'

export interface DayCommentItemView {
  id: string
  student_id: string
  date: string // YYYY-MM-DD
  author_id: string | null
  author_role: CommentAuthorRole
  author_display_name: string
  content: string
  created_at: string
  updated_at: string
  isMine: boolean
}

/** dateKey 文字列化（同じ日付ごとに集約するため） */
export function dayCommentKey(studentId: string, date: string): string {
  return `${studentId}__${date}`
}

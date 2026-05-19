// コメント・絵文字リアクション関連の共有定数 & 型

export const REACTION_EMOJIS = ['👍', '❤️', '🔥', '🎉', '👏', '🙏'] as const
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

export type CommentAuthorRole = 'student' | 'parent' | 'teacher' | 'ai'

export interface ReactionSummaryItem {
  emoji: string
  count: number
  mine: boolean
}

export interface CommentItemView {
  id: string
  record_id: string
  author_id: string | null
  author_role: CommentAuthorRole
  author_display_name: string
  content: string
  created_at: string
  updated_at: string
  isMine: boolean
  reactions: ReactionSummaryItem[]
}

export const ROLE_LABEL: Record<CommentAuthorRole, string> = {
  student: '生徒',
  parent: '親',
  teacher: '先生',
  ai: 'AI'
}

export const ROLE_BADGE_CLASS: Record<CommentAuthorRole, string> = {
  student: 'text-text-muted bg-surface-elevated border-border',
  parent: 'text-indigo bg-indigo/15 border-indigo/30',
  teacher: 'text-accent bg-accent-soft border-accent/30',
  ai: 'text-cat-ai bg-cat-ai/15 border-cat-ai/30'
}

export function formatRelativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'たった今'
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}日前`
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export function isEdited(createdAt: string, updatedAt: string): boolean {
  // updated_at が created_at より 2 秒以上後なら「編集済み」と扱う
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 2000
}

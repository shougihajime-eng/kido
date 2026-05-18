import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateBadgesForUser } from './evaluate'

/**
 * ユーザーの達成バッジを評価し、未獲得分を user_badges に挿入する。
 * 戻り値は今回新規に獲得したバッジ ID の配列。
 *
 * RLS は INSERT を service_role のみに限定しているので admin クライアントで実行。
 */
export async function awardBadgesForUser(userId: string): Promise<string[]> {
  const admin = createAdminClient()

  // すでに獲得済のバッジ
  const { data: ownedRows } = await admin
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)
  const owned = new Set((ownedRows ?? []).map((r) => r.badge_id))

  // 現時点で資格のあるバッジ全部
  const qualified = await evaluateBadgesForUser(admin, userId)

  // 新規分
  const newly = qualified.filter((id) => !owned.has(id))
  if (newly.length === 0) return []

  const rows = newly.map((badge_id) => ({ user_id: userId, badge_id }))
  const { error } = await admin.from('user_badges').insert(rows)
  if (error) {
    console.error('[badges] insert failed:', error)
    return []
  }
  return newly
}

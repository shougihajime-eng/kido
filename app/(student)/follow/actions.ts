'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleRivalAction(
  rivalId: string,
  makeRival: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'ログインが必要です' }
  }

  if (user.id === rivalId) {
    return { ok: false, error: '自分自身はライバルにできません' }
  }

  // rivals テーブルは Database 型未再生成のため untyped でアクセス
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any

  if (makeRival) {
    const { error } = await untyped
      .from('rivals')
      .upsert({ user_id: user.id, rival_id: rivalId })
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await untyped
      .from('rivals')
      .delete()
      .eq('user_id', user.id)
      .eq('rival_id', rivalId)
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath('/follow')
  return { ok: true }
}

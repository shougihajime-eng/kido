'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SetPrivateModeResult = { ok: true } | { ok: false; error: string }

/**
 * 親・先生 が紐づき生徒のプライベートモードを切り替える。
 * SECURITY DEFINER 関数 kido.set_student_private_mode を呼ぶ。
 * RLS / 権限チェックは関数内で行われる。
 */
export async function setStudentPrivateModeAction(
  studentId: string,
  newValue: boolean
): Promise<SetPrivateModeResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインしてください' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('set_student_private_mode', {
    target_student_id: studentId,
    new_value: newValue
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath(`/family/${studentId}`)
  revalidatePath('/family')
  revalidatePath('/follow')
  return { ok: true }
}

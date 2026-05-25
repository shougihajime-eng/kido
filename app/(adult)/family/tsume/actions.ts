'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string }

export type SaveTsumeInput = {
  id?: string
  title: string
  tesuu: number
  level: string
  startSfen: string
  finalSfen: string
  movesJa: string[]
  movesUsi: string[]
  frames: string[]
  composer: string
  source: string
  note: string
  published: boolean
}

const VALID_LEVELS = ['demo', 'easy', 'normal', 'hard', 'master']

// 先生だけが詰将棋を作れる。先生でなければ理由を返す。
async function requireTeacher() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'ログインが必要です' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'teacher') {
    return { ok: false as const, error: 'この操作は先生だけができます' }
  }
  return { ok: true as const, supabase, userId: user.id }
}

function revalidateTsume() {
  revalidatePath('/family/tsume')
  revalidatePath('/tsume')
  revalidatePath('/dashboard')
}

/** 詰将棋を新規保存 or 上書き保存 */
export async function saveTsumeProblem(input: SaveTsumeInput): Promise<ActionResult> {
  const auth = await requireTeacher()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { supabase, userId } = auth

  // かんたんな入力チェック
  if (!input.startSfen.trim()) return { ok: false, error: '開始の盤面がありません' }
  if (!Array.isArray(input.movesUsi) || input.movesUsi.length === 0) {
    return { ok: false, error: '答えの手順が1手もありません' }
  }
  if (input.frames.length !== input.movesUsi.length + 1) {
    return { ok: false, error: '盤面の記録（frames）と手数が合っていません' }
  }
  const level = VALID_LEVELS.includes(input.level) ? input.level : 'normal'
  const tesuu = input.movesUsi.length

  const row = {
    title: input.title.trim() || null,
    tesuu,
    level,
    start_sfen: input.startSfen.trim(),
    final_sfen: input.finalSfen.trim(),
    moves_ja: input.movesJa,
    moves_usi: input.movesUsi,
    frames: input.frames,
    composer: input.composer.trim() || null,
    source: input.source.trim() || null,
    note: input.note.trim() || null,
    published: input.published
  }

  if (input.id) {
    const { error } = await supabase.from('tsume_problems').update(row).eq('id', input.id)
    if (error) return { ok: false, error: error.message }
  } else {
    // 末尾に並べる（既存の最大 sort_order + 10）
    const { data: last } = await supabase
      .from('tsume_problems')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextOrder = (last?.sort_order ?? 0) + 10
    const { error } = await supabase
      .from('tsume_problems')
      .insert({ ...row, created_by: userId, sort_order: nextOrder })
    if (error) return { ok: false, error: error.message }
  }

  revalidateTsume()
  return { ok: true }
}

/** 公開 / 下書き を切り替え（生徒・保護者に出す/隠す） */
export async function setTsumePublished(id: string, published: boolean): Promise<ActionResult> {
  const auth = await requireTeacher()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { error } = await auth.supabase
    .from('tsume_problems')
    .update({ published })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidateTsume()
  return { ok: true }
}

/** 詰将棋を削除 */
export async function deleteTsumeProblem(id: string): Promise<ActionResult> {
  const auth = await requireTeacher()
  if (!auth.ok) return { ok: false, error: auth.error }
  const { error } = await auth.supabase.from('tsume_problems').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidateTsume()
  return { ok: true }
}

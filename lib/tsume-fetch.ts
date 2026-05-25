import { createClient } from '@/lib/supabase/server'
import { rowToTsume, TSUME, type TsumeProblem } from '@/lib/tsume'

// 公開された詰将棋（DB）を取得して TsumeProblem に変換する。
// まだ1問も公開されていなければ、組み込みの問題（TSUME）を返す（空にしない）。
export async function fetchPublishedTsume(): Promise<TsumeProblem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tsume_problems')
    .select(
      'id, tesuu, level, start_sfen, final_sfen, moves_ja, moves_usi, frames, title, composer, source, note'
    )
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const rows = data ?? []
  if (rows.length === 0) return TSUME
  return rows.map(rowToTsume)
}

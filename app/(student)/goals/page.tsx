import { createClient } from '@/lib/supabase/server'
import { todayLocalISO } from '@/lib/dates'
import { GoalsManager } from './GoalsManager'

export const metadata = {
  title: '目標'
}

export default async function GoalsPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const today = todayLocalISO()

  // 目標一覧（新しい順）
  const { data: goals } = await supabase
    .from('goals')
    .select('id, period, category_id, target_minutes, start_date, end_date, created_at')
    .eq('user_id', user.id)
    .order('end_date', { ascending: false })

  // 進捗計算のために、最古の目標 start_date 以降の練習を取得
  const earliestStart =
    goals && goals.length > 0
      ? goals.reduce((min, g) => (g.start_date < min ? g.start_date : min), goals[0].start_date)
      : today

  const { data: records } = await supabase
    .from('training_records')
    .select('date, category_id, duration_minutes')
    .eq('user_id', user.id)
    .gte('date', earliestStart)

  // カテゴリ一覧（kind 込み）
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_ja, color_token, kind')
    .order('sort_order', { ascending: true })

  const catMap = new Map((categories ?? []).map((c) => [c.id, c]))

  // 各目標の進捗を計算
  // category_id 未指定（全体）目標は将棋カテゴリのみを対象にする
  const goalsWithProgress = (goals ?? []).map((g) => {
    const inRange = (records ?? []).filter(
      (r) => r.date >= g.start_date && r.date <= g.end_date
    )
    const matching = g.category_id
      ? inRange.filter((r) => r.category_id === g.category_id)
      : inRange.filter((r) => {
          const cat = catMap.get(r.category_id)
          return cat?.kind === 'shogi'
        })
    const currentMinutes = matching.reduce((s, r) => s + r.duration_minutes, 0)
    const categoryName = g.category_id ? catMap.get(g.category_id)?.name_ja ?? '不明' : null
    const colorToken = g.category_id ? catMap.get(g.category_id)?.color_token ?? 'cat-other' : null
    const isActive = g.end_date >= today
    return {
      id: g.id,
      period: g.period as 'weekly' | 'monthly',
      categoryId: g.category_id,
      categoryName,
      colorToken,
      targetMinutes: g.target_minutes,
      currentMinutes,
      startDate: g.start_date,
      endDate: g.end_date,
      isActive
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">目標</h1>
        <p className="text-sm text-text-muted">
          週ごと・月ごとの目標を立てて、達成感を積み上げる
        </p>
      </header>

      <GoalsManager
        goals={goalsWithProgress}
        categories={(categories ?? []).map((c) => ({
          id: c.id,
          name_ja: c.name_ja,
          color_token: c.color_token,
          kind: c.kind
        }))}
        today={today}
      />
    </div>
  )
}

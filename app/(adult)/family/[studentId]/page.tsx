import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Calendar, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: '生徒の記録'
}

interface PageProps {
  params: Promise<{ studentId: string }>
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { studentId } = await params
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  // 紐づけ確認（RLS で守られているが二重チェック）
  const { data: rel } = await supabase
    .from('relationships')
    .select('id, kind')
    .eq('adult_id', user.id)
    .eq('student_id', studentId)
    .maybeSingle()

  if (!rel) {
    notFound()
  }

  // 生徒情報
  const { data: student } = await supabase
    .from('profiles')
    .select('display_name, level_text, avatar_url')
    .eq('id', studentId)
    .maybeSingle()

  if (!student) {
    notFound()
  }

  // 直近 14 日の記録
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const { data: records } = await supabase
    .from('training_records')
    .select('id, date, duration_minutes, memo, category_id, recorded_at')
    .eq('user_id', studentId)
    .gte('date', fourteenDaysAgo)
    .order('date', { ascending: false })
    .order('recorded_at', { ascending: false })

  // カテゴリ名引き
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_ja, icon_key, color_token')
  const catMap = new Map((categories ?? []).map((c) => [c.id, c]))

  const totalMinutes = (records ?? []).reduce((s, r) => s + r.duration_minutes, 0)
  const activeDays = new Set((records ?? []).map((r) => r.date)).size

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/family"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ChevronLeft className="w-4 h-4" />
          見守りに戻る
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center text-accent font-num text-2xl font-bold">
            {student.display_name.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{student.display_name}</h1>
            {student.level_text && (
              <p className="text-sm text-text-muted mt-0.5">{student.level_text}</p>
            )}
            <p className="text-xs text-text-dim mt-0.5">
              {rel.kind === 'parent' ? '親' : '先生'} として見守り中
            </p>
          </div>
        </div>
      </header>

      {/* サマリー */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <TrendingUp className="w-3.5 h-3.5" />
            14日間の合計
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-num text-3xl font-bold gold-glow">{totalMinutes}</span>
            <span className="text-sm text-text-muted">分</span>
          </div>
          <div className="text-xs text-text-dim mt-1">
            {Math.floor(totalMinutes / 60)} 時間 {totalMinutes % 60} 分
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Calendar className="w-3.5 h-3.5" />
            記録した日数
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-num text-3xl font-bold">{activeDays}</span>
            <span className="text-sm text-text-muted">日 / 14日</span>
          </div>
          <div className="text-xs text-text-dim mt-1">
            継続率 {Math.round((activeDays / 14) * 100)}%
          </div>
        </div>
      </section>

      {/* 記録一覧 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-muted">直近の記録</h2>
        {!records || records.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl px-4 py-10 text-center text-sm text-text-dim">
            この期間の記録はまだありません
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {records.map((r) => {
              const cat = catMap.get(r.category_id)
              return (
                <li
                  key={r.id}
                  className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-background font-bold text-xs"
                    style={{
                      backgroundColor: `var(--${cat?.color_token ?? 'cat-other'})`
                    }}
                  >
                    {cat?.name_ja?.slice(0, 1) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold">{cat?.name_ja ?? '不明'}</span>
                      <span className="text-xs text-text-dim">
                        {new Date(r.date).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </span>
                    </div>
                    {r.memo && (
                      <div className="text-xs text-text-muted mt-1 truncate">{r.memo}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-num text-xl font-bold text-accent">
                      {r.duration_minutes}
                    </div>
                    <div className="text-[10px] text-text-dim">分</div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-text-dim leading-relaxed">
        読み取り専用です。コメント機能・週間サマリー・カレンダー等は今後追加予定です。
      </p>
    </div>
  )
}

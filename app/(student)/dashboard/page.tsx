import Link from 'next/link'
import {
  BookText,
  CheckCircle2,
  ChevronRight,
  Flame,
  KeyRound,
  PlusCircle,
  Target,
  UsersRound
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AnimatedNumber } from '@/app/components/AnimatedNumber'
import {
  computeStreak,
  daysRemaining,
  formatMinutes,
  todayLocalISO,
  ymdAddDays
} from '@/lib/dates'
import { WeeklyBars } from '@/components/dashboard/WeeklyBars'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { MoodQuickLog } from '@/components/dashboard/MoodQuickLog'
import { MeigenCard } from '@/components/dashboard/MeigenCard'
import { StudentRecordCard } from '@/components/records/StudentRecordCard'
import { ShareAppButton } from '@/components/ShareAppButton'
import { fetchCommentsForRecords } from '@/lib/comments-fetch'
import { todayMeigenIndex } from '@/lib/meigen'

export const metadata = {
  title: 'ホーム'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const today = todayLocalISO()
  const weekStart = ymdAddDays(today, -6) // 直近7日（今日含む）

  const nowIso = new Date().toISOString()
  const [
    { data: profile },
    { data: records30 },
    { count: linkedCount },
    { count: activeCodes },
    { data: activeGoals },
    { data: moodLogs }
  ] = await Promise.all([
    supabase.from('profiles').select('display_name, role').eq('id', user!.id).maybeSingle(),
    supabase
      .from('training_records')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select(
        'id, date, duration_minutes, memo, self_memo, recorded_at, category:categories(id, name_ja, icon_key, color_token, kind)'
      )
      .eq('user_id', user!.id)
      .gte('date', ymdAddDays(today, -29))
      .order('date', { ascending: false })
      .order('recorded_at', { ascending: false }),
    supabase
      .from('relationships')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user!.id),
    supabase
      .from('invite_codes')
      .select('code', { count: 'exact', head: true })
      .eq('student_id', user!.id)
      .is('used_at', null)
      .gt('expires_at', nowIso),
    supabase
      .from('goals')
      .select('id, period, category_id, target_minutes, start_date, end_date')
      .eq('user_id', user!.id)
      .gte('end_date', today)
      .order('end_date', { ascending: true }),
    supabase
      .from('mood_logs')
      .select('date, score')
      .eq('user_id', user!.id)
      .gte('date', ymdAddDays(today, -6))
      .order('date', { ascending: true })
  ])

  const todayMood = (moodLogs ?? []).find((m) => m.date === today)?.score ?? null
  const recentMoods = (moodLogs ?? []).map((m) => ({ date: m.date, score: m.score }))

  type RowWithCat = {
    id: string
    date: string
    duration_minutes: number
    memo: string | null
    self_memo: string | null
    recorded_at: string
    category: {
      id: string
      name_ja: string
      icon_key: string
      color_token: string
      kind: string
    } | null
  }
  const records = (records30 ?? []) as unknown as RowWithCat[]

  const todayRecords = records.filter((r) => r.date === today)
  const weekRecords = records.filter((r) => r.date >= weekStart)
  const todayMinutes = todayRecords.reduce((s, r) => s + r.duration_minutes, 0)
  const weekMinutes = weekRecords.reduce((s, r) => s + r.duration_minutes, 0)

  // 連続日数🔥 は将棋カテゴリのみで判定（生活だけ記録した日は streak をキープしない）
  const shogiRecords = records.filter((r) => r.category?.kind === 'shogi')
  const distinctShogiDates = Array.from(new Set(shogiRecords.map((r) => r.date)))
  const { count: streak, needsToday } = computeStreak(distinctShogiDates)

  // 直近7日（古→新）の合計分
  const perDay = Array.from({ length: 7 }, (_, i) => {
    const d = ymdAddDays(weekStart, i)
    const minutes = weekRecords
      .filter((r) => r.date === d)
      .reduce((s, r) => s + r.duration_minutes, 0)
    return { date: d, minutes }
  })

  // カテゴリ別の今週合計
  const catMap = new Map<
    string,
    { name_ja: string; color_token: string; minutes: number }
  >()
  for (const r of weekRecords) {
    const cat = r.category
    if (!cat) continue
    const prev = catMap.get(cat.id)
    if (prev) prev.minutes += r.duration_minutes
    else
      catMap.set(cat.id, {
        name_ja: cat.name_ja,
        color_token: cat.color_token,
        minutes: r.duration_minutes
      })
  }
  const byCategoryThisWeek = Array.from(catMap.entries())
    .map(([category_id, v]) => ({ category_id, ...v }))
    .sort((a, b) => b.minutes - a.minutes)

  // 目標の進捗計算（直近30日の records から）
  // category_id 未指定（全体）目標は将棋のみを対象にする（生活だけで達成できないように）
  const goalsWithProgress = (activeGoals ?? []).map((g) => {
    const inRange = records.filter((r) => r.date >= g.start_date && r.date <= g.end_date)
    const matching = g.category_id
      ? inRange.filter((r) => r.category?.id === g.category_id)
      : inRange.filter((r) => r.category?.kind === 'shogi')
    const currentMinutes = matching.reduce((s, r) => s + r.duration_minutes, 0)
    const ratio = Math.min(1, currentMinutes / g.target_minutes)
    return {
      id: g.id,
      period: g.period as 'weekly' | 'monthly',
      categoryId: g.category_id,
      targetMinutes: g.target_minutes,
      currentMinutes,
      endDate: g.end_date,
      ratio,
      achieved: currentMinutes >= g.target_minutes
    }
  })

  // 表示する目標を1〜2個選ぶ（未達成優先、達成済みは1個まで）
  const featuredGoal = goalsWithProgress[0] // 最も期限が近いもの

  // 直近の記録に対するコメントを取得（共通ヘルパ）
  const recordIds = records.map((r) => r.id)
  const { byRecord: commentsByRecord } = await fetchCommentsForRecords(
    supabase,
    recordIds,
    user!.id
  )

  // 「コメントが付いた最近の記録」（今日以外も対象、コメント1件以上）
  const recordsWithCommentsBeyondToday = records
    .filter((r) => r.date !== today && (commentsByRecord.get(r.id)?.length ?? 0) > 0)
    .slice(0, 5)

  // 今日の名言：日付シードで初期値を決定（同日中は同じ／日が変われば変わる）
  const meigenInitial = todayMeigenIndex(today)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <div className="flex flex-col">
          <span className="text-text-dim text-xs font-num tracking-widest uppercase">KIDO</span>
          <h1 className="text-2xl font-bold">
            {profile?.display_name ? `${profile.display_name} さん` : 'ホーム'}
          </h1>
        </div>
        <form action="/auth/sign-out" method="post">
          <button type="submit" className="text-text-dim text-xs hover:text-text-muted underline">
            ログアウト
          </button>
        </form>
      </header>

      {/* 名言の間（常に最上段。「次の名言」で無限に切替できる） */}
      <MeigenCard initialIndex={meigenInitial} />

      {/* 今日の合計 */}
      <section className="bg-surface border border-border rounded-3xl p-8 flex flex-col items-center gap-2">
        <span className="text-sm text-text-muted">今日の合計</span>
        <div className="flex items-baseline gap-2">
          <AnimatedNumber
            value={todayMinutes}
            duration={1.6}
            className="font-num text-display font-bold gold-glow tabular-nums"
          />
          <span className="text-lg text-text-muted">分</span>
        </div>
        <span className="text-xs text-text-dim font-num">
          {todayMinutes > 0 ? formatMinutes(todayMinutes) : 'まだ記録がありません'}
        </span>
      </section>

      {/* CTA：今日何してましたか？ */}
      <Link
        href="/record"
        className="group relative overflow-hidden flex items-center justify-center gap-3 h-16 md:h-20 rounded-2xl bg-accent text-white font-bold text-lg md:text-xl shadow-[0_4px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep hover:shadow-[0_8px_28px_rgba(30,64,175,0.35)] transition-all active:scale-[0.98]"
      >
        <PlusCircle className="h-6 w-6 md:h-7 md:w-7 transition-transform group-hover:rotate-90" />
        今日何してましたか？
      </Link>

      {/* 今日の気分 */}
      <MoodQuickLog todayScore={todayMood} recent={recentMoods} />

      {/* 目標の進捗（あれば） */}
      {featuredGoal && (
        <Link
          href="/goals"
          className="group bg-surface border border-border hover:border-accent rounded-2xl p-5 flex flex-col gap-3 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: featuredGoal.achieved
                  ? 'rgba(5, 150, 105, 0.12)'
                  : 'var(--accent-soft)',
                color: featuredGoal.achieved ? 'var(--success)' : 'var(--accent)'
              }}
            >
              {featuredGoal.achieved ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Target className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">
                {featuredGoal.period === 'weekly' ? '今週' : '今月'}の目標
              </div>
              <div className="text-xs text-text-dim mt-0.5">
                あと {daysRemaining(featuredGoal.endDate, today)}日 ・ 目標{' '}
                <span className="font-num">{Math.round(featuredGoal.targetMinutes / 60)}h</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-accent transition-colors" />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="flex items-baseline gap-1">
                <span
                  className="font-num text-2xl font-bold"
                  style={{
                    color: featuredGoal.achieved ? 'var(--success)' : 'var(--accent)'
                  }}
                >
                  {Math.round(featuredGoal.currentMinutes / 60)}
                </span>
                <span className="text-xs text-text-dim font-num">
                  / {Math.round(featuredGoal.targetMinutes / 60)}h
                </span>
              </div>
              <span
                className={`text-sm font-num font-bold ${
                  featuredGoal.achieved ? 'text-success' : 'text-text-muted'
                }`}
              >
                {Math.round(featuredGoal.ratio * 100)}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.round(featuredGoal.ratio * 100)}%`,
                  backgroundColor: featuredGoal.achieved ? 'var(--success)' : 'var(--accent)',
                  boxShadow: featuredGoal.achieved
                    ? '0 0 12px rgba(5, 150, 105, 0.35)'
                    : '0 0 12px rgba(30, 64, 175, 0.25)'
                }}
              />
            </div>
            {goalsWithProgress.length > 1 && (
              <div className="text-[11px] text-text-dim mt-1.5">
                他に {goalsWithProgress.length - 1} 個の目標があります
              </div>
            )}
          </div>
        </Link>
      )}

      {!featuredGoal && (
        <Link
          href="/goals"
          className="group bg-surface border border-border hover:border-accent rounded-2xl p-4 flex items-center gap-3 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">目標を立てる</div>
            <div className="text-xs text-text-dim mt-0.5">
              週ごとの目標時間でモチベーションを上げる
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-accent transition-colors" />
        </Link>
      )}

      {/* ストリーク + 今週合計 */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-sm text-text-muted">連続日数</span>
          <div className="flex items-baseline gap-2">
            <AnimatedNumber
              value={streak}
              duration={1.2}
              className="font-num text-3xl font-bold tabular-nums"
            />
            <Flame
              className={`h-6 w-6 ${streak > 0 ? 'flame-flicker text-fire' : 'text-text-dim'}`}
              fill={streak > 0 ? 'currentColor' : 'none'}
            />
          </div>
          {needsToday && streak > 0 && (
            <span className="text-xs text-fire-bright">今日記録するとキープ！</span>
          )}
          {streak === 0 && (
            <span className="text-xs text-text-dim">今日から始めよう</span>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-sm text-text-muted">今週合計</span>
          <div className="flex items-baseline gap-1">
            <AnimatedNumber
              value={weekMinutes}
              duration={1.4}
              className="font-num text-3xl font-bold tabular-nums"
            />
            <span className="text-sm text-text-muted">分</span>
          </div>
          <span className="text-xs text-text-dim font-num">
            {weekMinutes > 0 ? formatMinutes(weekMinutes) : '—'}
          </span>
        </div>
      </section>

      {/* 週間グラフ */}
      <WeeklyBars perDay={perDay} />

      {/* カテゴリ別今週内訳（記録があれば）*/}
      {byCategoryThisWeek.length > 0 && (
        <CategoryBreakdown items={byCategoryThisWeek} />
      )}

      {/* 今日の記録（タップで会話・自己メモ） */}
      {todayRecords.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm text-text-muted flex items-center justify-between">
            <span>今日の記録</span>
            <span className="text-[10px] text-text-dim font-normal">
              タップで会話・自分メモ
            </span>
          </h2>
          <ul className="flex flex-col gap-2">
            {todayRecords.map((r) => (
              <StudentRecordCard
                key={r.id}
                record={{
                  id: r.id,
                  date: r.date,
                  duration_minutes: r.duration_minutes,
                  memo: r.memo,
                  self_memo: r.self_memo,
                  category: r.category
                    ? {
                        name_ja: r.category.name_ja,
                        icon_key: r.category.icon_key,
                        color_token: r.category.color_token
                      }
                    : null
                }}
                comments={commentsByRecord.get(r.id) ?? []}
              />
            ))}
          </ul>
        </section>
      )}

      {/* コメントが届いた最近の記録（今日以外） */}
      {recordsWithCommentsBeyondToday.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm text-text-muted flex items-center justify-between">
            <span>新しいコメントが届いた記録</span>
            <span className="text-[10px] text-text-dim font-normal">タップで会話</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {recordsWithCommentsBeyondToday.map((r) => (
              <StudentRecordCard
                key={r.id}
                record={{
                  id: r.id,
                  date: r.date,
                  duration_minutes: r.duration_minutes,
                  memo: r.memo,
                  self_memo: r.self_memo,
                  category: r.category
                    ? {
                        name_ja: r.category.name_ja,
                        icon_key: r.category.icon_key,
                        color_token: r.category.color_token
                      }
                    : null
                }}
                comments={commentsByRecord.get(r.id) ?? []}
              />
            ))}
          </ul>
        </section>
      )}

      {/* 日記（自己メモまとめ） */}
      <Link
        href="/diary"
        className="group flex items-center gap-3 bg-surface border border-border hover:border-gold rounded-2xl p-4 transition-colors"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--gold-soft)', color: 'var(--gold-deep)' }}
        >
          <BookText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">日記をひらく</div>
          <div className="text-xs text-text-dim mt-0.5">
            自分だけ見える、まとまった考えごとや気づきメモ
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-gold transition-colors" />
      </Link>

      {/* 親・先生を招待 */}
      <Link
        href="/code"
        className="group flex items-center gap-3 bg-surface border border-border hover:border-accent rounded-2xl p-4 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
          {(linkedCount ?? 0) > 0 ? (
            <UsersRound className="w-5 h-5" />
          ) : (
            <KeyRound className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            {(linkedCount ?? 0) > 0
              ? `${linkedCount}人が見守り中`
              : '親・先生を招待する'}
          </div>
          <div className="text-xs text-text-dim mt-0.5">
            {(activeCodes ?? 0) > 0
              ? `招待コード ${activeCodes}枚 が有効`
              : '8文字のコードを発行して渡そう'}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-accent transition-colors" />
      </Link>

      {/* 共有ボタン */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col items-center gap-2">
        <p className="text-xs text-text-muted">将棋仲間にもこのアプリを伝えてみよう</p>
        <ShareAppButton size="md" label="お友達にすすめる" />
      </div>

      <p className="text-center text-xs text-text-dim">
        ログイン中: <span className="font-num text-accent">{user?.email}</span>
      </p>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Calendar, MessageCircle, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { todayLocalISO, ymdAddDays } from '@/lib/dates'
import { formatLevel } from '@/lib/level'
import { RecordWithComments, type CommentItem } from './RecordWithComments'

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

  // 自分のプロフィール（スーパー先生か判定）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: myProfile } = await (supabase
    .from('profiles')
    .select('is_super_teacher')
    .eq('id', user.id)
    .maybeSingle() as any)
  const isSuperTeacher = Boolean(myProfile?.is_super_teacher)

  // 紐づけ確認（スーパー先生は招待なしでも閲覧可）
  const { data: rel } = await supabase
    .from('relationships')
    .select('id, kind')
    .eq('adult_id', user.id)
    .eq('student_id', studentId)
    .maybeSingle()

  if (!rel && !isSuperTeacher) {
    notFound()
  }

  // 生徒情報
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: student } = await (supabase
    .from('profiles')
    .select('display_name, level_kind, level_text, avatar_url')
    .eq('id', studentId)
    .maybeSingle() as any)

  if (!student) {
    notFound()
  }

  const studentLevelLabel = formatLevel(student.level_kind, student.level_text)

  // 直近 14 日の記録
  const fourteenDaysAgo = ymdAddDays(todayLocalISO(), -13)

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

  const recordIds = (records ?? []).map((r) => r.id)
  let commentsByRecord = new Map<string, CommentItem[]>()
  let totalComments = 0

  if (recordIds.length > 0) {
    const { data: comments } = await supabase
      .from('comments')
      .select('id, record_id, author_id, author_role, content, created_at')
      .in('record_id', recordIds)
      .order('created_at', { ascending: true })

    const authorIds = Array.from(
      new Set((comments ?? []).map((c) => c.author_id).filter((id): id is string => !!id))
    )
    const authorProfiles =
      authorIds.length > 0
        ? (
            await supabase.from('profiles').select('id, display_name').in('id', authorIds)
          ).data ?? []
        : []
    const authorMap = new Map(authorProfiles.map((p) => [p.id, p.display_name]))

    commentsByRecord = new Map<string, CommentItem[]>()
    for (const c of comments ?? []) {
      const list = commentsByRecord.get(c.record_id) ?? []
      list.push({
        id: c.id,
        author_id: c.author_id,
        author_role: c.author_role as CommentItem['author_role'],
        author_display_name: c.author_id
          ? (authorMap.get(c.author_id) ?? '不明')
          : c.author_role === 'ai'
            ? 'AI コーチ'
            : '不明',
        content: c.content,
        created_at: c.created_at,
        isMine: c.author_id === user.id
      })
      commentsByRecord.set(c.record_id, list)
    }
    totalComments = comments?.length ?? 0
  }

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
            {studentLevelLabel && (
              <p className="text-sm font-semibold text-accent mt-0.5">{studentLevelLabel}</p>
            )}
            <p className="text-xs text-text-dim mt-0.5">
              {rel
                ? `${rel.kind === 'parent' ? '親' : '先生'} として見守り中`
                : '全員見守り先生として閲覧中'}
            </p>
          </div>
        </div>
      </header>

      {/* サマリー */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <TrendingUp className="w-3 h-3" />
            14日合計
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-num text-2xl font-bold gold-glow">{totalMinutes}</span>
            <span className="text-xs text-text-muted">分</span>
          </div>
          <div className="text-[11px] text-text-dim mt-0.5">
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <Calendar className="w-3 h-3" />
            記録日数
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-num text-2xl font-bold">{activeDays}</span>
            <span className="text-xs text-text-muted">/14日</span>
          </div>
          <div className="text-[11px] text-text-dim mt-0.5">
            継続 {Math.round((activeDays / 14) * 100)}%
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <MessageCircle className="w-3 h-3" />
            コメント
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-num text-2xl font-bold text-accent">{totalComments}</span>
            <span className="text-xs text-text-muted">件</span>
          </div>
          <div className="text-[11px] text-text-dim mt-0.5">
            この14日に書いた数
          </div>
        </div>
      </section>

      {/* 記録一覧 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-muted flex items-center justify-between">
          <span>直近の記録</span>
          <span className="text-[10px] text-text-dim font-normal">
            タップでコメントを表示
          </span>
        </h2>
        {!records || records.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl px-4 py-10 text-center text-sm text-text-dim">
            この期間の記録はまだありません
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {records.map((r) => {
              const cat = catMap.get(r.category_id)
              return (
                <RecordWithComments
                  key={r.id}
                  record={{
                    id: r.id,
                    date: r.date,
                    duration_minutes: r.duration_minutes,
                    memo: r.memo,
                    category: cat
                      ? {
                          id: cat.id,
                          name_ja: cat.name_ja,
                          color_token: cat.color_token
                        }
                      : null
                  }}
                  studentId={studentId}
                  comments={commentsByRecord.get(r.id) ?? []}
                  canComment={true}
                />
              )
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-text-dim leading-relaxed">
        コメントは記録ごとに残せます。励まし・気づき・アドバイスを書こう。
        生徒側でも同じコメントが見られます。
      </p>
    </div>
  )
}

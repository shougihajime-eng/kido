import Link from 'next/link'
import { Crown, Eye, KeyRound, UserPlus, UsersRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatLevel } from '@/lib/level'
import { RemoveLinkButton } from './RemoveLinkButton'
import { ShareAppButton } from '@/components/ShareAppButton'

export const metadata = {
  title: '見守り'
}

const KIND_LABEL: Record<'parent' | 'teacher', string> = {
  parent: '親',
  teacher: '先生'
}

export default async function FamilyPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: myProfile } = await (supabase
    .from('profiles')
    .select('display_name, role, is_super_teacher')
    .eq('id', user.id)
    .maybeSingle() as any)

  const isSuperTeacher = Boolean(myProfile?.is_super_teacher)

  // 紐づき一覧（RLS により自分のものだけ取れる）
  const { data: rels } = await supabase
    .from('relationships')
    .select('id, kind, student_id, created_at')
    .eq('adult_id', user.id)
    .order('created_at', { ascending: false })

  const studentIds = (rels ?? []).map((r) => r.student_id)
  const studentProfiles =
    studentIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((
          await (supabase
            .from('profiles')
            .select('id, display_name, level_kind, level_text')
            .in('id', studentIds) as any)
        ).data ?? [])
      : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const studentMap = new Map((studentProfiles as any[]).map((p: any) => [p.id, p]))

  const linkedStudents = (rels ?? []).map((r) => ({
    id: r.id,
    kind: r.kind,
    studentId: r.student_id,
    displayName: studentMap.get(r.student_id)?.display_name ?? '（不明）',
    levelLabel: formatLevel(
      studentMap.get(r.student_id)?.level_kind,
      studentMap.get(r.student_id)?.level_text
    ),
    createdAt: r.created_at
  }))

  // スーパー先生の場合は全生徒を取得
  type AllStudent = { id: string; displayName: string; levelLabel: string }
  let allStudents: AllStudent[] = []
  if (isSuperTeacher) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: students } = await (supabase
      .from('profiles')
      .select('id, display_name, level_kind, level_text, role')
      .eq('role', 'student')
      .order('display_name') as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allStudents = ((students ?? []) as any[]).map((s: any) => ({
      id: s.id,
      displayName: s.display_name ?? '（不明）',
      levelLabel: formatLevel(s.level_kind, s.level_text)
    }))
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-bold">見守り</h1>
          <p className="text-sm text-text-muted mt-1 flex items-center gap-2 flex-wrap">
            <span>
              {myProfile?.display_name} さん（{myProfile?.role === 'parent' ? '親' : '先生'}）
            </span>
            {isSuperTeacher && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold text-white text-[11px] font-bold">
                <Crown className="w-3 h-3" /> 全員見守り
              </span>
            )}
          </p>
        </div>
        <form action="/auth/sign-out" method="post">
          <button type="submit" className="text-text-dim text-sm hover:text-text-muted underline">
            ログアウト
          </button>
        </form>
      </header>

      {/* 紐づけ追加CTA */}
      <Link
        href="/family/link"
        className="group bg-surface border border-border hover:border-accent rounded-2xl p-5 flex items-center gap-4 transition-colors"
      >
        <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
          <KeyRound className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold">招待コードで生徒と紐づく</div>
          <div className="text-xs text-text-muted mt-0.5">
            生徒が発行したコード（8文字）を入力するだけ
          </div>
        </div>
        <UserPlus className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
      </Link>

      {/* 紐づいた生徒一覧 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-muted flex items-center gap-2">
          <UsersRound className="w-4 h-4" />
          見守っている生徒
          {linkedStudents.length > 0 && (
            <span className="font-num text-text-dim">（{linkedStudents.length}人）</span>
          )}
        </h2>

        {linkedStudents.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl px-4 py-10 text-center">
            <p className="text-text-muted">まだ生徒と紐づいていません</p>
            <p className="text-xs text-text-dim mt-2">
              生徒から「招待コード」をもらって上のボタンから入力してください
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {linkedStudents.map((s) => (
              <li
                key={s.id}
                className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-surface-elevated flex items-center justify-center text-accent font-num text-lg font-bold">
                  {s.displayName.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold truncate">{s.displayName}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted">
                      {KIND_LABEL[s.kind as 'parent' | 'teacher']} として
                    </span>
                  </div>
                  {s.levelLabel && (
                    <div className="text-xs font-semibold text-accent mt-0.5">{s.levelLabel}</div>
                  )}
                </div>
                <Link
                  href={`/family/${s.studentId}`}
                  className="h-9 px-3 rounded-lg border border-border hover:border-accent text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  見る
                </Link>
                <RemoveLinkButton relationshipId={s.id} displayName={s.displayName} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* スーパー先生用：すべての生徒一覧 */}
      {isSuperTeacher && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-muted flex items-center gap-2">
            <Crown className="w-4 h-4 text-gold" />
            すべての生徒
            <span className="font-num text-text-dim">（{allStudents.length}人）</span>
          </h2>
          <p className="text-[11px] text-text-dim">
            あなたは「全員見守り」先生なので、招待なしで全生徒の記録を見られます。
          </p>

          {allStudents.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl px-4 py-10 text-center">
              <p className="text-text-muted">まだ生徒がいません</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {allStudents.map((s) => (
                <li
                  key={s.id}
                  className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-num text-lg font-bold">
                    {s.displayName.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{s.displayName}</div>
                    {s.levelLabel && (
                      <div className="text-xs font-semibold text-accent mt-0.5">{s.levelLabel}</div>
                    )}
                  </div>
                  <Link
                    href={`/family/${s.id}`}
                    className="h-9 px-3 rounded-lg border border-border hover:border-accent text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    見る
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="text-xs text-text-dim leading-relaxed">
        生徒の練習記録は「読み取り専用」で見られます。コメント機能は今後追加予定です。
        紐づきを解除すると、その生徒のデータは見られなくなります。
      </p>

      {/* 共有ボタン */}
      <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col items-center gap-3 mt-2">
        <p className="text-sm text-text-muted">
          将棋仲間の親御さん・先生にもこのアプリを伝えてみませんか
        </p>
        <ShareAppButton size="md" label="知り合いにすすめる" />
      </div>
    </div>
  )
}

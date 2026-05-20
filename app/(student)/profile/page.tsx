import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, LogOut, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BadgeShelf, type BadgeView } from '@/components/BadgeShelf'
import { awardBadgesForUser } from '@/lib/badges/award'
import { formatLevel } from '@/lib/level'

export const metadata = {
  title: '自分'
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 過去の記録に対しても遡及的にバッジを付与（既獲得分はスキップされる）
  await awardBadgesForUser(user.id)

  const [{ data: profile }, { data: allBadges }, { data: ownedBadges }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, role, level_kind, level_text, ai_tone')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('badges').select('id, name, description, icon_key'),
    supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', user.id)
  ])

  const levelDisplay = formatLevel(profile?.level_kind, profile?.level_text)

  const ownedMap = new Map(
    (ownedBadges ?? []).map((b) => [b.badge_id, b.earned_at as string])
  )

  const badges: BadgeView[] = (allBadges ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon_key: b.icon_key,
    earned: ownedMap.has(b.id),
    earned_at: ownedMap.get(b.id) ?? null
  }))

  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">自分</h1>
        <p className="text-sm text-text-muted">プロフィールとバッジ</p>
      </header>

      <section className="bg-surface border border-border rounded-2xl p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-accent text-white flex items-center justify-center font-num text-2xl font-bold">
          {profile?.display_name?.slice(0, 1) ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{profile?.display_name ?? '—'}</div>
          {levelDisplay && (
            <div className="text-sm text-accent font-semibold mt-0.5">{levelDisplay}</div>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-text-muted">バッジ</span>
          <span className="font-num text-2xl font-bold text-accent">
            {earnedCount}
            <span className="text-xs text-text-dim font-normal"> / {badges.length}</span>
          </span>
        </div>
      </section>

      {/* バッジ陳列棚 */}
      {badges.length > 0 && <BadgeShelf badges={badges} />}

      <nav className="flex flex-col gap-2">
        <Link
          href="/profile/edit"
          className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3 hover:bg-surface-elevated transition-colors"
        >
          <Pencil className="h-5 w-5 text-accent" strokeWidth={2} />
          <span className="flex-1 font-medium">なまえ・段級を編集</span>
          <span className="text-xs text-text-dim">→</span>
        </Link>

        <Link
          href="/code"
          className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3 hover:bg-surface-elevated transition-colors"
        >
          <KeyRound className="h-5 w-5 text-accent" strokeWidth={2} />
          <span className="flex-1 font-medium">親・先生を招待</span>
          <span className="text-xs text-text-dim">→</span>
        </Link>

        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3 hover:bg-surface-elevated transition-colors text-left"
          >
            <LogOut className="h-5 w-5 text-danger" strokeWidth={2} />
            <span className="flex-1 font-medium text-danger">ログアウト</span>
          </button>
        </form>
      </nav>
    </div>
  )
}

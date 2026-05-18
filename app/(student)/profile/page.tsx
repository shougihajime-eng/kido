import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, LogOut, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: '自分'
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role, level_text, ai_tone')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">自分</h1>
        <p className="text-sm text-text-muted">プロフィールと設定</p>
      </header>

      <section className="bg-surface border border-border rounded-2xl p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-accent text-background flex items-center justify-center font-num text-2xl font-bold">
          {profile?.display_name?.slice(0, 1) ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{profile?.display_name ?? '—'}</div>
          <div className="text-xs text-text-muted">{user.email}</div>
          {profile?.level_text && (
            <div className="text-xs text-text-dim mt-1">{profile.level_text}</div>
          )}
        </div>
      </section>

      <nav className="flex flex-col gap-2">
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

      <section className="bg-surface-elevated/40 border border-border rounded-2xl p-5 flex flex-col items-center gap-2 text-center">
        <UserRound className="h-5 w-5 text-text-dim" strokeWidth={2} />
        <p className="text-xs text-text-muted">
          プロフィール編集（ニックネーム・棋力・AIのトーン）は
          <br />
          このあと作っていきます。
        </p>
      </section>
    </div>
  )
}

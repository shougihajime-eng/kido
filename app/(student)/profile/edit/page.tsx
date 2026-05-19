import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditForm } from './form'
import type { LevelKind } from '@/lib/level'

export const metadata = {
  title: 'プロフィール編集'
}

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase
    .from('profiles')
    .select('display_name, role, level_kind, level_text')
    .eq('id', user.id)
    .maybeSingle() as any)

  if (!profile) {
    redirect('/profile')
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-xl border border-border bg-surface flex items-center justify-center text-text-muted hover:text-accent hover:border-accent transition-colors"
          aria-label="戻る"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">プロフィール編集</h1>
          <p className="text-sm text-text-muted">なまえと段級を変えられます</p>
        </div>
      </header>

      <ProfileEditForm
        initialName={profile.display_name as string}
        initialLevelKind={(profile.level_kind ?? '') as LevelKind | ''}
        initialLevelText={(profile.level_text ?? '') as string}
        role={profile.role as 'student' | 'parent' | 'teacher'}
      />
    </div>
  )
}

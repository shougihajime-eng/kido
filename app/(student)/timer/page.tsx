import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Timer } from './Timer'

export const metadata = {
  title: 'タイマー'
}

export default async function TimerPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, key, name_ja, icon_key, color_token, sort_order, is_preset, kind')
    .order('sort_order', { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:bg-surface-elevated"
          aria-label="戻る"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">タイマー</h1>
          <p className="text-xs text-text-dim mt-0.5">
            ストップウォッチで実時間を測ったり、タイマーで「あと◯分」を計れます
          </p>
        </div>
      </header>
      <Timer categories={categories ?? []} />
    </div>
  )
}

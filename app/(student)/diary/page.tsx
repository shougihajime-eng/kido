import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { todayLocalISO, ymdAddDays } from '@/lib/dates'
import { DiaryClient } from './DiaryClient'

export const metadata = {
  title: '日記'
}

export default async function DiaryPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const today = todayLocalISO()
  const since = ymdAddDays(today, -89)

  const { data: diaryRows } = await supabase
    .from('diary_entries')
    .select('id, date, content, created_at, visibility')
    .eq('user_id', user.id)
    .eq('visibility', 'self')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: memoRows } = await supabase
    .from('training_records')
    .select(
      'id, date, self_memo, category:categories(name_ja)'
    )
    .eq('user_id', user.id)
    .gte('date', since)
    .order('date', { ascending: false })

  type MemoRow = {
    id: string
    date: string
    self_memo: string | null
    category: { name_ja: string } | null
  }
  const selfMemos = ((memoRows ?? []) as unknown as MemoRow[])
    .filter((r) => r.self_memo && r.self_memo.trim().length > 0)
    .slice(0, 20)
    .map((r) => ({
      recordId: r.id,
      date: r.date,
      categoryName: r.category?.name_ja ?? '練習',
      selfMemo: r.self_memo!
    }))

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ChevronLeft className="w-4 h-4" />
          ホームに戻る
        </Link>
        <h1 className="text-2xl font-bold">日記</h1>
        <p className="text-xs text-text-dim">
          今日感じたこと、悩み、自分宛のメモを書く場所。自分しか見られません。
        </p>
      </header>

      <DiaryClient
        todayIso={today}
        diaryEntries={(diaryRows ?? []).map((r) => ({
          id: r.id,
          date: r.date,
          content: r.content,
          created_at: r.created_at
        }))}
        selfMemos={selfMemos}
      />
    </div>
  )
}

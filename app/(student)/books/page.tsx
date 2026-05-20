import Link from 'next/link'
import { ChevronLeft, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatMinutes } from '@/lib/dates'
import { AddBookForm } from './AddBookForm'
import { BookActions } from './BookActions'

export const metadata = {
  title: '本棚'
}

type Status = 'reading' | 'done' | 'paused'

const STATUS_LABEL: Record<Status, string> = {
  reading: '読書中',
  done: '読了',
  paused: '休憩中'
}

const STATUS_ORDER: Status[] = ['reading', 'paused', 'done']

export default async function BooksPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any

  // 本棚一覧
  const { data: booksRaw } = await untyped
    .from('books')
    .select('id, title, author, emoji, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  type BookRow = {
    id: string
    title: string
    author: string | null
    emoji: string
    status: Status
    created_at: string
  }
  const books = (booksRaw ?? []) as BookRow[]

  // 各本の累積時間（training_records.book_id で集計）
  const bookIds = books.map((b) => b.id)
  const minutesByBook = new Map<string, number>()
  if (bookIds.length > 0) {
    const { data: recsRaw } = await untyped
      .from('training_records')
      .select('book_id, duration_minutes')
      .eq('user_id', user.id)
      .in('book_id', bookIds)
    type RecRow = { book_id: string | null; duration_minutes: number }
    for (const r of (recsRaw ?? []) as RecRow[]) {
      if (!r.book_id) continue
      minutesByBook.set(r.book_id, (minutesByBook.get(r.book_id) ?? 0) + r.duration_minutes)
    }
  }

  // ステータス別グループ化
  const grouped: Record<Status, BookRow[]> = {
    reading: [],
    paused: [],
    done: []
  }
  for (const b of books) {
    grouped[b.status].push(b)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          ホームに戻る
        </Link>
        <div>
          <h1 className="text-3xl font-bold">本棚</h1>
          <p className="text-sm text-text-muted mt-1">
            使っている棋書・詰将棋本を登録して、累積時間を見える化しましょう
          </p>
        </div>
      </header>

      <AddBookForm />

      {books.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl px-4 py-10 text-center">
          <div className="text-4xl mb-2">📚</div>
          <p className="text-text-muted">まだ本がありません</p>
          <p className="text-xs text-text-dim mt-2">
            「羽生の頭脳」「寄せの手筋200」など、今使っている本を登録してみよう
          </p>
        </div>
      ) : (
        STATUS_ORDER.map((s) =>
          grouped[s].length === 0 ? null : (
            <section key={s} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-text-muted flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {STATUS_LABEL[s]}
                <span className="font-num text-text-dim">（{grouped[s].length}冊）</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {grouped[s].map((b) => {
                  const minutes = minutesByBook.get(b.id) ?? 0
                  return (
                    <li
                      key={b.id}
                      className={`bg-surface border rounded-2xl p-4 flex items-center gap-3 ${
                        s === 'done'
                          ? 'border-success/40 bg-success/5'
                          : s === 'paused'
                            ? 'border-border opacity-80'
                            : 'border-border'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center text-2xl shrink-0">
                        {b.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{b.title}</div>
                        {b.author && (
                          <div className="text-xs text-text-muted truncate">{b.author}</div>
                        )}
                        <div className="text-xs text-text-dim mt-0.5">
                          累積{' '}
                          <span className="font-num font-bold text-accent">
                            {minutes > 0 ? formatMinutes(minutes) : '0分'}
                          </span>
                        </div>
                      </div>
                      <BookActions id={b.id} title={b.title} status={b.status} />
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        )
      )}

      <p className="text-xs text-text-dim leading-relaxed">
        記録するとき「使った本」を選ぶと、各本の累積時間が増えていきます。
      </p>
    </div>
  )
}

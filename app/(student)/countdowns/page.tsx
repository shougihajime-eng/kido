import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { todayLocalISO } from '@/lib/dates'
import { AddCountdownForm } from './AddCountdownForm'
import { DeleteCountdownButton } from './DeleteButton'

export const metadata = {
  title: 'カウントダウン'
}

function daysUntil(targetIso: string, todayIso: string): number {
  const t = new Date(targetIso + 'T00:00:00')
  const n = new Date(todayIso + 'T00:00:00')
  const diff = Math.round((t.getTime() - n.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${dow}）`
}

export default async function CountdownsPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const today = todayLocalISO()

  // countdowns テーブルは Database 型未再生成のため untyped でアクセス
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any
  const { data: rows } = await untyped
    .from('countdowns')
    .select('id, title, target_date, emoji')
    .eq('user_id', user.id)
    .gte('target_date', today)
    .order('target_date', { ascending: true })

  type Row = { id: string; title: string; target_date: string; emoji: string }
  const items = ((rows ?? []) as Row[]).map((r) => ({
    id: r.id,
    title: r.title,
    targetDate: r.target_date,
    emoji: r.emoji ?? '📅',
    days: daysUntil(r.target_date, today)
  }))

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
          <h1 className="text-3xl font-bold">カウントダウン</h1>
          <p className="text-sm text-text-muted mt-1">
            大事な日（試験・大会・対局）までの残り日数を見える化します
          </p>
        </div>
      </header>

      <AddCountdownForm todayIso={today} />

      {items.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl px-4 py-10 text-center">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-text-muted">
            まだカウントダウンがありません
          </p>
          <p className="text-xs text-text-dim mt-2">
            「奨励会試験」「○○杯」「進級試験」など、目標の日を登録してみましょう
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((it) => {
            const tone =
              it.days <= 7
                ? 'border-fire bg-fire/5'
                : it.days <= 30
                  ? 'border-gold bg-gold/5'
                  : 'border-border bg-surface'
            const dayColor =
              it.days <= 7
                ? 'text-fire'
                : it.days <= 30
                  ? 'text-gold-deep'
                  : 'text-accent'
            return (
              <li
                key={it.id}
                className={`relative rounded-2xl border-2 p-4 flex items-center gap-3 ${tone}`}
              >
                <div className="w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center text-2xl shrink-0">
                  {it.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{it.title}</div>
                  <div className="text-xs text-text-dim mt-0.5 font-num">
                    {formatDateLabel(it.targetDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-num text-3xl font-bold tabular-nums ${dayColor}`}>
                    {it.days === 0 ? '今日' : it.days}
                  </div>
                  {it.days > 0 && (
                    <div className="text-[10px] text-text-dim">日後</div>
                  )}
                </div>
                <DeleteCountdownButton id={it.id} title={it.title} />
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-xs text-text-dim leading-relaxed">
        過ぎた日付は自動で一覧から消えます（データは残っているので心配しないでください）。
      </p>
    </div>
  )
}

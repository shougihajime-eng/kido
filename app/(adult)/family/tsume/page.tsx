import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, ArrowLeft, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LEVEL_BADGE, type TsumeLevel } from '@/lib/tsume'
import { TsumeAdminCard } from './TsumeAdminCard'

export const metadata = {
  title: '詰将棋を作る'
}

export default async function TsumeAdminPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'teacher') redirect('/family')

  // 先生は下書きも含めて全部見える（RLS）
  const { data: problems } = await supabase
    .from('tsume_problems')
    .select('id, title, tesuu, level, published, source, moves_ja, start_sfen')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const list = problems ?? []
  const publishedCount = list.filter((p) => p.published).length

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Link
          href="/family"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> 見守りにもどる
        </Link>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-gold" /> 詰将棋を作る
            </h1>
            <p className="text-sm text-text-muted mt-1 font-mincho">
              ぜんぶで {list.length} 問（公開中 {publishedCount} 問）。
              「公開する」を押すと生徒・保護者の画面に出ます。
            </p>
          </div>
          <Link
            href="/family/tsume/new"
            className="inline-flex items-center gap-2 px-5 min-h-[48px] rounded-full bg-accent text-white font-mincho text-sm font-bold shadow-[0_4px_16px_rgba(30,64,175,0.25)] hover:bg-accent-deep active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> 新しく作る
          </Link>
        </div>
      </header>

      {list.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl px-4 py-12 text-center">
          <p className="text-text-muted font-mincho">まだ詰将棋がありません</p>
          <p className="text-xs text-text-dim mt-2 font-mincho">
            「新しく作る」から、盤に駒を並べて作ってみましょう
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((p) => {
            const badge = LEVEL_BADGE[(p.level as TsumeLevel) ?? 'normal'] ?? LEVEL_BADGE.normal
            return (
              <TsumeAdminCard
                key={p.id}
                id={p.id}
                title={p.title}
                tesuu={p.tesuu}
                levelLabel={badge.label}
                levelBg={badge.bgClass}
                levelText={badge.textClass}
                published={p.published}
                source={p.source}
                firstMove={(p.moves_ja ?? [])[0] ?? ''}
              />
            )
          })}
        </ul>
      )}
    </div>
  )
}

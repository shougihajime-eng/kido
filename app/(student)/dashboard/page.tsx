import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'ホーム'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">ホーム</h1>
        <form action="/auth/sign-out" method="post">
          <button type="submit" className="text-text-dim text-sm hover:text-text-muted underline">
            ログアウト
          </button>
        </form>
      </header>

      {/* 今日の合計（Phase D で本実装、いまは骨組み）*/}
      <section className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-2">
        <span className="text-sm text-text-muted">今日の合計</span>
        <span className="text-6xl font-bold font-num gold-glow pulse-glow">0</span>
        <span className="text-sm text-text-muted">分</span>
      </section>

      {/* ストリーク + 週間 */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-sm text-text-muted">連続日数</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-num">0</span>
            <span className="text-2xl flame-flicker">🔥</span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-sm text-text-muted">今週合計</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-num">0</span>
            <span className="text-sm text-text-muted">分</span>
          </div>
        </div>
      </section>

      <section className="bg-surface-elevated border border-border-strong rounded-2xl p-6 text-center text-text-muted text-sm">
        <p>Phase A の骨組み完成 🎉</p>
        <p className="text-xs text-text-dim mt-2">
          記録入力・カレンダー・分析・親先生機能は順次追加していきます。
        </p>
        <p className="text-xs text-text-dim mt-2">
          ログイン中: <span className="font-num text-accent">{user?.email}</span>
        </p>
      </section>
    </div>
  )
}

import { Trophy, UsersRound, Sparkles, ChevronRight } from 'lucide-react'

export const metadata = {
  title: '仲間'
}

export default function FollowPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">仲間・ライバル</h1>
        <p className="text-base text-text-muted mt-1">
          一緒にがんばっている人や、目標の人を見つけよう
        </p>
      </header>

      {/* 近日公開バナー */}
      <section className="bg-surface border-2 border-accent/30 rounded-3xl p-8 flex flex-col items-center gap-4 text-center card-shadow">
        <div className="h-16 w-16 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
          <Sparkles className="h-8 w-8" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xl font-bold text-accent">近日公開</p>
          <p className="text-base text-text-muted leading-relaxed">
            ここに「仲間」と「ライバル」が並ぶ予定です。<br />
            お楽しみに！
          </p>
        </div>
      </section>

      {/* ここに何が来るかのプレビュー */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-text-muted">ここでできるようになること</h2>

        <div className="bg-surface border border-border rounded-2xl p-5 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
            <UsersRound className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-base">仲間の今週の練習時間が見える</div>
            <div className="text-sm text-text-muted mt-1 leading-relaxed">
              フォローした仲間が今週どれくらい練習したか、棒グラフで横並びに見える。
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-sakura-soft text-sakura flex items-center justify-center shrink-0">
            <Trophy className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-base">ライバルを設定して追いかけられる</div>
            <div className="text-sm text-text-muted mt-1 leading-relaxed">
              「この人に追いつきたい」という目標の相手を登録。
              <br />
              ライバルとのペース差が一目で分かる。
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex items-start gap-4">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--gold-soft)', color: 'var(--gold-deep)' }}
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-base">匿名でみんなの平均と比べられる</div>
            <div className="text-sm text-text-muted mt-1 leading-relaxed">
              「同じ目標レベルの人たちは、平均でどれくらい練習してる？」が
              <br />
              プレッシャーなく見られる、匿名の全体ビュー。
            </div>
          </div>
        </div>
      </section>

      <p className="text-center text-sm text-text-dim">
        まず1人を「仲間」として招待できるようにするところから順に作っていきます
      </p>
    </div>
  )
}

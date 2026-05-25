import { todayLocalISO } from '@/lib/dates'
import { dailyIndex, TSUME } from '@/lib/tsume'
import { fetchPublishedTsume } from '@/lib/tsume-fetch'
import { TsumeSolver } from '@/components/tsume/TsumeSolver'

export const metadata = {
  title: '詰将棋'
}

export default async function TsumePage() {
  const today = todayLocalISO()
  const problems = await fetchPublishedTsume()
  const initialIndex = dailyIndex(today, problems.length)
  // 先生が作って公開した問題があるかどうか（案内文の出し分けに使う）
  const usingTeacherProblems = problems !== TSUME

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header className="flex flex-col items-center text-center pt-2 pb-2 md:pt-4">
        <span className="text-text-dim text-xs font-num tracking-[0.35em] uppercase mb-2">
          TSUME SHOGI
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold">詰将棋</h1>
        <p className="font-mincho text-text-muted text-sm sm:text-base mt-3 max-w-md leading-relaxed">
          毎日ひとつ、手ごたえのある一問を。
          <br />
          こまを動かして、自分で詰ましてみよう。
        </p>
      </header>

      <TsumeSolver initialIndex={initialIndex} problems={problems} />

      {/* お知らせ */}
      <div className="bg-gold-soft/40 border border-gold/30 rounded-2xl p-4 text-center">
        {usingTeacherProblems ? (
          <p className="text-sm font-mincho text-gold-deep font-semibold mb-1">
            ぜんぶで {problems.length} 問。先生が作った問題だよ
          </p>
        ) : (
          <p className="text-sm font-mincho text-gold-deep font-semibold mb-1">
            コンピューターが作った検証ずみの問題です
          </p>
        )}
        <p className="text-xs text-text-muted font-mincho leading-relaxed">
          こまをタップして動かす先をタップ。正解だと相手が受けて1手すすみます。
          <br />
          こまった時は「ヒント」や「答えを見る」を押してね。
        </p>
      </div>
    </div>
  )
}

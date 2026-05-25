import { todayLocalISO } from '@/lib/dates'
import { todayTsumeIndex, TSUME } from '@/lib/tsume'
import { TsumeSolver } from '@/components/tsume/TsumeSolver'

export const metadata = {
  title: '詰将棋'
}

export default function TsumePage() {
  const today = todayLocalISO()
  const initialIndex = todayTsumeIndex(today)

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

      <TsumeSolver initialIndex={initialIndex} />

      {/* お知らせ（はじめさん向けの正直なメモ） */}
      <div className="bg-gold-soft/40 border border-gold/30 rounded-2xl p-4 text-center">
        <p className="text-sm font-mincho text-gold-deep font-semibold mb-1">
          コンピューターが作った検証ずみの問題です
        </p>
        <p className="text-xs text-text-muted font-mincho leading-relaxed">
          いまは {TSUME.length} 問（3手詰・5手詰）。すべて
          「最初に王手なし・本当に詰む・答えが一通り」を機械で確認ずみです。
          <br />
          これから問題数を増やし、著作権が切れた古典の名作（将棋図巧・将棋無双など）も
          検証してから加えていきます。
        </p>
      </div>
    </div>
  )
}

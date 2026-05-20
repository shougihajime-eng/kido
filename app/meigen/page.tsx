import { MeigenList } from '@/components/dashboard/MeigenList'
import { todayLocalISO } from '@/lib/dates'
import { todayMeigenIndex } from '@/lib/meigen'

export const metadata = {
  title: '名言の間'
}

export default function MeigenPage() {
  // 初期表示の名言：日付シードで決定論的に決める
  //   → 同日中に何度開いても同じ名言から始まり、日が変われば変わる
  //   → SSR/CSR でズレないので、開いた瞬間のチカチカが起きない
  const today = todayLocalISO()
  const initialIndex = todayMeigenIndex(today)

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {/* ヒーロー：大筆タイトル「名言の間」＋ 墨の一線 ＋ 序文 */}
      <header className="flex flex-col items-center text-center pt-2 pb-4 md:pt-6 md:pb-8">
        <span className="text-text-dim text-xs font-num tracking-[0.35em] uppercase mb-2">
          MEIGEN
        </span>
        <h1 className="brush-title ink-bloom text-5xl sm:text-6xl md:text-7xl">名言の間</h1>
        <span className="brush-underline-anim mt-4 w-28 sm:w-40" aria-hidden="true" />
        <p className="font-mincho text-text-muted text-[15px] sm:text-base md:text-lg mt-6 max-w-md leading-relaxed">
          先人の言葉に、力をもらう。
          <br />
          ボタンを押せば、また次の言葉。
        </p>
      </header>

      <MeigenList initialIndex={initialIndex} />
    </div>
  )
}

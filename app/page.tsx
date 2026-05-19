import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl flex flex-col items-center text-center gap-10">
        {/* ロゴ的なタイトル */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-3xl">🌸</div>
          <h1 className="text-7xl md:text-8xl font-bold gold-glow tracking-tight">棋道</h1>
          <div className="text-text-dim text-xs tracking-[0.4em] uppercase font-num">KIDO</div>
          <p className="text-text-muted text-lg mt-2">
            将棋プロ志望のための、日々の研鑽を記録するアプリ
          </p>
        </div>

        {/* 訴求 */}
        <div className="w-full bg-surface rounded-2xl border border-border p-6 sm:p-8 flex flex-col gap-4 text-left">
          <p className="text-text-muted text-sm leading-relaxed">
            <span className="text-accent font-semibold">毎日</span>
            の研鑽を記録し、
            <br />
            <span className="text-fire font-semibold">連続日数 🔥</span>
            で習慣を育て、
            <br />
            <span className="text-indigo font-semibold">仲間</span>
            と切磋琢磨する。
          </p>
          <p className="text-text-dim text-sm leading-relaxed">
            Strava がランニングを、Duolingo が語学を変えたように、
            棋道は将棋プロ志望の毎日を変えます。
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/signup"
            className="h-14 px-10 inline-flex items-center justify-center rounded-full bg-accent text-white font-semibold text-lg shadow-[0_4px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep hover:shadow-[0_8px_28px_rgba(30,64,175,0.35)] transition-all"
          >
            はじめる
          </Link>
          <Link
            href="/login"
            className="h-14 px-10 inline-flex items-center justify-center rounded-full border-2 border-border-strong bg-surface text-text font-semibold text-lg hover:border-accent hover:text-accent transition-colors"
          >
            ログイン
          </Link>
        </div>

        <div className="text-text-dim text-xs font-num tracking-wider">β · 開発中</div>
      </div>
    </main>
  )
}

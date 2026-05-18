import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl flex flex-col items-center text-center gap-10">
        {/* ロゴ的なタイトル */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-text-dim text-sm tracking-[0.4em] uppercase font-num">KIDO</div>
          <h1 className="text-6xl font-bold gold-glow tracking-tight">棋道</h1>
          <p className="text-text-muted text-base">
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
            className="h-12 px-8 inline-flex items-center justify-center rounded-full bg-accent text-background font-semibold shadow-[0_0_24px_rgba(212,162,76,0.3)] hover:bg-accent-deep transition-colors"
          >
            はじめる
          </Link>
          <Link
            href="/login"
            className="h-12 px-8 inline-flex items-center justify-center rounded-full border border-border-strong text-text hover:bg-surface-elevated transition-colors"
          >
            ログイン
          </Link>
        </div>

        <div className="text-text-dim text-xs font-num tracking-wider">β · 開発中</div>
      </div>
    </main>
  )
}

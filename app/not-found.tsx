import Link from 'next/link'

// アドレスが変わった・なくなったページを開いたとき（404）に出る日本語画面。
// 英語の "404 This page could not be found" のかわりにこれを出す。
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface card-shadow px-8 py-10 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-text mb-3">
          ページが見つかりませんでした
        </h1>
        <p className="text-text-muted leading-relaxed mb-8">
          アドレスが変わったか、なくなったページかもしれません。
          <br />
          ホームから、もう一度たどってみてください。
        </p>

        <Link
          href="/"
          className="h-14 w-full inline-flex items-center justify-center rounded-full bg-accent text-white font-semibold text-lg shadow-[0_4px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep transition-all hover-lift"
        >
          ホームにもどる
        </Link>
      </div>
    </main>
  )
}

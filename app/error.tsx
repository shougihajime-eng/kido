'use client' // エラー境界（Error Boundary）は必ずクライアントコンポーネント

import { useEffect } from 'react'
import Link from 'next/link'

// ページ内で一瞬の不具合（通信切れ・データ取得の失敗など）が起きたときに
// 英語のデフォルト画面ではなく、この やさしい日本語画面を出す。
export default function Error({
  error,
  unstable_retry
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    // あとで原因を追えるように、画面の裏側のログにだけ記録（ユーザーには見えない）
    console.error(error)
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface card-shadow px-8 py-10 text-center">
        <div className="text-5xl mb-4">🌸</div>
        <h1 className="text-2xl font-bold text-text mb-3">
          ちょっと、うまく開けませんでした
        </h1>
        <p className="text-text-muted leading-relaxed mb-8">
          通信が一瞬とぎれたか、ちょっとした不具合かもしれません。
          <br />
          下のボタンをもう一度押すと、たいてい直ります。
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="h-14 inline-flex items-center justify-center rounded-full bg-accent text-white font-semibold text-lg shadow-[0_4px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep transition-all hover-lift"
          >
            もう一度ひらく
          </button>
          <Link
            href="/"
            className="h-12 inline-flex items-center justify-center rounded-full text-accent font-semibold hover-lift"
          >
            ホームにもどる
          </Link>
        </div>

        <p className="text-text-dim text-tiny mt-8">
          何度やっても直らないときは、少し時間をおいてから開いてみてください。
        </p>
      </div>
    </main>
  )
}

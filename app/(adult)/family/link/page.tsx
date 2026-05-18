import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { LinkForm } from './LinkForm'

export const metadata = {
  title: '生徒と紐づく'
}

export default function LinkPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/family"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ChevronLeft className="w-4 h-4" />
          見守りに戻る
        </Link>
        <h1 className="text-3xl font-bold">生徒と紐づく</h1>
        <p className="text-sm text-text-muted">生徒が発行した「招待コード」を入力してください</p>
      </header>

      <LinkForm />

      <section className="bg-surface-elevated border border-border rounded-2xl p-5 text-sm text-text-muted leading-relaxed flex flex-col gap-2">
        <p className="font-semibold text-text">紐づけの流れ</p>
        <ol className="list-decimal list-inside space-y-1 text-text-muted text-xs">
          <li>生徒に「親（または先生）用の招待コードを発行して」と伝える</li>
          <li>生徒が画面に表示したコード（8文字、例：ABCD-1234）を受け取る</li>
          <li>このページにコードを入力して「紐づける」を押す</li>
          <li>「見守り」画面に戻り、生徒の記録が見られるようになる</li>
        </ol>
        <p className="text-xs text-text-dim mt-2">
          コードは1回使うと無効になります。失効すると別のコードが必要です（生徒側で再発行できます）。
        </p>
      </section>
    </div>
  )
}

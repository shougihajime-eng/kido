import { UsersRound } from 'lucide-react'

export const metadata = {
  title: '仲間'
}

export default function FollowPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">仲間</h1>
        <p className="text-sm text-text-muted">フォローしている人の最近の研鑽</p>
      </header>

      <section className="bg-surface border border-border rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-surface-elevated flex items-center justify-center text-accent">
          <UsersRound className="h-7 w-7" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">準備中</p>
          <p className="text-xs text-text-muted">
            仲間との比較や、フィードはこのあと作っていきます。
          </p>
        </div>
      </section>
    </div>
  )
}

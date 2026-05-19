import { MeigenList } from '@/components/dashboard/MeigenList'

export const metadata = {
  title: '名言の間'
}

export default function MeigenPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-text-dim text-xs font-num tracking-widest uppercase">MEIGEN</span>
        <h1 className="text-2xl md:text-3xl font-bold font-mincho">名言の間</h1>
        <p className="text-sm text-text-muted font-mincho">
          先輩棋士の言葉と、全力で生きた人々の言葉。気持ちが揺らいだ時に開こう。
        </p>
      </header>

      <MeigenList />
    </div>
  )
}

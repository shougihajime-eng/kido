import Link from 'next/link'
import { SignupForm } from './form'

export const metadata = {
  title: 'はじめる'
}

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center flex flex-col gap-2">
        <Link
          href="/"
          className="text-text-dim text-xs tracking-[0.4em] uppercase font-num hover:text-text-muted"
        >
          KIDO
        </Link>
        <h1 className="text-3xl font-bold gold-glow">はじめる</h1>
        <p className="text-sm text-text-muted">アカウントを作って、今日から記録を始めよう</p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-text-muted">
        もうアカウントがある？{' '}
        <Link href="/login" className="text-accent hover:text-accent-deep underline">
          ログイン
        </Link>
      </p>
    </div>
  )
}

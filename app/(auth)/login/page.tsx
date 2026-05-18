import Link from 'next/link'
import { LoginForm } from './form'

export const metadata = {
  title: 'ログイン'
}

export default function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center flex flex-col gap-2">
        <Link
          href="/"
          className="text-text-dim text-xs tracking-[0.4em] uppercase font-num hover:text-text-muted"
        >
          KIDO
        </Link>
        <h1 className="text-3xl font-bold gold-glow">ログイン</h1>
      </div>
      <LoginForm searchParams={searchParams} />
      <p className="text-center text-sm text-text-muted">
        まだアカウントがない？{' '}
        <Link href="/signup" className="text-accent hover:text-accent-deep underline">
          はじめる
        </Link>
      </p>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'ログインが必要です' }, { status: 401 })
  }

  let body: { endpoint: string }
  try {
    body = (await req.json()) as { endpoint: string }
  } catch {
    return NextResponse.json({ ok: false, error: '不正なリクエスト' }, { status: 400 })
  }

  if (!body.endpoint) {
    return NextResponse.json({ ok: false, error: 'endpoint が必要です' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any
  const { error } = await untyped
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', body.endpoint)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

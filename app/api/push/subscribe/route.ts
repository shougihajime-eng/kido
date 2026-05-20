import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type SubscribeBody = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  userAgent?: string
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'ログインが必要です' }, { status: 401 })
  }

  let body: SubscribeBody
  try {
    body = (await req.json()) as SubscribeBody
  } catch {
    return NextResponse.json({ ok: false, error: '不正なリクエスト' }, { status: 400 })
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ ok: false, error: '必要な情報が足りません' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any
  // upsert: 同じ endpoint があれば last_seen_at を更新
  const { error } = await untyped
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        user_agent: body.userAgent ?? null,
        last_seen_at: new Date().toISOString()
      },
      { onConflict: 'endpoint' }
    )

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

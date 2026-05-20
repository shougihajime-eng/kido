import { createClient } from '@/lib/supabase/server'
import { CodeManager } from './CodeManager'

export const metadata = {
  title: '親・先生を招待'
}

export default async function CodePage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    // 念のため。レイアウト側で弾かれる
    return null
  }

  const now = new Date().toISOString()

  // 自分の表示名（招待文に「○○ さんからの招待」と入れるため）
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  // 有効な招待コードを取得（未使用かつ未失効）
  const { data: activeCodes } = await supabase
    .from('invite_codes')
    .select('code, kind, expires_at, used_at, created_at')
    .eq('student_id', user.id)
    .is('used_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })

  // 紐づいた親・先生
  const { data: relationships } = await supabase
    .from('relationships')
    .select('id, kind, adult_id, created_at')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  // 親・先生の表示名を取得（個別 select で RLS をパスする）
  const adultIds = (relationships ?? []).map((r) => r.adult_id)
  const adultProfiles =
    adultIds.length > 0
      ? (
          await supabase
            .from('profiles')
            .select('id, display_name, role')
            .in('id', adultIds)
        ).data ?? []
      : []
  const adultMap = new Map(adultProfiles.map((p) => [p.id, p]))

  const linkedAdults = (relationships ?? []).map((r) => ({
    id: r.id,
    kind: r.kind as 'parent' | 'teacher',
    adultId: r.adult_id,
    displayName: adultMap.get(r.adult_id)?.display_name ?? '（不明）',
    createdAt: r.created_at
  }))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">親・先生を招待</h1>
        <p className="text-sm text-text-muted">
          コードを発行して、親や先生に渡そう。あなたの記録を見守ってもらえる
        </p>
      </header>

      <CodeManager
        initialCodes={(activeCodes ?? []).map((c) => ({
          code: c.code,
          kind: c.kind as 'parent' | 'teacher',
          expiresAt: c.expires_at,
          createdAt: c.created_at
        }))}
        linkedAdults={linkedAdults}
        studentName={myProfile?.display_name ?? null}
      />
    </div>
  )
}

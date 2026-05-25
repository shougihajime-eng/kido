import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TsumeEditor } from '@/components/tsume/TsumeEditor'

export const metadata = {
  title: '詰将棋を直す'
}

export default async function EditTsumePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'teacher') redirect('/family')

  const { data: row } = await supabase
    .from('tsume_problems')
    .select('id, title, level, start_sfen, moves_usi, composer, source, note, published')
    .eq('id', id)
    .maybeSingle()

  if (!row) notFound()

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <Link
          href="/family/tsume"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> 一覧にもどる
        </Link>
        <h1 className="text-2xl font-bold">詰将棋を直す・見る</h1>
      </header>
      <TsumeEditor
        initial={{
          id: row.id,
          title: row.title ?? '',
          level: row.level,
          startSfen: row.start_sfen,
          movesUsi: row.moves_usi ?? [],
          composer: row.composer ?? '',
          source: row.source ?? '',
          note: row.note ?? '',
          published: row.published
        }}
      />
    </div>
  )
}

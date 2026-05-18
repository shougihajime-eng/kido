import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RecordWizard } from './RecordWizard'

export const metadata = {
  title: '記録する'
}

export default async function RecordPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_ja, icon_key, color_token, sort_order, is_preset')
    .order('sort_order', { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:bg-surface-elevated"
          aria-label="戻る"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">今、何してた？</h1>
      </header>
      <RecordWizard categories={categories ?? []} />
    </div>
  )
}

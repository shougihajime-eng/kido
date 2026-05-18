import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main className="flex flex-1 flex-col w-full max-w-3xl mx-auto px-4 py-6 pb-24 safe-area-inset">
      {children}
    </main>
  )
}

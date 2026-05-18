import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdultBottomNav } from '@/components/nav/AdultBottomNav'

export default async function AdultLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ロールが親または先生でなければ生徒側へ
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/login')
  }
  if (profile.role === 'student') {
    redirect('/dashboard')
  }

  return (
    <>
      <main className="flex flex-1 flex-col w-full max-w-3xl mx-auto px-4 py-6 pb-24 safe-area-inset">
        {children}
      </main>
      <AdultBottomNav />
    </>
  )
}

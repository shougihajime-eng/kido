import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/nav/BottomNav'
import { SideNav } from '@/components/nav/SideNav'
import { AdultBottomNav } from '@/components/nav/AdultBottomNav'
import { AdultSideNav } from '@/components/nav/AdultSideNav'

export default async function MeigenLayout({ children }: { children: React.ReactNode }) {
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

  const isAdult = profile?.role === 'parent' || profile?.role === 'teacher'

  return (
    <div className="flex flex-1 min-h-screen w-full">
      {isAdult ? <AdultSideNav /> : <SideNav />}
      <main className="flex flex-1 flex-col w-full max-w-3xl md:max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10 pb-24 md:pb-10 safe-area-inset">
        {children}
      </main>
      {isAdult ? <AdultBottomNav /> : <BottomNav />}
    </div>
  )
}

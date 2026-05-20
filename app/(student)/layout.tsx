import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/nav/BottomNav'
import { SideNav } from '@/components/nav/SideNav'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 生徒ロール以外は親・先生エリアへ
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && profile.role !== 'student') {
    redirect('/family')
  }

  return (
    <div className="flex flex-1 min-h-screen w-full">
      <SideNav />
      <main className="flex flex-1 flex-col w-full max-w-3xl md:max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10 pb-bottom-nav md:pb-10 safe-area-inset">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

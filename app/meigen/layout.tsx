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
    <div className="flex flex-1 min-h-screen w-full meigen-atmosphere relative">
      {/* 遠い山並み（墨絵）— 固定で奥行きを出す */}
      <div className="meigen-mountains" aria-hidden="true">
        <svg
          viewBox="0 0 1200 320"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 遠い山 */}
          <path
            className="ridge-far"
            d="M0,320 L0,200 L120,150 L230,180 L350,120 L470,170 L600,90 L730,160 L860,110 L990,170 L1110,100 L1200,150 L1200,320 Z"
          />
          {/* 中ぐらいの山 */}
          <path
            className="ridge-mid"
            d="M0,320 L0,240 L160,210 L300,230 L460,195 L620,225 L780,200 L920,230 L1060,205 L1200,225 L1200,320 Z"
          />
          {/* 近い山 */}
          <path
            className="ridge-near"
            d="M0,320 L0,275 L150,260 L300,272 L470,258 L640,270 L820,255 L1000,268 L1200,260 L1200,320 Z"
          />
        </svg>
      </div>

      {/* 金粉（控えめなきらめき）— ページ全体に薄く散らす */}
      <div className="meigen-gold-dust" aria-hidden="true" />

      {isAdult ? <AdultSideNav /> : <SideNav />}
      <main className="relative z-10 flex flex-1 flex-col w-full max-w-3xl md:max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10 pb-24 md:pb-10 safe-area-inset">
        {children}
      </main>
      {isAdult ? <AdultBottomNav /> : <BottomNav />}
    </div>
  )
}

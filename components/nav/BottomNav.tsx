'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, BarChart3, User, Target, UsersRound } from 'lucide-react'

const ITEMS = [
  { href: '/dashboard', label: 'ホーム', icon: Home },
  { href: '/goals', label: '目標', icon: Target },
  { href: '/calendar', label: 'カレンダー', icon: Calendar },
  { href: '/analysis', label: '分析', icon: BarChart3 },
  { href: '/follow', label: '仲間', icon: UsersRound },
  { href: '/profile', label: '自分', icon: User }
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-t border-border safe-area-inset">
      <ul className="max-w-3xl mx-auto grid grid-cols-6">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                  active ? 'text-accent' : 'text-text-muted hover:text-text'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

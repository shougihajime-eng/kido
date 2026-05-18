'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, BarChart3, User, Target } from 'lucide-react'

const ITEMS = [
  { href: '/dashboard', label: 'ホーム', icon: Home },
  { href: '/goals', label: '目標', icon: Target },
  { href: '/calendar', label: 'カレンダー', icon: Calendar },
  { href: '/analysis', label: '分析', icon: BarChart3 },
  { href: '/profile', label: '自分', icon: User }
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border safe-area-inset">
      <ul className="max-w-3xl mx-auto grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                  active ? 'text-accent' : 'text-text-dim hover:text-text-muted'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

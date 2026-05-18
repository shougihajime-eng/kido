'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { KeyRound, User, UsersRound } from 'lucide-react'

const ITEMS = [
  { href: '/family', label: '見守り', icon: UsersRound },
  { href: '/family/link', label: '紐づけ', icon: KeyRound },
  { href: '/profile', label: '自分', icon: User }
]

export function AdultBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border safe-area-inset">
      <ul className="max-w-3xl mx-auto grid grid-cols-3">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/family'
              ? pathname === '/family' || (pathname.startsWith('/family/') && pathname !== '/family/link')
              : pathname === item.href || pathname.startsWith(item.href + '/')
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

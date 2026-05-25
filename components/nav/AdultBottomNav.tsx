'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { KeyRound, User, UsersRound, Quote } from 'lucide-react'

const BASE_ITEMS = [
  { href: '/family', label: '見守り', icon: UsersRound },
  { href: '/family/link', label: '紐づけ', icon: KeyRound },
  { href: '/meigen', label: '名言', icon: Quote },
  { href: '/profile', label: '自分', icon: User }
]

export function AdultBottomNav() {
  const pathname = usePathname()
  const items = BASE_ITEMS

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-t border-border safe-area-inset">
      <ul
        className="max-w-3xl mx-auto grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/family'
              ? pathname === '/family' ||
                (pathname.startsWith('/family/') && pathname !== '/family/link')
              : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-3 min-h-[60px] active:bg-accent-soft transition-colors ${
                  active ? 'text-accent' : 'text-text-muted hover:text-text'
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

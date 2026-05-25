'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { KeyRound, User, UsersRound, Quote } from 'lucide-react'

const BASE_ITEMS = [
  { href: '/family', label: '見守り', icon: UsersRound },
  { href: '/family/link', label: '紐づけ', icon: KeyRound },
  { href: '/meigen', label: '名言の間', icon: Quote },
  { href: '/profile', label: '自分', icon: User }
]

export function AdultSideNav() {
  const pathname = usePathname()
  const items = BASE_ITEMS

  return (
    <aside className="hidden md:flex w-60 lg:w-64 shrink-0 flex-col bg-surface border-r border-border py-6 sticky top-0 h-screen">
      <Link
        href="/family"
        className="flex items-center gap-2 px-6 mb-8 text-2xl font-bold text-accent"
      >
        <span className="text-sakura">🌸</span>
        <span>棋道</span>
      </Link>

      <nav className="flex-1 px-3 flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/family'
              ? pathname === '/family' ||
                (pathname.startsWith('/family/') && pathname !== '/family/link')
              : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-base font-medium ${
                active
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-muted hover:bg-surface-overlay hover:text-text'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-6 text-xs text-text-dim mt-6">見守りモード</div>
    </aside>
  )
}

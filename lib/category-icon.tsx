import { Scroll, Clock, Users, Cpu, BookOpen, Plus, Swords } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { className?: string; strokeWidth?: number }
type IconComp = ComponentType<IconProps>

// 詰将棋専用アイコン
function TsumeIcon({ className, strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...rest}
    >
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <polygon points="17 4.5 19.5 5.8 19 8 16 8 15.5 5.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

const ICONS: Record<string, IconComp> = {
  scroll: Scroll,
  tsume: TsumeIcon,
  clock: Clock,
  users: Users,
  swords: Swords,
  cpu: Cpu,
  book: BookOpen,
  plus: Plus,
}

/** icon_key からアイコンコンポーネントを引く */
export function getCategoryIcon(iconKey: string): IconComp {
  return ICONS[iconKey] ?? Plus
}

/** color_token を CSS var として返す */
export function categoryColorVar(token: string): string {
  return `var(--${token})`
}

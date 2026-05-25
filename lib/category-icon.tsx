import {
  Scroll,
  Clock,
  Users,
  Cpu,
  BookOpen,
  Plus,
  Swords,
  GraduationCap,
  Moon,
  Utensils,
  Gamepad2,
  Dumbbell,
  Smartphone
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { className?: string; strokeWidth?: number }
type IconComp = ComponentType<IconProps>

const ICONS: Record<string, IconComp> = {
  scroll: Scroll,
  clock: Clock,
  users: Users,
  swords: Swords,
  cpu: Cpu,
  book: BookOpen,
  plus: Plus,
  'graduation-cap': GraduationCap,
  moon: Moon,
  utensils: Utensils,
  gamepad: Gamepad2,
  dumbbell: Dumbbell,
  smartphone: Smartphone,
}

/** icon_key からアイコンコンポーネントを引く */
export function getCategoryIcon(iconKey: string): IconComp {
  return ICONS[iconKey] ?? Plus
}

/** color_token を CSS var として返す */
export function categoryColorVar(token: string): string {
  return `var(--${token})`
}

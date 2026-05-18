'use client'

import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  format?: (n: number) => string
}

/**
 * 数字をスッと立ち上げてくるカウントアップ。
 * Summit 〜 棋道 を貫く核の演出。
 */
export function AnimatedNumber({
  value,
  duration = 1.4,
  className,
  format = (n) => Math.round(n).toLocaleString()
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)
  const lastRef = useRef(0)

  useEffect(() => {
    const controls = animate(lastRef.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v)
    })
    lastRef.current = value
    return () => controls.stop()
  }, [value, duration])

  return <span className={className}>{format(display)}</span>
}

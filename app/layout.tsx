import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP, Inter, JetBrains_Mono, Yuji_Syuku, Shippori_Mincho } from 'next/font/google'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  display: 'swap'
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap'
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap'
})

// 筆文字（毛筆・太字）— 名言カードで使用。Yuji Syuku は墨を含んだ太い筆字。
const yujiSyuku = Yuji_Syuku({
  variable: '--font-fude',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap'
})

// 明朝（出典名やサブテキストで雰囲気を出す）— 名言カードで使用
const shipporiMincho = Shippori_Mincho({
  variable: '--font-mincho',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: {
    default: '棋道（きどう） — 将棋プロ志望のためのトレーニング記録',
    template: '%s | 棋道'
  },
  description:
    '毎日の研鑽を記録し、仲間と切磋琢磨する。奨励会員・女流棋士志望のためのトレーニング記録アプリ。',
  applicationName: '棋道',
  appleWebApp: {
    capable: true,
    title: '棋道',
    statusBarStyle: 'black-translucent'
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
  }
}

export const viewport: Viewport = {
  themeColor: '#faf7f0',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${inter.variable} ${jetbrainsMono.variable} ${yujiSyuku.variable} ${shipporiMincho.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-text">{children}</body>
    </html>
  )
}

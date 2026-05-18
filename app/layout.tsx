import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP, Inter, JetBrains_Mono } from 'next/font/google'
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
  themeColor: '#0a0a0c',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-text">{children}</body>
    </html>
  )
}

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '棋道（きどう）— 将棋プロ志望のためのトレーニング記録',
    short_name: '棋道',
    description:
      '毎日の研鑽を記録し、仲間と切磋琢磨する。奨励会員・女流棋士志望のためのトレーニング記録アプリ。',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0c',
    theme_color: '#0a0a0c',
    lang: 'ja',
    categories: ['lifestyle', 'education', 'sports'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icon-mask.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  }
}

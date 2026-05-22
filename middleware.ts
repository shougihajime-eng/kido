import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 静的アセット・画像・favicon・manifest・Service Worker (/sw.js)・public 配下の .js を除く全ルート
     * /sw.js は未ログインで取得できないと、Service Worker の登録に失敗してログイン直後の挙動が
     * 不安定になるため、必ず middleware の対象外にする。
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|map|json|woff|woff2|ttf|otf)$).*)'
  ]
}

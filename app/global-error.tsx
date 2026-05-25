'use client' // エラー境界（Error Boundary）は必ずクライアントコンポーネント

// アプリの土台（root layout）ごと開けなかったときの「最後の砦」。
// この画面は土台を置きかえるため、globals.css やフォントが効かない場合がある。
// そこで色・文字サイズ・配置をすべて中に直接書き、何があっても
// 日本語で・棋道らしい見た目で出るようにしている。
export default function GlobalError({
  unstable_retry
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    // global-error は自前の <html> と <body> を持つ必要がある
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#faf7f0',
          color: '#1f2937',
          fontFamily:
            "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', system-ui, sans-serif",
          WebkitFontSmoothing: 'antialiased'
        }}
      >
        <title>うまく開けませんでした | 棋道</title>
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            background: '#ffffff',
            border: '1px solid #ebe5d6',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(31, 41, 55, 0.05)',
            padding: '40px 32px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌸</div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 0 12px'
            }}
          >
            ちょっと、うまく開けませんでした
          </h1>
          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.7,
              color: '#4b5563',
              margin: '0 0 32px'
            }}
          >
            通信が一瞬とぎれたか、ちょっとした不具合かもしれません。
            <br />
            下のボタンをもう一度押すと、たいてい直ります。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                height: '56px',
                border: 'none',
                borderRadius: '9999px',
                background: '#1e40af',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(30, 64, 175, 0.25)'
              }}
            >
              もう一度ひらく
            </button>
            {/* 土台ごと壊れた最後の砦なので、画面まるごと読み直すため
                あえて通常リンク（next/link ではなく素の <a>）にしている */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                height: '48px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1e40af',
                fontWeight: 600,
                fontSize: '16px',
                textDecoration: 'none'
              }}
            >
              ホームにもどる
            </a>
          </div>

          <p
            style={{
              fontSize: '14px',
              color: '#9ca3af',
              margin: '32px 0 0'
            }}
          >
            何度やっても直らないときは、少し時間をおいてから開いてみてください。
          </p>
        </div>
      </body>
    </html>
  )
}

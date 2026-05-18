import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0a0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg width="130" height="130" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <polygon
          points="100,30 175,80 165,170 35,170 25,80"
          fill="none"
          stroke="#d4a24c"
          strokeWidth="12"
          strokeLinejoin="round"
        />
        <line
          x1="100"
          y1="55"
          x2="100"
          y2="155"
          stroke="#d4a24c"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <line
          x1="65"
          y1="100"
          x2="135"
          y2="100"
          stroke="#d4a24c"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    </div>,
    size
  )
}

import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string }

function I({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconCalc = (p: IconProps) => (
  <I {...p}>
    <rect x="5" y="2" width="14" height="20" rx="2.5" />
    <path d="M8.5 6h7" />
    <path d="M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01" />
  </I>
)

export const IconSigma = (p: IconProps) => (
  <I {...p}>
    <path d="M18 7V4H6l6.5 8L6 20h12v-3" />
  </I>
)

export const IconChart = (p: IconProps) => (
  <I {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 14l3.5-5 3 3L18.5 6" />
  </I>
)

export const IconCode = (p: IconProps) => (
  <I {...p}>
    <path d="M15.5 18 21 12l-5.5-6" />
    <path d="M8.5 6 3 12l5.5 6" />
  </I>
)

export const IconSwap = (p: IconProps) => (
  <I {...p}>
    <path d="M8 3 4 7l4 4" />
    <path d="M4 7h16" />
    <path d="m16 21 4-4-4-4" />
    <path d="M20 17H4" />
  </I>
)

export const IconCamera = (p: IconProps) => (
  <I {...p}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3.2" />
  </I>
)

export const IconSun = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </I>
)

export const IconMoon = (p: IconProps) => (
  <I {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </I>
)

export const IconHistory = (p: IconProps) => (
  <I {...p}>
    <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3.5 2" />
  </I>
)

export const IconKeyboard = (p: IconProps) => (
  <I {...p}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
  </I>
)

export const IconX = (p: IconProps) => (
  <I {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </I>
)

export const IconPlus = (p: IconProps) => (
  <I {...p}>
    <path d="M5 12h14M12 5v14" />
  </I>
)

export const IconTrash = (p: IconProps) => (
  <I {...p}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </I>
)

export const IconEye = (p: IconProps) => (
  <I {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </I>
)

export const IconEyeOff = (p: IconProps) => (
  <I {...p}>
    <path d="M9.9 5.2A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.1" />
    <path d="M6.3 6.4A16.9 16.9 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.6-1.7" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m3 3 18 18" />
  </I>
)

export const IconDownload = (p: IconProps) => (
  <I {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </I>
)

export const IconImage = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </I>
)

export const IconZap = (p: IconProps) => (
  <I {...p}>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </I>
)

export const IconRotateCcw = (p: IconProps) => (
  <I {...p}>
    <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
    <path d="M3 3v5h5" />
  </I>
)

export const IconClipboard = (p: IconProps) => (
  <I {...p}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </I>
)

export const IconSparkle = (p: IconProps) => (
  <I {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
  </I>
)

export function LogoMark({ size = 44 }: { size?: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="numera-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a84ff" />
          <stop offset="1" stopColor="#bf5af2" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#numera-logo-g)" />
      <text
        x="32"
        y="45"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="36"
        fill="#fff"
        textAnchor="middle"
      >
        π
      </text>
    </svg>
  )
}

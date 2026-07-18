import type { SVGProps } from 'react'

export function BabyCheckMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M48.5 28.6C48.5 41.5 40.4 50 30.2 50 20 50 12 42 12 31.8c0-8.3 5.4-15.6 13.3-18.1 1.6-.5 2.9 1.3 2 2.7-1.1 1.7-.8 3.9.7 5.2 2.2 2 5.4.8 6.3-1.6.5-1.3 2.1-1.7 3.2-.8 6.7 5.3 11 1.7 11 9.4Z"
        fill="currentColor"
      />
      <circle cx="26" cy="32" r="2.4" fill="white" />
      <circle cx="38" cy="32" r="2.4" fill="white" />
      <path
        d="m24.5 41 4.2 4.2L40 35"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

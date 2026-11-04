import type { CSSProperties } from 'react'

const paths: Record<string, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
  approval: <><path d="M9 3h6l1 2h3v16H5V5h3z"/><path d="m8 13 3 3 5-6M9 3v4h6V3"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/></>,
  history: <><path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  down: <path d="m6 9 6 6 6-6"/>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  back: <path d="M20 12H4m6-6-6 6 6 6"/>,
  external: <><path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></>,
  expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>,
  image: <><rect x="3" y="3" width="18" height="18"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h3m4 0h3"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  checkCircle: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  location: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></>,
  shield: <><path d="m12 3 8 3v6c0 5-8 10-8 10S4 17 4 12V6z"/><path d="m8 12 3 3 5-6"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></>,
  filter: <><path d="M4 7h16M7 12h10m-7 5h4"/><circle cx="8" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/></>,
  refresh: <><path d="M20 7a9 9 0 0 0-15-1L3 9m0-6v6h6m-5 8a9 9 0 0 0 15 1l2-3m0 6v-6h-6"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6"/></>,
  building: <><path d="M4 21V7l8-4 8 4v14M2 21h20M8 9h1m6 0h1m-8 4h1m6 0h1m-6 8v-4h4v4"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3v.1"/></>,
  menu: <path d="M3 6h18M3 12h18M3 18h18"/>,
  file: <><path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8m-8 4h6"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/></>,
}

export default function Icon({ name, size = 20, className, style }: { name: string; size?: number; className?: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>{paths[name] ?? paths.file}</svg>
}

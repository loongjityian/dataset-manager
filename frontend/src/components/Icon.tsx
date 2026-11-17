const paths = {
  upload: 'M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  pencil: 'M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4.35-4.35',
  x: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5 10 17l9-10',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  alert: 'M12 8v5m0 3.5v.5M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5',
  table: 'M4 5h16v14H4zM4 10h16M4 14.5h16M10 10v9',
  key: 'M14.5 9.5a4 4 0 1 0-3.9 4.4L10 15h-2v2H6v2H4v-2.6l6.1-6.1M15 8h.01',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, className = 'size-4' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

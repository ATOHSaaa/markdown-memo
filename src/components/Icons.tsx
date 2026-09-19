import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l5 5" />
    </Icon>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M7 7l1 13h8l1-13" />
    </Icon>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 6H6v12h3" />
      <path d="M10 12h9" />
      <path d="M16 8l4 4-4 4" />
    </Icon>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  )
}

export function BoldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 5h7a3.5 3.5 0 0 1 0 7H7z" />
      <path d="M7 12h8a3.5 3.5 0 0 1 0 7H7z" />
    </Icon>
  )
}

export function ItalicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 5h8" />
      <path d="M6 19h8" />
      <path d="M14 5l-4 14" />
    </Icon>
  )
}

export function ListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 7h11M9 12h11M9 17h11" />
      <path d="M5 7h.01M5 12h.01M5 17h.01" />
    </Icon>
  )
}

export function OrderedListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 7h10M10 12h10M10 17h10" />
      <path d="M4 6.5h2v4H4" />
      <path d="M4 14h3l-3 4h3" />
    </Icon>
  )
}

export function QuoteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 17c-2 0-3-1.5-3-4V9h4v4H7c0 2 1 3 2 4zM16 17c-2 0-3-1.5-3-4V9h4v4h-2c0 2 1 3 2 4z" />
    </Icon>
  )
}

export function CodeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 8L5 12l4 4" />
      <path d="M15 8l4 4-4 4" />
    </Icon>
  )
}

export function LinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 13a5 5 0 0 0 7.5.1l1.4-1.4a5 5 0 0 0-7.1-7.1L10.5 6" />
      <path d="M14 11a5 5 0 0 0-7.5-.1L5.1 12.3a5 5 0 0 0 7.1 7.1L13.5 18" />
    </Icon>
  )
}

export function ImageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.4" />
      <path d="M5 17l5-5 3 3 2-2 4 4" />
    </Icon>
  )
}

export function Heading1Icon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 6v12M12 6v12M5 12h7" />
      <path d="M18 10v8M16.5 18h3" />
    </Icon>
  )
}

export function Heading2Icon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6v12M11 6v12M4 12h7" />
      <path d="M15 11c.6-.8 1.4-1.2 2.3-1.2 1.4 0 2.2.9 2.2 2.1 0 2.4-4.5 3.2-4.5 6h4.7" />
    </Icon>
  )
}

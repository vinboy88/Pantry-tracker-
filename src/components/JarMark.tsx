interface JarMarkProps {
  size?: number
}

export function JarMark({ size = 64 }: JarMarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="currentColor" />
      <rect x="22" y="12" width="20" height="8" rx="2.5" fill="var(--on-sage)" />
      <rect x="26" y="19" width="12" height="5" fill="var(--on-sage)" />
      <rect x="16" y="23" width="32" height="31" rx="8" fill="var(--on-sage)" />
      <rect x="21" y="32" width="22" height="12" rx="3" fill="currentColor" />
    </svg>
  )
}

interface InstallHintProps {
  onDismiss: () => void
}

export function InstallHint({ onDismiss }: InstallHintProps) {
  return (
    <aside className="install-hint">
      <div>
        <strong>Keep Pantry one tap away</strong>
        <p>Safari → Share → Add to Home Screen</p>
      </div>
      <button type="button" className="ghost-btn" onClick={onDismiss}>
        Got it
      </button>
    </aside>
  )
}

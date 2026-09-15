import { JarMark } from './JarMark.tsx'

interface WelcomeProps {
  onDismiss: () => void
  standalone: boolean
}

export function Welcome({ onDismiss, standalone }: WelcomeProps) {
  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <button type="button" className="sheet-backdrop" aria-label="Close welcome" onClick={onDismiss} />
      <section className="sheet welcome-sheet">
        <div className="welcome-hero" aria-hidden="true">
          <span className="welcome-mark">
            <JarMark size={72} />
          </span>
        </div>
        <h2 id="welcome-title">Your shelves, minus the guesswork</h2>
        <ul className="welcome-list">
          <li>Add what you have — quantity, category, expiry, notes, or scan a barcode.</li>
          <li>Quick-add a name, tap a recent item, or scan to bump the count.</li>
          <li>Low stock and expiry light up. Backup lives under Settings.</li>
          <li>Everything stays on this phone. Works offline after the first load.</li>
        </ul>
        {!standalone ? (
          <div className="install-card">
            <strong>Add to your iPhone Home Screen</strong>
            <p>In Safari, tap Share, then Add to Home Screen. Pantry opens like an app.</p>
          </div>
        ) : null}
        <button type="button" className="primary-btn welcome-cta" onClick={onDismiss}>
          Get started
        </button>
      </section>
    </div>
  )
}

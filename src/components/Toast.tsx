interface ToastProps {
  message: string
}

export function Toast({ message }: ToastProps) {
  if (!message) return null
  return (
    <p className="toast" role="status" aria-live="polite">
      {message}
    </p>
  )
}

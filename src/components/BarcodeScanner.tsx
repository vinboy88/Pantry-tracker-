import { useEffect, useId, useRef, useState } from 'react'
import { isPlausibleBarcode, normalizeBarcode } from '../lib/barcode.ts'
import { isStandalone } from '../lib/theme.ts'
import {
  cameraSupported,
  classifyCameraError,
  detectFromImageFile,
  detectFromVideo,
  queryCameraPermission,
  startCameraStream,
  stopCameraStream,
  type CameraFacing,
  type CameraFailure,
} from '../lib/scanEngine.ts'

type ScanPhase = 'intro' | 'starting' | 'live' | 'denied' | 'error' | 'manual'

interface BarcodeScannerProps {
  onDetect: (barcode: string) => void
  onClose: () => void
}

const FAILURE_COPY: Record<CameraFailure, string> = {
  denied: 'Camera access is off, so Pantry cannot read a barcode from the live view.',
  missing: 'No camera is available on this device.',
  insecure: 'Safari only shares the camera on HTTPS. Open the GitHub Pages site or another secure URL.',
  busy: 'The camera is in use by another app. Close it and try again.',
  unsupported: 'This browser cannot open the camera.',
  unknown: 'Could not start the camera.',
}

function permissionHelp(): string {
  return isStandalone()
    ? 'On iPhone: Settings → Pantry → Camera → Allow, then tap Try camera again.'
    : 'On iPhone: Settings → Safari → Camera → Allow, then tap Try camera again.'
}

export function BarcodeScanner({ onDetect, onClose }: BarcodeScannerProps) {
  const titleId = useId()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const runningRef = useRef(false)
  const handledRef = useRef(false)
  const detectRef = useRef(onDetect)

  useEffect(() => {
    detectRef.current = onDetect
  }, [onDetect])

  const [phase, setPhase] = useState<ScanPhase>('intro')
  const [failure, setFailure] = useState<CameraFailure | null>(null)
  const [facing, setFacing] = useState<CameraFacing>('environment')
  const [session, setSession] = useState(0)
  const [manual, setManual] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)

  const emit = (barcode: string) => {
    if (handledRef.current) return
    handledRef.current = true
    runningRef.current = false
    try {
      navigator.vibrate?.(20)
    } catch {
      /* ignore */
    }
    detectRef.current(barcode)
  }

  const stopLive = () => {
    runningRef.current = false
    stopCameraStream(streamRef.current)
    streamRef.current = null
    const video = videoRef.current
    if (video) video.srcObject = null
  }

  const requestCamera = (nextFacing: CameraFacing = facing) => {
    setPhotoError(null)
    setManualError(null)
    setFailure(null)
    setFacing(nextFacing)
    handledRef.current = false
    setPhase('starting')
    setSession((value) => value + 1)
  }

  useEffect(() => {
    let cancelled = false
    void queryCameraPermission().then((status) => {
      if (cancelled) return
      if (status === 'denied') {
        setFailure('denied')
        setPhase('denied')
        return
      }
      if (status === 'granted' && cameraSupported()) {
        setPhotoError(null)
        setManualError(null)
        setFailure(null)
        setFacing('environment')
        handledRef.current = false
        setPhase('starting')
        setSession((value) => value + 1)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  useEffect(() => {
    if (session === 0) return

    const video = videoRef.current
    if (!video) {
      setFailure('unknown')
      setPhase('error')
      return
    }

    let cancelled = false
    runningRef.current = false
    stopCameraStream(streamRef.current)
    streamRef.current = null

    void startCameraStream(video, facing)
      .then((stream) => {
        if (cancelled) {
          stopCameraStream(stream)
          return
        }
        streamRef.current = stream
        runningRef.current = true
        setPhase('live')

        const canvas = canvasRef.current ?? document.createElement('canvas')
        const tick = async () => {
          if (!runningRef.current || handledRef.current || cancelled) return
          const hit = await detectFromVideo(video, canvas)
          if (hit) {
            emit(hit)
            return
          }
          if (runningRef.current && !cancelled) window.setTimeout(() => void tick(), 140)
        }
        window.setTimeout(() => void tick(), 220)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const kind = classifyCameraError(error)
        setFailure(kind)
        setPhase(kind === 'denied' ? 'denied' : 'error')
      })

    return () => {
      cancelled = true
      runningRef.current = false
      stopCameraStream(streamRef.current)
      streamRef.current = null
    }
  }, [facing, session])

  useEffect(() => {
    return () => {
      runningRef.current = false
      stopCameraStream(streamRef.current)
      streamRef.current = null
    }
  }, [])

  const submitManual = () => {
    const code = normalizeBarcode(manual)
    if (!isPlausibleBarcode(code)) {
      setManualError('Enter the digits under the barcode (UPC or EAN).')
      return
    }
    emit(code)
  }

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) return
    setPhotoBusy(true)
    setPhotoError(null)
    try {
      const hit = await detectFromImageFile(file)
      if (hit) {
        emit(hit)
        return
      }
      setPhotoError('No barcode in that photo. Try a sharper, closer shot or type the numbers.')
    } catch {
      setPhotoError('Could not read that photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const showManual = phase === 'manual' || phase === 'denied' || phase === 'error'
  const showStage = phase === 'starting' || phase === 'live'
  const canFlip = phase === 'live'

  return (
    <div className="sheet-root scanner-root" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="sheet-backdrop" aria-label="Close scanner" onClick={onClose} />
      <section className="sheet scanner-sheet">
        <header className="editor-head">
          <button type="button" className="text-btn" onClick={onClose}>
            Cancel
          </button>
          <h2 id={titleId}>Scan barcode</h2>
          {canFlip ? (
            <button
              type="button"
              className="text-btn"
              onClick={() => requestCamera(facing === 'environment' ? 'user' : 'environment')}
            >
              Flip
            </button>
          ) : (
            <span />
          )}
        </header>

        <div className="scanner-body">
          {phase === 'intro' ? (
            <div className="scanner-copy">
              <p>
                Pantry uses the camera to read the barcode on a package, then finds that item or starts
                a new one. The photo stays on this phone.
              </p>
              <p>
                If it is a new item, Pantry may look up a name from the public Open Food Facts catalog.
                You can always type the numbers instead.
              </p>
              <button type="button" className="primary-btn" onClick={() => requestCamera()}>
                Start camera
              </button>
              {!cameraSupported() ? (
                <p className="form-hint">
                  {window.isSecureContext
                    ? 'This browser cannot open the camera. Type the barcode or use a photo.'
                    : 'Camera needs HTTPS. Use the GitHub Pages site from Safari, or type the numbers.'}
                </p>
              ) : null}
            </div>
          ) : null}

          {showStage ? (
            <div className="scanner-stage">
              <video ref={videoRef} className="scanner-video" muted playsInline autoPlay />
              <div className="scanner-reticle" aria-hidden="true" />
              <p className="scanner-caption">
                {phase === 'starting' ? 'Starting camera…' : 'Hold the barcode inside the box'}
              </p>
            </div>
          ) : null}

          {phase === 'denied' || phase === 'error' ? (
            <div className="scanner-copy">
              <p>{FAILURE_COPY[failure ?? 'unknown']}</p>
              {failure === 'denied' ? <p>{permissionHelp()}</p> : null}
              <button type="button" className="primary-btn" onClick={() => requestCamera()}>
                Try camera again
              </button>
            </div>
          ) : null}

          {phase === 'manual' ? (
            <div className="scanner-copy">
              <p>Type the digits printed under the barcode.</p>
              <button type="button" className="ghost-btn settings-wide" onClick={() => requestCamera()}>
                Use camera instead
              </button>
            </div>
          ) : null}

          {showManual ? (
            <form
              className="scanner-manual"
              onSubmit={(event) => {
                event.preventDefault()
                submitManual()
              }}
            >
              <label>
                Barcode
                <input
                  value={manual}
                  onChange={(event) => {
                    setManual(event.target.value)
                    setManualError(null)
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  autoCorrect="off"
                  placeholder="e.g. 012345678905"
                />
              </label>
              {manualError ? <p className="form-error">{manualError}</p> : null}
              <button type="submit" className="primary-btn" disabled={!manual.trim()}>
                Use this barcode
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="ghost-btn settings-wide"
              onClick={() => {
                stopLive()
                setPhase('manual')
              }}
            >
              Type the numbers
            </button>
          )}

          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              void onPickPhoto(file)
              event.target.value = ''
            }}
          />
          <button
            type="button"
            className="ghost-btn settings-wide"
            disabled={photoBusy}
            onClick={() => fileRef.current?.click()}
          >
            {photoBusy ? 'Reading photo…' : 'Use a photo'}
          </button>
          {photoError ? <p className="form-error">{photoError}</p> : null}
        </div>
        <canvas ref={canvasRef} className="sr-only" aria-hidden="true" />
      </section>
    </div>
  )
}

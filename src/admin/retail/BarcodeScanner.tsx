import Button from '@shared/ui/Button';
import { BarcodeDetector, prepareZXingModule, type BarcodeFormat } from 'barcode-detector/ponyfill';
import { useEffect, useRef, useState } from 'react';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import { runCaptureFeedback } from './cameraFeedback';

/**
 * Camera barcode scanner for the retail back-office. Uses the BarcodeDetector
 * ponyfill (zxing WASM) so it works on iPhone Safari too; the WASM binary is
 * bundled with the app (no CDN fetch). Falls back to a manual-entry field when
 * the camera is unavailable or permission is denied.
 */

prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) =>
      path.endsWith('.wasm') ? wasmUrl : prefix + path,
  },
});

// Retail product barcodes only (the default). QR codes are deliberately
// excluded here — boxes often carry a marketing QR next to the product
// barcode, and the camera would happily "scan" the URL instead of the EAN.
// The event door page passes `formats={['qr_code']}` for ticket scanning.
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] as const;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid #d5cec4',
  fontSize: 16,
};

export default function BarcodeScanner({
  onDetected,
  onCancel,
  formats,
  title = 'Scan the barcode',
  manualPlaceholder = '…or type the barcode',
  manualInputMode = 'numeric',
}: {
  onDetected: (code: string) => void;
  /** Omit to render without a Cancel button (admin's zero-tap scan page). */
  onCancel?: () => void;
  /** Override the detected formats (default: retail product barcodes). */
  formats?: readonly BarcodeFormat[];
  title?: string;
  manualPlaceholder?: string;
  manualInputMode?: 'numeric' | 'text';
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let detecting = false;
    const detector = new BarcodeDetector({ formats: [...(formats ?? FORMATS)] });

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('This browser has no camera access — type the barcode below.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch {
        if (!cancelled) {
          setCameraError('Camera unavailable or permission denied — type the barcode below.');
        }
        return;
      }
      if (cancelled || !videoRef.current) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // Autoplay hiccups resolve on the next user gesture; the loop still runs.
      }
      timer = setInterval(async () => {
        if (detecting || cancelled || video.readyState < 2) return;
        detecting = true;
        try {
          const barcodes = await detector.detect(video);
          const hit = barcodes.find((b) => b.rawValue);
          if (hit && !cancelled) {
            if (timer) clearInterval(timer);
            // The shared "got it" ritual (#21): flash + buzz + freeze on the
            // frame that read + fade out, then hand over to the lookup.
            await runCaptureFeedback({
              video,
              flash: flashRef.current,
              card: cardRef.current,
            });
            if (!cancelled) onDetected(hit.rawValue);
          }
        } catch {
          // Individual detect() failures are transient — keep scanning.
        } finally {
          detecting = false;
        }
      }, 250);
    }

    void start();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected, formats]);

  return (
    <div ref={cardRef} className="card checkout-block" style={{ padding: '1.25rem' }}>
      <h2 className="display-7" style={{ marginTop: 0 }}>
        {title}
      </h2>
      {cameraError ? (
        <p role="alert" className="paragraph-small mg-top-8px">
          {cameraError}
        </p>
      ) : (
        <div style={{ position: 'relative', marginTop: 12 }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: '100%',
              maxHeight: 320,
              borderRadius: 12,
              background: '#111',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          {/* Shutter flash (#21) — animated by runCaptureFeedback. */}
          <div
            ref={flashRef}
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 12,
              background: '#fff',
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
        </div>
      )}
      <form
        className="mg-top-12px"
        style={{ display: 'flex', gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          const code = manualCode.trim();
          if (code) onDetected(code);
        }}
      >
        <input
          aria-label="Barcode"
          style={inputStyle}
          inputMode={manualInputMode}
          placeholder={manualPlaceholder}
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
        />
        <Button
          type="submit"
          variant="white"
          disabled={!manualCode.trim()}
          data-cta-id="retail-scan-manual"
        >
          Look up
        </Button>
      </form>
      {onCancel ? (
        <div className="mg-top-12px">
          <Button variant="link" onClick={onCancel} data-cta-id="retail-scan-cancel">
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}

import { fadeIn, runCaptureFeedback } from '@features/retail/cameraFeedback';
import type { IntakeShot } from '@features/retail/retailApi';
import Button from '@shared/ui/Button';
import { useEffect, useRef, useState } from 'react';

/**
 * Guided intake-photo capture (#19/#21): a live in-app viewfinder with one
 * job — take the front or back shot for a barcode the commercial DB doesn't
 * know. One heading, the operator's words, nothing else. Mirrors
 * BarcodeScanner's camera handling (environment-facing getUserMedia, one
 * stream for the whole front→back sequence) and falls back to a native file
 * picker when the camera is unavailable or permission is denied.
 */

const HEADING: Record<IntakeShot, string> = {
  front: 'Take a picture of the front of the product',
  back: 'Take a picture of the back of the product',
};

const FILE_LABEL: Record<IntakeShot, string> = {
  front: 'Front photo file',
  back: 'Back photo file',
};

export default function PhotoCapture({
  shot,
  onCapture,
  onCancel,
}: {
  shot: IntakeShot;
  onCapture: (file: File) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [snapping, setSnapping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('This browser has no camera access — pick the photo below.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch {
        if (!cancelled) {
          setCameraError('Camera unavailable or permission denied — pick the photo below.');
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
        // Autoplay hiccups resolve on the next user gesture.
      }
    }

    void start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Entrance half of the cross-fade (#21) — on mount and again when the same
  // instance turns from the front shot to the back shot.
  useEffect(() => {
    fadeIn(cardRef.current);
  }, [shot]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || snapping) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Freeze on exactly the frame that was drawn.
    video.pause();
    setSnapping(true);
    canvas.toBlob(
      (blob) => {
        void (async () => {
          if (!blob) {
            // Encoding failed — resume the live view; staff just tap again.
            void videoRef.current?.play().catch(() => undefined);
            setSnapping(false);
            return;
          }
          const file = new File([blob], `${shot}.jpg`, { type: 'image/jpeg' });
          const fade = await runCaptureFeedback({
            video: videoRef.current,
            flash: flashRef.current,
            card: cardRef.current,
          });
          onCapture(file);
          // If this same instance now serves the next shot, restore the live
          // view and fade back in; when it unmounted instead (form next),
          // these are harmless no-ops on detached nodes.
          fade?.cancel();
          void videoRef.current?.play().catch(() => undefined);
          fadeIn(cardRef.current);
          setSnapping(false);
        })();
      },
      'image/jpeg',
      0.92,
    );
  };

  return (
    <div ref={cardRef} className="card checkout-block" style={{ padding: '1.25rem' }}>
      <h2 className="display-7" style={{ marginTop: 0 }}>
        {HEADING[shot]}
      </h2>
      {cameraError ? (
        <>
          <p role="alert" className="paragraph-small mg-top-8px">
            {cameraError}
          </p>
          <input
            aria-label={FILE_LABEL[shot]}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onCapture(file);
            }}
          />
        </>
      ) : (
        <>
          <div style={{ position: 'relative', marginTop: 12 }}>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%',
                maxHeight: 420,
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
          <div className="mg-top-12px">
            {/* #22: one look on both screens — never greys while the camera
                warms up; capture() just no-ops until frames arrive. */}
            <Button onClick={capture} data-cta-id={`admin-capture-${shot}`}>
              Capture
            </Button>
          </div>
        </>
      )}
      <div className="mg-top-12px">
        <Button variant="link" onClick={onCancel} data-cta-id="admin-capture-cancel">
          Cancel
        </Button>
      </div>
    </div>
  );
}

import type { IntakeShot } from '@features/retail/retailApi';
import Button from '@shared/ui/Button';
import { useEffect, useRef, useState } from 'react';

/**
 * Guided intake-photo capture (#19): a live in-app viewfinder with one job —
 * take the front or back shot for a barcode the commercial DB doesn't know.
 * Mirrors BarcodeScanner's camera handling (environment-facing getUserMedia,
 * one stream for the whole front→back sequence) and falls back to a native
 * file picker when the camera is unavailable or permission is denied.
 */

const COPY: Record<IntakeShot, { title: string; instruction: string }> = {
  front: { title: 'Front photo', instruction: 'Fill the frame with the front of the product.' },
  back: { title: 'Back photo', instruction: 'Make sure the ingredients list is readable.' },
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(new File([blob], `${shot}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  };

  return (
    <div className="card checkout-block" style={{ padding: '1.25rem' }}>
      <h2 className="display-7" style={{ marginTop: 0 }}>
        {COPY[shot].title}
      </h2>
      <p className="paragraph-small mg-top-8px">{COPY[shot].instruction}</p>
      {cameraError ? (
        <>
          <p role="alert" className="paragraph-small mg-top-8px">
            {cameraError}
          </p>
          <input
            aria-label={`${COPY[shot].title} file`}
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
          <video
            ref={videoRef}
            playsInline
            muted
            onCanPlay={() => setReady(true)}
            style={{
              width: '100%',
              maxHeight: 420,
              borderRadius: 12,
              background: '#111',
              objectFit: 'cover',
              marginTop: 12,
            }}
          />
          <div className="mg-top-12px">
            <Button onClick={capture} disabled={!ready} data-cta-id={`admin-capture-${shot}`}>
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

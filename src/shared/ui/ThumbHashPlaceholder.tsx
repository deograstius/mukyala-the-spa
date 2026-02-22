import { getMediaPlaceholder } from '@generated/mediaPlaceholders';
import * as React from 'react';
import { thumbHashToRGBA } from 'thumbhash';

function base64ToBytes(base64: string): Uint8Array {
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(base64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  }
  // Vitest/node fallback.

  return new Uint8Array(Buffer.from(base64, 'base64'));
}

export type ThumbHashPlaceholderProps = {
  src: string;
  hidden?: boolean;
  className?: string;
};

export default function ThumbHashPlaceholder({
  src,
  hidden,
  className = 'media-placeholder',
}: ThumbHashPlaceholderProps) {
  const key = React.useMemo(() => {
    if (!src) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        return new URL(src).pathname || src;
      } catch {
        return src;
      }
    }
    return src;
  }, [src]);

  const placeholder = getMediaPlaceholder(key);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!placeholder?.thumbhash) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof ImageData === 'undefined') return;

    const bytes = base64ToBytes(placeholder.thumbhash);
    const { w, h, rgba } = thumbHashToRGBA(bytes);

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new ImageData(new Uint8ClampedArray(rgba), w, h);
    ctx.putImageData(img, 0, 0);
  }, [placeholder?.thumbhash]);

  if (!placeholder?.thumbhash) return null;

  const cls = hidden ? `${className} is-hidden` : className;
  return (
    <div className={cls} aria-hidden="true">
      <canvas ref={canvasRef} className="thumbhash-canvas" />
    </div>
  );
}

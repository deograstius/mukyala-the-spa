/**
 * The shared "got it" ritual for successful camera events (spec #21): flash +
 * buzz + a ~500ms freeze on the exact frame + a fade-out, so a barcode read
 * and a photo capture feel identical. All fades — the calm brand motion
 * language; no slide, no pop.
 */

const FLASH_MS = 200;
const FREEZE_MS = 500;
const CROSS_FADE_MS = 250;

/** WAAPI with a jsdom guard — animations simply skip in tests. */
function safeAnimate(
  el: Element | null,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
): Animation | null {
  if (!el || typeof el.animate !== 'function') return null;
  return el.animate(keyframes, options);
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Flash the viewfinder, buzz, hold the frozen frame, then fade the card out.
 * Returns the card's fade animation (held at opacity 0 via fill:forwards) so
 * a caller that KEEPS the card mounted (front→back capture) can cancel it
 * before fading back in; callers that unmount the card just ignore it.
 */
export async function runCaptureFeedback(refs: {
  video: HTMLVideoElement | null;
  flash: HTMLElement | null;
  card: HTMLElement | null;
}): Promise<Animation | null> {
  navigator.vibrate?.(80);
  // Pausing the stream freezes the viewfinder on the frame just taken.
  refs.video?.pause();
  safeAnimate(refs.flash, [{ opacity: 0 }, { opacity: 0.85 }, { opacity: 0 }], {
    duration: FLASH_MS,
    easing: 'ease-out',
  });
  await wait(FREEZE_MS);
  const fade = safeAnimate(refs.card, [{ opacity: 1 }, { opacity: 0 }], {
    duration: CROSS_FADE_MS,
    easing: 'ease-out',
    fill: 'forwards',
  });
  if (fade) await fade.finished.catch(() => undefined);
  return fade;
}

/** Entrance half of the cross-fade, for whatever replaces the faded screen. */
export function fadeIn(el: Element | null): void {
  safeAnimate(el, [{ opacity: 0 }, { opacity: 1 }], {
    duration: CROSS_FADE_MS,
    easing: 'ease-out',
  });
}

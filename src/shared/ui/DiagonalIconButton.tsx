import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import type { HTMLAttributes } from 'react';

type DiagonalIconButtonProps = {
  theme?: 'white' | 'dark';
} & HTMLAttributes<HTMLDivElement>;

export default function DiagonalIconButton({
  theme = 'white',
  className,
  ...rest
}: DiagonalIconButtonProps) {
  const parts = [
    'secondary-button-icon',
    theme === 'white' ? 'white-button-inside-link' : 'dark-button-inside-link',
    className ?? '',
  ];
  const containerClass = parts.filter(Boolean).join(' ');

  const containerRef = useRef<HTMLDivElement>(null);
  const iconControls = useAnimationControls();
  const bgControls = useAnimationControls();
  const colorControls = useAnimationControls();

  const prefersReduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Find card/link ancestor so whole tile hover triggers animation
    let trigger: HTMLElement | null = el;
    const isTrigger = (n: Element) =>
      n.classList.contains('beauty-services-link-item') ||
      n.classList.contains('services-card-wrapper');
    while (trigger && trigger.parentElement && !isTrigger(trigger)) {
      trigger = trigger.parentElement as HTMLElement;
    }
    if (trigger && !isTrigger(trigger)) trigger = el;

    const enter = async () => {
      if (prefersReduced) {
        void bgControls.start({ backgroundColor: 'var(--core--colors--neutral--100)' });
        void colorControls.start({ color: 'var(--core--colors--neutral--800)' });
        return;
      }
      await Promise.all([
        bgControls.start({
          backgroundColor: 'var(--core--colors--neutral--100)',
          transition: { duration: 0.35, ease: 'easeOut' },
        }),
        iconControls.start({ x: 28, y: -28, transition: { duration: 0.18, ease: 'easeOut' } }),
      ]);
      await iconControls.set({ x: -28, y: 28 });
      await Promise.all([
        colorControls.start({ color: 'var(--core--colors--neutral--800)' }),
        iconControls.start({ x: 0, y: 0, transition: { duration: 0.18, ease: 'easeOut' } }),
      ]);
    };

    const leave = async () => {
      if (prefersReduced) {
        void bgControls.start({ backgroundColor: 'rgba(0,0,0,0)' });
        void colorControls.start({ color: 'var(--core--colors--neutral--100)' });
        return;
      }
      await iconControls.start({ x: -28, y: 28, transition: { duration: 0.18, ease: 'easeOut' } });
      await iconControls.set({ x: 28, y: -28 });
      await Promise.all([
        colorControls.start({ color: 'var(--core--colors--neutral--100)' }),
        iconControls.start({ x: 0, y: 0, transition: { duration: 0.18, ease: 'easeOut' } }),
        bgControls.start({
          backgroundColor: 'rgba(0,0,0,0)',
          transition: { duration: 0.35, ease: 'easeOut' },
        }),
      ]);
    };

    const onEnter = () => void enter();
    const onLeave = () => void leave();

    trigger.addEventListener('mouseenter', onEnter);
    trigger.addEventListener('mouseleave', onLeave);
    return () => {
      trigger.removeEventListener('mouseenter', onEnter);
      trigger.removeEventListener('mouseleave', onLeave);
    };
  }, [bgControls, colorControls, iconControls, prefersReduced]);

  return (
    <motion.div ref={containerRef} className={containerClass} {...rest} animate={bgControls}>
      <motion.div
        className="icon-font-rounded diagonal-button-icon"
        aria-hidden
        initial={{ x: 0, y: 0 }}
        animate={iconControls}
        style={{ display: 'grid', placeItems: 'center' }}
      >
        <motion.span
          animate={colorControls}
          initial={{ color: 'var(--core--colors--neutral--100)' }}
        >
          {'\uE810'}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

import { motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';
import { useInView } from 'react-intersection-observer';

export interface RevealProps {
  className?: string;
  // Inline style passthrough on the rendered wrapper (motion.div in normal mode,
  // plain div in `prefers-reduced-motion`). Used by Hero.tsx to apply
  // `gridColumn: '1 / -1'` so a Reveal-wrapped child can span the full width
  // of the parent CSS grid (`.hero-v1-grid` is `grid-template-columns: 1fr auto`)
  // — without this, the wrapper itself stays in column 1 and any inner
  // `gridColumn` style is moot because the inner element is no longer the grid
  // item. Mirrors the existing `className` prop; no impact on call sites that
  // omit it.
  style?: React.CSSProperties;
  children: React.ReactNode;
  distance?: number; // px
  duration?: number; // seconds
  delay?: number; // seconds
  once?: boolean;
  amount?: number; // 0..1 intersection
}

export default function Reveal({
  className,
  style,
  children,
  distance = 40,
  duration = 0.6,
  delay = 0,
  once = true,
  amount = 0.2,
}: RevealProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({
    threshold: amount,
    triggerOnce: once,
    fallbackInView: true,
  });

  if (prefersReduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: distance }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
      transition={{ duration, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

export interface RevealStaggerProps {
  children: React.ReactNode;
  interval?: number; // seconds between children
  startDelay?: number; // seconds
  distance?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
}

export function RevealStagger({
  children,
  interval = 0.06,
  startDelay = 0,
  distance,
  duration,
  once,
  amount,
}: RevealStaggerProps) {
  const items = React.Children.toArray(children);
  return (
    <>
      {items.map((child, i) => (
        <Reveal
          key={i}
          delay={startDelay + i * interval}
          distance={distance}
          duration={duration}
          once={once}
          amount={amount}
        >
          {child as React.ReactNode}
        </Reveal>
      ))}
    </>
  );
}

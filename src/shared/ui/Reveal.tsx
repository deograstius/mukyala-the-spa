import { motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';

export interface RevealProps {
  className?: string;
  children: React.ReactNode;
  distance?: number; // px
  duration?: number; // seconds
  delay?: number; // seconds
  once?: boolean;
  amount?: number; // 0..1 intersection
}

export default function Reveal({
  className,
  children,
  distance = 40,
  duration = 0.6,
  delay = 0,
  once = true,
  amount = 0.2,
}: RevealProps) {
  const prefersReduced = useReducedMotion();
  const hasIntersectionObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window;

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  if (hasIntersectionObserver) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y: distance }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once, amount }}
        transition={{ duration, ease: 'easeOut', delay }}
      >
        {children}
      </motion.div>
    );
  }

  // Fallback for non-browser/test environments: render without viewport observers
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0 }}
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

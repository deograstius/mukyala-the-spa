import { useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { emitTelemetry, initFirstTouchAttribution, installCtaClickTracking } from './telemetry';

type ExitReason = 'navigate' | 'pagehide' | 'hidden';

function usePathname(): string {
  return useRouterState({
    select: (s) => s.location.pathname,
  });
}

export default function TelemetryRoot() {
  const pathname = usePathname();
  const currentPathRef = useRef<string | null>(null);
  const pageStartMsRef = useRef<number>(0);
  const exitEmittedRef = useRef<boolean>(false);

  const emitExitIfNeeded = (reason: ExitReason, toPath?: string) => {
    const fromPath = currentPathRef.current;
    if (!fromPath) return;
    if (exitEmittedRef.current) return;
    exitEmittedRef.current = true;

    const now = performance.now();
    const durationMs = Math.max(0, Math.round(now - pageStartMsRef.current));
    emitTelemetry({
      event: 'page_exit',
      route: fromPath,
      path: fromPath,
      method: 'GET',
      props: {
        durationMs,
        reason,
        ...(toPath ? { toPath } : {}),
      },
    });
  };

  useEffect(() => {
    initFirstTouchAttribution();
    installCtaClickTracking();
  }, []);

  useEffect(() => {
    const onPageHide = () => emitExitIfNeeded('pagehide');
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') emitExitIfNeeded('hidden');
    };
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const now = performance.now();
    const prevPath = currentPathRef.current;

    if (!prevPath) {
      currentPathRef.current = pathname;
      pageStartMsRef.current = now;
      exitEmittedRef.current = false;
      emitTelemetry({
        event: 'page_view',
        route: pathname,
        path: pathname,
        method: 'GET',
      });
      return;
    }

    if (prevPath === pathname) return;

    emitExitIfNeeded('navigate', pathname);

    currentPathRef.current = pathname;
    pageStartMsRef.current = now;
    exitEmittedRef.current = false;
    emitTelemetry({
      event: 'page_view',
      route: pathname,
      path: pathname,
      method: 'GET',
    });
  }, [pathname]);

  return null;
}

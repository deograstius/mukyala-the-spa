import { emitTelemetry } from '@app/telemetry';

// One customer-facing catalog fallback (spec decision #27): whenever a
// browsing surface has no products to render — the catalog is genuinely
// empty OR the API is unreachable — customers see this single line. The two
// causes stay distinguishable internally: the down-case logs and emits
// telemetry via reportCatalogUnavailable, never silent.
export const SOLD_OUT_MESSAGE = 'All sold out! More products coming soon!';

export function reportCatalogUnavailable(surface: 'home' | 'shop', error: unknown): void {
  console.error(
    `[catalog] products unavailable on ${surface}; showing the sold-out fallback`,
    error,
  );
  emitTelemetry({ event: 'catalog_unavailable', props: { surface } });
}

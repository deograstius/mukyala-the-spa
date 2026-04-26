import { useEffect, useState } from 'react';

/**
 * Dev-only A/B background palette switcher.
 *
 * Renders a small floating panel pinned to the bottom-right corner that lets
 * the operator preview candidate page-shell background colors live without
 * editing CSS. Overrides the `--core--colors--neutral--100` CSS variable on
 * <html> (which `body` and other rules consume), so candidate-section
 * backgrounds (hero overlay, etc.) that use other tokens are unaffected.
 *
 * Persists the selection in localStorage so it survives reloads. The default
 * production state is unchanged: when the user picks "Default", we remove
 * the inline override entirely.
 *
 * Excluded from production builds via the `import.meta.env.DEV` guard at the
 * mount site (Vite tree-shakes the import).
 */

type PaletteId = 'default' | 'soft-ivory' | 'cream-linen' | 'apple-gray';

type Candidate = {
  id: PaletteId;
  label: string;
  value: string | null; // null === restore default
};

const CANDIDATES: Candidate[] = [
  { id: 'default', label: 'Default', value: null },
  { id: 'soft-ivory', label: 'Soft Ivory', value: 'rgba(254, 251, 246, 1)' },
  { id: 'cream-linen', label: 'Cream Linen', value: 'rgba(252, 247, 238, 1)' },
  { id: 'apple-gray', label: 'Apple Store Gray', value: 'rgba(243, 243, 246, 1)' },
];

const STORAGE_KEY = 'mk:dev:palette';
const CSS_VAR = '--core--colors--neutral--100';

const applyPalette = (id: PaletteId): void => {
  const root = document.documentElement;
  const candidate = CANDIDATES.find((c) => c.id === id);
  if (!candidate || candidate.value === null) {
    root.style.removeProperty(CSS_VAR);
    return;
  }
  root.style.setProperty(CSS_VAR, candidate.value);
};

export function PaletteSwitcher(): JSX.Element {
  const [active, setActive] = useState<PaletteId>('default');

  useEffect(() => {
    let stored: PaletteId = 'default';
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw && CANDIDATES.some((c) => c.id === raw)) {
        stored = raw as PaletteId;
      }
    } catch {
      // ignore (private mode etc.)
    }
    setActive(stored);
    applyPalette(stored);
  }, []);

  const pick = (id: PaletteId): void => {
    setActive(id);
    applyPalette(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="region"
      aria-label="Dev palette switcher"
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        zIndex: 2147483647,
        background: 'rgba(20, 20, 24, 0.92)',
        color: '#fff',
        padding: '10px 12px',
        borderRadius: 10,
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        font: '12px/1.3 system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        maxWidth: 220,
      }}
    >
      <div style={{ opacity: 0.7, fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        Palette (dev)
      </div>
      {CANDIDATES.map((c) => {
        const isActive = c.id === active;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => pick(c.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 6,
              border: isActive ? '1px solid #fff' : '1px solid rgba(255,255,255,0.18)',
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              font: 'inherit',
              textAlign: 'left',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background:
                  c.value ?? 'repeating-linear-gradient(45deg,#888,#888 3px,#444 3px,#444 6px)',
                border: '1px solid rgba(255,255,255,0.35)',
                flex: '0 0 auto',
              }}
            />
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default PaletteSwitcher;

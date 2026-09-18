import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../auth';
import { mainWebsiteUrl } from '../config';
import {
  adjustRetailStock,
  fetchRetailCategories,
  fetchRetailProducts,
  isAuthError,
  patchRetailProduct,
  type RetailCategory,
  type RetailProduct,
} from '../retail/retailApi';
import '../scan-flow.css';
import { inputStyle, labelStyle } from '../styles';

/**
 * `/products` — the management surface (spec §6; re-laid out by #31, approved
 * from the ASCII mockup). The grow rule: an element alone on its line
 * stretches the full card width; elements sharing a line split it 50/50.
 * Fields save themselves (blur/change); quantity is the row's ONE deliberate
 * action and commits only on Apply. The action strip (Apply · View in app)
 * closes the controls; the barcode/Added/Edited meta line closes the row.
 */

// #19/#29: description boxes grow to fit their text — no inner scrollbar.
// Runs as the ref callback (mount/remount — rows re-key on the stored value)
// and again on every keystroke via onInput.
function autoSize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

// Scanned-in / last-edited dates (#20, #31); rows without one show nothing.
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Two elements sharing a horizontal axis split it equally and fill it (#31).
const splitRowStyle: React.CSSProperties = { display: 'flex', gap: 12 };
const splitCellStyle: React.CSSProperties = { flex: 1, minWidth: 0 };

export default function ProductsPage() {
  const { onAuthExpired } = useAdminAuth();
  const [products, setProducts] = useState<RetailProduct[] | null>(null);
  const [categories, setCategories] = useState<RetailCategory[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const [prods, cats] = await Promise.all([
        fetchRetailProducts(),
        fetchRetailCategories().catch(() => null),
      ]);
      setProducts(prods);
      if (cats) setCategories(cats);
    } catch (err) {
      if (isAuthError(err)) {
        onAuthExpired();
        return;
      }
      setLoadError('Could not load products. Try again.');
    }
  }, [onAuthExpired]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <Section className="admin-products">
      <Container>
        <div className="inner-container _580px center">
          <div className="card checkout-block" style={{ padding: '1.25rem' }}>
            <h1 className="display-7" style={{ margin: 0 }}>
              Products
            </h1>
            {loadError ? (
              <p role="alert" className="paragraph-small mg-top-12px" style={{ color: '#b91c1c' }}>
                {loadError}
              </p>
            ) : null}
            {products === null && !loadError ? (
              <p className="paragraph-small mg-top-12px">Loading…</p>
            ) : null}
            {products?.length === 0 ? (
              <p className="paragraph-small mg-top-12px">
                No products yet — scan the first one in on the Scan page.
              </p>
            ) : null}
            {groupProducts(products ?? [], categories).map((group) => (
              <div key={group.key}>
                {group.heading ? (
                  <h2 className="paragraph-large" style={{ margin: '24px 0 0', fontWeight: 600 }}>
                    {group.heading}
                  </h2>
                ) : null}
                <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0 }}>
                  {group.items.map((p) => (
                    <ProductRow
                      key={p.slug}
                      product={p}
                      categories={categories}
                      onChanged={() => void reload()}
                      onAuthExpired={onAuthExpired}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

function groupProducts(products: RetailProduct[], categories: RetailCategory[]) {
  const groups: Array<{ key: string; heading: string | null; items: RetailProduct[] }> = [];
  const hasCategorized = products.some((p) => p.categoryId);
  for (const cat of categories) {
    const items = products.filter((p) => p.categoryId === cat.id);
    if (items.length > 0) groups.push({ key: cat.id, heading: cat.title, items });
  }
  const rest = products.filter(
    (p) => !p.categoryId || !categories.some((c) => c.id === p.categoryId),
  );
  if (rest.length > 0) {
    groups.push({
      key: 'uncategorized',
      heading: hasCategorized ? 'Uncategorized' : null,
      items: rest,
    });
  }
  return groups;
}

type Busy = 'save' | 'shop' | 'homepage' | 'category' | 'stock' | null;

function ProductRow({
  product,
  categories,
  onChanged,
  onAuthExpired,
}: {
  product: RetailProduct;
  categories: RetailCategory[];
  onChanged: () => void;
  onAuthExpired: () => void;
}) {
  // Only Available is editable (#29): in-cart units belong to the deciding
  // customer. null = inventory unreachable → the quantity control disables.
  const available = product.stock ? product.stock.available : null;
  const inCart = product.stock ? product.stock.reserved : 0;

  const [qty, setQty] = useState(available === null ? '' : String(available));
  const [busy, setBusy] = useState<Busy>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  // Re-sync the quantity after any reload that changed Available (including
  // our own Apply). An untouched reload leaves in-progress typing alone.
  useEffect(() => {
    setQty(available === null ? '' : String(available));
  }, [available]);

  async function guard<T>(kind: Exclude<Busy, null>, fn: () => Promise<T>) {
    setRowError(null);
    setBusy(kind);
    try {
      await fn();
      onChanged();
    } catch (err) {
      if (isAuthError(err)) {
        onAuthExpired();
        return;
      }
      setRowError(err instanceof Error && err.message ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  // Inline fields save on blur (#29). Unchanged values are a no-op; invalid
  // input resets to the stored value with a row error.
  function saveTitle(e: React.FocusEvent<HTMLInputElement>) {
    const next = e.target.value.trim();
    if (next === product.title) return;
    if (next.length < 2) {
      setRowError('Name needs at least 2 characters.');
      e.target.value = product.title;
      return;
    }
    void guard('save', () => patchRetailProduct(product.slug, { title: next }));
  }

  function savePrice(e: React.FocusEvent<HTMLInputElement>) {
    const cents = Math.round(Number.parseFloat(e.target.value) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      setRowError('Enter a price like 45 or 45.50.');
      e.target.value = (product.priceCents / 100).toFixed(2);
      return;
    }
    if (cents === product.priceCents) return;
    void guard('save', () => patchRetailProduct(product.slug, { priceCents: cents }));
  }

  function saveDescription(e: React.FocusEvent<HTMLTextAreaElement>) {
    const next = e.target.value.trim();
    if (next === (product.description ?? '')) return;
    void guard('save', () => patchRetailProduct(product.slug, { description: next || null }));
  }

  const qtyValid = /^\d+$/.test(qty);
  const qtyChanged = available !== null && qtyValid && Number(qty) !== available;
  const id = (field: string) => `admin-${field}-${product.slug}`;

  // The row's meta line: barcode · Added · Edited (#31).
  const meta = [
    product.barcode ? `‖ ${product.barcode}` : null,
    product.createdAt ? `Added ${shortDate(product.createdAt)}` : null,
    product.updatedAt ? `Edited ${shortDate(product.updatedAt)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li style={{ padding: '16px 0', borderBottom: '1px solid #eee' }}>
      <label htmlFor={id('name')} style={labelStyle}>
        Name
      </label>
      <input
        id={id('name')}
        key={`title-${product.title}`}
        defaultValue={product.title}
        onBlur={saveTitle}
        style={{ ...inputStyle, fontWeight: 600 }}
      />
      <div className="mg-top-12px" style={splitRowStyle}>
        <div style={splitCellStyle}>
          <label htmlFor={id('price')} style={labelStyle}>
            Price (USD)
          </label>
          <input
            id={id('price')}
            key={`price-${product.priceCents}`}
            style={inputStyle}
            inputMode="decimal"
            defaultValue={(product.priceCents / 100).toFixed(2)}
            onBlur={savePrice}
          />
        </div>
        <div style={splitCellStyle}>
          <label htmlFor={id('qty')} style={labelStyle}>
            Quantity
          </label>
          <input
            id={id('qty')}
            style={inputStyle}
            inputMode="numeric"
            disabled={available === null}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          {inCart > 0 ? (
            <p className="paragraph-small" style={{ margin: '4px 0 0', opacity: 0.7 }}>
              In cart: {inCart}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mg-top-12px">
        <label htmlFor={id('category')} style={labelStyle}>
          Category
        </label>
        <select
          id={id('category')}
          style={inputStyle}
          disabled={busy !== null}
          value={product.categoryId ?? ''}
          onChange={(e) =>
            guard('category', () =>
              patchRetailProduct(product.slug, { categoryId: e.target.value || null }),
            )
          }
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <label
        className="mg-top-12px"
        style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}
        htmlFor={id('shop')}
      >
        <input
          id={id('shop')}
          type="checkbox"
          checked={product.active}
          disabled={busy !== null}
          onChange={(e) =>
            guard('shop', () => patchRetailProduct(product.slug, { active: e.target.checked }))
          }
        />
        Show in shop
      </label>
      <label
        className="mg-top-8px"
        style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}
        htmlFor={id('home')}
      >
        <input
          id={id('home')}
          type="checkbox"
          checked={Boolean(product.homeFeatured)}
          disabled={busy !== null}
          onChange={(e) =>
            guard('homepage', () =>
              patchRetailProduct(product.slug, { homeFeatured: e.target.checked }),
            )
          }
        />
        Feature on homepage
      </label>
      <div className="mg-top-12px">
        <label htmlFor={id('desc')} style={labelStyle}>
          Description
        </label>
        <textarea
          id={id('desc')}
          key={`desc-${product.description ?? ''}`}
          ref={autoSize}
          style={{ ...inputStyle, minHeight: 44, resize: 'none', overflow: 'hidden' }}
          rows={1}
          placeholder="Description"
          defaultValue={product.description ?? ''}
          onInput={(e) => autoSize(e.currentTarget)}
          onBlur={saveDescription}
        />
      </div>
      <div className="mg-top-12px" style={splitRowStyle}>
        <Button
          style={splitCellStyle}
          disabled={busy !== null || !product.sku || !qtyChanged}
          data-cta-id={`admin-apply-stock-${product.slug}`}
          onClick={() =>
            guard('stock', () =>
              adjustRetailStock(product.sku!, Number(qty) - (available ?? 0), 'recount'),
            )
          }
        >
          {busy === 'stock' ? 'Applying…' : 'Apply'}
        </Button>
        <a
          href={`${mainWebsiteUrl()}/shop/${product.slug}`}
          className="button-primary w-inline-block"
          style={splitCellStyle}
          target="_blank"
          rel="noopener noreferrer"
          data-cta-id={`admin-view-${product.slug}`}
        >
          View in app
        </a>
      </div>
      {meta ? (
        <p className="paragraph-small mg-top-12px" style={{ margin: '12px 0 0', opacity: 0.7 }}>
          {meta}
        </p>
      ) : null}
      {rowError ? (
        <p role="alert" className="paragraph-small mg-top-8px" style={{ color: '#b91c1c' }}>
          {rowError}
        </p>
      ) : null}
    </li>
  );
}

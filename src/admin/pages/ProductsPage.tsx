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
import { inputStyle } from '../styles';

/**
 * `/products` — the management surface (spec §6, simplified by #29): every
 * field sits inline and saves itself on blur; the two toggles (shop,
 * homepage) apply on tap; stock is ONE quantity — type the new Available and
 * tap Apply. No Edit/Adjust ceremonies. Creation lives on `/scan` only.
 */

// Scanned-in date (decision #20); rows without one (pre-#20 API) show nothing.
function addedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
    <Section>
      <Container>
        <div className="inner-container _580px center">
          <div className="card checkout-block" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className="display-7" style={{ margin: 0 }}>
                Products
              </h1>
              <Button variant="link" onClick={() => void reload()} data-cta-id="admin-refresh">
                Refresh
              </Button>
            </div>
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
                  <h2
                    className="paragraph-small"
                    style={{
                      margin: '20px 0 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      opacity: 0.7,
                    }}
                  >
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

  return (
    <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flexGrow: 1 }}>
          <input
            aria-label={`Name for ${product.title}`}
            key={`title-${product.title}`}
            defaultValue={product.title}
            onBlur={saveTitle}
            style={{ ...inputStyle, fontWeight: 600 }}
          />
          <div className="paragraph-small mg-top-8px">
            {product.sku || 'no SKU'}
            {product.barcode ? ` · ‖ ${product.barcode}` : ''}
            {product.active ? '' : ' · hidden from shop'}
            {product.createdAt ? ` · Added ${addedDate(product.createdAt)}` : ''}
          </div>
          <div className="paragraph-small">
            {product.stock
              ? `Available ${available}${inCart > 0 ? ` · In cart ${inCart}` : ''}`
              : 'Stock: —'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <a
            href={`${mainWebsiteUrl()}/shop/${product.slug}`}
            className="link"
            target="_blank"
            rel="noopener noreferrer"
            data-cta-id={`admin-view-${product.slug}`}
          >
            View in app
          </a>
        </div>
      </div>
      <div
        className="mg-top-8px"
        style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span className="paragraph-small" aria-hidden="true">
            $
          </span>
          <input
            aria-label={`Price for ${product.title}`}
            key={`price-${product.priceCents}`}
            style={{ ...inputStyle, width: 84, padding: '8px 10px' }}
            inputMode="decimal"
            defaultValue={(product.priceCents / 100).toFixed(2)}
            onBlur={savePrice}
          />
        </span>
        <input
          aria-label={`Quantity for ${product.title}`}
          style={{ ...inputStyle, width: 90, padding: '8px 10px' }}
          inputMode="numeric"
          disabled={available === null}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <Button
          variant="white"
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
        <select
          aria-label={`Category for ${product.title}`}
          style={{ ...inputStyle, width: 'auto', padding: '8px 10px' }}
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
        <Button
          variant="link"
          disabled={busy !== null}
          data-cta-id={`admin-toggle-${product.slug}`}
          onClick={() =>
            guard('shop', () => patchRetailProduct(product.slug, { active: !product.active }))
          }
        >
          {busy === 'shop' ? 'Saving…' : product.active ? 'Hide from shop' : 'Show in shop'}
        </Button>
        <Button
          variant="link"
          disabled={busy !== null}
          data-cta-id={`admin-feature-${product.slug}`}
          onClick={() =>
            guard('homepage', () =>
              patchRetailProduct(product.slug, { homeFeatured: !product.homeFeatured }),
            )
          }
        >
          {busy === 'homepage'
            ? 'Saving…'
            : product.homeFeatured
              ? 'Hide from homepage'
              : 'Feature on homepage'}
        </Button>
      </div>
      <textarea
        aria-label={`Description for ${product.title}`}
        key={`desc-${product.description ?? ''}`}
        className="mg-top-8px"
        style={{ ...inputStyle, minHeight: 44, resize: 'vertical' }}
        rows={1}
        placeholder="Description"
        defaultValue={product.description ?? ''}
        onBlur={saveDescription}
      />
      {rowError ? (
        <p role="alert" className="paragraph-small mg-top-8px" style={{ color: '#b91c1c' }}>
          {rowError}
        </p>
      ) : null}
    </li>
  );
}

import {
  adjustRetailStock,
  fetchRetailCategories,
  fetchRetailProducts,
  isAuthError,
  patchRetailProduct,
  receiveRetailStock,
  type AdjustReason,
  type RetailCategory,
  type RetailProduct,
} from '@features/retail/retailApi';
import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { formatCurrency } from '@utils/currency';
import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../auth';
import { mainWebsiteUrl } from '../config';
import { inputStyle, labelStyle } from '../styles';

/**
 * `/products` — the management surface (spec §6): receive, edit
 * (title/price/description), adjust stock, assign category, hide/show — the
 * POC's per-row feature set re-homed on its own page. Creation lives on
 * `/scan` only (barcode-first; manual add is gone).
 */
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
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState<'receive' | 'toggle' | 'category' | 'edit' | 'adjust' | null>(
    null,
  );
  const [rowError, setRowError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(product.title);
  const [editPrice, setEditPrice] = useState((product.priceCents / 100).toFixed(2));
  const [editDescription, setEditDescription] = useState(product.description ?? '');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustReason, setAdjustReason] = useState<AdjustReason>('recount');

  async function guard<T>(
    kind: 'receive' | 'toggle' | 'category' | 'edit' | 'adjust',
    fn: () => Promise<T>,
  ) {
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

  return (
    <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="paragraph-large" style={{ fontWeight: 600 }}>
            {product.title}
          </div>
          <div className="paragraph-small">
            {formatCurrency(product.priceCents)} · {product.sku || 'no SKU'}
            {product.barcode ? ` · ‖ ${product.barcode}` : ''}
            {product.active ? '' : ' · hidden from shop'}
          </div>
          <div className="paragraph-small">
            {product.stock
              ? `In stock: ${product.stock.available} available (${product.stock.onHand} on hand)`
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
            View
          </a>
        </div>
      </div>
      <div
        className="mg-top-8px"
        style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <input
          aria-label={`Receive quantity for ${product.title}`}
          style={{ ...inputStyle, width: 90, padding: '8px 10px' }}
          inputMode="numeric"
          placeholder="Qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <Button
          variant="white"
          disabled={busy !== null || !product.sku || !/^\d+$/.test(qty) || Number(qty) < 1}
          data-cta-id={`admin-receive-${product.slug}`}
          onClick={() =>
            guard('receive', async () => {
              await receiveRetailStock(product.sku!, Number(qty));
              setQty('');
            })
          }
        >
          {busy === 'receive' ? 'Receiving…' : 'Receive'}
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
            guard('toggle', () => patchRetailProduct(product.slug, { active: !product.active }))
          }
        >
          {busy === 'toggle' ? 'Saving…' : product.active ? 'Hide from shop' : 'Show in shop'}
        </Button>
        <Button
          variant="link"
          disabled={busy !== null}
          data-cta-id={`admin-edit-${product.slug}`}
          onClick={() => {
            setEditTitle(product.title);
            setEditPrice((product.priceCents / 100).toFixed(2));
            setEditDescription(product.description ?? '');
            setEditing((prev) => !prev);
          }}
        >
          {editing ? 'Close edit' : 'Edit'}
        </Button>
        <Button
          variant="link"
          disabled={busy !== null || !product.sku}
          data-cta-id={`admin-adjust-${product.slug}`}
          onClick={() => {
            setAdjustDelta('');
            setAdjustReason('recount');
            setAdjusting((prev) => !prev);
          }}
        >
          {adjusting ? 'Close adjust' : 'Adjust stock'}
        </Button>
      </div>
      {adjusting ? (
        <div
          className="mg-top-12px"
          style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <input
            aria-label={`Stock correction for ${product.title} (use a minus sign to remove)`}
            style={{ ...inputStyle, width: 110, padding: '8px 10px' }}
            inputMode="numeric"
            placeholder="e.g. -2 or 3"
            value={adjustDelta}
            onChange={(e) => setAdjustDelta(e.target.value)}
          />
          <select
            aria-label={`Adjustment reason for ${product.title}`}
            style={{ ...inputStyle, width: 'auto', padding: '8px 10px' }}
            disabled={busy !== null}
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value as AdjustReason)}
          >
            <option value="recount">Recount</option>
            <option value="damaged">Damaged</option>
            <option value="other">Other</option>
          </select>
          <Button
            variant="white"
            disabled={
              busy !== null ||
              !product.sku ||
              !/^-?\d+$/.test(adjustDelta.trim()) ||
              Number(adjustDelta) === 0
            }
            data-cta-id={`admin-apply-adjust-${product.slug}`}
            onClick={() =>
              guard('adjust', async () => {
                await adjustRetailStock(product.sku!, Number(adjustDelta.trim()), adjustReason);
                setAdjustDelta('');
                setAdjusting(false);
              })
            }
          >
            {busy === 'adjust' ? 'Adjusting…' : 'Apply correction'}
          </Button>
          <span className="paragraph-small" style={{ opacity: 0.7 }}>
            Positive adds, negative removes. On hand can’t go below zero.
          </span>
        </div>
      ) : null}
      {editing ? (
        <div className="mg-top-12px" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor={`admin-edit-title-${product.slug}`} style={labelStyle}>
            Name
          </label>
          <input
            id={`admin-edit-title-${product.slug}`}
            style={inputStyle}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <label htmlFor={`admin-edit-price-${product.slug}`} style={labelStyle}>
            Price (USD)
          </label>
          <input
            id={`admin-edit-price-${product.slug}`}
            style={{ ...inputStyle, width: 140 }}
            inputMode="decimal"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
          />
          <label htmlFor={`admin-edit-description-${product.slug}`} style={labelStyle}>
            Description
          </label>
          <textarea
            id={`admin-edit-description-${product.slug}`}
            style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="white"
              disabled={busy !== null || editTitle.trim().length < 2}
              data-cta-id={`admin-save-edit-${product.slug}`}
              onClick={() => {
                const priceCents = Math.round(Number.parseFloat(editPrice) * 100);
                if (!Number.isFinite(priceCents) || priceCents < 0) {
                  setRowError('Enter a price like 45 or 45.50.');
                  return;
                }
                void guard('edit', async () => {
                  await patchRetailProduct(product.slug, {
                    title: editTitle.trim(),
                    priceCents,
                    description: editDescription.trim() || null,
                  });
                  setEditing(false);
                });
              }}
            >
              {busy === 'edit' ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      ) : null}
      {rowError ? (
        <p role="alert" className="paragraph-small mg-top-8px" style={{ color: '#b91c1c' }}>
          {rowError}
        </p>
      ) : null}
    </li>
  );
}

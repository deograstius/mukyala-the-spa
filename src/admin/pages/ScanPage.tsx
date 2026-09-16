import {
  normalizeImportedDescription,
  normalizeImportedTitle,
} from '@features/retail/importNormalize';
import {
  createRetailCategory,
  createRetailProduct,
  fetchBarcodeInfo,
  fetchRetailCategories,
  fetchRetailProductByBarcode,
  isAuthError,
  patchRetailProduct,
  receiveRetailStock,
  type BarcodeInfo,
  type RetailCategory,
  type RetailProduct,
} from '@features/retail/retailApi';
import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { formatCurrency } from '@utils/currency';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../auth';
import { mainWebsiteUrl } from '../config';
import { inputStyle, labelStyle } from '../styles';

// Lazy: the scanner drags in the zxing WASM decoder (~1MB); load it only when
// staff actually open the camera.
const BarcodeScanner = lazy(() => import('@features/retail/BarcodeScanner'));

type ScanState =
  | null
  | { mode: 'scanning' }
  | { mode: 'lookup'; barcode: string }
  | { mode: 'found'; product: RetailProduct }
  | { mode: 'unknown'; barcode: string; hint: BarcodeInfo; categoryId?: string };

/**
 * `/scan` — the default surface. Scan (or type) a commercial barcode:
 * known → receive stock into the existing product; unknown → create the
 * product fully in one card (details → quantity ≥1 → visibility) per spec §5.
 */
export default function ScanPage() {
  const { onAuthExpired } = useAdminAuth();
  const [categories, setCategories] = useState<RetailCategory[]>([]);
  const [scan, setScan] = useState<ScanState>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRetailCategories()
      .then((cats) => {
        if (!cancelled) setCategories(cats);
      })
      .catch((err) => {
        if (isAuthError(err)) onAuthExpired();
        // Otherwise: the create form simply starts without category options.
      });
    return () => {
      cancelled = true;
    };
  }, [onAuthExpired]);

  const handleNewCategory = useCallback((cat: RetailCategory) => {
    setCategories((prev) => (prev.some((c) => c.id === cat.id) ? prev : [...prev, cat]));
  }, []);

  const handleDetected = useCallback(
    async (code: string) => {
      setScan({ mode: 'lookup', barcode: code });
      try {
        const product = await fetchRetailProductByBarcode(code);
        if (product) {
          setScan({ mode: 'found', product });
          return;
        }
        const hint = await fetchBarcodeInfo(code);
        // Match an EXISTING shop category from the database's category path —
        // never auto-create categories on scan (junk-category regression).
        let categoryId: string | undefined;
        if (hint.category) {
          const path = hint.category.toLowerCase();
          categoryId = categories.find((c) => path.includes(c.title.toLowerCase()))?.id;
        }
        setScan({ mode: 'unknown', barcode: code, hint, categoryId });
      } catch (err) {
        if (isAuthError(err)) {
          onAuthExpired();
          return;
        }
        setScan({ mode: 'unknown', barcode: code, hint: {} });
      }
    },
    [onAuthExpired, categories],
  );

  const closeScan = useCallback(() => setScan(null), []);
  const scanAgain = useCallback(() => setScan({ mode: 'scanning' }), []);

  return (
    <Section>
      <Container>
        <div className="inner-container _580px center">
          {scan === null ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {notice ? (
                <div className="card" role="status" style={{ padding: '0.75rem 1rem' }}>
                  <p className="paragraph-small" style={{ margin: 0 }}>
                    {notice}{' '}
                    <a
                      href={`${mainWebsiteUrl()}/shop`}
                      className="link"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cta-id="admin-view-shop"
                    >
                      View shop
                    </a>
                  </p>
                </div>
              ) : null}
              <div className="text-center">
                <h1 className="display-7" style={{ marginTop: 0 }}>
                  Scan
                </h1>
                <p className="paragraph-small mg-top-8px">
                  New products and restocks both start with the barcode.
                </p>
                <div className="mg-top-16px">
                  <Button onClick={scanAgain} data-cta-id="admin-scan">
                    Scan barcode
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {scan.mode === 'scanning' ? (
                <Suspense
                  fallback={
                    <div className="card checkout-block" style={{ padding: '1.25rem' }}>
                      <p className="paragraph-small" style={{ margin: 0 }}>
                        Opening the scanner…
                      </p>
                    </div>
                  }
                >
                  <BarcodeScanner onDetected={handleDetected} onCancel={closeScan} />
                </Suspense>
              ) : null}
              {scan.mode === 'lookup' ? (
                <div className="card checkout-block" style={{ padding: '1.25rem' }}>
                  <p className="paragraph-small" style={{ margin: 0 }}>
                    Looking up {scan.barcode}…
                  </p>
                </div>
              ) : null}
              {scan.mode === 'found' ? (
                <ReceiveCard
                  product={scan.product}
                  onDone={(msg) => {
                    if (msg) setNotice(msg);
                    closeScan();
                  }}
                  onScanAgain={scanAgain}
                  onAuthExpired={onAuthExpired}
                />
              ) : null}
              {scan.mode === 'unknown' ? (
                <CreateProductCard
                  barcode={scan.barcode}
                  hint={scan.hint}
                  resolvedCategoryId={scan.categoryId}
                  categories={categories}
                  onNewCategory={handleNewCategory}
                  onDone={(msg) => {
                    if (msg) setNotice(msg);
                    closeScan();
                  }}
                  onScanAgain={scanAgain}
                  onCancel={closeScan}
                  onAuthExpired={onAuthExpired}
                />
              ) : null}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

function ReceiveCard({
  product,
  onDone,
  onScanAgain,
  onAuthExpired,
}: {
  product: RetailProduct;
  onDone: (notice: string | null) => void;
  onScanAgain: () => void;
  onAuthExpired: () => void;
}) {
  const [qty, setQty] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [received, setReceived] = useState<number | null>(null);

  const qtyNum = /^\d+$/.test(qty) ? Number(qty) : 0;

  return (
    <div className="card checkout-block" style={{ padding: '1.25rem' }}>
      <h2 className="display-7" style={{ marginTop: 0 }}>
        {product.title}
      </h2>
      <p className="paragraph-small mg-top-8px" style={{ margin: 0 }}>
        {formatCurrency(product.priceCents)} · {product.sku || 'no SKU'}
        {product.category ? ` · ${product.category.title}` : ''}
      </p>
      <p className="paragraph-small mg-top-8px">
        {product.stock
          ? `In stock: ${product.stock.available} available (${product.stock.onHand} on hand)`
          : 'Stock: —'}
      </p>
      {received !== null ? (
        <p role="status" className="paragraph-small mg-top-12px" style={{ fontWeight: 600 }}>
          Received {received} ✓
        </p>
      ) : (
        <div
          className="mg-top-12px"
          style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <input
            aria-label={`Receive quantity for ${product.title}`}
            style={{ ...inputStyle, width: 90 }}
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <Button
            disabled={busy || !product.sku || qtyNum < 1}
            data-cta-id="admin-scan-receive"
            onClick={async () => {
              setError(null);
              setBusy(true);
              try {
                await receiveRetailStock(product.sku!, qtyNum);
                setReceived(qtyNum);
              } catch (err) {
                if (isAuthError(err)) {
                  onAuthExpired();
                  return;
                }
                setError(
                  err instanceof Error && err.message ? err.message : 'Could not receive stock.',
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Receiving…' : 'Receive'}
          </Button>
        </div>
      )}
      {!product.sku ? (
        <p className="paragraph-small mg-top-8px" style={{ color: '#b91c1c' }}>
          This product has no SKU, so stock can’t be received.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="paragraph-small mg-top-8px" style={{ color: '#b91c1c' }}>
          {error}
        </p>
      ) : null}
      <div className="mg-top-16px" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button variant="white" onClick={onScanAgain} data-cta-id="admin-scan-next">
          Scan next
        </Button>
        <Button
          variant="link"
          onClick={() =>
            onDone(received !== null ? `Received ${received} × “${product.title}”.` : null)
          }
          data-cta-id="admin-scan-done"
        >
          Done
        </Button>
      </div>
    </div>
  );
}

/**
 * Everything-in-one-place create (spec §5): barcode + name + price +
 * quantity (≥1) + visibility, all in one card. Submit runs create-hidden →
 * receive-stock → apply-visibility; a mid-sequence failure keeps the card
 * open in a "stock not received yet" state with inline retry, so a product
 * can never be silently stranded (operator decision 2026-09-16).
 */
function CreateProductCard({
  barcode: initialBarcode,
  hint,
  resolvedCategoryId,
  categories,
  onNewCategory,
  onDone,
  onScanAgain,
  onCancel,
  onAuthExpired,
}: {
  barcode: string;
  hint: BarcodeInfo;
  resolvedCategoryId?: string;
  categories: RetailCategory[];
  onNewCategory: (cat: RetailCategory) => void;
  onDone: (notice: string | null) => void;
  onScanAgain: () => void;
  onCancel: () => void;
  onAuthExpired: () => void;
}) {
  const hintTitle = hint.title || hint.brand || '';

  const [barcode, setBarcode] = useState(initialBarcode);
  const [title, setTitle] = useState(hintTitle ? normalizeImportedTitle(hintTitle) : '');
  const [price, setPrice] = useState(
    hint.suggestedPriceCents ? (hint.suggestedPriceCents / 100).toFixed(2) : '',
  );
  const [qty, setQty] = useState('1');
  const [showOnWebsite, setShowOnWebsite] = useState(false);
  const [categoryId, setCategoryId] = useState(resolvedCategoryId ?? '');
  const [description, setDescription] = useState(
    hint.description ? normalizeImportedDescription(hint.description) : '',
  );
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Pipeline markers — retry resumes from the first incomplete step.
  const [created, setCreated] = useState<RetailProduct | null>(null);
  const [receivedQty, setReceivedQty] = useState<number | null>(null);
  const [published, setPublished] = useState(false);
  const [donePanel, setDonePanel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qtyNum = /^\d+$/.test(qty.trim()) ? Number(qty.trim()) : 0;
  const trimmedManualImage = manualImageUrl.trim();
  const manualImageInvalid =
    Boolean(trimmedManualImage) && !/^https:\/\/.+/.test(trimmedManualImage);
  const imageUrl = hint.imageUrl || trimmedManualImage || undefined;

  async function submit() {
    setError(null);
    if (!created) {
      if (barcode.trim().length < 4) {
        setError('The barcode must be at least 4 characters.');
        return;
      }
      const priceCents = Math.round(Number.parseFloat(price) * 100);
      if (!Number.isFinite(priceCents) || priceCents < 0) {
        setError('Enter a price like 45 or 45.50.');
        return;
      }
      if (manualImageInvalid) {
        setError('The image link must start with https://');
        return;
      }
    }
    if (qtyNum < 1) {
      setError('Quantity must be at least 1 — every product goes in with real stock.');
      return;
    }
    setBusy(true);
    try {
      let product = created;
      if (!product) {
        const priceCents = Math.round(Number.parseFloat(price) * 100);
        // Created hidden regardless of the toggle; visibility is applied only
        // after stock lands, so a failure can never leave a visible
        // zero-stock product.
        product = await createRetailProduct({
          title: title.trim(),
          priceCents,
          barcode: barcode.trim(),
          categoryId: categoryId || undefined,
          imageUrl,
          description: description.trim() || undefined,
          active: false,
        });
        setCreated(product);
      }
      if (receivedQty === null) {
        await receiveRetailStock(product.sku!, qtyNum);
        setReceivedQty(qtyNum);
      }
      if (showOnWebsite && !published) {
        await patchRetailProduct(product.slug, { active: true });
        setPublished(true);
      }
      setDonePanel(true);
    } catch (err) {
      if (isAuthError(err)) {
        onAuthExpired();
        return;
      }
      setError(err instanceof Error && err.message ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  if (donePanel && created) {
    return (
      <div className="card checkout-block" style={{ padding: '1.25rem' }}>
        <p role="status" className="paragraph-large" style={{ margin: 0, fontWeight: 600 }}>
          “{created.title}” added — {receivedQty} in stock ✓
        </p>
        <p className="paragraph-small mg-top-8px" style={{ margin: 0 }}>
          {published ? 'Live on the shop.' : 'Hidden — publish it from Products when it’s ready.'}
        </p>
        <div className="mg-top-16px" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="white" onClick={onScanAgain} data-cta-id="admin-create-scan-next">
            Scan next
          </Button>
          <Button
            variant="link"
            onClick={() =>
              onDone(
                published
                  ? `“${created.title}” is live on the shop.`
                  : `“${created.title}” was added — hidden until you publish it.`,
              )
            }
            data-cta-id="admin-create-done"
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {hint.imageUrl ? (
            <img
              src={hint.imageUrl}
              alt=""
              style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8 }}
            />
          ) : null}
          <p className="paragraph-small" style={{ margin: 0 }}>
            New barcode: <strong>{initialBarcode}</strong>
            {hintTitle
              ? ` — looks like “${hintTitle}”`
              : ' — nothing found in the barcode database'}
          </p>
        </div>
      </div>

      <form
        className="card checkout-block"
        style={{ padding: '1.25rem' }}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <h2 className="display-7" style={{ marginTop: 0 }}>
          Create this product
        </h2>
        {created ? (
          <p className="paragraph-small mg-top-8px" style={{ margin: 0, fontWeight: 600 }}>
            Product created — stock not received yet. Retry to finish.
          </p>
        ) : null}
        <div className="mg-top-12px">
          <label htmlFor="admin-new-barcode" style={labelStyle}>
            Barcode
          </label>
          <input
            id="admin-new-barcode"
            style={inputStyle}
            value={barcode}
            inputMode="numeric"
            disabled={Boolean(created)}
            onChange={(e) => setBarcode(e.target.value)}
          />
        </div>
        <div className="mg-top-12px">
          <label htmlFor="admin-new-title" style={labelStyle}>
            Name
          </label>
          <input
            id="admin-new-title"
            style={inputStyle}
            value={title}
            placeholder="e.g. Shea Butter Body Balm"
            disabled={Boolean(created)}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="mg-top-12px">
          <label htmlFor="admin-new-price" style={labelStyle}>
            Price (USD)
          </label>
          <input
            id="admin-new-price"
            style={inputStyle}
            value={price}
            inputMode="decimal"
            placeholder="e.g. 45.00"
            disabled={Boolean(created)}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="mg-top-12px">
          <label htmlFor="admin-new-qty" style={labelStyle}>
            Quantity
          </label>
          <input
            id="admin-new-qty"
            style={{ ...inputStyle, width: 120 }}
            value={qty}
            inputMode="numeric"
            disabled={receivedQty !== null}
            onChange={(e) => setQty(e.target.value)}
          />
          <p className="paragraph-small mg-top-8px" style={{ margin: 0, opacity: 0.7 }}>
            Units in hand right now — at least 1.
          </p>
        </div>
        <div className="mg-top-12px">
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}
            htmlFor="admin-new-visibility"
          >
            <input
              id="admin-new-visibility"
              type="checkbox"
              checked={showOnWebsite}
              disabled={published}
              onChange={(e) => setShowOnWebsite(e.target.checked)}
            />
            Show on website
          </label>
          <p className="paragraph-small mg-top-8px" style={{ margin: 0, opacity: 0.7 }}>
            Leave off to review the name, photo, and description first — you can publish from
            Products.
          </p>
        </div>
        <div className="mg-top-12px">
          <label htmlFor="admin-new-category" style={labelStyle}>
            Category
          </label>
          <select
            id="admin-new-category"
            style={inputStyle}
            value={categoryId}
            disabled={Boolean(created)}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {hint.category ? (
            <p className="paragraph-small mg-top-8px" style={{ margin: 0, opacity: 0.7 }}>
              Database suggests: {hint.category}
            </p>
          ) : null}
          {showNewCategory ? (
            <div className="mg-top-8px" style={{ display: 'flex', gap: 8 }}>
              <input
                aria-label="New category name"
                style={inputStyle}
                value={newCategory}
                placeholder="e.g. Serums"
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <Button
                type="button"
                variant="white"
                disabled={newCategory.trim().length < 2 || busy}
                data-cta-id="admin-create-category"
                onClick={async () => {
                  setError(null);
                  try {
                    const cat = await createRetailCategory(newCategory.trim());
                    onNewCategory(cat);
                    setCategoryId(cat.id);
                    setNewCategory('');
                    setShowNewCategory(false);
                  } catch (err) {
                    if (isAuthError(err)) {
                      onAuthExpired();
                      return;
                    }
                    setError(
                      err instanceof Error && err.message
                        ? err.message
                        : 'Could not create the category.',
                    );
                  }
                }}
              >
                Add
              </Button>
            </div>
          ) : created ? null : (
            <div className="mg-top-8px">
              <Button
                type="button"
                variant="link"
                onClick={() => setShowNewCategory(true)}
                data-cta-id="admin-new-category-toggle"
              >
                + New category
              </Button>
            </div>
          )}
        </div>
        <div className="mg-top-12px">
          <label htmlFor="admin-new-description" style={labelStyle}>
            Description
          </label>
          <textarea
            id="admin-new-description"
            style={{ ...inputStyle, minHeight: 88, resize: 'vertical' }}
            value={description}
            placeholder="Shown on the product page (optional)"
            disabled={Boolean(created)}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {hint.imageUrl ? (
          <p className="paragraph-small mg-top-12px" style={{ margin: 0, opacity: 0.7 }}>
            Photo from the barcode database attached ✓
          </p>
        ) : (
          <div className="mg-top-12px">
            <label htmlFor="admin-new-image" style={labelStyle}>
              Image link (optional)
            </label>
            <input
              id="admin-new-image"
              style={inputStyle}
              value={manualImageUrl}
              inputMode="url"
              placeholder="https://… (product photo)"
              disabled={Boolean(created)}
              onChange={(e) => setManualImageUrl(e.target.value)}
            />
            {manualImageInvalid ? (
              <p className="paragraph-small mg-top-8px" style={{ margin: 0, color: '#b91c1c' }}>
                The image link must start with https://
              </p>
            ) : (
              <p className="paragraph-small mg-top-8px" style={{ margin: 0, opacity: 0.7 }}>
                Without a photo the product shows a placeholder tile in the shop.
              </p>
            )}
          </div>
        )}
        {error ? (
          <p role="alert" className="paragraph-small mg-top-12px" style={{ color: '#b91c1c' }}>
            {error}
          </p>
        ) : null}
        <div className="mg-top-16px" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button
            type="submit"
            disabled={
              busy ||
              (!created && (title.trim().length < 2 || !price || !barcode.trim())) ||
              qtyNum < 1
            }
            data-cta-id="admin-add-product"
          >
            {busy ? 'Working…' : created ? 'Retry' : 'Add product'}
          </Button>
          {created ? null : (
            <Button
              type="button"
              variant="link"
              onClick={onCancel}
              data-cta-id="admin-create-cancel"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

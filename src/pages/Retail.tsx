import { setBaseTitle } from '@app/seo';
import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { formatCurrency } from '@utils/currency';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

// Lazy: the scanner drags in the zxing WASM decoder (~1MB). Customers never
// need it — only staff on /retail who tap "Scan barcode".
const BarcodeScanner = lazy(() => import('../features/retail/BarcodeScanner'));
import {
  normalizeImportedDescription,
  normalizeImportedTitle,
} from '../features/retail/importNormalize';
import {
  adjustRetailStock,
  createRetailCategory,
  createRetailProduct,
  fetchBarcodeInfo,
  fetchRetailCategories,
  fetchRetailProductByBarcode,
  fetchRetailProducts,
  getRetailToken,
  isAuthError,
  patchRetailProduct,
  receiveRetailStock,
  retailLogin,
  setRetailToken,
  type AdjustReason,
  type BarcodeInfo,
  type RetailCategory,
  type RetailProduct,
} from '../features/retail/retailApi';

/**
 * Staff-only retail back-office (POC): log in, scan barcodes (scan → receive
 * for known products, scan → create/attach for unknown ones), add products,
 * receive stock, group products into categories, toggle products on/off the
 * live shop. Unlisted route — not linked from customer-facing navigation.
 */

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid #d5cec4',
  fontSize: 16,
};

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontWeight: 600 };

type ScanState =
  | null
  | { mode: 'scanning' }
  | { mode: 'lookup'; barcode: string }
  | { mode: 'found'; product: RetailProduct }
  | { mode: 'unknown'; barcode: string; hint: BarcodeInfo; categoryId?: string };

export default function Retail() {
  const [token, setToken] = useState<string | null>(() => getRetailToken());

  useEffect(() => {
    setBaseTitle('Retail back-office');
  }, []);

  const handleLogout = useCallback(() => {
    setRetailToken(null);
    setToken(null);
  }, []);

  return (
    <Section>
      <Container>
        <div className="inner-container _580px center">
          <div className="text-center">
            <h1 className="display-9">Mukyala Retail</h1>
            <p className="paragraph-small mg-top-8px">Staff back-office</p>
          </div>
          <div className="mg-top-32px">
            {token ? (
              <Dashboard onAuthExpired={handleLogout} onLogout={handleLogout} />
            ) : (
              <Login onLoggedIn={setToken} />
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

// Remembered locally AFTER a successful sign-in — no staff usernames ship in
// the public bundle.
const LAST_USERNAME_KEY = 'retail:lastUsername:v1';

function readLastUsername(): string {
  try {
    return window.localStorage.getItem(LAST_USERNAME_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveLastUsername(username: string): void {
  try {
    window.localStorage.setItem(LAST_USERNAME_KEY, username);
  } catch {
    // ignore — just retype next visit
  }
}

function Login({ onLoggedIn }: { onLoggedIn: (token: string) => void }) {
  const [username, setUsername] = useState(readLastUsername);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="card checkout-block"
      style={{ padding: '1.25rem' }}
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
          const token = await retailLogin(username.trim(), password);
          saveLastUsername(username.trim());
          onLoggedIn(token);
        } catch (err) {
          setError(
            err instanceof Error && err.message
              ? err.message
              : 'Could not sign in. Please try again.',
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label htmlFor="retail-username" style={labelStyle}>
          Username
        </label>
        <input
          id="retail-username"
          style={inputStyle}
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="mg-top-16px">
        <label htmlFor="retail-password" style={labelStyle}>
          Password
        </label>
        <input
          id="retail-password"
          style={inputStyle}
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? (
        <p role="alert" className="paragraph-small mg-top-12px" style={{ color: '#b91c1c' }}>
          {error}
        </p>
      ) : null}
      <div className="mg-top-16px">
        <Button type="submit" disabled={busy || !password} data-cta-id="retail-login">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>
    </form>
  );
}

function Dashboard({
  onAuthExpired,
  onLogout,
}: {
  onAuthExpired: () => void;
  onLogout: () => void;
}) {
  const [products, setProducts] = useState<RetailProduct[] | null>(null);
  const [categories, setCategories] = useState<RetailCategory[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanState>(null);

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
      setLoadError('Could not load products. Pull to refresh or try again.');
    }
  }, [onAuthExpired]);

  useEffect(() => {
    void reload();
  }, [reload]);

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
        // Match an EXISTING shop category from the database's category path.
        // We deliberately do NOT auto-create categories here — creation only
        // happens on product approval (the old behavior left junk categories
        // behind whenever a scan was canceled).
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

  // While a scan flow is open, show only that flow — keeps the phone screen
  // focused on the two-tap receive loop.
  if (scan) {
    return (
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
              void reload();
              closeScan();
            }}
            onScanAgain={() => {
              void reload();
              scanAgain();
            }}
            onAuthExpired={onAuthExpired}
          />
        ) : null}
        {scan.mode === 'unknown' ? (
          <UnknownBarcodePanel
            barcode={scan.barcode}
            hint={scan.hint}
            resolvedCategoryId={scan.categoryId}
            products={products ?? []}
            categories={categories}
            onNewCategory={handleNewCategory}
            onDone={(msg) => {
              if (msg) setNotice(msg);
              void reload();
              closeScan();
            }}
            onScanAgain={() => {
              void reload();
              scanAgain();
            }}
            onCancel={closeScan}
            onAuthExpired={onAuthExpired}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <Button onClick={scanAgain} data-cta-id="retail-scan">
          Scan barcode
        </Button>
      </div>

      <AddProductForm
        categories={categories}
        onNewCategory={handleNewCategory}
        onCreated={(p) => {
          setNotice(
            p.active
              ? `“${p.title}” is live on the shop.`
              : `“${p.title}” was added — hidden from the shop until you publish it.`,
          );
          void reload();
        }}
        onAuthExpired={onAuthExpired}
      />

      {notice ? (
        <div className="card" role="status" style={{ padding: '0.75rem 1rem' }}>
          <p className="paragraph-small" style={{ margin: 0 }}>
            {notice}{' '}
            <a href="/shop" className="link" data-cta-id="retail-view-shop">
              View shop
            </a>
          </p>
        </div>
      ) : null}

      <div className="card checkout-block" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="display-7" style={{ margin: 0 }}>
            Products
          </h2>
          <Button variant="link" onClick={() => void reload()} data-cta-id="retail-refresh">
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
          <p className="paragraph-small mg-top-12px">No products yet — add the first one above.</p>
        ) : null}
        {groupProducts(products ?? [], categories).map((group) => (
          <div key={group.key}>
            {group.heading ? (
              <h3
                className="paragraph-small"
                style={{
                  margin: '20px 0 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  opacity: 0.7,
                }}
              >
                {group.heading}
              </h3>
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

      <div style={{ textAlign: 'center' }}>
        <Button variant="link" onClick={onLogout} data-cta-id="retail-logout">
          Sign out
        </Button>
      </div>
    </div>
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
            data-cta-id="retail-scan-receive"
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
        <Button variant="white" onClick={onScanAgain} data-cta-id="retail-scan-next">
          Scan next
        </Button>
        <Button
          variant="link"
          onClick={() =>
            onDone(received !== null ? `Received ${received} × “${product.title}”.` : null)
          }
          data-cta-id="retail-scan-done"
        >
          Done
        </Button>
      </div>
    </div>
  );
}

function UnknownBarcodePanel({
  barcode,
  hint,
  resolvedCategoryId,
  products,
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
  products: RetailProduct[];
  categories: RetailCategory[];
  onNewCategory: (cat: RetailCategory) => void;
  onDone: (notice: string | null) => void;
  onScanAgain: () => void;
  onCancel: () => void;
  onAuthExpired: () => void;
}) {
  const [attachSlug, setAttachSlug] = useState('');
  const [attachBusy, setAttachBusy] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const unbarcoded = products.filter((p) => !p.barcode);
  const hintTitle = hint.title || hint.brand || '';

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
            New barcode: <strong>{barcode}</strong>
            {hintTitle
              ? ` — looks like “${hintTitle}”`
              : ' — nothing found in the barcode database'}
          </p>
        </div>
      </div>

      <AddProductForm
        heading="Create this product"
        categories={categories}
        onNewCategory={onNewCategory}
        initialTitle={hintTitle ? normalizeImportedTitle(hintTitle) : ''}
        initialPriceCents={hint.suggestedPriceCents}
        initialCategoryId={resolvedCategoryId}
        initialDescription={
          hint.description ? normalizeImportedDescription(hint.description) : undefined
        }
        barcode={barcode}
        imageUrl={hint.imageUrl}
        categoryHint={hint.category}
        onCreated={(p) =>
          onDone(
            p.active
              ? `“${p.title}” is live on the shop.`
              : `“${p.title}” was added — hidden from the shop until you publish it.`,
          )
        }
        onAuthExpired={onAuthExpired}
      />

      {unbarcoded.length > 0 ? (
        <div className="card checkout-block" style={{ padding: '1.25rem' }}>
          <h2 className="display-7" style={{ marginTop: 0 }}>
            …or attach to an existing product
          </h2>
          <select
            aria-label="Product to attach this barcode to"
            style={{ ...inputStyle, marginTop: 8 }}
            value={attachSlug}
            onChange={(e) => setAttachSlug(e.target.value)}
          >
            <option value="">Choose a product…</option>
            {unbarcoded.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
          {attachError ? (
            <p role="alert" className="paragraph-small mg-top-8px" style={{ color: '#b91c1c' }}>
              {attachError}
            </p>
          ) : null}
          <div className="mg-top-12px">
            <Button
              variant="white"
              disabled={!attachSlug || attachBusy}
              data-cta-id="retail-attach-barcode"
              onClick={async () => {
                setAttachError(null);
                setAttachBusy(true);
                try {
                  await patchRetailProduct(attachSlug, { barcode });
                  const target = unbarcoded.find((p) => p.slug === attachSlug);
                  onDone(`Barcode attached to “${target?.title ?? attachSlug}”.`);
                } catch (err) {
                  if (isAuthError(err)) {
                    onAuthExpired();
                    return;
                  }
                  setAttachError(
                    err instanceof Error && err.message
                      ? err.message
                      : 'Could not attach the barcode.',
                  );
                } finally {
                  setAttachBusy(false);
                }
              }}
            >
              {attachBusy ? 'Attaching…' : 'Attach barcode'}
            </Button>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Button variant="white" onClick={onScanAgain} data-cta-id="retail-unknown-scan-again">
          Scan again
        </Button>
        <Button variant="link" onClick={onCancel} data-cta-id="retail-unknown-cancel">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function AddProductForm({
  categories,
  onNewCategory,
  onCreated,
  onAuthExpired,
  initialTitle,
  initialPriceCents,
  initialCategoryId,
  initialDescription,
  barcode,
  imageUrl,
  categoryHint,
  heading,
}: {
  categories: RetailCategory[];
  onNewCategory: (cat: RetailCategory) => void;
  onCreated: (p: RetailProduct) => void;
  onAuthExpired: () => void;
  initialTitle?: string;
  initialPriceCents?: number;
  initialCategoryId?: string;
  initialDescription?: string;
  barcode?: string;
  imageUrl?: string;
  categoryHint?: string;
  heading?: string;
}) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [price, setPrice] = useState(initialPriceCents ? (initialPriceCents / 100).toFixed(2) : '');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? '');
  const [description, setDescription] = useState(initialDescription ?? '');
  const [manualImageUrl, setManualImageUrl] = useState('');
  // Scanned imports stay HIDDEN until staff explicitly publish — raw feed
  // data must never go customer-live in one tap (NOTES/spa-pages.md M2/B7).
  const [publishNow, setPublishNow] = useState(!barcode);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedManualImage = manualImageUrl.trim();
  const manualImageInvalid =
    Boolean(trimmedManualImage) && !/^https:\/\/.+/.test(trimmedManualImage);

  return (
    <form
      className="card checkout-block"
      style={{ padding: '1.25rem' }}
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const priceCents = Math.round(Number.parseFloat(price) * 100);
        if (!Number.isFinite(priceCents) || priceCents < 0) {
          setError('Enter a price like 45 or 45.50.');
          return;
        }
        if (manualImageInvalid) {
          setError('The image link must start with https://');
          return;
        }
        setBusy(true);
        try {
          const created = await createRetailProduct({
            title: title.trim(),
            priceCents,
            sku: sku.trim() || undefined,
            barcode: barcode || undefined,
            categoryId: categoryId || undefined,
            imageUrl: imageUrl || trimmedManualImage || undefined,
            description: description.trim() || undefined,
            active: publishNow,
          });
          setTitle('');
          setPrice('');
          setSku('');
          setDescription('');
          setManualImageUrl('');
          onCreated(created);
        } catch (err) {
          if (isAuthError(err)) {
            onAuthExpired();
            return;
          }
          setError(
            err instanceof Error && err.message ? err.message : 'Could not add the product.',
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="display-7" style={{ marginTop: 0 }}>
        {heading ?? 'Add a product'}
      </h2>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="mg-top-8px"
          style={{ width: 96, height: 96, objectFit: 'contain', borderRadius: 8 }}
        />
      ) : null}
      {barcode ? (
        <p className="paragraph-small mg-top-8px" style={{ margin: 0 }}>
          Barcode: {barcode}
          {imageUrl ? ' · photo attached ✓' : ''}
        </p>
      ) : null}
      <div className="mg-top-12px">
        <label htmlFor="retail-new-title" style={labelStyle}>
          Name
        </label>
        <input
          id="retail-new-title"
          style={inputStyle}
          value={title}
          placeholder="e.g. Shea Butter Body Balm"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="mg-top-12px">
        <label htmlFor="retail-new-price" style={labelStyle}>
          Price (USD)
        </label>
        <input
          id="retail-new-price"
          style={inputStyle}
          value={price}
          inputMode="decimal"
          placeholder="e.g. 45.00"
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="mg-top-12px">
        <label htmlFor="retail-new-category" style={labelStyle}>
          Category
        </label>
        <select
          id="retail-new-category"
          style={inputStyle}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        {categoryHint ? (
          <p className="paragraph-small mg-top-8px" style={{ margin: 0, opacity: 0.7 }}>
            Database suggests: {categoryHint}
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
              data-cta-id="retail-create-category"
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
        ) : (
          <div className="mg-top-8px">
            <Button
              type="button"
              variant="link"
              onClick={() => setShowNewCategory(true)}
              data-cta-id="retail-new-category-toggle"
            >
              + New category
            </Button>
          </div>
        )}
      </div>
      <div className="mg-top-12px">
        <label htmlFor="retail-new-description" style={labelStyle}>
          Description
        </label>
        <textarea
          id="retail-new-description"
          style={{ ...inputStyle, minHeight: 88, resize: 'vertical' }}
          value={description}
          placeholder="Shown on the product page (optional)"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {barcode ? null : (
        <>
          <div className="mg-top-12px">
            <label htmlFor="retail-new-sku" style={labelStyle}>
              SKU (optional)
            </label>
            <input
              id="retail-new-sku"
              style={inputStyle}
              value={sku}
              placeholder="Leave blank to auto-generate"
              onChange={(e) => setSku(e.target.value)}
            />
          </div>
          <div className="mg-top-12px">
            <label htmlFor="retail-new-image" style={labelStyle}>
              Image link (optional)
            </label>
            <input
              id="retail-new-image"
              style={inputStyle}
              value={manualImageUrl}
              inputMode="url"
              placeholder="https://… (product photo)"
              onChange={(e) => setManualImageUrl(e.target.value)}
            />
            {manualImageInvalid ? (
              <p className="paragraph-small mg-top-8px text-error" style={{ margin: 0 }}>
                The image link must start with https://
              </p>
            ) : (
              <p className="paragraph-small mg-top-8px" style={{ margin: 0, opacity: 0.7 }}>
                Without a photo the product shows a placeholder tile in the shop.
              </p>
            )}
          </div>
        </>
      )}
      {barcode ? (
        <div className="mg-top-12px">
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}
            htmlFor="retail-publish-now"
          >
            <input
              id="retail-publish-now"
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
            />
            Publish to the shop immediately
          </label>
          <p className="paragraph-small mg-top-8px" style={{ margin: 0, opacity: 0.7 }}>
            Leave unchecked to review the name, photo, and description first — you can publish from
            the product list below.
          </p>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="paragraph-small mg-top-12px" style={{ color: '#b91c1c' }}>
          {error}
        </p>
      ) : null}
      <div className="mg-top-16px">
        <Button
          type="submit"
          disabled={busy || title.trim().length < 2 || !price}
          data-cta-id="retail-add-product"
        >
          {busy ? 'Adding…' : barcode && !publishNow ? 'Save for review' : 'Add to shop'}
        </Button>
      </div>
    </form>
  );
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
            href={`/shop/${product.slug}`}
            className="link"
            data-cta-id={`retail-view-${product.slug}`}
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
          data-cta-id={`retail-receive-${product.slug}`}
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
          data-cta-id={`retail-toggle-${product.slug}`}
          onClick={() =>
            guard('toggle', () => patchRetailProduct(product.slug, { active: !product.active }))
          }
        >
          {busy === 'toggle' ? 'Saving…' : product.active ? 'Hide from shop' : 'Show in shop'}
        </Button>
        <Button
          variant="link"
          disabled={busy !== null}
          data-cta-id={`retail-edit-${product.slug}`}
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
          data-cta-id={`retail-adjust-${product.slug}`}
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
            data-cta-id={`retail-apply-adjust-${product.slug}`}
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
          <label htmlFor={`retail-edit-title-${product.slug}`} style={labelStyle}>
            Name
          </label>
          <input
            id={`retail-edit-title-${product.slug}`}
            style={inputStyle}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <label htmlFor={`retail-edit-price-${product.slug}`} style={labelStyle}>
            Price (USD)
          </label>
          <input
            id={`retail-edit-price-${product.slug}`}
            style={{ ...inputStyle, width: 140 }}
            inputMode="decimal"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
          />
          <label htmlFor={`retail-edit-description-${product.slug}`} style={labelStyle}>
            Description
          </label>
          <textarea
            id={`retail-edit-description-${product.slug}`}
            style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="white"
              disabled={busy !== null || editTitle.trim().length < 2}
              data-cta-id={`retail-save-edit-${product.slug}`}
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

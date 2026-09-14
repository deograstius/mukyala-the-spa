import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { formatCurrency } from '@utils/currency';
import { useCallback, useEffect, useState } from 'react';
import BarcodeScanner from '../features/retail/BarcodeScanner';
import {
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
  | { mode: 'unknown'; barcode: string; hint: BarcodeInfo };

export default function Retail() {
  const [token, setToken] = useState<string | null>(() => getRetailToken());

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

function Login({ onLoggedIn }: { onLoggedIn: (token: string) => void }) {
  const [username, setUsername] = useState('abryemah');
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
        setScan({ mode: 'unknown', barcode: code, hint });
      } catch (err) {
        if (isAuthError(err)) {
          onAuthExpired();
          return;
        }
        setScan({ mode: 'unknown', barcode: code, hint: {} });
      }
    },
    [onAuthExpired],
  );

  const closeScan = useCallback(() => setScan(null), []);
  const scanAgain = useCallback(() => setScan({ mode: 'scanning' }), []);

  const handleNewCategory = useCallback((cat: RetailCategory) => {
    setCategories((prev) => (prev.some((c) => c.id === cat.id) ? prev : [...prev, cat]));
  }, []);

  // While a scan flow is open, show only that flow — keeps the phone screen
  // focused on the two-tap receive loop.
  if (scan) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {scan.mode === 'scanning' ? (
          <BarcodeScanner onDetected={handleDetected} onCancel={closeScan} />
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
          setNotice(`“${p.title}” is live on the shop.`);
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
        initialTitle={hintTitle}
        barcode={barcode}
        imageUrl={hint.imageUrl}
        categoryHint={hint.category}
        onCreated={(p) => onDone(`“${p.title}” is live on the shop.`)}
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
  barcode?: string;
  imageUrl?: string;
  categoryHint?: string;
  heading?: string;
}) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setBusy(true);
        try {
          const created = await createRetailProduct({
            title: title.trim(),
            priceCents,
            sku: sku.trim() || undefined,
            barcode: barcode || undefined,
            categoryId: categoryId || undefined,
            imageUrl: imageUrl || undefined,
          });
          setTitle('');
          setPrice('');
          setSku('');
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
      {barcode ? null : (
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
      )}
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
          {busy ? 'Adding…' : 'Add to shop'}
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
  const [busy, setBusy] = useState<'receive' | 'toggle' | 'category' | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  async function guard<T>(kind: 'receive' | 'toggle' | 'category', fn: () => Promise<T>) {
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
      </div>
      {rowError ? (
        <p role="alert" className="paragraph-small mg-top-8px" style={{ color: '#b91c1c' }}>
          {rowError}
        </p>
      ) : null}
    </li>
  );
}

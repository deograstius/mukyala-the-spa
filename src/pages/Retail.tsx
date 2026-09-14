import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { formatCurrency } from '@utils/currency';
import { useCallback, useEffect, useState } from 'react';
import {
  createRetailProduct,
  fetchRetailProducts,
  getRetailToken,
  isAuthError,
  patchRetailProduct,
  receiveRetailStock,
  retailLogin,
  setRetailToken,
  type RetailProduct,
} from '../features/retail/retailApi';

/**
 * Staff-only retail back-office (POC): log in, add a product, receive stock,
 * toggle a product on/off the live shop. Unlisted route — not linked from
 * any customer-facing navigation.
 */

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid #d5cec4',
  fontSize: 16,
};

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontWeight: 600 };

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      setProducts(await fetchRetailProducts());
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <AddProductForm
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
        <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
          {(products ?? []).map((p) => (
            <ProductRow
              key={p.slug}
              product={p}
              onChanged={() => void reload()}
              onAuthExpired={onAuthExpired}
            />
          ))}
        </ul>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Button variant="link" onClick={onLogout} data-cta-id="retail-logout">
          Sign out
        </Button>
      </div>
    </div>
  );
}

function AddProductForm({
  onCreated,
  onAuthExpired,
}: {
  onCreated: (p: RetailProduct) => void;
  onAuthExpired: () => void;
}) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
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
        Add a product
      </h2>
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
        <label htmlFor="retail-new-sku" style={labelStyle}>
          SKU / barcode (optional)
        </label>
        <input
          id="retail-new-sku"
          style={inputStyle}
          value={sku}
          placeholder="Leave blank to auto-generate"
          onChange={(e) => setSku(e.target.value)}
        />
      </div>
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
  onChanged,
  onAuthExpired,
}: {
  product: RetailProduct;
  onChanged: () => void;
  onAuthExpired: () => void;
}) {
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState<'receive' | 'toggle' | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  async function guard<T>(kind: 'receive' | 'toggle', fn: () => Promise<T>) {
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

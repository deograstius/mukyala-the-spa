import { useMemo } from 'react';
import Container from '../components/ui/Container';
import Section from '../components/ui/Section';
import { useCart } from '../contexts/CartContext';
import { getSlugFromHref, useProducts } from '../hooks/products';
import { formatCurrency, parsePriceToCents } from '../utils/currency';

export default function Checkout() {
  const products = useProducts();
  const { items } = useCart();
  const { list, subtotal } = useMemo(() => {
    const list = Object.values(items)
      .map((it) => {
        const product = products.find((p) => getSlugFromHref(p.href) === it.slug);
        if (!product) return undefined;
        const priceCents = parsePriceToCents(product.price);
        return { ...it, product, priceCents, lineTotal: priceCents * it.qty };
      })
      .filter(Boolean) as Array<{
      slug: string;
      qty: number;
      product: ReturnType<typeof useProducts>[number];
      priceCents: number;
      lineTotal: number;
    }>;
    const subtotal = list.reduce((sum, r) => sum + r.lineTotal, 0);
    return { list, subtotal };
  }, [items, products]);

  return (
    <Section>
      <Container>
        <div className="inner-container _580px center">
          <div className="text-center">
            <h1 className="display-11">Checkout</h1>
            <div className="mg-top-16px">
              <p className="paragraph-large">
                Online checkout coming soon. Please call or visit to complete purchase.
              </p>
            </div>
          </div>
        </div>

        <div className="mg-top-40px">
          {list.length === 0 ? (
            <div className="card _404-not-found-card" style={{ padding: '1rem' }}>
              <p className="paragraph-large">Your cart is empty.</p>
            </div>
          ) : (
            <div className="card checkout-block" style={{ padding: '1rem' }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {list.map(({ slug, qty, product, lineTotal }) => (
                  <li
                    key={slug}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <img
                        src={product.image}
                        alt={product.title}
                        width={48}
                        height={48}
                        style={{ borderRadius: 8, objectFit: 'cover' }}
                      />
                      <div>
                        <div className="paragraph-large">{product.title}</div>
                        <div className="paragraph-small">Qty: {qty}</div>
                      </div>
                    </div>
                    <div className="paragraph-large">{formatCurrency(lineTotal)}</div>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <div className="display-7">Subtotal</div>
                <div className="display-7">{formatCurrency(subtotal)}</div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

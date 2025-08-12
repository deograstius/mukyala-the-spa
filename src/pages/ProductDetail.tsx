import { useEffect } from 'react';
import ImageCardMedia from '../components/cards/ImageCardMedia';
import Button from '../components/ui/Button';
import Container from '../components/ui/Container';
import Section from '../components/ui/Section';
import { useCart } from '../contexts/CartContext';
import { useProductBySlug } from '../hooks/products';

function useSlugFromPath(): string | undefined {
  // Fallback approach: derive slug from location path: /shop/<slug>
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const parts = path.split('/').filter(Boolean);
  const slug = parts[1]; // ['shop', '<slug>']
  return slug;
}

export default function ProductDetail() {
  const slug = useSlugFromPath();
  const product = useProductBySlug(slug);
  const { addItem } = useCart();

  useEffect(() => {
    if (product) {
      document.title = `${product.title} – Mukyala Day Spa`;
    } else {
      document.title = 'Product – Mukyala Day Spa';
    }
  }, [product]);

  if (!product) {
    return (
      <main className="section">
        <div className="w-layout-blockcontainer container-default w-container">
          <h1 className="display-9" style={{ marginBottom: '1rem' }}>
            Product not found
          </h1>
          <p className="paragraph-large">We couldn’t find this product.</p>
        </div>
      </main>
    );
  }

  return (
    <Section>
      <Container>
        <div className="w-layout-grid grid-2-columns">
          <div className="image-wrapper border-radius-20px">
            <ImageCardMedia
              src={product.image}
              srcSet={product.imageSrcSet}
              sizes={product.imageSizes}
              alt={product.title}
              wrapperClassName="image-wrapper border-radius-16px"
              imageClassName="card-image _w-h-100"
            />
          </div>
          <div>
            <h1 className="display-9">{product.title}</h1>
            <div className="mg-top-16px">
              <div className="display-7">{product.price}</div>
            </div>
            <div className="mg-top-24px">
              <p className="paragraph-large">
                A thoughtful selection from our spa — description coming soon.
              </p>
            </div>
            <div className="mg-top-32px">
              <Button size="large" onClick={() => addItem(slug!)}>
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

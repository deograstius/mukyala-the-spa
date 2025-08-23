import { setTitle } from '@app/seo';
import ImageCardMedia from '@shared/cards/ImageCardMedia';
import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useLoaderData } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useCart } from '../contexts/CartContext';

import type { Product } from '../types/product';

export default function ProductDetail() {
  // Product is provided by the route loader (404 handled by router if missing)
  const product = useLoaderData<Product>({ from: '/shop/$slug' });
  const { addItem } = useCart();

  useEffect(() => {
    setTitle(`${product.title} – Mukyala Day Spa`);
  }, [product.title]);

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
              <Button
                size="large"
                onClick={() => {
                  // Slug derived from href (shared convention across app)
                  const slug = product.href.split('/').pop()!;
                  addItem(slug);
                }}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

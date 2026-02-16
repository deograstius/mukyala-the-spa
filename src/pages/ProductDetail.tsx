import { setBaseTitle } from '@app/seo';
import ImageCardMedia from '@shared/cards/ImageCardMedia';
import DetailLayout from '@shared/layouts/DetailLayout';
import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import DetailMeta from '@shared/ui/DetailMeta';
import Section from '@shared/ui/Section';
import { useLoaderData } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useCart } from '../contexts/CartContext';

import type { Product } from '../types/product';

export default function ProductDetail() {
  const product = useLoaderData({ from: '/shop/$slug' }) as Product;
  const { addItem, openCart } = useCart();

  useEffect(() => {
    setBaseTitle(product.title);
  }, [product.title]);

  return (
    <Section>
      <Container>
        <DetailLayout
          media={
            <ImageCardMedia
              src={product.image}
              srcSet={product.imageSrcSet}
              sizes={product.imageSizes}
              alt={product.title}
              wrapperClassName="image-wrapper border-radius-16px"
              imageClassName="card-image _w-h-100"
            />
          }
          title={<h1 className="display-9">{product.title}</h1>}
          meta={<DetailMeta priceCents={product.priceCents} className="mg-top-16px" />}
          description={
            <div className="mg-top-24px">
              <p className="paragraph-large">
                Curated and spa-tested by our team. Need help choosing what fits your routine? Email
                us at info@mukyala.com.
              </p>
            </div>
          }
          actions={
            <div className="mg-top-32px">
              <Button
                size="large"
                onClick={() => {
                  try {
                    const slug = product.href.split('/').pop()!;
                    addItem(slug);
                  } catch {
                    openCart({ error: 'general' });
                  }
                }}
              >
                Add to Cart
              </Button>
            </div>
          }
        />
      </Container>
    </Section>
  );
}

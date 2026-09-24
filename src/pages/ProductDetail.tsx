import { setPageMeta } from '@app/seo';
import ProductImageCarousel from '@features/shop/ProductImageCarousel';
import ImageCardMedia from '@shared/cards/ImageCardMedia';
import DetailLayout from '@shared/layouts/DetailLayout';
import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import DetailMeta from '@shared/ui/DetailMeta';
import Section from '@shared/ui/Section';
import { Link, useLoaderData } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useCart } from '../contexts/CartContext';

import type { Product } from '../types/product';

/**
 * Barcode-feed descriptions arrive as multi-line spec text; a single collapsed
 * <p> renders them as an unreadable wall. Split on blank lines / line breaks
 * so curated AND imported copy both read as paragraphs.
 */
function descriptionParagraphs(description: string): string[] {
  return description
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ProductDetail() {
  const product = useLoaderData({ from: '/shop/$slug' }) as Product;
  const { addItem, openCart } = useCart();

  useEffect(() => {
    setPageMeta(
      product.title,
      product.description || `${product.title}: skin care from Mukyala The Spa in Carlsbad.`,
      `/shop/${product.slug ?? product.href.split('/').pop()}`,
    );
  }, [product.title, product.description, product.slug, product.href]);

  return (
    <Section>
      <Container>
        <DetailLayout
          media={
            // 2+ images → the carousel (#33); a single image renders exactly
            // as before, no chrome.
            product.images && product.images.length > 1 ? (
              <ProductImageCarousel images={product.images} title={product.title} />
            ) : (
              <ImageCardMedia
                src={product.image}
                srcSet={product.imageSrcSet}
                sizes={product.imageSizes}
                alt={product.title}
                wrapperClassName="image-wrapper border-radius-16px"
                imageClassName="card-image _w-h-100"
              />
            )
          }
          title={<h1 className="display-9">{product.title}</h1>}
          meta={<DetailMeta priceCents={product.priceCents} className="mg-top-16px" />}
          description={
            <div className="mg-top-24px">
              {product.description ? (
                descriptionParagraphs(product.description).map((para, i) => (
                  <p key={i} className={`paragraph-large${i > 0 ? ' mg-top-16px' : ''}`}>
                    {para}
                  </p>
                ))
              ) : (
                <p className="paragraph-large">
                  Used in our treatment room. Need help choosing what fits your routine? Email us at
                  info@mukyala.com.
                </p>
              )}
            </div>
          }
          actions={
            <div className="mg-top-32px">
              <Button
                size="large"
                data-cta-id="product-detail-add-to-cart"
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
              <p className="paragraph-small mg-top-16px">
                Questions before you buy? See our{' '}
                <Link to="/shipping" className="text-link">
                  shipping
                </Link>{' '}
                and{' '}
                <Link to="/refunds" className="text-link">
                  returns
                </Link>{' '}
                policies.
              </p>
            </div>
          }
        />
      </Container>
    </Section>
  );
}

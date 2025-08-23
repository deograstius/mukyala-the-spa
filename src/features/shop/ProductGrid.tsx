import ProductCard from '@features/shop/ProductCard';
import type { Product } from '../../types/product';

export interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="empty-state w-dyn-empty">
        <div>No items found.</div>
      </div>
    );
  }

  return (
    <div role="list" className="grid-3-columns packages-grid">
      {products.map((p) => (
        <div role="listitem" key={p.href} className="w-dyn-item">
          <ProductCard
            title={p.title}
            price={p.price}
            image={p.image}
            imageSrcSet={p.imageSrcSet}
            imageSizes={p.imageSizes}
            href={p.href}
            className="z-index-1 mg-bottom-24px"
          />
        </div>
      ))}
    </div>
  );
}

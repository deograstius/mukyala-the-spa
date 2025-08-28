import MediaCard from '@shared/cards/MediaCard';
import List from '@shared/ui/List';
import ListItem from '@shared/ui/ListItem';
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
    <List className="grid-3-columns packages-grid">
      {products.map((p) => (
        <ListItem key={p.href} className="w-dyn-item">
          <MediaCard
            title={p.title}
            price={p.price}
            image={p.image}
            imageSrcSet={p.imageSrcSet}
            imageSizes={p.imageSizes}
            href={p.href}
            className="z-index-1 mg-bottom-24px"
            wrapperClassName="image-wrapper border-radius-16px z-index-1"
            imageClassName="card-image _w-h-100"
            overlayClassName="bg-image-overlay z-index-1"
            contentClassName="content-inside-image-bottom"
            titleClassName="card-white-title display-7 text-neutral-100"
          />
        </ListItem>
      ))}
    </List>
  );
}

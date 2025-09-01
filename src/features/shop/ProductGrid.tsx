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
            priceCents={p.priceCents}
            image={p.image}
            imageSrcSet={p.imageSrcSet}
            imageSizes={p.imageSizes}
            href={p.href}
            className="z-index-1 mg-bottom-24px"
            wrapperClassName="image-wrapper border-radius-16px z-index-1 aspect-square"
            imageClassName="card-image _w-h-100"
            overlayChildren={
              <div className="button-icon-inside-link-wrapper" aria-hidden="true">
                <div className="secondary-button-icon large no-hover">
                  <div className="accordion-icon-wrapper inside-button">
                    <div className="accordion-icon-line vertical" />
                    <div className="accordion-icon-line" />
                  </div>
                </div>
              </div>
            }
            contentClassName="mg-top-32px"
            titleClassName="card-title display-7"
          />
        </ListItem>
      ))}
    </List>
  );
}

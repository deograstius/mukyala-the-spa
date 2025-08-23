import ImageCardMedia from '@shared/cards/ImageCardMedia';
import { Link } from '@tanstack/react-router';
import * as React from 'react';

export interface ProductCardProps {
  title: string;
  price: string;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  href: string;
  className?: string;
}

export default function ProductCard({
  title,
  price,
  image,
  imageSrcSet,
  imageSizes,
  href,
  className,
}: ProductCardProps) {
  return (
    <Link
      to={href}
      preload="intent"
      className={`text-decoration-none display-block w-inline-block${
        className ? ` ${className}` : ''
      }`}
    >
      <ImageCardMedia
        src={image}
        srcSet={imageSrcSet}
        sizes={imageSizes}
        alt={title}
        wrapperClassName="image-wrapper border-radius-16px z-index-1"
        imageClassName="card-image _w-h-100"
        overlayClassName="bg-image-overlay z-index-1"
      />
      <div className="content-inside-image-bottom">
        <div className="flex-horizontal space-between gap-16px---flex-wrap">
          <h3 className="card-white-title display-7 text-neutral-100">{title}</h3>
          <div className="display-7 text-neutral-100">{price}</div>
        </div>
      </div>
    </Link>
  );
}

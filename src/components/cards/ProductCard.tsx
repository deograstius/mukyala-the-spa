import * as React from 'react';
import ResponsiveImage from '../ui/ResponsiveImage';

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
    <a
      href={href}
      className={`text-decoration-none display-block w-inline-block${
        className ? ` ${className}` : ''
      }`}
    >
      <div className="image-wrapper border-radius-16px z-index-1">
        <div className="bg-image-overlay z-index-1" />
        <ResponsiveImage
          src={image}
          srcSet={imageSrcSet}
          sizes={imageSizes}
          alt={title}
          className="card-image _w-h-100"
        />
      </div>
      <div className="content-inside-image-bottom">
        <div className="flex-horizontal space-between gap-16px---flex-wrap">
          <h3 className="card-white-title display-7 text-neutral-100">{title}</h3>
          <div className="display-7 text-neutral-100">{price}</div>
        </div>
      </div>
    </a>
  );
}

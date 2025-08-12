import * as React from 'react';
import ImageCardMedia from './ImageCardMedia';

export interface ServiceCardProps {
  title: string;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  href: string;
  className?: string;
}

export default function ServiceCard({
  title,
  image,
  imageSrcSet,
  imageSizes,
  href,
  className,
}: ServiceCardProps) {
  return (
    <a
      href={href}
      className={`beauty-services-link-item w-inline-block${className ? ` ${className}` : ''}`}
    >
      <ImageCardMedia
        src={image}
        srcSet={imageSrcSet}
        sizes={imageSizes}
        alt={title}
        wrapperClassName="image-wrapper"
        imageClassName="card-image _w-h-100"
        overlayClassName="bg-image-overlay overlay-15"
      />
      <div className="content-card-services">
        <div className="flex-horizontal space-between gap-16px---flex-wrap">
          <h3 className="card-title display-7 text-neutral-100">{title}</h3>
          <div className="secondary-button-icon white-button-inside-link">
            <div className="icon-font-rounded diagonal-button-icon"></div>
          </div>
        </div>
      </div>
    </a>
  );
}

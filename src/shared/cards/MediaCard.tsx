import ImageCardMedia from '@shared/cards/ImageCardMedia';
import { Link } from '@tanstack/react-router';
import * as React from 'react';

export interface MediaCardProps {
  title: string;
  href: string;
  price?: string;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  className?: string;
  wrapperClassName?: string;
  imageClassName?: string;
  overlayClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  rightElement?: React.ReactNode;
}

export default function MediaCard({
  title,
  href,
  price,
  image,
  imageSrcSet,
  imageSizes,
  className,
  wrapperClassName,
  imageClassName,
  overlayClassName,
  contentClassName,
  titleClassName = 'display-7',
  rightElement,
}: MediaCardProps) {
  const base = 'text-decoration-none display-block w-inline-block';
  const linkClass = className ? `${base} ${className}` : base;
  return (
    <Link to={href} preload="intent" className={linkClass}>
      <ImageCardMedia
        src={image}
        srcSet={imageSrcSet}
        sizes={imageSizes}
        alt={title}
        wrapperClassName={wrapperClassName}
        imageClassName={imageClassName}
        overlayClassName={overlayClassName}
      />
      {contentClassName ? (
        <div className={contentClassName}>
          <div className="flex-horizontal space-between gap-16px---flex-wrap">
            <h3 className={titleClassName}>{title}</h3>
            {price ? <div className="display-7 text-neutral-100">{price}</div> : rightElement}
          </div>
        </div>
      ) : null}
    </Link>
  );
}

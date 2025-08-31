import ImageCardMedia from '@shared/cards/ImageCardMedia';
import Price from '@shared/ui/Price';
import { Link } from '@tanstack/react-router';
import * as React from 'react';

export interface MediaCardProps {
  title: string;
  href: string;
  priceCents?: number;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  className?: string;
  wrapperClassName?: string;
  imageClassName?: string;
  overlayClassName?: string;
  overlayChildren?: React.ReactNode;
  contentClassName?: string;
  titleClassName?: string;
  rightElement?: React.ReactNode;
  /** Optional children rendered immediately after the image wrapper, before content */
  beforeContent?: React.ReactNode;
}

export default function MediaCard({
  title,
  href,
  priceCents,
  image,
  imageSrcSet,
  imageSizes,
  className,
  wrapperClassName,
  imageClassName,
  overlayClassName,
  overlayChildren,
  contentClassName,
  titleClassName = 'display-7',
  rightElement,
  beforeContent,
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
        overlayChildren={overlayChildren}
      />
      {beforeContent}
      {contentClassName ? (
        <div className={contentClassName}>
          <div className="flex-horizontal space-between gap-16px---flex-wrap">
            <h3 className={titleClassName}>{title}</h3>
            {typeof priceCents === 'number' ? (
              <Price cents={priceCents} as="div" className="display-7 text-neutral-100" />
            ) : (
              rightElement
            )}
          </div>
        </div>
      ) : null}
    </Link>
  );
}

import * as React from 'react';
import ResponsiveImage from '../ui/ResponsiveImage';

export interface ImageCardMediaProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  wrapperClassName?: string;
  imageClassName?: string;
  overlayClassName?: string;
  overlayChildren?: React.ReactNode;
}

/**
 * Shared image wrapper for card components, keeping class names consistent.
 */
export default function ImageCardMedia({
  src,
  srcSet,
  sizes,
  alt,
  wrapperClassName = 'image-wrapper',
  imageClassName = 'card-image _w-h-100',
  overlayClassName,
  overlayChildren,
}: ImageCardMediaProps) {
  return (
    <div className={wrapperClassName}>
      {overlayClassName ? <div className={overlayClassName} /> : null}
      {overlayChildren}
      <ResponsiveImage
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={imageClassName}
      />
    </div>
  );
}

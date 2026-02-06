import * as React from 'react';
import ResponsiveImage from '../ui/ResponsiveImage';
import ThumbHashPlaceholder from '../ui/ThumbHashPlaceholder';

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
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div className={wrapperClassName}>
      <div className="media-frame">
        <ThumbHashPlaceholder src={src} hidden={loaded} />
        {overlayClassName ? <div className={`${overlayClassName} media-overlay`} /> : null}
        {overlayChildren ? <div className="media-overlay-children">{overlayChildren}</div> : null}
        <ResponsiveImage
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={imageClassName}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}

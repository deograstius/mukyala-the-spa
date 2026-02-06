import ImageCardMedia from '@shared/cards/ImageCardMedia';
import Price from '@shared/ui/Price';
import ThumbHashPlaceholder from '@shared/ui/ThumbHashPlaceholder';
import { Link } from '@tanstack/react-router';
import * as React from 'react';

export interface MediaCardProps {
  title: string;
  href: string;
  priceCents?: number;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  videoSrc?: string;
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
  videoSrc,
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
  const [videoReady, setVideoReady] = React.useState(false);
  return (
    <Link to={href} preload="intent" className={linkClass}>
      {videoSrc ? (
        <div className={wrapperClassName}>
          <div className="media-frame">
            <ThumbHashPlaceholder src={videoSrc} hidden={videoReady} />
            {overlayClassName ? <div className={`${overlayClassName} media-overlay`} /> : null}
            {overlayChildren ? (
              <div className="media-overlay-children">{overlayChildren}</div>
            ) : null}
            <video
              className="card-video _w-h-100"
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setVideoReady(true)}
              onError={() => setVideoReady(true)}
            />
          </div>
        </div>
      ) : (
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
      )}
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

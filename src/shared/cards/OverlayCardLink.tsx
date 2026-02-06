import ThumbHashPlaceholder from '@shared/ui/ThumbHashPlaceholder';
import * as React from 'react';

export interface OverlayCardLinkProps {
  href: string;
  iconSrc: string;
  videoSrc?: string;
  imageSrc: string;
  imageSrcSet?: string;
  imageSizes?: string;
  alt: string;
  hiddenMobile?: boolean;
  label?: string;
  className?: string;
  overlayClassName?: string;
  overlayContentClassName?: string;
  iconClassName?: string;
  imageClassName?: string;
  videoClassName?: string;
  targetBlank?: boolean;
}

export default function OverlayCardLink({
  href,
  iconSrc,
  videoSrc,
  imageSrc,
  imageSrcSet,
  imageSizes,
  alt,
  hiddenMobile,
  label = 'Follow us',
  className = 'social-media-feed---image-wrapper w-inline-block',
  overlayClassName = 'social-media-feed---image-overlay',
  overlayContentClassName = 'social-media-feed---logo-and-text',
  iconClassName = 'social-feed---icon-inside',
  imageClassName = 'card-image width-100',
  videoClassName = 'card-video width-100',
  targetBlank = true,
}: OverlayCardLinkProps) {
  const cls = className + (hiddenMobile ? ' hidden-on-mobile-portrait' : '');
  const [videoReady, setVideoReady] = React.useState(false);
  const [imageReady, setImageReady] = React.useState(false);
  return (
    <a
      href={href}
      target={targetBlank ? '_blank' : undefined}
      rel={targetBlank ? 'noopener noreferrer' : undefined}
      className={cls}
    >
      <div className={`${overlayClassName} media-overlay`}>
        <div className={overlayContentClassName}>
          <img src={iconSrc} alt="Social platform icon" className={iconClassName} />
          <div className="display-3 text-neutral-100">{label}</div>
        </div>
      </div>

      {videoSrc ? (
        <div className="media-frame">
          <ThumbHashPlaceholder src={videoSrc} hidden={videoReady} />
          <video
            className={videoClassName}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label={alt}
            onLoadedData={() => setVideoReady(true)}
            onError={() => setVideoReady(true)}
          />
        </div>
      ) : (
        <div className="media-frame">
          <ThumbHashPlaceholder src={imageSrc} hidden={imageReady} />
          <img
            src={imageSrc}
            srcSet={imageSrcSet}
            sizes={imageSizes}
            alt={alt}
            className={imageClassName}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(true)}
          />
        </div>
      )}
    </a>
  );
}

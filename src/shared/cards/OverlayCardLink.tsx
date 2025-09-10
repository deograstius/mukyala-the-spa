export interface OverlayCardLinkProps {
  href: string;
  iconSrc: string;
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
  targetBlank?: boolean;
}

export default function OverlayCardLink({
  href,
  iconSrc,
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
  targetBlank = true,
}: OverlayCardLinkProps) {
  const cls = className + (hiddenMobile ? ' hidden-on-mobile-portrait' : '');
  return (
    <a
      href={href}
      target={targetBlank ? '_blank' : undefined}
      rel={targetBlank ? 'noopener noreferrer' : undefined}
      className={cls}
    >
      <div className={overlayClassName}>
        <div className={overlayContentClassName}>
          <img src={iconSrc} alt="Social platform icon" className={iconClassName} />
          <div className="display-3 text-neutral-100">{label}</div>
        </div>
      </div>

      <img
        src={imageSrc}
        srcSet={imageSrcSet}
        sizes={imageSizes}
        alt={alt}
        className={imageClassName}
        loading="lazy"
      />
    </a>
  );
}

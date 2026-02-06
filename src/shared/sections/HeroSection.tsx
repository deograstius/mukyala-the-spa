import Container from '@shared/ui/Container';
import ResponsiveImage from '@shared/ui/ResponsiveImage';
import Section from '@shared/ui/Section';
import ThumbHashPlaceholder from '@shared/ui/ThumbHashPlaceholder';
import * as React from 'react';

export interface HeroImage {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
}

export interface HeroSectionProps {
  variant?: 'background' | 'image-only' | 'content-only';
  sectionClassName?: string;
  containerClassName?: string;
  bgImage?: HeroImage; // used by background/image-only variants
  overlayClassName?: string; // e.g., 'bg-image-overlay'
  children?: React.ReactNode; // content inside the hero
  after?: React.ReactNode; // optional element after container (e.g., half-bg decorator)
}

export default function HeroSection({
  variant = 'background',
  sectionClassName,
  containerClassName,
  bgImage,
  overlayClassName,
  children,
  after,
}: HeroSectionProps) {
  const [bgReady, setBgReady] = React.useState(false);
  if ((variant === 'background' || variant === 'image-only') && !bgImage) {
    throw new Error('HeroSection: bgImage is required for background/image-only variants');
  }

  const sectionCls = [sectionClassName, variant === 'image-only' ? 'hero-image-only' : undefined]
    .filter(Boolean)
    .join(' ');
  const containerCls = containerClassName ? containerClassName : undefined;

  if (variant === 'content-only') {
    return (
      <Section className={sectionCls}>
        <Container className={containerCls}>{children}</Container>
        {after}
      </Section>
    );
  }

  if (variant === 'image-only') {
    return (
      <Section className={sectionCls}>
        <Container className={containerCls ?? 'z-index-1'}>
          <div className="full-image-content hero-v8">
            <div className="image-wrapper full-section-image">
              <div className="media-frame">
                <ThumbHashPlaceholder src={bgImage!.src} hidden={bgReady} />
                <ResponsiveImage
                  src={bgImage!.src}
                  srcSet={bgImage!.srcSet}
                  sizes={bgImage!.sizes}
                  alt={bgImage!.alt}
                  className="_w-h-100 fit-cover"
                  loading="eager"
                  onLoad={() => setBgReady(true)}
                  onError={() => setBgReady(true)}
                />
              </div>
            </div>
          </div>
        </Container>
        {after}
      </Section>
    );
  }

  // background variant
  return (
    <Section>
      <Container>
        <div className="full-image-content hero-v1">
          {children}
          <div className="image-wrapper full-section-image">
            <div className="media-frame">
              <ThumbHashPlaceholder src={bgImage!.src} hidden={bgReady} />
              <ResponsiveImage
                src={bgImage!.src}
                srcSet={bgImage!.srcSet}
                sizes={bgImage!.sizes}
                alt={bgImage!.alt}
                className="_w-h-100 fit-cover"
                loading="eager"
                onLoad={() => setBgReady(true)}
                onError={() => setBgReady(true)}
              />
            </div>
          </div>
          {overlayClassName ? <div className={`${overlayClassName} media-overlay`} /> : null}
        </div>
      </Container>
      {after}
    </Section>
  );
}

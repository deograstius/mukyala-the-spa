import OverlayCardLink from '@shared/cards/OverlayCardLink';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { socialLinks as fallbackSocialLinks } from '../../data/social';
import type { SocialLink } from '../../types/data';

type CommunityProps = {
  links?: SocialLink[];
};

const COMMUNITY_VISUALS: Record<
  string,
  { image: string; imageSrcSet?: string; alt: string; hiddenMobile?: boolean; videoSrc?: string }
> = {
  instagram: {
    image: '/images/skincare-routine-mirror.jpg',
    alt: 'Skincare routine in mirror',
    videoSrc: '/videos/skincare-routine-mirror.mp4',
  },
};

const DEFAULT_VISUALS = Object.values(COMMUNITY_VISUALS);

function Community({ links }: CommunityProps) {
  const resolvedLinks = links && links.length > 0 ? links : fallbackSocialLinks;
  if (!resolvedLinks.length) return null;

  const ctaLink =
    resolvedLinks.find((link) => link.key === 'instagram') ?? resolvedLinks[0] ?? null;

  return (
    <Section className="pd-top-100px">
      <Container>
        <h2 className="display-9 text-center">Our community</h2>

        <div className="mg-top-64px">
          <div className="w-layout-grid grid-1-column community-grid">
            {resolvedLinks.map((link, index) => {
              const visual =
                COMMUNITY_VISUALS[link.key] ?? DEFAULT_VISUALS[index % DEFAULT_VISUALS.length];
              return (
                <OverlayCardLink
                  key={link.key}
                  href={link.url}
                  iconSrc={link.icon}
                  videoSrc={visual.videoSrc}
                  videoPoster={visual.image}
                  imageSrc={visual.image}
                  imageSrcSet={visual.imageSrcSet}
                  imageSizes="(max-width: 479px) 92vw, (max-width: 991px) 49vw, (max-width: 1919px) 24vw, 25vw"
                  alt={visual.alt}
                  hiddenMobile={visual.hiddenMobile}
                  label={`Follow ${link.label}`}
                />
              );
            })}
          </div>
        </div>

        <div className="mg-top-48px">
          <div className="buttons-row">
            <a
              href={ctaLink?.url || 'https://www.instagram.com/'}
              target="_blank"
              rel="noopener noreferrer"
              className="button-primary large w-inline-block"
            >
              <div className="text-block">Follow us</div>
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default Community;

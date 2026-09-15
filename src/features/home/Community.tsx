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

  return (
    <Section className="section-pad-top-xl">
      <Container>
        <h2 className="display-9 text-center">Our community</h2>

        <div className="mg-top-40px">
          <div className="w-layout-grid grid-1-column community-links">
            {resolvedLinks.map((link, index) => {
              const visual =
                COMMUNITY_VISUALS[link.key] ?? DEFAULT_VISUALS[index % DEFAULT_VISUALS.length];
              return (
                <OverlayCardLink
                  key={link.key}
                  href={link.url}
                  iconSrc={link.icon}
                  videoSrc={visual.videoSrc}
                  imageSrc={visual.image}
                  imageSrcSet={visual.imageSrcSet}
                  imageSizes="(max-width: 479px) 92vw, (max-width: 1439px) 94vw, 1290px"
                  alt={visual.alt}
                  hiddenMobile={visual.hiddenMobile}
                  label={`Follow ${link.label}`}
                />
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default Community;

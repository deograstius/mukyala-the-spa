import { socialLinks } from '../../data/social';

interface CommunityItem {
  /** Destination social link */
  href: string;
  /** SVG icon that appears inside the overlay */
  icon: string;
  /** JPG photo shown in the grid */
  image: string;
  /** srcSet value for responsive images */
  imageSrcSet: string;
  /** Whether the card should be hidden on mobile portrait (matches Webflow) */
  hiddenMobile?: boolean;
  /** Alt text for the <img> */
  alt: string;
}

// Static visual cards; links/icons are sourced from centralized social data
const communityItems: CommunityItem[] = [
  {
    href: '#',
    icon: '',
    image: '/images/tiktok-community.jpg',
    imageSrcSet:
      '/images/tiktok-community-p-500.jpg 500w, /images/tiktok-community-p-800.jpg 800w, /images/tiktok-community.jpg 1216w',
    alt: 'TikTok community highlight',
  },
  {
    href: '#',
    icon: '',
    image: '/images/instagram-community.jpg',
    imageSrcSet:
      '/images/instagram-community-p-500.jpg 500w, /images/instagram-community-p-800.jpg 800w, /images/instagram-community.jpg 1216w',
    alt: 'Instagram community highlight',
  },
];

import OverlayCardLink from '@shared/cards/OverlayCardLink';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';

function Community() {
  return (
    <Section className="pd-top-100px">
      <Container>
        <h2 className="display-9 text-center">Our community</h2>

        <div className="mg-top-64px">
          <div className="w-layout-grid grid-2-columns community-grid">
            {communityItems.map((item) => {
              const link = item.alt.toLowerCase().includes('tiktok')
                ? socialLinks.find((s) => s.key === 'tiktok')
                : socialLinks.find((s) => s.key === 'instagram');
              const href = link?.url ?? '#';
              const icon = link?.icon ?? '';
              return (
                <OverlayCardLink
                  key={item.alt}
                  href={href}
                  iconSrc={icon}
                  imageSrc={item.image}
                  imageSrcSet={item.imageSrcSet}
                  imageSizes="(max-width: 479px) 92vw, (max-width: 991px) 49vw, (max-width: 1919px) 24vw, 25vw"
                  alt={item.alt}
                  hiddenMobile={item.hiddenMobile}
                  label="Follow us"
                />
              );
            })}
          </div>
        </div>

        <div className="mg-top-48px">
          <div className="buttons-row">
            <a
              href={
                socialLinks.find((s) => s.key === 'instagram')?.url || 'https://www.instagram.com/'
              }
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

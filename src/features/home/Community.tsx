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

const communityItems: CommunityItem[] = [
  {
    href: 'https://www.tiktok.com/',
    icon: '/images/tiktok-icon-white-hair-x-webflow-template.svg',
    image: '/images/tiktok-community.jpg',
    imageSrcSet:
      '/images/tiktok-community-p-500.jpg 500w, /images/tiktok-community-p-800.jpg 800w, /images/tiktok-community.jpg 1216w',
    alt: 'TikTok community highlight',
  },
  {
    href: 'https://www.instagram.com/',
    icon: '/images/instagram-icon-white-hair-x-webflow-template.svg',
    image: '/images/instagram-community.jpg',
    imageSrcSet:
      '/images/instagram-community-p-500.jpg 500w, /images/instagram-community-p-800.jpg 800w, /images/instagram-community.jpg 1216w',
    alt: 'Instagram community highlight',
  },
];

import Container from '../../components/ui/Container';
import Section from '../../components/ui/Section';

function Community() {
  return (
    <Section>
      <Container>
        <h2 className="display-9 text-center">Our community</h2>

        <div className="mg-top-64px">
          <div className="w-layout-grid grid-2-columns community-grid">
            {communityItems.map((item) => (
              <a
                key={item.alt}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`social-media-feed---image-wrapper w-inline-block${
                  item.hiddenMobile ? ' hidden-on-mobile-portrait' : ''
                }`}
              >
                <div className="social-media-feed---image-overlay">
                  <div className="social-media-feed---logo-and-text">
                    <img
                      src={item.icon}
                      alt="Social platform icon"
                      className="social-feed---icon-inside"
                    />
                    <div className="display-3 text-neutral-100">Follow us</div>
                  </div>
                </div>

                <img
                  src={item.image}
                  srcSet={item.imageSrcSet}
                  sizes="(max-width: 479px) 92vw, (max-width: 991px) 49vw, (max-width: 1919px) 24vw, 25vw"
                  alt={item.alt}
                  className="card-image width-100"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>

        <div className="mg-top-48px">
          <div className="buttons-row">
            <a
              href="https://www.instagram.com/"
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

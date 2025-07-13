/*
 * Community.tsx – "Our community" photo grid with Instagram/TikTok links
 * ----------------------------------------------------------------------
 * This component is a faithful JSX port of the "Our community" section
 * from the Webflow template (home-v1.html).  It keeps the original class
 * names so that the existing `mukyala-2.webflow.css` styling applies
 * without modifications.
 */

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
    image: '/images/community-image-01-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/community-image-01-hair-x-webflow-template-p-500.jpg 500w, /images/community-image-01-hair-x-webflow-template-p-800.jpg 800w, /images/community-image-01-hair-x-webflow-template.jpg 1216w',
    alt: 'Community Image 01',
  },
  {
    href: 'https://www.instagram.com/',
    icon: '/images/instagram-icon-white-hair-x-webflow-template.svg',
    image: '/images/community-image-02-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/community-image-02-hair-x-webflow-template-p-500.jpg 500w, /images/community-image-02-hair-x-webflow-template-p-800.jpg 800w, /images/community-image-02-hair-x-webflow-template.jpg 1216w',
    alt: 'Community Image 02',
    hiddenMobile: true,
  },
  {
    href: 'https://www.tiktok.com/',
    icon: '/images/tiktok-icon-white-hair-x-webflow-template.svg',
    image: '/images/community-image-05-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/community-image-05-hair-x-webflow-template-p-500.jpg 500w, /images/community-image-05-hair-x-webflow-template-p-800.jpg 800w, /images/community-image-05-hair-x-webflow-template.jpg 1216w',
    alt: 'Community Image 05',
  },
  {
    href: 'https://www.tiktok.com/',
    icon: '/images/tiktok-icon-white-hair-x-webflow-template.svg',
    image: '/images/community-image-03-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/community-image-03-hair-x-webflow-template-p-500.jpg 500w, /images/community-image-03-hair-x-webflow-template-p-800.jpg 800w, /images/community-image-03-hair-x-webflow-template.jpg 1216w',
    alt: 'Community Image 03',
    hiddenMobile: true,
  },
  {
    href: 'https://www.instagram.com/',
    icon: '/images/instagram-icon-white-hair-x-webflow-template.svg',
    image: '/images/community-image-04-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/community-image-04-hair-x-webflow-template-p-500.jpg 500w, /images/community-image-04-hair-x-webflow-template-p-800.jpg 800w, /images/community-image-04-hair-x-webflow-template.jpg 1216w',
    alt: 'Community Image 04',
    hiddenMobile: true,
  },
  {
    href: 'https://www.instagram.com/',
    icon: '/images/instagram-icon-white-hair-x-webflow-template.svg',
    image: '/images/community-image-06-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/community-image-06-hair-x-webflow-template-p-500.jpg 500w, /images/community-image-06-hair-x-webflow-template-p-800.jpg 800w, /images/community-image-06-hair-x-webflow-template.jpg 1216w',
    alt: 'Community Image 06',
  },
];

function Community() {
  return (
    <section className="section pd-bottom-200px">
      <div className="w-layout-blockcontainer container-default w-container">
        <h2 className="display-9 text-center">Our community</h2>

        <div className="mg-top-64px">
          <div className="w-layout-grid grid-4-columns community-grid">
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
      </div>
    </section>
  );
}

export default Community;

import Container from '@shared/ui/Container';
import ResponsiveImage from '@shared/ui/ResponsiveImage';
import Section from '@shared/ui/Section';
import BulletItem from '../../components/BulletItem';
import { primaryLocation } from '../../data/contact';
import type { Location } from '../../types/data';

type LocationSpotlightProps = {
  location?: Location;
};

/** "Mon–Fri: 10 am – 6 pm" → "10 am – 6 pm" (for equal-hours comparison). */
function stripDayPrefix(hours: string): string {
  return hours.replace(/^[^:]*:\s*/, '').trim();
}

function LocationSpotlight({ location = primaryLocation }: LocationSpotlightProps) {
  if (!location) return null;
  return (
    <Section className="section-pad-top-xl">
      <Container>
        <div className="inner-container _580px center">
          <div className="text-center">
            <h2 className="display-9">Our location</h2>
          </div>
        </div>

        <div className="mg-top-40px">
          <div className="w-layout-grid grid-2-columns location-image-right">
            {/* Content card — venue name a step below the section heading so
                the two headings stop competing at the same 48px scale. */}
            <div className="card location-card-content-side">
              <h3 className="display-7">{location.name}</h3>

              <div className="mg-top-40px">
                <div className="grid-1-column gap-row-20px">
                  {/* Address */}
                  <BulletItem href={location.mapUrl}>
                    <div className="inner-container _298px">
                      <div className="paragraph-large">
                        {location.address.line1}, {location.address.city}, {location.address.state}{' '}
                        {location.address.postalCode}, {location.address.country}
                      </div>
                    </div>
                  </BulletItem>

                  {/* Phone */}
                  <BulletItem href={`tel:${location.phone.tel}`}>
                    <div className="paragraph-large">{location.phone.display}</div>
                  </BulletItem>

                  {/* Email */}
                  <BulletItem href={`mailto:${location.email}`}>
                    <div className="paragraph-large">{location.email}</div>
                  </BulletItem>

                  {/* Hours — identical weekday/weekend hours collapse into a
                      single "Open daily" line. */}
                  <BulletItem>
                    <div className="grid-1-column gap-row-4px">
                      {location.weekdayHours &&
                      location.weekendHours &&
                      stripDayPrefix(location.weekdayHours) ===
                        stripDayPrefix(location.weekendHours) ? (
                        <div className="paragraph-large">
                          Open daily {stripDayPrefix(location.weekdayHours)}
                        </div>
                      ) : (
                        <>
                          {location.weekdayHours && (
                            <div className="paragraph-large">{location.weekdayHours}</div>
                          )}
                          {location.weekendHours && (
                            <div className="paragraph-large">{location.weekendHours}</div>
                          )}
                        </>
                      )}
                    </div>
                  </BulletItem>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="image-wrapper border-radius-20px">
              <ResponsiveImage
                src="/images/carlsbad-location-exterior.jpg"
                srcSet="/images/carlsbad-location-exterior-p-500.jpg 500w, /images/carlsbad-location-exterior-p-800.jpg 800w, /images/carlsbad-location-exterior.jpg 1480w"
                sizes="(max-width: 479px) 92vw, (max-width: 991px) 100vw, (max-width: 1439px) 57vw, 58vw"
                alt="Mukyala treatment room with illuminated sign"
                className="_w-h-100 fit-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default LocationSpotlight;

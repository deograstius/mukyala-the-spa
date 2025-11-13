import Container from '@shared/ui/Container';
import ResponsiveImage from '@shared/ui/ResponsiveImage';
import Section from '@shared/ui/Section';
import BulletItem from '../../components/BulletItem';
import { primaryLocation } from '../../data/contact';
import type { Location } from '../../types/data';

type LocationSpotlightProps = {
  location?: Location;
};

function LocationSpotlight({ location = primaryLocation }: LocationSpotlightProps) {
  if (!location) return null;
  return (
    <Section className="pd-top-100px">
      <Container>
        <div className="inner-container _580px center">
          <div className="text-center">
            <h2 className="display-9">Our location</h2>
          </div>
        </div>

        <div className="mg-top-40px">
          <div className="w-layout-grid grid-2-columns location-image-right">
            {/* Content card */}
            <div className="card location-card-content-side">
              <h2 className="display-9">{location.name}</h2>

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

                  {/* Hours */}
                  <BulletItem>
                    <div className="grid-1-column gap-row-4px">
                      {location.weekdayHours && (
                        <div className="paragraph-large">{location.weekdayHours}</div>
                      )}
                      {location.weekendHours && (
                        <div className="paragraph-large">{location.weekendHours}</div>
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
                alt="Carlsbad spa location exterior"
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

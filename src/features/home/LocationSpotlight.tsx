import Container from '@shared/ui/Container';
import ResponsiveImage from '@shared/ui/ResponsiveImage';
import Section from '@shared/ui/Section';
import BulletItem from '../../components/BulletItem';
import { primaryLocation } from '../../data/contact';

function LocationSpotlight() {
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
              <h2 className="display-9">{primaryLocation.name}</h2>

              <div className="mg-top-40px">
                <div className="grid-1-column gap-row-20px">
                  {/* Address */}
                  <BulletItem href={primaryLocation.mapUrl}>
                    <div className="inner-container _298px">
                      <div className="paragraph-large">
                        {primaryLocation.address.line1}, {primaryLocation.address.city},{' '}
                        {primaryLocation.address.state} {primaryLocation.address.postalCode},{' '}
                        {primaryLocation.address.country}
                      </div>
                    </div>
                  </BulletItem>

                  {/* Phone */}
                  <BulletItem href={`tel:${primaryLocation.phone.tel}`}>
                    <div className="paragraph-large">{primaryLocation.phone.display}</div>
                  </BulletItem>

                  {/* Email */}
                  <BulletItem href={`mailto:${primaryLocation.email}`}>
                    <div className="paragraph-large">{primaryLocation.email}</div>
                  </BulletItem>

                  {/* Hours */}
                  <BulletItem>
                    <div className="grid-1-column gap-row-4px">
                      {primaryLocation.weekdayHours && (
                        <div className="paragraph-large">{primaryLocation.weekdayHours}</div>
                      )}
                      {primaryLocation.weekendHours && (
                        <div className="paragraph-large">{primaryLocation.weekendHours}</div>
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

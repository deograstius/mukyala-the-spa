import { setBaseTitle } from '@app/seo';
import Community from '@features/home/Community';
import ServiceCard from '@features/services/ServiceCard';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useEffect } from 'react';
import { services } from '../data/services';

export default function Services() {
  useEffect(() => {
    setBaseTitle('Services');
  }, []);

  return (
    <>
      <Section className="hero v13">
        <Container>
          <div className="inner-container _518px center">
            <div className="text-center">
              <h1 className="display-11">Services</h1>
              <div className="mg-top-16px">
                <p className="paragraph-large">
                  Explore our signature facials and treatments — curated for results, delivered with
                  timeless care.
                </p>
              </div>
            </div>
          </div>

          <div className="mg-top-64px">
            <div className="grid-2-columns gap-row-30px">
              {services.map((s) => (
                <ServiceCard
                  key={s.href}
                  title={s.title}
                  image={s.image}
                  imageSrcSet={s.imageSrcSet}
                  imageSizes={s.imageSizes}
                  href={s.href}
                />
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Community section under services, mirroring Webflow layout */}
      <Community />
    </>
  );
}

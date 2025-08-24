import { setBaseTitle } from '@app/seo';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { blogPosts } from '../data/posts';

export default function Blog() {
  setBaseTitle('Blog');
  return (
    <Section className="hero v7">
      <Container>
        <div className="inner-container _580px center">
          <div className="text-center">
            <h1 className="display-11">Blog</h1>
            <div className="mg-top-16px">
              <p className="paragraph-large">Thoughtful notes on beauty, wellness and care.</p>
            </div>
          </div>
        </div>

        <div className="mg-top-60px">
          <div className="w-layout-grid grid-1-column gap-20px">
            {blogPosts.map((p) => (
              <article key={p.id} className="card">
                <div className="mg-bottom-8px">
                  <h2 className="display-7">{p.title}</h2>
                </div>
                <p className="paragraph-large">{p.excerpt}</p>
                <div className="mg-top-12px text-neutral-700">Full articles coming soon.</div>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

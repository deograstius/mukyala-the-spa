import { primaryLocation } from '@data/contact';
import ProductGrid from '@features/shop/ProductGrid';
import { useCheckoutSuccessCache } from '@hooks/checkoutSuccess';
import { useOrderStatusQuery } from '@hooks/orders.api';
import { useProducts } from '@hooks/products';
import HeroSection from '@shared/sections/HeroSection';
import Container from '@shared/ui/Container';
import Price from '@shared/ui/Price';
import Section from '@shared/ui/Section';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';
import BulletItem from '../components/BulletItem';

type CheckoutSuccessLoader = { orderId?: string };

export default function CheckoutSuccess() {
  const search = useSearch({ from: '/checkout/success' }) as CheckoutSuccessLoader;
  const orderId = search?.orderId;
  const navigate = useNavigate({ from: '/checkout/success' });
  const { snapshot } = useCheckoutSuccessCache(orderId);
  const confirmationToken = snapshot?.token;
  const orderStatusQuery = useOrderStatusQuery(orderId, confirmationToken);
  const products = useProducts();
  const recommended = useMemo(() => products.slice(0, 3), [products]);

  useEffect(() => {
    if (!orderId) {
      const id = window.setTimeout(() => {
        navigate({
          to: '/shop',
          search: () => ({}),
          replace: true,
        });
      }, 4000);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [orderId, navigate]);

  return (
    <>
      <Hero />
      <Section>
        <Container>
          <OrderSummaryCard
            orderId={orderId}
            snapshot={snapshot}
            serverStatus={orderStatusQuery.data?.status}
            serverEmail={orderStatusQuery.data?.email ?? undefined}
            isStatusLoading={orderStatusQuery.isFetching}
            statusError={
              orderStatusQuery.isError
                ? "We could not verify your order yet. We'll update you by email."
                : undefined
            }
          />
          <CallToActions />
          <SupportBlock />
          {recommended.length > 0 && (
            <div className="mg-top-60px">
              <div className="text-center mg-bottom-32px">
                <p className="eyebrow">Continue the ritual</p>
                <h3 className="display-8">Guests also love these Mukyala favorites</h3>
              </div>
              <ProductGrid products={recommended} />
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}

function Hero() {
  return (
    <HeroSection variant="content-only" sectionClassName="section">
      <div className="w-layout-grid grid-2-columns hero-image-right">
        <div>
          <h1 className="display-8">Thank you. Your order is in, and we’re getting it ready.</h1>
          <p className="paragraph-large mg-top-16px">
            We’ll send a confirmation email with tracking details as soon as your products ship.
            While you wait, keep exploring the rituals crafted by our estheticians.
          </p>
        </div>
      </div>
    </HeroSection>
  );
}

type OrderSummaryProps = {
  orderId?: string;
  snapshot: ReturnType<typeof useCheckoutSuccessCache>['snapshot'];
  serverStatus?: 'pending' | 'checkout_started' | 'confirmed' | 'canceled';
  serverEmail?: string;
  isStatusLoading: boolean;
  statusError?: string;
};

function OrderSummaryCard({
  orderId,
  snapshot,
  serverStatus,
  serverEmail,
  isStatusLoading,
  statusError,
}: OrderSummaryProps) {
  if (!orderId) {
    return (
      <div className="card checkout-block mg-bottom-32px" role="alert">
        <div className="w-commerce-commercecheckoutsummaryblockheader checkout-block-header">
          <h2 className="display-6">We couldn’t find your order</h2>
        </div>
        <div className="w-commerce-commercecheckoutblockcontent checkout-block-content">
          <p className="paragraph-large">
            The confirmation link didn’t include an order reference. We’ll take you back to checkout
            shortly, or you can return to the <a href="/shop">shop</a> now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card checkout-block mg-bottom-32px">
      <div className="w-commerce-commercecheckoutsummaryblockheader checkout-block-header">
        <div>
          <p className="eyebrow">Order #{orderId}</p>
          <h2 className="display-6">Order summary</h2>
        </div>
        <OrderStatusBadge status={serverStatus} isLoading={isStatusLoading} />
      </div>
      <fieldset className="w-commerce-commercecheckoutblockcontent checkout-block-content">
        {snapshot ? (
          <>
            {(() => {
              const email = serverEmail ?? snapshot.email;
              if (!email) {
                return (
                  <p className="paragraph-large">
                    We’ll email your receipt once the order is confirmed.
                  </p>
                );
              }
              return (
                <p className="paragraph-large">
                  We’ll email <strong>{email}</strong> once the order is confirmed.
                </p>
              );
            })()}
            <ul style={{ listStyle: 'none', margin: '1rem 0 0', padding: 0 }}>
              {snapshot.items.map((item) => (
                <li
                  key={`${item.slug}-${item.title}`}
                  className="w-commerce-commercecheckoutsummarylineitem"
                  style={{ alignItems: 'center', gap: 12 }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img
                      src={item.image}
                      alt={item.imageAlt || item.title}
                      width={54}
                      height={54}
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                    />
                    <div>
                      <div className="paragraph-large">{item.title}</div>
                      <div className="paragraph-small text-neutral-600">Qty {item.qty}</div>
                    </div>
                  </div>
                  <Price cents={item.priceCents * item.qty} className="paragraph-large" />
                </li>
              ))}
            </ul>
            <div className="w-commerce-commercecheckoutsummarylineitem mg-top-16px">
              <div>Subtotal</div>
              <Price cents={snapshot.subtotalCents} className="display-7" />
            </div>
          </>
        ) : (
          <p className="paragraph-large">
            We saved your order reference locally but couldn’t hydrate the line items. We’ll email
            the full summary as soon as the order is confirmed.
          </p>
        )}
        {statusError && (
          <p className="paragraph-small mg-top-12px" role="status">
            {statusError}
          </p>
        )}
      </fieldset>
    </div>
  );
}

function OrderStatusBadge({
  status,
  isLoading,
}: {
  status?: 'pending' | 'checkout_started' | 'confirmed' | 'canceled';
  isLoading?: boolean;
}) {
  let label = 'Processing';
  let background = '#f5f1ec';
  let color = '#4d2d1c';

  if (isLoading) {
    label = 'Checking status…';
  } else if (status === 'confirmed') {
    label = 'Confirmed';
    background = '#e3f5ec';
    color = '#0f5132';
  } else if (status === 'checkout_started') {
    label = 'Processing';
  } else if (status === 'canceled') {
    label = 'Canceled';
    background = '#fce8e8';
    color = '#7f1d1d';
  }

  return (
    <div
      className="badge small"
      style={{
        background,
        color,
        padding: '6px 14px',
        borderRadius: 999,
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: 12,
      }}
      aria-live="polite"
    >
      {label}
    </div>
  );
}

function CallToActions() {
  return (
    <div className="mg-top-24px">
      <div className="buttons-row left wrap">
        <a href="/shop" className="button-primary large w-inline-block">
          <div className="text-block">Continue shopping</div>
        </a>
        <a href="/reservation" className="link center-mbp w-inline-block">
          <div>Book a spa reservation</div>
          <div className="item-icon-right medium">
            <div className="icon-font-rounded"></div>
          </div>
        </a>
      </div>
    </div>
  );
}

function SupportBlock() {
  const location = primaryLocation;
  return (
    <div className="card location-card-content-side mg-top-40px">
      <h3 className="display-8">Need a hand?</h3>
      <p className="paragraph-large mg-top-8px">
        Our concierge team is on standby seven days a week, 10 am – 6 pm PT.
      </p>
      <div className="grid-1-column gap-row-16px mg-top-24px">
        <BulletItem href={`tel:${location.phone.tel}`}>
          <div className="paragraph-large">{location.phone.display}</div>
        </BulletItem>
        <BulletItem href={`mailto:${location.email}`}>
          <div className="paragraph-large">{location.email}</div>
        </BulletItem>
        <BulletItem href={location.mapUrl}>
          <div className="paragraph-large">
            {location.address.line1}, {location.address.city}, {location.address.state}{' '}
            {location.address.postalCode}
          </div>
        </BulletItem>
      </div>
    </div>
  );
}

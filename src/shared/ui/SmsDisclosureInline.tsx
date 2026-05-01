import { primaryLocation } from '@data/contact';
import type { CSSProperties } from 'react';

type SmsDisclosureInlineProps = {
  className?: string;
  style?: CSSProperties;
  linkClassName?: string;
  linkStyle?: CSSProperties;
  ctaId?: string;
  variant?: 'compact' | 'full';
};

export default function SmsDisclosureInline({
  className = 'paragraph-small',
  style,
  linkClassName,
  linkStyle,
  ctaId = 'waitlist-sms-disclosures',
  variant = 'compact',
}: SmsDisclosureInlineProps) {
  const resolvedLinkStyle: CSSProperties = {
    display: 'inline',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    textDecoration: 'underline',
    ...(linkClassName ? {} : { color: 'inherit' }),
    ...linkStyle,
  };

  if (variant === 'full') {
    return (
      <p className={className} style={style}>
        By texting to join the waitlist, you agree to receive recurring marketing SMS from Mukyala
        Day Spa. Consent is not a condition of purchase. Message frequency varies. Message and data
        rates may apply. Reply STOP to opt out and HELP for help. For support, contact{' '}
        <a href="mailto:info@mukyala.com" className={linkClassName} style={resolvedLinkStyle}>
          info@mukyala.com
        </a>{' '}
        or{' '}
        <a
          href={`tel:${primaryLocation.phone.tel}`}
          className={linkClassName}
          style={resolvedLinkStyle}
        >
          +1 {primaryLocation.phone.display}
        </a>
        . Carriers are not liable for delayed or undelivered messages. See our{' '}
        <a
          href="/sms-disclosures"
          className={linkClassName}
          style={resolvedLinkStyle}
          data-cta-id={ctaId}
        >
          SMS program disclosures
        </a>
        ,{' '}
        <a href="/terms" className={linkClassName} style={resolvedLinkStyle}>
          Terms of Service
        </a>
        , and{' '}
        <a href="/privacy" className={linkClassName} style={resolvedLinkStyle}>
          Privacy Policy
        </a>
        .
      </p>
    );
  }

  return (
    <p className={className} style={style}>
      By joining the waitlist via SMS, you agree to receive recurring marketing texts from Mukyala.
      Consent is not a condition of purchase. Review our{' '}
      <a
        href="/sms-disclosures"
        className={linkClassName}
        style={resolvedLinkStyle}
        data-cta-id={ctaId}
      >
        SMS program disclosures
      </a>
      .
    </p>
  );
}

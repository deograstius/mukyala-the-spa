import type { CSSProperties } from 'react';

type SmsDisclosureInlineProps = {
  className?: string;
  style?: CSSProperties;
  linkClassName?: string;
  linkStyle?: CSSProperties;
  ctaId?: string;
};

export default function SmsDisclosureInline({
  className = 'paragraph-small',
  style,
  linkClassName,
  linkStyle,
  ctaId = 'waitlist-sms-disclosures',
}: SmsDisclosureInlineProps) {
  const resolvedLinkStyle: CSSProperties = {
    display: 'inline',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    textDecoration: 'underline',
    ...(linkClassName ? {} : { color: 'inherit' }),
    ...linkStyle,
  };

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

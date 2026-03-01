export type MarketingCaptureSurface =
  | 'reservation_waitlist'
  | 'checkout_waitlist'
  | 'manage_notifications';

export type MarketingChannel = 'email' | 'sms';

export type ConsentCopyVersion = {
  id: string;
  text: string;
  locale: 'en-US';
};

export type MarketingCapturePolicy = {
  surface: MarketingCaptureSurface;
  channel: MarketingChannel;
  requiresExplicitConsentCopy: true;
  requiresDoubleOptIn: true;
  liveCaptureEnabled: boolean;
  fallbackMessageWhenDisabled: string;
};

export const MARKETING_CAPTURE_POLICIES: MarketingCapturePolicy[] = [
  {
    surface: 'reservation_waitlist',
    channel: 'email',
    requiresExplicitConsentCopy: true,
    requiresDoubleOptIn: true,
    liveCaptureEnabled: false,
    fallbackMessageWhenDisabled:
      'Marketing email capture is not live on this page yet; use manage notifications for verified preference updates.',
  },
  {
    surface: 'checkout_waitlist',
    channel: 'email',
    requiresExplicitConsentCopy: true,
    requiresDoubleOptIn: true,
    liveCaptureEnabled: false,
    fallbackMessageWhenDisabled:
      'Marketing email capture is not live on this page yet; we do not collect email marketing consent here.',
  },
];

export function getMarketingCapturePolicy(
  surface: MarketingCaptureSurface,
  channel: MarketingChannel,
): MarketingCapturePolicy | undefined {
  return MARKETING_CAPTURE_POLICIES.find(
    (item) => item.surface === surface && item.channel === channel,
  );
}

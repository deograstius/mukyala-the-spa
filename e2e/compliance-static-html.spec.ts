import { expect, test } from '@playwright/test';

const compliancePages = [
  {
    // Home ships a static no-JS fallback (see src/prerender.tsx) so Google's
    // OAuth branding review sees the app name, functionality description,
    // Ads API data-use statement, and privacy/terms links in raw HTML.
    route: '/',
    expectedText: [
      '<h1>Mukyala</h1>',
      'Licensed esthetician facials',
      'Google Ads API',
      'href="/privacy"',
      'href="/terms"',
    ],
  },
  {
    route: '/privacy',
    expectedText: [
      'Mukyala Privacy Policy',
      'No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.',
      'All of the data-sharing categories described elsewhere in this Privacy Policy exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.',
    ],
  },
  {
    route: '/terms',
    expectedText: [
      'Mukyala Terms of Service',
      'Reply STOP to opt out and HELP for help.',
      'Message frequency varies.',
      'Message and data rates may apply.',
      'Carriers are not liable for delayed or undelivered messages.',
      'href="/privacy"',
    ],
  },
  {
    route: '/sms-disclosures',
    expectedText: [
      'SMS Program Disclosures',
      'Message frequency varies.',
      'Message and data rates may apply.',
    ],
  },
  {
    route: '/reservation',
    expectedText: [
      'Book an appointment',
      // Pinned to canonical site phone (src/data/contact.ts). The prerendered
      // /reservation page must contain this literal in raw HTML.
      '(760) 276-6583',
      // SMS program disclosures were only rendered here while the campaign
      // blackout (CAMPAIGN_BLACKOUT_END_YMD, ended 2026-08-21) showed the SMS
      // waitlist. They remain asserted on /terms and /sms-disclosures above.
      // Privacy/terms consent links next to the submit button are the stable
      // compliance surface on this page.
      'href="/privacy"',
      'href="/terms"',
    ],
  },
];

for (const pageData of compliancePages) {
  test(`raw html is prerendered for ${pageData.route}`, async ({ request }) => {
    const response = await request.get(pageData.route);
    expect(response.ok()).toBeTruthy();

    const html = await response.text();
    expect(html).not.toContain('<div id="root"></div>');
    for (const expected of pageData.expectedText) {
      expect(html).toContain(expected);
    }
  });
}

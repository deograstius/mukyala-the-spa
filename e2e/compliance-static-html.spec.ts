import { expect, test } from '@playwright/test';

const compliancePages = [
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
      'message frequency varies and message and data rates may apply',
      'Carriers are not liable for delayed or undelivered messages.',
      'href="/privacy"',
    ],
  },
  {
    route: '/sms-disclosures',
    expectedText: ['SMS Program Disclosures'],
  },
  {
    route: '/reservation',
    expectedText: [
      'Book an appointment',
      '(760) 870-1087',
      'Message frequency varies.',
      'Message and data rates may apply.',
      'Reply STOP to opt out and HELP for help.',
      'Carriers are not liable for delayed or undelivered messages.',
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

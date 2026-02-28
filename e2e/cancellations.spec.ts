import { expect, test } from '@playwright/test';

async function assertFooterCancellationsDeepLink(page: import('@playwright/test').Page) {
  await page.goto('/terms');

  const footer = page.getByRole('contentinfo');
  const cancellationsLink = footer.getByRole('link', { name: 'Cancellations' });

  await expect(cancellationsLink).toBeVisible();
  await expect(cancellationsLink).toHaveAttribute('href', '/terms#cancellations');

  await cancellationsLink.click();
  await expect(page).toHaveURL(/\/terms\/?#cancellations$/);
  await expect(page.locator('#cancellations')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Cancellations' })).toBeVisible();
}

test('footer Cancellations link reaches /terms#cancellations (desktop viewport)', async ({
  page,
}) => {
  await assertFooterCancellationsDeepLink(page);
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('footer Cancellations link reaches /terms#cancellations (mobile viewport)', async ({
    page,
  }) => {
    await assertFooterCancellationsDeepLink(page);
  });
});

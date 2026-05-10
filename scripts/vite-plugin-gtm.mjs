/*
 * vite-plugin-gtm.mjs — chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
 *
 * Vite plugin that injects the Google Tag Manager container snippet into
 * index.html at build time, gated entirely on the `VITE_GTM_ID` environment
 * variable.
 *
 * Zero-network-when-unset contract:
 *   - VITE_GTM_ID unset OR empty           -> NO snippet emitted at all.
 *     index.html ships unchanged. There is no placeholder ID, no console
 *     warning, no fetch. This is the dev default and the safe default.
 *   - VITE_GTM_ID set to e.g. "GTM-ABC1234" -> two blocks injected:
 *       1. <script> in <head> that loads gtm.js (bootstraps dataLayer + GTM).
 *       2. <noscript> <iframe> in <body> for users without JS.
 *
 * The Consent Mode v2 default state push is emitted as an inline <script>
 * BEFORE the gtm.js loader, so when GTM evaluates tags it already sees the
 * defaults (ad_* denied, analytics_storage granted).
 */

const GTM_ID_REGEX = /^GTM-[A-Z0-9]+$/;

function consentDefaultScript() {
  // Plain, minified-friendly JS. Mirrors Google Consent Mode v2 docs.
  return [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('consent', 'default', {",
    "  ad_storage: 'denied',",
    "  ad_user_data: 'denied',",
    "  ad_personalization: 'denied',",
    "  analytics_storage: 'granted',",
    "  functionality_storage: 'granted',",
    "  security_storage: 'granted',",
    '  wait_for_update: 500',
    '});',
  ].join('\n');
}

function gtmLoaderScript(id) {
  // Standard GTM loader from Google docs, with the ID interpolated.
  return (
    "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':" +
    "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0]," +
    "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;" +
    "j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;" +
    "f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','" +
    id +
    "');"
  );
}

function gtmNoscriptIframe(id) {
  return (
    '<iframe src="https://www.googletagmanager.com/ns.html?id=' +
    id +
    '" height="0" width="0" style="display:none;visibility:hidden"></iframe>'
  );
}

/**
 * Vite plugin factory. Returns a plugin that injects GTM into index.html when
 * VITE_GTM_ID is set + valid. No-op otherwise.
 */
export function gtmInjection() {
  return {
    name: 'mukyala-gtm-injection',
    transformIndexHtml: {
      // `pre` runs before the default index transform; we want our consent-
      // default <script> to land in head before any module preload entries.
      order: 'pre',
      handler(html) {
        const id = process.env.VITE_GTM_ID;
        if (!id || !id.trim()) {
          // Pure no-op. No warning, no console output, no fetch.
          return html;
        }
        const trimmed = id.trim();
        if (!GTM_ID_REGEX.test(trimmed)) {
          // Visible build warning, but do not crash. Skip injection so the
          // site still ships. Operators frequently fat-finger the ID; failing
          // the build over a typo would be worse than a clean opt-out.
          console.warn(
            `[vite-plugin-gtm] VITE_GTM_ID="${trimmed}" does not match /^GTM-[A-Z0-9]+$/. ` +
              'Skipping GTM injection. Fix the ID or unset the env var to silence this warning.',
          );
          return html;
        }

        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: { 'data-gtm-consent-default': 'true' },
              children: consentDefaultScript(),
              injectTo: 'head-prepend',
            },
            {
              tag: 'script',
              attrs: { 'data-gtm-loader': 'true' },
              children: gtmLoaderScript(trimmed),
              injectTo: 'head',
            },
            {
              tag: 'noscript',
              attrs: { 'data-gtm-noscript': 'true' },
              children: gtmNoscriptIframe(trimmed),
              injectTo: 'body-prepend',
            },
          ],
        };
      },
    },
  };
}

export default gtmInjection;

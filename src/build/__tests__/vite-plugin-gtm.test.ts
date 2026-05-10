/*
 * vite-plugin-gtm build-time tests — chunk: spa-tracking-and-consent-2026-05-09
 * (tester pass).
 *
 * We don't run a full `vite build` from inside vitest (slow + flaky); instead
 * we import the plugin's `transformIndexHtml.handler` directly and feed it a
 * representative index.html under different `process.env.VITE_GTM_ID` states.
 * This locks the no-op-when-unset contract and the inject-when-set contract
 * with a fast deterministic test.
 */

import { afterEach, beforeEach, describe, it, expect } from 'vitest';

// Plugin is .mjs in /scripts; it is plain JS so we can import the named export.

// @ts-expect-error — .mjs has no .d.ts shim
import gtmInjection from '../../../scripts/vite-plugin-gtm.mjs';

type InjectTo = 'head' | 'head-prepend' | 'body' | 'body-prepend';

interface TagDescriptor {
  tag: string;
  attrs?: Record<string, string | boolean>;
  children?: string;
  injectTo?: InjectTo;
}

interface IndexHtmlTransformResult {
  html: string;
  tags: TagDescriptor[];
}

interface PluginShape {
  name: string;
  transformIndexHtml: {
    order: 'pre' | 'post';
    handler: (html: string) => string | IndexHtmlTransformResult;
  };
}

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
  <head><title>Mukyala</title></head>
  <body><div id="root"></div></body>
</html>`;

describe('vite-plugin-gtm', () => {
  const original = process.env.VITE_GTM_ID;

  beforeEach(() => {
    delete process.env.VITE_GTM_ID;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.VITE_GTM_ID;
    else process.env.VITE_GTM_ID = original;
  });

  it('exports a Vite plugin with a transformIndexHtml handler', () => {
    const plugin = gtmInjection() as PluginShape;
    expect(plugin.name).toBe('mukyala-gtm-injection');
    expect(plugin.transformIndexHtml.order).toBe('pre');
    expect(typeof plugin.transformIndexHtml.handler).toBe('function');
  });

  it('VITE_GTM_ID unset: returns html unchanged (zero-network contract)', () => {
    const plugin = gtmInjection() as PluginShape;
    const out = plugin.transformIndexHtml.handler(SAMPLE_HTML);
    // Pure passthrough — `out === html` literally.
    expect(out).toBe(SAMPLE_HTML);
    // String form contains no GTM markers.
    const text = typeof out === 'string' ? out : out.html;
    expect(text).not.toContain('googletagmanager.com');
    expect(text).not.toContain('gtm.start');
    expect(text).not.toContain('dataLayer');
  });

  it('VITE_GTM_ID empty string: returns html unchanged (zero-network contract)', () => {
    process.env.VITE_GTM_ID = '   ';
    const plugin = gtmInjection() as PluginShape;
    const out = plugin.transformIndexHtml.handler(SAMPLE_HTML);
    expect(out).toBe(SAMPLE_HTML);
  });

  it('VITE_GTM_ID malformed: returns html unchanged (skips with warning, no crash)', () => {
    process.env.VITE_GTM_ID = 'not-a-real-gtm-id';
    const plugin = gtmInjection() as PluginShape;
    const out = plugin.transformIndexHtml.handler(SAMPLE_HTML);
    expect(out).toBe(SAMPLE_HTML);
  });

  it('VITE_GTM_ID set + valid: emits the consent-default + loader + noscript tags', () => {
    process.env.VITE_GTM_ID = 'GTM-TEST123';
    const plugin = gtmInjection() as PluginShape;
    const out = plugin.transformIndexHtml.handler(SAMPLE_HTML) as IndexHtmlTransformResult;

    expect(typeof out).toBe('object');
    expect(out.html).toBe(SAMPLE_HTML);
    expect(Array.isArray(out.tags)).toBe(true);
    expect(out.tags.length).toBe(3);

    // Consent default <script> goes first, in head-prepend.
    const consentDefault = out.tags.find(
      (t) => t.attrs && t.attrs['data-gtm-consent-default'] === 'true',
    );
    expect(consentDefault).toBeDefined();
    expect(consentDefault!.tag).toBe('script');
    expect(consentDefault!.injectTo).toBe('head-prepend');
    expect(consentDefault!.children).toContain("gtag('consent', 'default'");
    // CCPA defaults: ad_* denied, analytics_storage granted.
    expect(consentDefault!.children).toContain("ad_storage: 'denied'");
    expect(consentDefault!.children).toContain("ad_user_data: 'denied'");
    expect(consentDefault!.children).toContain("ad_personalization: 'denied'");
    expect(consentDefault!.children).toContain("analytics_storage: 'granted'");

    // GTM loader <script> in head, with the ID interpolated.
    const loader = out.tags.find((t) => t.attrs && t.attrs['data-gtm-loader'] === 'true');
    expect(loader).toBeDefined();
    expect(loader!.tag).toBe('script');
    expect(loader!.injectTo).toBe('head');
    expect(loader!.children).toContain('googletagmanager.com/gtm.js');
    expect(loader!.children).toContain('GTM-TEST123');

    // Noscript iframe in body-prepend.
    const noscript = out.tags.find((t) => t.attrs && t.attrs['data-gtm-noscript'] === 'true');
    expect(noscript).toBeDefined();
    expect(noscript!.tag).toBe('noscript');
    expect(noscript!.injectTo).toBe('body-prepend');
    expect(noscript!.children).toContain('https://www.googletagmanager.com/ns.html?id=GTM-TEST123');
  });

  it('the produced consent-default snippet pushes a default consent state with wait_for_update', () => {
    process.env.VITE_GTM_ID = 'GTM-TEST123';
    const plugin = gtmInjection() as PluginShape;
    const out = plugin.transformIndexHtml.handler(SAMPLE_HTML) as IndexHtmlTransformResult;
    const consentDefault = out.tags.find(
      (t) => t.attrs && t.attrs['data-gtm-consent-default'] === 'true',
    )!;
    expect(consentDefault.children).toContain('wait_for_update');
    // The Consent Mode v2 docs default is 500ms — pin it so we notice changes.
    expect(consentDefault.children).toContain('wait_for_update: 500');
    // Functionality + security storage are granted (operate-the-site basics).
    expect(consentDefault.children).toContain("functionality_storage: 'granted'");
    expect(consentDefault.children).toContain("security_storage: 'granted'");
  });
});

describe('built dist/index.html (no VITE_GTM_ID at build time)', () => {
  it('contains no GTM/dataLayer markers (zero-network confirmed)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const distIndex = path.join(process.cwd(), 'dist', 'index.html');
    if (!fs.existsSync(distIndex)) {
      // No build artifact present in this environment — skip this assertion.
      // The plugin-handler tests above cover the contract regardless.
      return;
    }
    const html = fs.readFileSync(distIndex, 'utf8');
    expect(html).not.toContain('googletagmanager.com');
    expect(html).not.toContain('gtm.start');
    // The string `dataLayer` MUST NOT appear directly in index.html — it can
    // only appear inside JS chunks that lazy-evaluate window.dataLayer.
    expect(html).not.toContain('dataLayer');
  });
});

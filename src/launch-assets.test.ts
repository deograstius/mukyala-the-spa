/*
 * Launch-asset unit tests — chunk: spa-launch-readiness-seo-2026-05-09 (tester pass).
 *
 * Parses index.html JSON-LD, /public/sitemap.xml, /public/robots.txt, and
 * sanity-checks /public/og-image.jpg from disk. No dev server, no network.
 */

import fs from 'node:fs';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

const ROOT = process.cwd();
const INDEX_HTML = path.join(ROOT, 'index.html');
const SITEMAP_XML = path.join(ROOT, 'public', 'sitemap.xml');
const ROBOTS_TXT = path.join(ROOT, 'public', 'robots.txt');
const OG_IMAGE = path.join(ROOT, 'public', 'og-image.jpg');

function readFile(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

function extractJsonLd(html: string): unknown {
  // Strip HTML comments first — index.html includes a docblock comment that
  // mentions `<script type="application/ld+json">` literally, which would
  // otherwise be picked up by a naive regex match.
  const stripped = html.replace(/<!--[\s\S]*?-->/g, '');
  const match = stripped.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match) {
    throw new Error('No <script type="application/ld+json"> block found in index.html');
  }
  // Whitespace-tolerant JSON parse.
  return JSON.parse(match[1].trim());
}

type AnyRecord = Record<string, unknown>;

describe('JSON-LD in index.html', () => {
  const html = readFile(INDEX_HTML);
  const data = extractJsonLd(html) as AnyRecord;

  it('@type is BeautySalon', () => {
    expect(data['@type']).toBe('BeautySalon');
  });

  it('name is Mukyala', () => {
    expect(data.name).toBe('Mukyala');
  });

  it('address has the expected NAP fields', () => {
    const addr = data.address as AnyRecord;
    expect(addr).toBeDefined();
    expect(addr.streetAddress).toBe('390 Oak Ave');
    expect(addr.addressLocality).toBe('Carlsbad');
    expect(addr.postalCode).toBe('92008');
  });

  it('telephone digits match (760) 276-6583 / +17602766583', () => {
    const tel = String(data.telephone ?? '');
    expect(tel.length).toBeGreaterThan(0);
    // Normalise to digits — accepts "+1-760-276-6583", "+17602766583",
    // or "(760) 276-6583". E.164 with country code yields 11 digits.
    const digits = tel.replace(/\D+/g, '');
    expect(digits === '7602766583' || digits === '17602766583').toBe(true);
  });

  it('geo coordinates fall within reasonable Carlsbad bounds', () => {
    const geo = data.geo as AnyRecord;
    expect(geo).toBeDefined();
    const lat = Number(geo.latitude);
    const lng = Number(geo.longitude);
    expect(Number.isFinite(lat)).toBe(true);
    expect(Number.isFinite(lng)).toBe(true);
    expect(lat).toBeGreaterThanOrEqual(33.0);
    expect(lat).toBeLessThanOrEqual(33.3);
    expect(lng).toBeGreaterThanOrEqual(-117.5);
    expect(lng).toBeLessThanOrEqual(-117.2);
  });

  it('openingHoursSpecification covers all 7 days, 10:00–18:00', () => {
    const specs = data.openingHoursSpecification as AnyRecord[] | undefined;
    expect(Array.isArray(specs)).toBe(true);
    const dayCoverage = new Set<string>();
    const allWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const spec of specs!) {
      expect(spec.opens).toBe('10:00');
      expect(spec.closes).toBe('18:00');
      const days = Array.isArray(spec.dayOfWeek)
        ? (spec.dayOfWeek as string[])
        : [String(spec.dayOfWeek)];
      for (const d of days) dayCoverage.add(d);
    }
    for (const d of allWeek) {
      expect(dayCoverage.has(d), `openingHoursSpecification should cover ${d}`).toBe(true);
    }
  });

  it('hasOfferCatalog has exactly 8 offers', () => {
    const catalog = data.hasOfferCatalog as AnyRecord | undefined;
    expect(catalog).toBeDefined();
    const items = catalog!.itemListElement as unknown[] | undefined;
    expect(Array.isArray(items)).toBe(true);
    expect(items!.length).toBe(8);
  });

  it('sameAs includes the Instagram URL', () => {
    const sameAs = data.sameAs as unknown[] | undefined;
    expect(Array.isArray(sameAs)).toBe(true);
    const hasInstagram = (sameAs as string[]).some((u) =>
      /instagram\.com\//i.test(String(u ?? '')),
    );
    expect(hasInstagram).toBe(true);
  });

  it('image is an absolute URL ending in .jpg', () => {
    const img = String(data.image ?? '');
    expect(/^https?:\/\//.test(img)).toBe(true);
    expect(/\.jpg$/i.test(img)).toBe(true);
  });
});

describe('robots.txt', () => {
  const robots = readFile(ROBOTS_TXT);

  it('contains "User-agent: *"', () => {
    expect(/^User-agent:\s*\*/m.test(robots)).toBe(true);
  });

  it('contains "Allow: /"', () => {
    expect(/^Allow:\s*\/\s*$/m.test(robots)).toBe(true);
  });

  it('points to the absolute production sitemap URL', () => {
    expect(robots).toContain('https://www.mukyala.com/sitemap.xml');
  });
});

describe('sitemap.xml', () => {
  const xml = readFile(SITEMAP_XML);

  it('declares as XML and parses without obvious malformation', () => {
    expect(xml.trim().startsWith('<?xml')).toBe(true);
    // Balanced <urlset>...</urlset>.
    expect(xml).toMatch(/<urlset\b[^>]*>[\s\S]*<\/urlset>/);
    // No raw, unescaped ampersands inside <loc> values.
    const locContents = Array.from(xml.matchAll(/<loc>([^<]*)<\/loc>/g)).map((m) => m[1]);
    expect(locContents.length).toBeGreaterThan(0);
    for (const loc of locContents) {
      // Reject literal "&" that isn't part of a recognized entity.
      expect(/&(?!(amp|lt|gt|quot|apos);)/.test(loc)).toBe(false);
    }
  });

  it('contains the home URL', () => {
    expect(xml).toMatch(/<loc>https:\/\/www\.mukyala\.com\/?<\/loc>/);
  });

  it('every <loc> is HTTPS and on the mukyala.com domain', () => {
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      expect(loc.startsWith('https://'), `<loc> ${loc} must be HTTPS`).toBe(true);
      try {
        const u = new URL(loc);
        expect(
          u.hostname === 'mukyala.com' || u.hostname.endsWith('.mukyala.com'),
          `<loc> ${loc} must be on mukyala.com`,
        ).toBe(true);
      } catch {
        throw new Error(`<loc> ${loc} is not a valid URL`);
      }
    }
  });

  it('every <url> entry has a <lastmod> in valid ISO 8601 format', () => {
    const urlBlocks = Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/g)).map((m) => m[1]);
    expect(urlBlocks.length).toBeGreaterThan(0);
    // Accept date-only (YYYY-MM-DD) or full ISO datetime per W3C/sitemap spec.
    const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
    const isoFull = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
    for (const block of urlBlocks) {
      const m = block.match(/<lastmod>([^<]+)<\/lastmod>/);
      expect(m, '<url> entry should include a <lastmod>').toBeTruthy();
      const value = m![1].trim();
      const ok = isoDateOnly.test(value) || isoFull.test(value);
      expect(ok, `<lastmod> "${value}" must be ISO 8601`).toBe(true);
      // Date.parse should succeed.
      expect(Number.isFinite(Date.parse(value))).toBe(true);
    }
  });
});

describe('og-image.jpg', () => {
  it('exists at public/og-image.jpg', () => {
    expect(fs.existsSync(OG_IMAGE)).toBe(true);
  });

  it('is non-zero bytes and under 300 KB', () => {
    const stat = fs.statSync(OG_IMAGE);
    expect(stat.size).toBeGreaterThan(0);
    expect(stat.size).toBeLessThan(300 * 1024);
  });

  it('is a JPEG by magic bytes (FF D8 FF)', () => {
    const fd = fs.openSync(OG_IMAGE, 'r');
    const buf = Buffer.alloc(3);
    fs.readSync(fd, buf, 0, 3, 0);
    fs.closeSync(fd);
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8);
    expect(buf[2]).toBe(0xff);
  });

  it('has dimensions exactly 1200x630 (parsed from JPEG SOF marker)', () => {
    // Lightweight inline JPEG SOF (Start Of Frame) parser: walks marker
    // segments and reads height/width from the first SOFn marker. Avoids
    // adding any test dependency on jimp/sharp/etc.
    const buf = fs.readFileSync(OG_IMAGE);
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8);
    let offset = 2;
    let height = -1;
    let width = -1;
    while (offset < buf.length) {
      // Skip fill bytes.
      while (offset < buf.length && buf[offset] !== 0xff) offset++;
      while (offset < buf.length && buf[offset] === 0xff) offset++;
      const marker = buf[offset];
      offset++;
      // Standalone markers without payload (RSTn, SOI, EOI).
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        continue;
      }
      // Segment length includes the 2 length bytes.
      const segLen = buf.readUInt16BE(offset);
      // SOFn markers (0xC0–0xCF, excluding 0xC4=DHT, 0xC8=JPG, 0xCC=DAC).
      const isSof =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        // Layout: [precision:1][height:2][width:2][...]
        height = buf.readUInt16BE(offset + 2 + 1);
        width = buf.readUInt16BE(offset + 2 + 1 + 2);
        break;
      }
      offset += segLen;
    }
    expect(width).toBe(1200);
    expect(height).toBe(630);
  });
});

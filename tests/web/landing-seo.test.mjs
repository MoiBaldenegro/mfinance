import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  sincronizarIndex, sincronizarSitemap, versionActual,
} from '../../scripts/sync-web-version.mjs';

const docs = new URL('../../docs/', import.meta.url);
const html = readFileSync(new URL('index.html', docs), 'utf8');
const BASE = 'https://moibaldenegro.github.io/mfinance/';

function jsonLd(h) {
  const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  return JSON.parse(m[1])['@graph'];
}
const app = (h) => jsonLd(h).find((n) => n['@type'] === 'SoftwareApplication');

test('la landing declara canonical, Open Graph y Twitter con URLs absolutas', () => {
  assert.match(html, new RegExp(`<link rel="canonical" href="${BASE}">`));
  for (const meta of ['og:url', 'og:image', 'og:title', 'og:description', 'twitter:card', 'twitter:image']) {
    assert.match(html, new RegExp(`(property|name)="${meta}" content="[^"]+"`), meta);
  }
  assert.ok(existsSync(new URL('og-image.png', docs)), 'falta docs/og-image.png');
});

test('todos los botones de descarga apuntan al instalador de la versión publicada', () => {
  const datos = app(html);
  const enlaces = [...html.matchAll(/href="([^"]*releases\/download[^"]*)"/g)].map((m) => m[1]);
  assert.ok(enlaces.length >= 3);
  for (const e of enlaces) assert.equal(e, datos.downloadUrl);
  assert.ok(datos.downloadUrl.endsWith(`/v${datos.softwareVersion}/mfinance_${datos.softwareVersion}_x64-setup.exe`));
  assert.match(html, new RegExp(`<span data-version>${datos.softwareVersion}</span>`));
});

test('cada pregunta del FAQ visible está en los datos estructurados', () => {
  const faq = jsonLd(html).find((n) => n['@type'] === 'FAQPage');
  const visibles = [...html.matchAll(/<summary>([^<]+)<\/summary>/g)].map((m) => m[1]);
  assert.deepEqual(faq.mainEntity.map((q) => q.name), visibles);
});

test('sincronizarIndex mueve enlaces, versión, notas, fecha y etiqueta', () => {
  const nuevo = sincronizarIndex(html, '2.0.0', '2027-01-15');
  const datos = app(nuevo);
  assert.equal(versionActual(nuevo), '2.0.0');
  assert.equal(datos.dateModified, '2027-01-15');
  assert.equal(datos.releaseNotes, 'https://github.com/MoiBaldenegro/mfinance/releases/tag/v2.0.0');
  assert.doesNotMatch(nuevo, new RegExp(`v${app(html).softwareVersion}/`));
  assert.equal([...nuevo.matchAll(/v2\.0\.0\/mfinance_2\.0\.0_x64-setup\.exe/g)].length,
    [...html.matchAll(/releases\/download\//g)].length);
  assert.match(nuevo, /<span data-version>2\.0\.0<\/span>/);
});

test('sincronizarSitemap actualiza lastmod', () => {
  const xml = readFileSync(new URL('sitemap.xml', docs), 'utf8');
  assert.match(sincronizarSitemap(xml, '2027-01-15'), /<lastmod>2027-01-15<\/lastmod>/);
});

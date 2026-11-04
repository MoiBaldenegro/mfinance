// Sincroniza la landing (docs/) con la versión publicada: enlaces de
// descarga, datos estructurados, etiqueta visible y fecha del sitemap.
// Uso: node scripts/sync-web-version.mjs [version] [AAAA-MM-DD]
// Sin argumentos toma la versión de package.json y la fecha de hoy.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const VERSION = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function sincronizarIndex(html, version, fecha) {
  return html
    .replace(/releases\/download\/v[^/"]+\/mfinance_[^"]+?_x64-setup\.exe/g,
      `releases/download/v${version}/mfinance_${version}_x64-setup.exe`)
    .replace(/releases\/tag\/v[^"]+"/g, `releases/tag/v${version}"`)
    .replace(/"softwareVersion": "[^"]*"/, `"softwareVersion": "${version}"`)
    .replace(/"dateModified": "[^"]*"/, `"dateModified": "${fecha}"`)
    .replace(/(<span data-version>)[^<]*(<\/span>)/g, `$1${version}$2`);
}

export function sincronizarSitemap(xml, fecha) {
  return xml.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${fecha}</lastmod>`);
}

export function versionActual(html) {
  return html.match(/"softwareVersion": "([^"]*)"/)?.[1];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raiz = new URL('../', import.meta.url);
  const pkg = JSON.parse(readFileSync(new URL('package.json', raiz), 'utf8'));
  const version = process.argv[2] ?? pkg.version;
  const fecha = process.argv[3] ?? new Date().toISOString().slice(0, 10);
  if (!VERSION.test(version) || !FECHA.test(fecha)) {
    console.error(`Versión o fecha inválida: ${version} ${fecha}`);
    process.exit(1);
  }
  const index = fileURLToPath(new URL('docs/index.html', raiz));
  const sitemap = fileURLToPath(new URL('docs/sitemap.xml', raiz));
  const html = readFileSync(index, 'utf8');
  // Solo se toca la web si cambió la versión: así el job es idempotente.
  if (versionActual(html) === version) {
    console.log(`La web ya está en v${version}`);
  } else {
    writeFileSync(index, sincronizarIndex(html, version, fecha));
    writeFileSync(sitemap, sincronizarSitemap(readFileSync(sitemap, 'utf8'), fecha));
    console.log(`Web actualizada a v${version} (${fecha})`);
  }
}

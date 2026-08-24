# Evaluación de `pdfjs-dist` como candidato para la feature 12 `diagnostico-pdf`

> Informe de investigación externa (explorer), 2026-08-22. Pregunta asignada:
> ¿sirve `pdfjs-dist` (npm) para extraer **fecha, comercio e importe** de
> estados de cuenta bancarios en PDF, con subida por mes y análisis por
> lotes, en este repo (React 19 + TS + Vite ^7.0.4 + Tauri 2, WebView2 en
> Windows)? La aprobación de la dependencia sigue siendo **decisión
> exclusiva del humano** (docs/dependencies.md); este informe solo aporta
> evidencia.
>
> Nota: existe una investigación paralela del lado Rust (`pdf-extract` /
> `lopdf`, salida prevista en `progress/research/`); este documento no la
> sustituye ni la anticipa.

## Veredicto ejecutivo

Candidato sólido, con condiciones: pin de versión exacta, worker cargado vía
`?url` de Vite (patrón necesario en builds release de Tauri), import dinámico
del parser, y aceptación explícita de dos límites: PDFs escaneados quedan
fuera de alcance (sin OCR) y la reconstrucción de filas de tabla es trabajo
manual nuestro sobre coordenadas. Es Apache-2.0, gratuito, mantenido por
Mozilla con cadencia ~mensual, con cadena de suministro verificable
(trusted publisher + SLSA + sigstore) y —clave para este arnés— funciona en
Node sin navegador ni canvas, así que el pipeline de extracción es testeable
con `node:test` tal como exige el repo. Detalles y fuentes abajo.

## Tabla de hallazgos

| # | Pregunta | Hallazgo | Fuente |
|---|----------|----------|--------|
| 1 | Versión actual | `6.2.108`, última estable (publicada 2026-07-28). Serie 6.x abierta por v6.0.227 (2026-05-30), que trajo cambios de API (majors con breaking changes marcados `[api-major]`). | registry.npmjs.org/pdfjs-dist/latest · mozilla.github.io/pdf.js/getting_started · github.com/mozilla/pdf.js/releases |
| 1 | Mantenimiento / estado | Proyecto de **Mozilla Corporation**, activo desde 2011; visor PDF por defecto de Firefox desde v19. Cadencia ≈ mensual (6.2.108 jul-26, 6.1.200 jun-26, 6.0.227 may-26, 5.7.284 abr-26…). ~24,2 M descargas/semana, 3.529 dependents, 0 dependencias runtime obligatorias (solo `@napi-rs/canvas` opcional para render en Node). Publicado vía GitHub Actions *trusted publisher* con atestación SLSA y firma sigstore. | npmjs.com/package/pdfjs-dist · en.wikipedia.org/wiki/PDFjs · releasealert.dev/npmjs/_/pdfjs-dist · registry.npmjs.org/pdfjs-dist/latest |
| 2 | Licencia y costo | **Apache-2.0 exacta** (campo `license` del registro npm y `LICENSE` del repo/paquete). Coste: 0; sin tier de pago ni telemetría. Recursos embebidos con licencias permisivas propias (Foxit/Liberation bajo `standard_fonts/`). | registry.npmjs.org/pdfjs-dist/latest · github.com/mozilla/pdf.js/blob/master/LICENSE |
| 3 | Extracción de texto | API: `getDocument({ data }).promise` → `pdf.getPage(i)` → `page.getTextContent()`. Devuelve `items[]` con `str`, `hasEOL`, `dir`, `width`, `height` y `transform` (matriz de posición en puntos PDF). No hay detector de tablas nativo: las filas se reconstruyen agrupando items por Y y ordenando por X. | mozilla.github.io/pdf.js/examples · nutrient.io/blog/pdfjs-server-side-text-extraction |
| 3 | Fidelidad con extractos digitales | Con capa de texto (extractos descargados del banco): texto crudo fiel; el orden de lectura lo reconstruimos nosotros con coordenadas. Casos límite documentados: coordenadas x/y incorrectas en páginas apaisadas/rotadas (discusión #18688, sin respuesta oficial) y fallos puntuales en archivos concretos (issue #11779, cerrado). El esfuerzo real está en heurísticas por formato de cada banco, no en la librería. | github.com/mozilla/pdf.js/discussions/18688 · github.com/mozilla/pdf.js/issues/11779 |
| 3 | Escaneados / OCR | Un PDF escaneado es imagen sin capa de texto: `getTextContent()` devuelve vacío. pdf.js **no incluye OCR**; haría falta Tesseract.js u otro motor (fuera de alcance actual). Encaja con el criterio de aceptación de «PDF corrupto o ilegible»: detectar cero texto → informar ese archivo sin abortar el lote. | nutrient.io/blog/how-to-extract-text-from-a-pdf-using-javascript (FAQ OCR) |
| 3 | Contraseñas | Soportadas: `loadingTask.onPassword = (cb, reason) => …` con `PasswordResponses.NEED_PASSWORD` / `INCORRECT_PASSWORD`; se llama `cb(password)` y la carga continúa. El formato antiguo por tercer parámetro está deprecado. | github.com/mozilla/pdf.js/issues/11420 · dzone.com/articles/handling-password-protected-PDF-javascript |
| 4 | Worker con Vite | Patrón canónico: `import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'` → `GlobalWorkerOptions.workerSrc = workerUrl`. Alternativa: `?worker` + `GlobalWorkerOptions.workerPort = new PdfWorker()`. Si el worker no carga, pdf.js cae a *fake worker* en el hilo principal («Setting up fake worker»: warning + pérdida de rendimiento, no error fatal). | stackoverflow.com/q/78877350 (respuesta aceptada) · stackoverflow.com/q/74452371 · github.com/mozilla/pdf.js/issues/8305 |
| 4 | Tamaño añadido (v6.2.108 medido) | Bundle JS: `build/pdf.min.mjs` = 454.669 B (~0,44 MB). Worker como asset aparte (no cuenta en bundle inicial): `pdf.worker.min.mjs` = 1.262.398 B (~1,20 MB). Paquete descomprimido total 34,5 MB, pero incluye cmaps/standard_fonts/viewer/wasm que solo viajan al dist si se referencian. Con import dinámico, ambos trozos se cargan solo al usar la feature. | data.jsdelivr.com/v1/packages/npm/pdfjs-dist@6.2.108?structure=flat · registry.npmjs.org/pdfjs-dist/latest (`unpackedSize`) |
| 4 | Problemas conocidos Vite 7 / workers | No encontré incidencia específica Vite 7 + pdfjs-dist; los patrones `?url`/`?worker` son los mecanismos documentados de Vite y estables entre Vite 5→7. Errores históricos típicos: rutas a `node_modules` en builds de librería, MIME `application/octet-stream` servido mal, y el renombrado `.js`→`.mjs` desde v4 (usar siempre `pdf.worker.min.mjs`). Desajuste lib/worker produce error explícito de version mismatch. | stackoverflow.com/a/78877350 · stackoverflow.com/q/73979621 · github.com/mozilla/pdf.js/issues/14332 |
| 4 | WebView2 (Tauri Windows) | WebView2 es Chromium moderno (Tauri lo garantiza actualizado): soporta módulos ES y web workers. Riesgo específico Tauri: en build release, `new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).pathname` NO resuelve (assets servidos por protocolo propio, no hay filesystem real) — caso documentado en Tauri+SvelteKit donde dev funcionaba y release fallaba; la solución es dejar que Vite emita el asset con `?url`/`?worker` dentro de `dist/`. Revisar CSP de tauri.conf.json si existe (`worker-src 'self'`). | stackoverflow.com/q/79093607 · v2.tauri.app/reference/webview-versions |

| 5 | Ubicación hexagonal | Encaja como **adapter frontend bajo `src/adapters/`** (p.ej. `parser-pdf-web.ts`) que implemente un puerto de dominio (p.ej. `ExtractorMovimientosPort` en `src/domain/`), siguiendo el patrón existente (`*-ipc-adapter.ts`, `tema-local-storage-adapter.ts`). Los componentes jamás importan `pdfjs-dist`; el adapter tampoco usa `invoke()`. El almacenamiento de comprobantes en `Documents/mfinance/comprobantes/<YYYY-MM>/` sigue necesitando backend/IPC (FS real), pero el **parseo** puede vivir íntegramente en el front. La alternativa es delegar parseo a un command Rust (ver §Comparativa). | Estructura del repo: src/adapters/, docs/architecture.md |
| 5 | Tests node:test | `pdfjs-dist` funciona en Node **sin navegador ni canvas** para extracción: sin configurar worker (cae a hilo principal), `getDocument({ data })` acepta `Uint8Array`; conviene pasar `cMapUrl` y `standardFontDataUrl` resolviéndolos desde el propio paquete en disco. Requisito duro: `engines: node >=22.13.0 || >=24` — el Node local del repo (v22.22.2) cumple. Node 22+ trae nativo `Promise.withResolvers` que pdf.js usa. Consecuencia: tests node:test pueden ejercitar extracción real con PDFs fixture pequeños comprometidos en `tests/fixtures/`, cumpliendo TDD del arnés. | nutrient.io/blog/pdfjs-server-side-text-extraction · registry.npmjs.org/pdfjs-dist/latest |
| 6 | vs Rust (resumen) | Ventaja clave pdfjs-dist: extractor de texto más maduro y probado de las opciones, y único camino testeable end-to-end con `node:test` (la ruta Rust solo sería testeable con `cargo test`, dejando el journey e2e del criterio de aceptación dependiendo de mocks IPC). Inconveniente clave pdfjs-dist: ~1,6 MB añadidos al lado webview (mitigable con carga perezosa) y lógica de parseo JS sujeta a breaking changes entre majors. La evaluación detallada de `pdf-extract`/`lopdf` está a cargo del informe paralelo; comparativa numérica no se duplica aquí. | Este informe + criterios de feature_list.json id 12 |

## Recomendación razonada para este repo

**Recomiendo aprobar `pdfjs-dist` (pin exacto `6.2.108.x` o la estable vigente
al aprobar) como librería de parseo, con la extracción en un adapter frontend
y las heurísticas fecha/comercio/importe como caso de uso puro de dominio
testeable.** Razones:

1. **Testabilidad dentro del arnés actual.** El criterio de aceptación exige
   journey end-to-end probado y el repo corre tests con `node:test` sin
   dependencias extra. pdfjs-dist extrae texto en Node puro (sin DOM, sin
   worker, Node ≥22.13 —el repo tiene 22.22.2—): los fixtures PDF permiten
   tests reales rojo→verde. Con crates Rust, esa misma capa requeriría
   `cargo test` aparte y mocks para el e2e.
2. **Madurez y cobertura.** Es el motor PDF en JS más usado (24 M
   descargas/semana, base del visor de Firefox); soporta contraseñas y da
   coordenadas para reconstruir filas. Los límites reales (escaneados,
   layouts raros) son compartidos por cualquier extractor no-OCR.
3. **Coste cero y licencia limpia** (Apache-2.0), con cadena de suministro
   firmada y verificable.

Condiciones de uso si se aprueba (para el implementer):

- Pin de versión exacta en package.json (los majors rompen API; v6 lo hizo).
- Import dinámico del módulo pdf.js dentro del adapter, para no pagar ~0,44 MB
  en el chunk inicial; el worker (~1,20 MB asset) solo se emite al build.
- Worker SIEMPRE vía `import url from 'pdfjs-dist/build/pdf.worker.min.mjs?url'`
  (o `?worker` + `workerPort`): es lo único fiable en release de Tauri.
- Detectar páginas/documentos sin texto → marcar archivo «ilegible (¿escaneado?)»
  sin abortar el lote (criterio de aceptación 12-5).
- No renderizar nunca a canvas (no hace falta para extraer): reduce superficie
  de las CVEs históricas ligadas a rendering/fuentes.

## Riesgos principales

1. **Breaking changes entre majors** (v4→5→6 cambiaron API y nombres de
   archivos `.js`→`.mjs`). Mitigación: pin exacto y upgrades deliberados.
2. **Worker mal cargado**: cae a fake worker silencioso (bloquea UI) o error
   de version mismatch lib/worker. Mitigación: patrón `?url` + aserción en
   dev de que no aparece «Setting up fake worker».
3. **Tauri release ≠ dev**: rutas resueltas con `new URL().pathname` fallan en
   el ejecutable empaquetado (caso documentado). Mitigación: dejar emitir el
   asset a Vite dentro de `dist/`.
4. **Variedad de extractos bancarios**: cada banco tiene layout propio; la
   heurística de filas será iterativa y probablemente imperfecta al inicio.
   El gate de tabla revisable (confirmar/editar/descartar) ya previsto en la
   feature absorbe este riesgo funcional.
5. **Escaneados sin OCR**: quedan fuera; deben detectarse y reportarse.
   Añadir OCR sería una futura dependencia con su propia aprobación humana.
6. **Peso en webview** (~1,6 MB totales con carga perezosa). Aceptable en app
   de escritorio local; no hay coste de red real.
7. **Engines Node ≥22.13||≥24**: cualquier entorno de pruebas con Node más
   viejo romperá en el import (el actual 22.22.2 cumple).

## Pendientes detectados (no perseguidos en esta sesión)

- Informe paralelo de crates Rust `pdf-extract`/`lopdf` para cerrar la
  comparativa A/B que pide el criterio de aceptación 12-1.
- Verificar CSP efectiva de tauri.conf.json antes de implementar (si define
  `script-src`/`worker-src`, permitir `'self'` para el worker).

## Fuentes

- npm registry (metadatos exactos v6.2.108): https://registry.npmjs.org/pdfjs-dist/latest
- npm (adopción, última publicación): https://www.npmjs.com/package/pdfjs-dist
- Releases mozilla/pdf.js: https://github.com/mozilla/pdf.js/releases
- Cadencia de releases: https://releasealert.dev/npmjs/_/pdfjs-dist
- Getting started / builds modern & legacy: https://mozilla.github.io/pdf.js/getting_started/
- Ejemplos oficiales (getTextContent): https://mozilla.github.io/pdf.js/examples/
- Wikipedia PDF.js (historia, CVEs conocidos): https://en.wikipedia.org/wiki/PDFjs
- Extracción server-side en Node (patrón completo): https://www.nutrient.io/blog/pdfjs-server-side-text-extraction/
- OCR fuera de alcance de pdf.js: https://www.nutrient.io/blog/how-to-extract-text-from-a-pdf-using-javascript/
- onPassword / PasswordResponses: https://github.com/mozilla/pdf.js/issues/11420 · https://dzone.com/articles/handling-password-protected-PDF-javascript
- Worker Vite `?url`: https://stackoverflow.com/questions/78877350 · https://stackoverflow.com/questions/73979621 · https://github.com/mozilla/pdf.js/issues/8305
- Fake worker explicado: https://stackoverflow.com/questions/74452371
- Fallo worker en Tauri release: https://stackoverflow.com/questions/79093607
- WebView2 = Chromium actualizado: https://v2.tauri.app/reference/webview-versions
- Coordenadas getTextContent en páginas rotadas (caso límite): https://github.com/mozilla/pdf.js/discussions/18688
- Fallo puntual de extracción (cerrado): https://github.com/mozilla/pdf.js/issues/11779
- Tamaños de archivos medidos: https://data.jsdelivr.com/v1/packages/npm/pdfjs-dist@6.2.108?structure=flat

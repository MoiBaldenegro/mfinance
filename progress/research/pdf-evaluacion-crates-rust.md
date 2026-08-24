# Investigación: evaluación de crates Rust `pdf-extract` y `lopdf` para la feature 12 `diagnostico-pdf`

- **Fecha:** 2026-08-22
- **Feature ligada:** 12 `diagnostico-pdf` (estado actual: `blocked` a la espera de aprobación humana de dependencia)
- **Caso de uso:** extraer **fecha, comercio e importe** de movimientos de estados de cuenta bancarios en PDF (generados digitalmente), procesando lotes desde `Documents/mfinance/comprobantes/<YYYY-MM>/` vía command Tauri → adapter en `src-tauri/src/infrastructure/`, testeable con `cargo test` sin tauri.
- **Alcance:** solo los dos crates asignados. Otras alternativas detectadas quedan anotadas como pendientes al final.

---

## 1. pdf-extract

### 1.1 Versión, mantenimiento y estado

| Dato | Valor | Fuente |
|---|---|---|
| Versión actual | **0.12.0** (2026-06-25) | API crates.io |
| Primera publicación | 2018-01-28 | API crates.io |
| Descargas | 4.18 M totales / ~2.43 M recientes (~90 días) | API crates.io |
| Repo | jrmuizel/pdf-extract: ~596 stars, 121 forks, 288 commits, 20 contribuidores, último push = fecha del release | GitHub |
| Backlog | 53 issues abiertas, 20 PRs abiertas | GitHub |
| Cadencia | Activa: 0.8.0 (ene 2025) → 0.8.2 (feb 2025) → 0.9.0 (abr 2025) → 0.10.0 (oct 2025) → 0.12.0 (jun 2026); salta números (no hubo 0.11) | docs.rs versiones |

Mantenimiento sano pero de ritmo "mejor esfuerzo": releases regulares sin fechas prometidas, y varias PRs externas valiosas llevan meses sin fusionar (ver riesgos).

### 1.2 Licencia y costo

- **MIT** (licencia única, no dual), según el campo `license` de cada versión en crates.io y el badge de docs.rs. Sin costo ni restricciones de uso relevantes para una app de escritorio privada/comercial.

### 1.3 Cobertura real

- **PDFs digitales (capa de texto):** sí, es su propósito único. API simple: `extract_text_from_mem(&bytes) -> Result<String>` y variantes por página (`extract_text_from_mem_by_pages`). Fuente: docs.rs crate index.
- **Cifrado/contraseña:** soportado. Funciones `*_encrypted` (`extract_text_encrypted`, `extract_text_from_mem_encrypted`, …) más `LoadOptions::with_password` re-exportada de lopdf; descifrado automático con contraseña vacía (típico de eStatements bancarios que solo restringen permisos). PERO hay bugs reales abiertos: la PR #136 (feb 2026, **sin fusionar**) documenta que eStatements AES reales fallan con `InvalidCipherTextLength` por doble descifrado, y lo verifica contra un eStatement bancario real (Canadian Tire Financial Services). Issue #98 (`UnsupportedEncryption` en PDF sin contraseña) se cerró en abr 2025. La PR #131 documenta que con lopdf 0.36 muchos PDFs sin contraseña devolvían **texto vacío** por un bug de cifrado del parser subyacente, arreglado en lopdf 0.38 → riesgo de desfase de versión acoplado.
- **PDFs escaneados (solo imagen):** **NO**. No hace OCR ni rasteriza; devuelve vacío o casi vacío ante PDFs de solo imagen. Terceros lo confirman explícitamente ("neither did pdf-extract", issue #1311 de nearai/ironclaw sobre su motor de extracción).
- **Robustez ante PDFs malformados:** punto débil documentado. Issue #141 (mar 2026, abierta) inventaría **~50 puntos de pánico** (`panic!`/`unwrap`) sobre entrada no confiable a través de pdf-extract y sus tres parsers auxiliares (adobe-cmap-parser, cff-parser, type1-encoding-parser); su autor mantiene forks endurecidos en GitLab (gitlab.com/cxxl/*). Ejemplos concretos: pánico "bad length of hexstring" en CMap (#104, abierta), pánico `Parse(InvalidContentStream)` con imágenes inline (#134, abierta), stack overflow / index out of bounds (#139).

### 1.4 Calidad del texto para tablas de extractos

- **Sin noción de layout:** emite texto en orden de flujo de contenido, sin detección de columnas ni orden de lectura. Evaluación de terceros (nearai/ironclaw #1311): "dumps raw text with no awareness of reading order, tables… for complex PDFs (contracts, financial reports…) the extracted text is garbled". Para extractos bancarios esto significa: las filas suelen salir línea a línea (bien si el banco emite una operación por línea), pero celdas posicionadas por separado pueden intercalarse.
- **Espaciado:** bugs históricos de palabras partidas por espaciado raro (#79/#84, corregidos en 2024 vía bf92c9b).
- **Acentos/español:** riesgo real y vigente. La PR #155 (jul 2026, **abierta**) documenta que fuentes CFF con encoding interno pueden decodificar `é` WinAnsi como `Ø`; el caso de prueba es sintético pero describe fallos con subconjuntos reales. Histórico similar con umlauts alemanes (#22, abierta desde 2020) y glifos sin información unicode (#9, abierta desde 2018, del propio autor). Los extractos españoles usan mayoritariamente WinAnsi/Cp1252 + ToUnicode bien formados, así que lo esperable es correcto, con casos límite posibles (ñ, á, é en comercios).

### 1.5 Integración en Tauri (adapter hexagonal)

- **Dependencias normales:** `lopdf ^0.42` (¡el parser es lopdf!), adobe-cmap-parser, cff-parser, postscript, type1-encoding-parser, euclid, encoding_rs, unicode-normalization, log. Todo Rust puro, sin binarios del sistema ni C: compila limpio en el target Windows de Tauri. docs.rs/crate/pdf-extract/0.12.0.
- **Peso:** superconjunto del árbol de lopdf (incluye su stack cripto aes/cbc/ecb/md-5/sha2/rand vía lopdf). Compilación adicional moderada.
- **Docs:** cobertura **4%** documentada (docs.rs) — la API se aprende del README (3 líneas) y del código.
- **Encaje hexagonal:** ideal para un puerto `ExtractoresDeMovimientosPort` (dominio) implementado por `PdfExtractMovimientoAdapter` en `src-tauri/src/infrastructure/`: leer bytes del archivo, llamar `extract_text_from_mem_by_pages`, parsear líneas con heurísticas/regex hacia `Movimiento { fecha, comercio, importe }`. Sin tauri en el adapter → `cargo test` con fixtures PDF pequeños funciona directo. **Requisito crítico del lote:** envolver el procesamiento por archivo en `std::panic::catch_unwind` (o equivalente) porque los pánicos documentados matarían el command entero; la feature ya exige informar el archivo concreto sin abortar el resto del lote, así que el diseño lo contempla.
- Nota: al depender de `lopdf ^0.42`, en el lockfile convivirían lopdf 0.42 (vía pdf-extract) y cualquier uso directo nuestro de 0.44 si mezcláramos ambos crates — no recomendado; elegir UNO.

### 1.6 Riesgos principales

1. **Pánicos ante PDFs malformados del usuario** (múltiples issues abiertas, #141 como catálogo). Mitigable con catch_unwind por archivo.
2. **Bugs activos justo en nuestra área**: descifrado AES de eStatements (#136 pendiente) y acentos (#155 pendiente). Si el banco del usuario cifra con AES y propietario-password, puede fallar hoy.
3. **Desfase con lopdf**: pdf-extract 0.12 depende de lopdf ^0.42 cuando existe 0.44; los bugs de cifrado históricos vinieron exactamente de ese desfase (#131, #124).
4. **Churn de arquitectura**: hay una PR abierta (#142, mar 2026) portando el motor a `hayro_syntax` (otro parser), con cambios breaking; el proyecto está en transición interna.
5. **Documentación casi inexistente** → curva de depuración apoyada en issues.
6. **Escaneados**: fuera de alcance total (devuelve texto vacío; habría que avisar "PDF ilegible", que la feature ya prevé).

---

## 2. lopdf

### 2.1 Versión, mantenimiento y estado

| Dato | Valor | Fuente |
|---|---|---|
| Versión actual | **0.44.0** (2026-07-10) | API crates.io |
| Primera publicación | 2016-12-23 | API crates.io |
| Descargas | 16.3 M totales / ~8.14 M recientes (~90 días) | API crates.io |
| Repo | J-F-Liu/lopdf: ~2.2k stars, CI activa (badge GitHub Actions) | docs.rs badge / README |
| MSRV | 1.88 en 0.44.0 (1.85 en las de principios de 2026) — **el repo local tiene rustc 1.90.0: cumple** | README + verificación local |
| Cadencia | Muy alta: 11 releases entre ene 2025 y jul 2026 (0.35→0.44), tres solo en junio de 2026 | docs.rs versiones |

El proyecto más activo de los dos y con la comunidad más grande; semver 0.x ⇒ cambios breaking entre minors habituales (habrá que fijar versión exacta en Cargo.toml).

### 2.2 Licencia y costo

- **MIT**, según campo `license` de crates.io y README ("MIT license, with the exception of the Montserrat font" — excepción irrelevante: afecta a una fuente embebida opcional que no usaríamos). Sin costo.

### 2.3 Cobertura real

- **PDFs digitales:** sí — modelo completo del documento (objetos, páginas, content streams, object streams/xref streams PDF 1.5+). Incluye **extracción de texto propia**: `doc.extract_text(&[page_numbers]) -> Result<String>` (README, sección Decrypt incluye ejemplo real).
- **Cifrado/contraseña:** el mejor de los dos. Detecta `Encrypt` en trailer, descifra automáticamente contraseñas vacías, expone `authenticate_password` y `LoadOptions::with_password`. Limitaciones declaradas por el propio README: *"Currently only supports PDFs encrypted with empty passwords"* (automáticamente), *"Password-protected PDFs require manual authentication"*, *"Some encryption algorithms may not be fully supported"*. Suite de tests de descifrado dedicada (`tests/decryption.rs`).
- **PDFs escaneados:** **NO** (misma razón: no rasteriza ni hace OCR). Caso afín documentado: PDF procesado con OCRmyPDF (capa de texto invisible CID Identity-H) produce `"Identity-H Unimplemented"` (#425, jul 2025) — o sea, hasta capas OCR de terceros pueden fallar según la fuente.
- **Robustez:** mejor perfil que pdf-extract en parsing general (los fallos graves reportados contra pdf-extract son de sus parsers de fuente propios, no de lopdf), aunque `extract_text` devuelve `Err` global si una sola página tiene un CMap problemático (#330); existe variante tolerante `extract_text_chunks`/fragmentos (PR #342) que devuelve lo extraíble marcando los errores por fragmento.

### 2.4 Calidad del texto para tablas de extractos

- El extractor de lopdf es, en palabras de su propia contribuidora en PR #492: *"a glyph-run collector, not a text-state-machine renderer… does NOT add full text-state tracking (Tm position math, reading-order inference, column detection)"*. Es decir: **orden de flujo, sin columnas ni geometría** — mismo modelo mental que pdf-extract.
- Palabras pegadas cuando el generador posiciona con matrices en vez de espacios: visible en la salida de ejemplo de PR #342 ("Loremipsumdolorsitamet…").
- Hasta hace poco **perdía silenciosamente** el texto emitido con los operadores `'`, `"`, `T*` (común en generadores de formularios/gobierno); corregido en commits 6474715/5388c6e (PR #492).
- ToUnicodeCMap no conforme a spec ⇒ error de página entera en `extract_text` (#330), tolerado por fragmentos con `extract_text_chunks`.
- **A favor:** al ser low-level, un adapter puede recorrer los operadores de contenido (`Td/TD/Tm/TJ/Tj`) y obtener **coordenadas reales** para reconstruir filas/columnas por posición — es trabajo DIY (días, con máquina de estados de texto y CTM), pero es el único camino de los dos para ordenar columnas de forma fiable.

### 2.5 Integración en Tauri (adapter hexagonal)

- **Dependencias core (siempre):** aes, cbc, ecb, md-5, sha2, rand, getrandom (stack cripto del descifrado), flate2, nom 8, encoding_rs, indexmap, rangemap, stringprep, weezl, bitflags, itoa, log, thiserror. **Features default de 0.44.0: chrono + jiff + rayon + time** (cuatro backends de fecha + parseo paralelo activados por defecto) — para nuestro uso conviene `default-features = false` y activar solo lo mínimo (ninguna fecha backend es necesaria: parseamos nosotros las fechas de los movimientos). docs.rs/crate/lopdf/0.44.0/features.
- Opcionales que NO activaríamos: `image` (embed_image), `ttf-parser` (font_embedding), `tokio` (async), `serde`.
- **Todo Rust puro, sin binarios externos** → build Windows de Tauri sin fricción; peso de compilación moderado-alto en default, ajustable bajando features.
- **Docs:** 42% documentado (docs.rs), README extenso con ejemplos ejecutables incluido descifrado.
- **Encaje hexagonal:** idéntico patrón puerto/adapter que pdf-extract. Camino A (rápido): `extract_text`/`extract_text_chunks` + heurísticas de líneas. Camino B (robusto para tablas): walk manual de `Content::operations` capturando posición (Tm/Td/TJ) → agrupar por Y en filas y ordenar por X en columnas → extracción determinista de fecha/comercio/importe. Ambos testeables con `cargo test` y fixtures, sin tauri.

### 2.6 Riesgos principales

1. **Calidad out-of-the-box insuficiente para tablas**: sin orden de lectura/columnas; la alternativa seria (camino B) es ingeniería propia significativa que este proyecto tendría que mantener.
2. **Casos límite de CMap/fuentes CID** (#330, #425, #125): extractos con fuentes raras pueden fallar página entera o dar caracteres incorrectos.
3. **Descifrado con contraseña real requiere intervención** (authenticate_password) y "algunos algoritmos pueden no estar soportados" (README).
4. **Semver 0.x + MSRV que sube rápido** (1.85→1.88 en pocos meses): obliga a actualizar toolchain o clavar versión.
5. **Escaneados**: fuera de alcance, igual que pdf-extract.

---

## 3. Tabla comparativa final

| Criterio | pdf-extract 0.12.0 | lopdf 0.44.0 |
|---|---|---|
| Último release | 2026-06-25 (hace ~2 meses) | 2026-07-10 (hace ~6 semanas) |
| Cadencia 2025–2026 | Regular (5 releases) | Muy alta (11 releases) |
| Descargas recientes (~90d) | ~2.43 M | ~8.14 M |
| Licencia | MIT | MIT (excepción fuente Montserrat, irrelevante) |
| Costo / restricciones | Ninguno | Ninguno |
| Papel | Extractor de texto alto nivel (usa lopdf ^0.42 internamente) | Parser/manipulador bajo nivel + `extract_text` propio |
| Texto de PDFs digitales | Sí (una llamada) | Sí (`extract_text`) o DIY con coordenadas |
| Contraseña/cifrado | Sí (`*_encrypted`, `LoadOptions::with_password`); bug abierto con AES de eStatements reales (#136) | Sí, el más completo (auto password vacía + `authenticate_password`); limitaciones declaradas |
| Escaneados (OCR) | No | No |
| Orden de lectura / columnas | No (flujo de contenido) | No en `extract_text` (declarado por maintainer); posible DIY con coordenadas |
| Espaciado/palabras pegadas | Bugs históricos corregidos (#79) | Caso conocido con generadores que no emiten espacios (PR #342) |
| Acentos/español | Riesgo abierto: é→Ø con CFF subsets (PR #155); histórico umlauts (#22) | Depende de ToUnicode; errores CMap rompen página en `extract_text` (#330), tolerable con chunks |
| Robustez ante malformados | Débil: ~50 puntos de pánico catalogados (#141) | Mejor; errores tipificados como `Result`, aunque `extract_text` es all-or-nothing (#330) |
| Dependencias transitivas | Superset de lopdf + 4 parsers de fuente + euclid | Core: stack cripto + flate2 + nom 8 + encoding_rs…; default añade chrono+jiff+rayon+time (recortables) |
| Docs | 4% documentada | 42% documentada, README ejemplar |
| MSRV | No declarado | 1.85–1.88 (repo local 1.90: OK) |
| Esfuerzo adapter MVP | Horas: `extract_text_from_mem_by_pages` + heurísticas de línea + catch_unwind | Semana(s) si se quiere orden por columnas (walk de operadores); horas si se acepta igual calidad que pdf-extract |
| Riesgo nº1 | Pánicos + 2 fixes pendientes que nos afectan directamente (#136, #155) | Habría que construir el análisis posicional nosotros |

## 4. Recomendación razonada para este caso

**Candidato recomendado: `pdf-extract` 0.12** (con mitigaciones explícitas), **no `lopdf` directo**:

1. **Relación real entre ambos:** pdf-extract está construido SOBRE lopdf; adoptarlo da el parser de lopdf más la capa de manejo de fuentes/CMap/descifrado que es justamente donde pdf-extract aporta valor sobre lopdf crudo. Usar lopdf solo tiene sentido si vamos a invertir en el análisis posicional DIY (camino B), que es un proyecto en sí mismo.
2. **El requisito duro de la feature es el lote con errores por archivo**, no la perfección de columnas: la UI presenta tabla revisable donde el humano confirma/edita/descarta cada movimiento. Ese diseño tolera imperfecciones de extracción; NO tolera un pánico que mate el command. Con catch_unwind por archivo + informe de archivo ilegible (ya exigido por el criterio de aceptación), pdf-extract queda dentro de lo razonable.
3. **Los extractos objetivo son digitales y en español**: mayoría WinAnsi/ToUnicode correctos → el riesgo de acentos (#155) es de cola, y el de AES (#136) se aplica solo a bancos que cifran con owner-password; ambos tienen workaround parcial (probar `_encrypted` con contraseña vacía) y están en revisión upstream.
4. **Coste de oportunidad:** con lopdf directo, para igualar la calidad de fuentes de pdf-extract acabaríamos reimplementando parte de pdf-extract dentro de infrastructure — código propio que además violaría el espíritu de "lógica en casos de uso, adapters finos".

Condiciones que acompañarían la aprobación humana (decisión exclusiva del humano, materializada en `docs/dependencies.md`):
- Fijar `pdf-extract = "=0.12.0"` (semver 0.x, evita sorpresas de breaking changes).
- Adapter en `infrastructure/` con catch_unwind por archivo y error nombrado `PdfIlegible`/`PdfCorrupto`.
- Corpus de fixtures en `tests/`: extracto digital español típico, uno con acentos en comercios, uno cifrado con password vacía, uno corrupto (para el camino infeliz del lote).
- Registrar en `docs/dependencies.md` las dos issues abiertas relevantes (#136, #155) como deuda conocida.

**Cuándo preferir lopdf:** si tras probar con extractos reales del usuario los movimientos salieran intercalados por columnas (celdas posicionadas independientes), el análisis posicional DIY solo compensa hacerlo sobre lopdf — en ese caso se migraría el adapter sin tocar dominio ni puertos.

## 5. Pendientes anotados (fuera de esta sesión, para el líder/humano)

- Evaluar `pdf_oxide` (Rust, MIT/Apache-2.0, afirma orden de lectura configurable y salida markdown; apareció en la investigación de terceros como reemplazo directo de pdf-extract) — no investigada aquí por quedar fuera del encargo.
- La feature 12 menciona también `pdfjs-dist` (npm, frontend) como candidato: requeriría investigación propia (peso WASM en Tauri, licencia Apache-2.0) antes de decidir.
- Probar AMBOS crates contra 2–3 extractos reales del banco del humano antes de aprobar: es el único test de verdad para la heurística fecha/comercio/importe.

## 6. Fuentes

- crates.io API pdf-extract: https://crates.io/api/v1/crates/pdf-extract (versión 0.12.0, fechas, licencia MIT, descargas)
- crates.io API lopdf: https://crates.io/api/v1/crates/lopdf (versión 0.44.0, fechas, licencia MIT, descargas, features)
- docs.rs pdf-extract 0.12.0 (deps y cobertura docs): https://docs.rs/crate/pdf-extract/0.12.0
- docs.rs pdf-extract índice API (funciones *_encrypted, LoadOptions, OutputDev): https://docs.rs/pdf-extract/latest/pdf_extract/index.html y https://docs.rs/pdf-extract/latest/pdf_extract/struct.LoadOptions.html
- docs.rs lopdf 0.44.0 (deps): https://docs.rs/crate/lopdf/0.44.0 · features: https://docs.rs/crate/lopdf/0.44.0/features
- README lopdf master (descifrado, features, licencia): https://raw.githubusercontent.com/J-F-Liu/lopdf/master/README.md
- Repos: https://github.com/jrmuizel/pdf-extract (stars/issues/contribuidores) · https://github.com/J-F-Liu/lopdf
- lopdf PR #492 (operadores ' " T*; cita "glyph-run collector… no reading-order inference"): https://github.com/J-F-Liu/lopdf/pull/492
- lopdf issue #330 + PR #342 (ToUnicodeCMap errors, extract_text_chunks, palabras pegadas): https://github.com/J-F-Liu/lopdf/issues/330 · https://github.com/J-F-Liu/lopdf/pull/342
- lopdf issue #425 (OCRmyPDF/Identity-H): https://github.com/J-F-Liu/lopdf/issues/425
- pdf-extract PR #136 (AES eStatement bancario, pendiente): https://github.com/jrmuizel/pdf-extract/pull/136
- pdf-extract PR #131 (texto vacío por bug cifrado lopdf 0.36): https://github.com/jrmuizel/pdf-extract/pull/131
- pdf-extract issue #98 (UnsupportedEncryption, cerrada): https://github.com/jrmuizel/pdf-extract/issues/98
- pdf-extract PR #155 (é→Ø encoding CFF, abierta): https://github.com/jrmuizel/pdf-extract/pull/155
- pdf-extract issue #141 (~50 pánicos, forks endurecidos): https://github.com/jrmuizel/pdf-extract/issues/141
- pdf-extract issues #104 (pánico CMap), #134 (pánico inline image), #94 (pánico widths, cerrada), #79 (espaciado, cerrada), #22/#9 (unicode faltante): URLs github.com/jrmuizel/pdf-extract/issues/<n>
- Evaluación de terceros sobre pdf-extract v0.7 (ironclaw #1311): https://github.com/nearai/ironclaw/issues/1311

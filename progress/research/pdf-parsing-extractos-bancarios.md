# Investigación: fiabilidad del parsing de fecha/comercio/importe en extractos bancarios PDF

- **Fecha**: 2026-08-22 · **Agente**: explorer
- **Encargo**: ¿qué tan fiable es extraer fecha, comercio/concepto e importe de
  estados de cuenta bancarios en PDF (bancos españoles/hispanohablantes), y qué
  estrategia de parsing conviene? Alimenta la discusión de la feature futura de
  importación de extractos (relacionada con la 12 `diagnostico-pdf`, hoy
  `blocked` a la espera de aprobación humana de dependencia).
- **Contexto del repo verificado**: Tauri 2 + React 19 + TS (frontend), backend
  Rust hexagonal, tests con `node:test` sin dependencias. Sin ninguna
  dependencia de PDF aprobada aún (`docs/dependencies.md`). La elección concreta
  de librería (crates Rust vs `pdfjs-dist`) se investiga en informes paralelos:
  `progress/research/pdf-evaluacion-crates-rust.md` y
  `progress/research/pdf-evaluacion-pdfjs-dist.md`. Este informe cubre la
  **estrategia**, no la librería.

---

## TL;DR (conclusión accionable)

1. **Para PDFs nativos descargados del portal del banco, la capa de texto es
   fiable** (los genera el propio sistema del banco, no son escaneos). Lo que
   **no** es fiable es tratarla como texto plano: el orden interno del texto
   del PDF no coincide necesariamente con el orden visual, y cada banco usa un
   layout distinto. El ecosistema open source converge en: **parser por
   banco/plantilla + reconstrucción de filas por coordenadas (x,y)**.
2. La estrategia recomendada es: extraer palabras con coordenadas → reconstruir
   líneas visuales por proximidad vertical → segmentar movimientos con
   heurísticas (fecha al inicio, importe al final) → **validar contra los
   totales/saldos impresos en el propio extracto** («golden rule») → tabla
   revisable en UI. Con esa validación cruzada, la revisión humana por fila
   **sí** mitiga suficientemente los errores residuales para uso personal.
3. Los PDFs escaneados serán minoritarios en este caso de uso (los extractos se
   descargan del portal); **posponer OCR es razonable**: detectar «sin capa de
   texto» con un umbral de caracteres por página e informar «archivo ilegible»
   sin abortar el lote.

---

## 1. Fiabilidad práctica y experiencias documentadas

### 1.1 El referente del sector rechaza el PDF a propósito

Firefly III (el gestor de finanzas personales self-hosted más conocido)
documenta en su guía oficial de importación: *"PDF files will never be
supported. Sorry about that."* Su Data Importer acepta CSV y CAMT.05x y dirige
a terceros para lo demás.

- Fuente: <https://docs.firefly-iii.org/how-to/data-importer/import/file/>

Lectura para mfinance: no es que el PDF sea imposible; es que mantener parsers
por banco es un coste recurrente (los bancos cambian layouts sin avisar) y por
eso prefieren formatos estructurados. Si la feature quiere éxito a largo plazo,
la tabla revisable con confirmación humana es exactamente el mecanismo que hace
tolerable ese mantenimiento.

### 1.2 Proyectos que sí parsean PDFs de bancos hispanohablantes (funcionan, pero por banco)

| Proyecto | Banco | Técnica | Lección |
|---|---|---|---|
| [bbva2pandas](https://github.com/ablancolopez/bbva2pandas) (Python, GPL-3) | BBVA España | `pdftotext` (poppler) con layout + parseo de líneas | Existe y se mantiene para el extracto mensual concreto de BBVA ES: un parser por plantilla de extracto |
| [bbva-monthly-statement-pdf-to-csv](https://github.com/economyssive/bbva-monthly-statement-pdf-to-csv) (Java) | BBVA España | Texto del PDF → CSV con columnas FECHA OPERACIÓN\|FECHA VALOR\|TIPO\|DESCRIPCIÓN\|IMPORTE\|SALDO | El mismo esquema de columnas; otro implementador independiente confirma viabilidad |
| [account-statement-parsers](https://github.com/Ovski4/account-statement-parsers) (Python) | N26, Boursorama, Crédit Mutuel… | Módulos por banco sobre texto del PDF | Soporte multi-banco = colección de módulos pequeños por entidad, no un parser universal |
| [CONCILIACION `pdf_reader.py`](https://github.com/ericknavarro316-ship-it/CONCILIACION/blob/cfd6e898/pdf_reader.py) | BBVA (México) | pdfplumber `extract_words`: agrupar por Y redondeada (±2px), columnas por rangos de `x0`, fusión de líneas de continuación, blacklist de frases del pie | Ejemplo completo y legible de la técnica de coordenadas aplicada a un extracto en español (CARGO/ABONO/SALDO) |
| [pocketwatchai](https://github.com/Oguama77/pocketwatchai) (FastAPI+React) | Varios (Revolut, FirstBank…) | Pipeline multi-estrategia puntuado: tablas con reglas → reconstrucción por posición de palabras → OCR; elige la candidata que mejor cuadra con los totales impresos del extracto | *"many bank PDFs have no ruled tables (Revolut), some have rules but collapse every row into a single cell"*; puntúa cada extracción contra Total Credit/Debit y saldos |
| [banksheet](https://github.com/tio-ze-rj/banksheet) (TS/Node) | Bancos BR/CA/US (plugin por banco) | Regex sobre texto; utilidades de importe por país | Aviso explícito a contribuidores: *"Use pdf-parse or pdfjs-dist to inspect the raw extracted text — it often looks very different from the visual PDF"* (texto pegado, espacios ausentes) |
| [monopoly](https://github.com/benjamin-awd/monopoly) (Python) | Bancos SG/ch | Config declarativa por banco + *safety check* que valida totales de cargos/abonos | El check de totales como red de seguridad por defecto |
| [bank-statement-parser](https://github.com/akhilnarang/bank-statement-parser) (Python) | HDFC, ICICI… (India) | pdfplumber + PyMuPDF; devuelve además `reconciliation` con `opening + credits − debits == closing` (delta 0.00) | La reconciliación de saldo como salida de primera clase del parser |

Nota de honestidad: el encargo citaba «moneybalancer» como ejemplo; **no he
encontrado ninguna fuente fiable** sobre ese proyecto concreto (ni repo activo
ni documentación). No lo uso como evidencia. Los proyectos listados arriba sí
están verificados en sus repos/README.

### 1.3 Alternativa estructurada que existe en España (relevante para la spec)

Todos los bancos españoles ofrecen exportar el extracto en **Norma 43
(AEB/cuaderno 43)**, un formato de texto fijo de 80 caracteres diseñado para
intercambio máquina-máquina, con importe con signo explícito (carácter `1`=+/`2`=−),
fechas YYMMDD y conceptos multilínea (registros 23/24). Rutas de exportación
documentadas por banco: CaixaBank, BBVA, Santander, Sabadell, Bankinter.

- Fuentes: <https://docs.frihet.io/en/finanzas/aeb43-norma43> ·
  <https://www.npmjs.com/package/@frihet/aeb43-parser> ·
  <https://github.com/enricopesce/norma43> · módulo Odoo OCA
  <https://github.com/OCA/l10n-spain/tree/15.0/l10n_es_account_statement_import_n43>

Implicación: **el PDF es el peor input disponible** cuando existe N43/CSV. Para
la spec: aceptar PDF como caso principal pedido, pero dejar la puerta abierta
(añadir N43/CSV después es órdenes de magnitud más fiable y trivial de parsear).

**Respuesta al interrogante**: ¿capa de texto fiable? Sí en PDFs nativos
(descarga del portal); heterogeneidad: total entre bancos (columnas, orden,
signos, idiomas de cabecera, pies con publicidad) — por eso todos los proyectos
serios terminan con un perfil/plantilla por banco y validación por totales.

## 2. Estrategias de parsing (qué funciona, con fuentes)

### 2.1 Por qué NO basta regex sobre el texto plano

- El formato PDF no tiene concepto de «línea» ni de «tabla»: son operadores de
  posicionamiento de glifos. Respuesta de mantenedor de pdf.js: *"there's not
  really any concept of 'lines' in the PDF specification... glyphs are rather
  positioned absolutely"* — hay que reconstruir las líneas uno mismo a partir de
  los transforms. <https://github.com/mozilla/pdf.js/issues/9732>
- El array de items de `getTextContent()` sigue el **orden interno del archivo**,
  no el visual: hay documentos reales donde el pie de página sale primero, u
  otras páginas donde el orden está revuelto (típico tras OCR o conversiones).
  <https://github.com/mozilla/pdf.js/issues/14493> ·
  <https://github.com/mozilla/pdf.js/issues/17191>
- Además el texto llega fragmentado (una palabra puede partirse en varios items,
  p. ej. `"J"` + `"ohns"`), con flags `hasEOL` y transform `[..., x, y]`.
  <https://github.com/mozilla/pdf.js/issues/18201>

Conclusión: regex sobre `extract_text()` plano solo vale como **detección del
banco/formato** (buscar cabeceras características). El parseo de movimientos
necesita coordenadas.

### 2.2 Reconstrucción de líneas visuales por coordenadas (el núcleo)

Patrón común (documentado paso a paso por StatementSheet, equipo que lo tiene
en producción):

1. Extraer fragmentos de texto con su caja `(page, x, y, width, height)` —
   en pdf.js: `items[].transform` (e=x, f=y) y `width`; en pdfplumber:
   `extract_words()` da `x0/x1/top/bottom`.
2. Ordenar por página → Y → X.
3. Agrupar en filas visuales con **tolerancia vertical ~2–4 px** para PDFs
   digitales (mayor para OCR). Demasiado pequeña parte una fila en dos; demasiado
   grande fusiona filas vecinas.
4. Mejora clave medida en producción: combinar la tolerancia Y con **solapamiento
   vertical de alturas de texto** (overlap de `[top, bottom]`) en vez de un único
   umbral; evita partir filas cuyo importe va 3–4 px más bajo que la descripción.
   Bug real documentado: un importe alineado visualmente pero 4 px más bajo se
   parseaba como fila aparte.

- Fuente completa:
  <https://statementsheet.com/technical-guides-articles/rebuilding_rows_from_positioned_pdf_text/>

### 2.3 Detección de columnas

Tres variantes vistas, de simple a robusto:

- **Cabeceras como anclas**: localizar las palabras de la cabecera de la tabla
  (`Fecha`, `Descripción`, `Importe`, `Saldo`, `CARGO`, `ABONO`…) con `search()`,
  tomar sus `x0/x1` como límites de columna y pasarlos como líneas verticales
  explícitas al extractor. Recomendado por el autor de pdfplumber en discusión
  oficial: <https://github.com/jsvine/pdfplumber/discussions/943>
- **Rangos fijos por plantilla de banco**: una vez calibrado un extracto,
  acotar columnas por rangos de `x0` (ejemplo real de BBVA: fecha `<50`,
  descripción `105..225`, cargo `360..415`, abono `415..470`, saldo `470..535`).
  Simple y muy estable mientras no cambie el layout. Fuente: `pdf_reader.py`
  de CONCILIACION (URL en §1.2).
- **Estrategia `text` de tablas** (`vertical_strategy: "text"`) con tolerancias
  ajustables (`snap_y_tolerance`, `intersection_x_tolerance`): flexible, pero
  las tolerancias óptimas difieren por banco.
  Fuente: <https://localextract.app/blog/extract-data-from-bank-statement-pdf>

### 2.4 Heurísticas de línea (segmentación de movimientos)

Combinación usada por los proyectos exitosos:

- **Fila nueva de movimiento** = la línea empieza con una fecha válida
  (`dd/mm/yyyy`, `dd/mm/yy` o `dd MMM`) en la zona izquierda Y contiene ≥1
  token de importe al final (patrón monetario con separadores).
- **Línea de continuación** (concepto multilínea) = sin fecha inicial y sin
  importe; se concatena al movimiento anterior **si** arranca dentro de la
  banda X de la columna descripción (para no tragarse notas del pie ni
  publicidad del banco — el proyecto CONCILIACION mantiene una blacklist
  explícita de frases del pie tipo «Estimado Cliente…»).
  Fuentes: CONCILIACION `pdf_reader.py`; regla equivalente en
  [adoptai/cpa-skills](https://github.com/adoptai/cpa-skills/blob/dev/markdown/bank-statement-to-excel.md):
  *"A description continuing on the next physical line has no date and no
  amount. Join it to the transaction above. Use the word coordinates to confirm
  it starts in the description column."*
- **Delimitar la tabla**: empezar a capturar tras la cabecera reconocida y
  parar en líneas de totales («Total movimientos», «Saldo final…»). Mismo
  patrón en CONCILIACION y en los demás.

### 2.5 Manejo de signos (cargos/abonos)

- **Columnas separadas CARGO/ABONO (o Money In/Money Out)**: la forma más común;
  el signo viene de **qué columna** contiene el importe, no de un carácter. Es
  literalmente imposible saberlo sin la posición horizontal: *"it was impossible
  to tell if a monetary amount was a debit or credit without knowing its
  horizontal position on the page"*
  (<https://stevesdevnotes.hashnode.dev/extracting-usable-data-from-pdf-bank-statements>).
- **Signo explícito** `-1.234,56`, o **trailing minus** `123,45-` (formato
  contable europeo), o **paréntesis** `(123,45)` (formato Excel contable).
  Referencia de implementación que los trata todos: PR deltalytix
  <https://github.com/hugodemenez/deltalytix/pull/165>.
- Trampa documentada al colapsar dos columnas en un importe firmado: el
  *sign-flip* silencioso (un mismo día con cargo y abono sin fusionar invierte
  el signo y los libros derivan el doble). Fuente:
  <https://www.statementedge.com/blog/aib-lloyds-barclays-to-xero-2026>
- Regla práctica: si ambas columnas tienen valor en la misma fila, no decidir
  por nuestra cuenta → marcar la fila como «requiere revisión» en la UI.

## 3. Formato de importe español: trampas concretas

Formato canónico: `1.234,56 €` (punto = miles, coma = decimal, espacio duro
antes del símbolo). Lista de trampas verificadas en incidencias reales:

1. **Orden de limpieza importa**: quitar primero los puntos de millares y luego
   sustituir la coma decimal; hacerlo al revés corrompe valores. Guía con el
   orden correcto y los patrones a inspeccionar (`1.234,56`, `577,50`,
   `(577,50)`, `-`, blanco):
   <https://www.elysiate.com/blog/csv-for-accounting-exports-separators-negatives-and-parentheses>
2. **Ambigüedad `1.234` / `12.345`**: ¿mil doscientos treinta y cuatro o 1,234?
   Heurística razonable para extractos ES: si hay coma decimal presente en el
   documento, el punto es miles; un grupo de exactamente 3 dígitos tras un punto
   con contexto de columna monetaria = miles. Caso señalado como ambiguo en
   revisión de código: <https://github.com/hugodemenez/deltalytix/pull/165>
3. **Trailing minus y paréntesis**: `123,45-` y `(123,45)` significan negativo.
4. **Espacios duros (NBSP/U+00A0 o espacio fino) como separador de miles** y
   símbolo `€` pegado o separado: normalizar whitespace antes de parsear.
5. **Guiones y ceros**: `—` o `-` en columna de importe suele ser «no aplica»,
   no cero negativo (Excel contable muestra ceros como guiones).
6. **No usar float**: normalizar a texto canónico y convertir a entero de
   céntimos o decimal exacto; la imprecisión float rompe la comparación de
   totales/saldos. Referencia: misma guía Elysiate («cast into precise numeric
   types», pandas `decimal`/`thousands` como referencia del patrón).
7. **El signo lógico puede invertirse respecto al signo impreso** según el banco
   (algunos imprimen cargos positivos en columna CARGO). Decidir el convenio
   (negativo = gasto) en un solo sitio del dominio.

Casos mínimos para el test unitario del parser de importe (derivados de las
fuentes anteriores): `1.234,56` · `1.234` · `12.345` · `0,00` · `-237,08` ·
`237,08-` · `(237,08)` · `1.234.567,89` · `€ 89,90` · `89,90 €` · `—`.

## 4. PDFs escaneados: proporción realista y posponer OCR

- **En este caso de uso el escaneado será raro**: los extractos de Santander,
  BBVA, CaixaBank, Revolut o N26 se **descargan** del portal/app y nacen
  digitales (por eso los parsers del §1 funcionan solo con capa de texto). El
  escaneo aparece si el usuario digitaliza el papel que algunos bancos envían
  por correo.
- Datos de flujos reales (contexto AP empresarial, peorcista respecto a nuestro
  caso): distribución de un stream real de procesamiento de facturas — 58 %
  PDF digital conocido, 21 % PDF digital nuevo, **14 % escaneo limpio 300 dpi**,
  **7 % foto/escaneo pobre** (≈21 % escaneado total); la clase foto queda en
  81,5 % de precisión de campo y «nunca straight-through». Fuente (blog de
  proveedor, tomar como orden de magnitud):
  <https://autoolize.com/blog/invoice-ocr-in-production/>
- Contexto histórico de facturas en enterprises: ~70 % llegan como papel/PDF/
  adjuntos frente a ~30 % e-factura real (Ardent Partners, 2015):
  <https://payablesplace.ardentpartners.com/2015/04/the-persistent-paper-problem-in-accounts-payable-and-how-to-attack-it/>
- La calidad del OCR depende críticamente de la imagen: 98–99 % en escaneos
  limpios vs ~75 % en fotos torcidas (estimaciones de proveedor):
  <https://www.gennai.io/blog/pdf-invoice-extraction-technical-guide>
- **Detección barata de «escaneado»**: umbral de caracteres extraíbles por
  página (implementación de referencia con `SCAN_CHAR_THRESHOLD = 60`
  chars/página y flag `scanned` por página:
  <https://github.com/adoptai/cpa-skills/blob/dev/markdown/bank-statement-to-excel.md>;
  patrón equivalente de enrutado por baja densidad de texto en
  <https://github.com/sebastienrousseau/bankstatementparser/>).

**Veredicto**: posponer OCR es razonable y es lo que hace el ecosistema
(monopoly: OCR opcional; MoneyLens/bankstatementparser: OCR como fallback
separable; pocketwatchai: sin binario Tesseract todo funciona menos los
escaneos, y devuelven un error accionable). Para la spec: si una página no pasa
el umbral de texto → estado `ilegible` para ese archivo con mensaje claro, y el
lote continúa con el resto. OCR = feature futura con dependencia externa pesada
(binario Tesseract o servicio), que además requeriría decisión humana de
dependencia igual que ahora.

## 5. Pipeline recomendado para mfinance

Diseño alineado con la arquitectura hexagonal del repo (todo esto vive en
dominio/casos de uso; la librería PDF queda detrás de un puerto):

```
archivo(s) → clasificar → extraer tokens+coords → líneas visuales
→ segmentar movimientos → validar campos → validación global (golden rule)
→ propuesta (tabla revisable) → confirmación humana → alta de movimientos
```

1. **Clasificar**: ¿es PDF? ¿tiene capa de texto (umbral chars/página)? Si no →
   resultado por archivo `ilegible`, el lote sigue. Si el PDF está cifrado con
   contraseña → estado propio `protegido` (varios bancos protegen con la fecha
   de nacimiento; pedir contraseña en UI es opción futura).
2. **Extraer** items `{page, str, x, y, width, height}` con la librería elegida
   (ver informes paralelos de crates vs pdfjs-dist).
3. **Reconstruir filas visuales**: ordenar por (página, Y, X); agrupar con
   tolerancia Y pequeña + solapamiento vertical (§2.2). Debug: volcado
   `page,y,texto` (técnica recomendada por StatementSheet).
4. **Segmentar movimientos**: cabecera ancla → capturar hasta totales; fila
   nueva = fecha válida al inicio + importe al final; continuación = sin fecha
   ni importe dentro de la banda X de descripción (§2.4).
5. **Validar campos** (por fila): importe es-ES estricto (§3) a céntimos;
   fechas `dd/mm/yyyy` dentro del periodo del extracto; comercio = resto de la
   línea. Filas imposibles → marcadas `requiere revisión`, nunca descartadas en
   silencio.
6. **Golden rule (validación global)** — el ingrediente que separa un juguete de
   algo fiable: `saldo_inicial + Σ abonos − Σ cargos ≈ saldo_final` impreso
   (delta 0,00) y, si el extracto imprime «Total cargos/abonos», comparar también
   con ellos. Produce un **score por archivo/lote** (`verificado` /
   `discrepancia` / `no verificable`) que la UI muestra. Fuentes del patrón:
   <https://github.com/akhilnarang/bank-statement-parser> (delta 0.00),
   <https://github.com/Oguama77/pocketwatchai> (scoring contra totales impresos),
   <https://github.com/sebastienrousseau/bankstatementparser>
   (VERIFIED/DISCREPANCY/UNVERIFIABLE), <https://github.com/benjamin-awd/monopoly>
   (safety check por defecto).
7. **Tabla revisable en UI**: filas editables (fecha, concepto, importe, signo),
   badge de confianza por fila/lote, discrepancias resaltadas; confirmación por
   fila y acción «confirmar todas las correctas». Dedupe idempotente por hash
   `fecha|importe|concepto-normalizado` para tolerar re-subidas (patrón
   `transaction_hash` de bankstatementparser).

**¿Mitiga la revisión humana los errores del parser?** Sí, **pero condicionada**
a que exista la validación global del punto 6:

- Errores *groseros* (fila partida, concepto mezclado, importe ilegible) saltan
  a la vista en una tabla revisable.
- Los errores *peligrosos* son los silenciosos: un dígito cambiado en el OCR de
  un escaneo, un signo volteado al colapsar CARGO/ABONO, o una fila duplicada.
  Sin golden rule, pasan desapercibidos para un revisor que confía en la tabla
  (caso documentado de sign-flip silencioso en §2.5). **Con** golden rule, esos
  mismos errores rompen la cuadratura del saldo y se vuelven visibles
  («discrepancia: revisa antes de confirmar»).
- Conclusión para la spec: la combinación golden rule + revisión por fila es
  suficiente para uso personal; la revisión sola, sin cuadre de saldos, no
  lo es.

## 6. Qué debería cubrir el test e2e automatizado (sin dependencias pesadas)

Problema conocido: los extractos reales tienen PII y **no deben commitearse**
(los propios proyectos lo dicen y generan sintéticos). Patrón consolidado:

- Generar **fixtures sintéticos deterministas** de PDFs con capa de texto y
  **totales conocidos de antemano**, junto con el JSON esperado, commiteados
  ambos. Así la suite deja de probar solo helpers y ejercita el pipeline real.
  Precedentes: issue finview «Generate synthetic PDF fixtures for true
  end-to-end parser regression tests»
  <https://github.com/vfaber2/finview/issues/55>; generador Schwab de decaf
  (reportlab como extra dev-only, «the generator adapts to the parsers»)
  <https://github.com/vjt/decaf/commit/d80559439a01201eb18ce6a388b373d93f0f1d2a>;
  par `digital.pdf` + `scanned.pdf` reproducibles de bankstatementparser
  <https://github.com/sebastienrousseau/bankstatementparser/blob/main/examples/hybrid/README.md>.
- En este repo (tests `node:test`, sin deps nuevas): un **generador mínimo en
  stdlib** que emite un PDF válido de 1 página con operadores `Tj/Td` (un PDF
  con texto plano cabe en ~40 líneas de escritura manual) es viable como script
  del arnés (`scripts/<slug>.mjs`, reglas de `docs/architecture.md`); o bien un
  fixture binario pequeño generado una vez y commiteado junto a su JSON
  esperado.

Cobertura mínima del journey subir→analizar→verificar→actualizar:

1. **Happy path**: PDF sintético de 1 página estilo genérico ES (fecha
   `dd/mm/yyyy`, concepto, importe `1.234,56`, saldo) → N movimientos extraídos,
   importes exactos en céntimos, saldos cuadran → estado `verificado`.
2. **Concepto multilínea**: un movimiento cuya descripción ocupa 2–3 líneas →
   concepto concatenado, sin filas fantasma.
3. **Dos columnas cargo/abono** con celdas vacías alternas → signo correcto por
   columna; fila con ambas columnas → marcada `requiere revisión`.
4. **Importes trampa** (§3): millares, trailing minus, guion en columna, NBSP.
5. **Página sin capa de texto** (fixture «escaneado»: PDF con solo imagen o
   vacío de texto) → estado `ilegible` para ese archivo y **el lote continúa**
   con los demás (assert: los otros archivos se procesan).
6. **Discrepancia deliberada**: totales que no cuadran con el saldo impreso →
   estado `discrepancia` visible y bloqueo de confirmación masiva.
7. **Re-subida del mismo archivo** → dedupe: ningún movimiento duplicado.
8. **Archivo corrupto/truncado** → error controlado con mensaje, sin abortar el
   lote ni petar la UI.
9. **Persistencia**: tras confirmar, los movimientos aparecen en el dominio y
   sobreviven a recarga (integración con el puerto de persistencia ya existente).

Con 1–9 en verde, la feature tiene confianza real de extremo a extremo sin
haber tocado un extracto verdadero; los extractos reales de los bancos del
usuario quedan para la fase de calibración manual (plantillas por banco),
fuera de CI.

## 7. Pendientes detectados (no investigados aquí)

- Elección concreta de librería de extracción (crates Rust `pdf-extract`/
  `lopdf` vs npm `pdfjs-dist`): en curso en
  `progress/research/pdf-evaluacion-crates-rust.md` y
  `progress/research/pdf-evaluacion-pdfjs-dist.md`.
- Soporte futuro de entrada Norma 43 / CSV de banca española (más fiable que
  PDF; ver §1.3) — candidato natural para otra feature.
- PDFs protegidos con contraseña (flujo de UI para pedirla).

## Fuentes

- Firefly III Data Importer — tipos de archivo:
  <https://docs.firefly-iii.org/how-to/data-importer/import/file/>
- bbva2pandas (BBVA España, pdftotext/poppler):
  <https://github.com/ablancolopez/bbva2pandas>
- BBVA monthly statement PDF→CSV (Java):
  <https://github.com/economyssive/bbva-monthly-statement-pdf-to-csv>
- account-statement-parsers (N26, Boursorama…):
  <https://github.com/Ovski4/account-statement-parsers>
- CONCILIACION `pdf_reader.py` (BBVA MX, pdfplumber por coordenadas):
  <https://github.com/ericknavarro316-ship-it/CONCILIACION/blob/cfd6e898/pdf_reader.py>
- pocketwatchai (multi-estrategia + scoring contra totales):
  <https://github.com/Oguama77/pocketwatchai>
- banksheet (plugins por banco, avisos sobre texto extraído):
  <https://github.com/tio-ze-rj/banksheet>
- monopoly (configs por banco + safety check):
  <https://github.com/benjamin-awd/monopoly>
- bank-statement-parser (reconciliación delta 0.00):
  <https://github.com/akhilnarang/bank-statement-parser>
- bankstatementparser (routing determinista/LLM/vision, synthetic PDFs):
  <https://github.com/sebastienrousseau/bankstatementparser/> y
  <https://github.com/sebastienrousseau/bankstatementparser/blob/main/examples/hybrid/README.md>
- Norma 43 / AEB43: <https://docs.frihet.io/en/finanzas/aeb43-norma43> ·
  <https://www.npmjs.com/package/@frihet/aeb43-parser> ·
  <https://github.com/enricopesce/norma43> ·
  <https://github.com/OCA/l10n-spain/tree/15.0/l10n_es_account_statement_import_n43>
- pdf.js: sin concepto de línea (mantenedor):
  <https://github.com/mozilla/pdf.js/issues/9732>; orden interno ≠ visual:
  <https://github.com/mozilla/pdf.js/issues/14493> ·
  <https://github.com/mozilla/pdf.js/issues/17191>; fragmentación de items y
  transform: <https://github.com/mozilla/pdf.js/issues/18201>
- StatementSheet — reconstrucción de filas por coordenadas (producción):
  <https://statementsheet.com/technical-guides-articles/rebuilding_rows_from_positioned_pdf_text/>
- Steve's Dev Notes — columnas por posición horizontal (débito vs crédito):
  <https://stevesdevnotes.hashnode.dev/extracting-usable-data-from-pdf-bank-statements>
- pdfplumber discussion #943 (cabeceras como anclas de columna):
  <https://github.com/jsvine/pdfplumber/discussions/943>
- LocalExtract — comparativa Tabula/pdfplumber/Camelot, tolerancias por banco:
  <https://localextract.app/blog/extract-data-from-bank-statement-pdf>
- adoptai/cpa-skills — umbral de detección de escaneado y reglas de tabla:
  <https://github.com/adoptai/cpa-skills/blob/dev/markdown/bank-statement-to-excel.md>
- deltalytix PR #165 — parser de importes europeos (trailing minus, NBSP,
  ambigüedades): <https://github.com/hugodemenez/deltalytix/pull/165>
- Elysiate — normalización de separadores/negativos antes de cast:
  <https://www.elysiate.com/blog/csv-for-accounting-exports-separators-negatives-and-parentheses>
- StatementEdge — sign-flip al colapsar Money In/Out:
  <https://www.statementedge.com/blog/aib-lloyds-barclays-to-xero-2026>
- Autoolize — distribución real digital/escaneado y precisión por clase (blog
  proveedor): <https://autoolize.com/blog/invoice-ocr-in-production/>
- Ardent Partners — proporción papel/PDF vs e-factura (2015):
  <https://payablesplace.ardentpartners.com/2015/04/the-persistent-paper-problem-in-accounts-payable-and-how-to-attack-it/>
- Gennai — precisión OCR según calidad de imagen (blog proveedor):
  <https://www.gennai.io/blog/pdf-invoice-extraction-technical-guide>
- finview issue #55 — fixtures sintéticos para e2e:
  <https://github.com/vfaber2/finview/issues/55>
- decaf commit d805594 — generador sintético Schwab con reportlab dev-only:
  <https://github.com/vjt/decaf/commit/d80559439a01201eb18ce6a388b373d93f0f1d2a>

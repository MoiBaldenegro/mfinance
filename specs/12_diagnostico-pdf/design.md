# Diseño — diagnostico-pdf (feature 12)

## Contexto visual

- Hoy la sección Diagnóstico es un placeholder (`src/components/diagnostico-section/DiagnosticoSection.tsx`,
  REQ-05-04) con un resumen estático y su hoja `diagnostico-section.css`.
- Estado deseado: flujo completo dentro de la sección — selector de mes,
  subida múltiple de PDFs, botón Analizar, informe por archivo, tabla
  revisable fila a fila y Confirmación que actualiza el mes. El frontend
  NO parsea nada: recibe del backend los movimientos ya extraídos (veredicto
  humano: pdf-extract en Rust vía comando Tauri; front limpio y ligero).

## Arquitectura backend (extracción íntegra en Rust, hexagonal)

```
#[tauri::command] diagnostico_commands.rs   ← fino, sin lógica
        │ delega
        ▼
application/diagnostico_pdf.rs              ← analizar_lote / confirmar
        │ usa                                  ▲ implementa
        ▼                                      │
domain/comprobante_pdf.rs ◄─ infrastructure/comprobantes_fs.rs
(traits + entidades puras)      infrastructure/pdf_extractor.rs (pdf-extract)
```

- `domain/comprobante_pdf.rs`: entidades puras (`MovimientoDetectado`,
  `ResultadoArchivoPdf`, `EstadoArchivo`, `Coherencia`) y traits-puerto
  `ComprobantesStore` (guardar/listar PDFs) y `PdfMovimientosExtractor`
  (texto → movimientos). Sin `tauri` ni `pdf_extract`: testeable aislado
  con `cargo test`.
- `infrastructure/pdf_extractor.rs`: adapter `PdfExtractExtractor` llama
  `pdf_extract::extract_text_from_mem_by_pages`; el crate vive SOLO aquí
  (pin exacto `=0.12`), con `catch_unwind(AssertUnwindSafe)` por archivo y
  control del umbral de ilegibilidad.
- `infrastructure/comprobantes_fs.rs`: `ComprobantesFsRepository` guarda
  bytes en `Documents/mfinance/comprobantes/<YYYY-MM>/<nombre original>`
  (ruta resuelta de `document_dir()` en `setup`, mismo patrón que
  `JsonSnapshotRepository`; sin crate `dirs`).
- `application/diagnostico_pdf.rs`: caso de uso `analizar_lote(mes)` itera
  archivo a archivo envolviendo cada extracción en `catch_unwind`
  (issue #141 de pdf-extract cataloga ~50 puntos de pánico ante PDFs
  malformados: sin contención, un archivo basura mata el command entero);
  `application/parser_extracto.rs` contiene las heurísticas puras
  texto→movimientos y la validación de coherencia; `confirmar` suma cada
  movimiento aceptado al `MonthlyRecord.gastos` bajo su `ExpenseCategory`
  y persiste el snapshot vía el puerto `Repository` existente.
- `commands/diagnostico_commands.rs`: `subir_comprobantes_cmd`,
  `diagnosticar_comprobantes_cmd` y `confirmar_diagnostico_cmd`; handlers
  finos registrados en `generate_handler!` de `lib.rs`; `AppState`
  ampliado con extractor y store inyectados.
- Transporte binario: `<input type="file" multiple>` → `arrayBuffer()` →
  cadena base64 en los argumentos del command; decodificador base64
  mínimo propio en `infrastructure` (stdlib). Leer bytes en TS es
  transporte, no parseo.

## Estrategia de parsing (MVP de líneas sobre el flujo de contenido)

- pdf-extract entrega texto por página en orden de flujo SIN coordenadas:
  el MVP reconstruye movimientos línea a línea. Si extractos reales
  intercalaran columnas, la migración a walk posicional (lopdf `Td/Tm/TJ`,
  agrupar por Y / ordenar por X) sustituye solo el adapter sin tocar
  dominio ni application (puerto estable).
- Fila nueva = línea que arranca con fecha válida y termina en token de
  importe. Fechas admitidas: `dd/mm/yyyy`, `dd/mm/yy` e ISO `YYYY-MM-DD`;
  se normalizan a `YYYY-MM-DD` del dominio (REQ-12-19).
- Concepto multilínea: línea sin fecha inicial ni importe se concatena al
  movimiento previo (REQ-12-20); blacklist de pies del banco («Estimado
  cliente», «Saldo…», «Total…», publicidad) evita filas fantasma.
- Importes españoles: quitar puntos de millares ANTES de sustituir la coma
  decimal; NBSP/espacio duro normalizado; trailing minus `123,45-` y
  paréntesis `(123,45)` = negativo; guion/em-dash en columna = no aplica;
  parseo a céntimos enteros exactos antes de exponer el f64 del dominio
  (REQ-12-18).
- Golden rule INFORMATIVA: si el extracto imprime saldo inicial, totales o
  saldo final, se contrasta `saldo inicial + abonos − cargos ≈ saldo
  impreso` (delta ≤ 0,00) y se clasifica Verificada / Discrepancia /
  No verificable (REQ-12-16/17). Nunca bloquea la revisión ni la
  confirmación: orienta al usuario durante la misma.
- Sin crate `regex`: stdlib no trae regex y añadirla sería dependencia
  nueva; los patrones son simples y se implementan con escáneres manuales
  deterministas cubiertos por tests unitarios.

## Manejo de errores nombrados

- `domain/pdf_error.rs`: `PdfError { Corrupto, Ilegible, PanicoCapturado }`
  con nombre de archivo y motivo; ningún pánico cruza la frontera del
  command (REQ-12-13/14).
- Informe por archivo con estado `Analizado / Ilegible / Corrupto /
  Fallido` y mensaje en español citando el archivo concreto; el lote
  continúa siempre.
- Frontend: variantes de error tipadas en el puerto; la UI muestra el
  detalle por archivo sin romper la tabla del resto.

## UI (frontend React — solo presentación)

- `DiagnosticoSection.tsx` ampliado (≤100 líneas) con tres subcomponentes
  nuevos: `DiagnosticoSubida.tsx` (selector de mes existente + input file
  múltiple + lista de nombres + botón Analizar), `DiagnosticoTabla.tsx`
  (filas editables: fecha, comercio, importe, categoría select del catálogo
  cerrado, acciones confirmar/editar/descartar fila a fila, botón Confirmar
  selección) y `DiagnosticoInforme.tsx` (estado por archivo + badge de
  coherencia).
- Lógica de edición/selección/resumen en caso de uso puro
  `src/domain/use-cases/diagnostico-tabla.ts` (node:test). Ningún `.tsx`
  parsea PDF (REQ-12-08).
- Puerto `src/domain/ports/diagnostico-port.ts` implementado por
  `src/adapters/diagnostico-ipc-adapter.ts`, único sitio con `invoke()`
  (REQ-12-09).
- Estilos: `diagnostico-section.css` ampliada más hojas nuevas por
  componente (`diagnostico-subida.css`, `diagnostico-tabla.css`,
  `diagnostico-informe.css`) desde `src/styles/`. Cero CSS embebido en
  `.tsx`.
- Estados vacíos, carga y error con las clases comunes de
  `estados-comunes.css` (feature 18); WHILE analizando, indicador de carga
  con botón deshabilitado.

## Tokens usados (solo de src/styles/tokens.css, paleta dual feature 17)

| Token | Uso |
|-------|-----|
| `--color-surface` | panel de subida, informe y filas de tabla |
| `--color-border` | divisores de tabla e informe |
| `--color-primary` / `-hover` / `-bg` | botones Analizar y Confirmar selección |
| `--color-positive` | badge coherencia verificada / fila confirmada |
| `--color-warn` | badge discrepancia / fila requiere revisión |
| `--color-negative` | archivos ilegibles-corruptos y acción descartar |
| `--color-text` / `--color-muted` | datos de filas y ayudas / estados vacíos |
| `--shadow-card` | elevación de paneles |

Espaciado, radios y transiciones también exclusivamente por token.

## Decisiones y constraints

- pdf-extract única librería de PDF (decisión humana); versión clavada en
  `src-tauri/Cargo.toml`; entrada previa obligatoria en
  `docs/dependencies.md` (REQ-12-01/03) antes de implementar.
- `catch_unwind` por archivo es obligatorio, no opcional: es la mitigación
  documentada de los pánicos de pdf-extract (#141, #104, #134).
- Umbral de ilegibilidad 60 caracteres/página detecta «sin capa de texto»
  (escaneado) sin OCR; el OCR queda fuera de alcance por decisión
  razonada de los informes de research.
- `MonthlyRecord` agrega gastos por `ExpenseCategory` del catálogo cerrado:
  por eso la tabla exige asignar/editar categoría por fila (REQ-12-11)
  como paso previo a la incorporación (REQ-12-12).
- Regla de 100 líneas: reparto en módulos pequeños listados arriba;
  desarrollo test-first — `cargo test` para dominio/application/parser
  (fixtures de texto con importes trampa, multilínea, golden rule, bytes
  basura para el camino infeliz) y `node:test` para el caso de uso de
  tabla; journey e2e (REQ-12-21) sobre fixture PDF sintético determinista
  generado con script de arnés `scripts/generate-pdf-fixture.mjs`
  (verbo `generate-`) commiteado junto a su JSON esperado.
- `./init.sh` verde como puerta de cierre.

## Alternativa descartada

- Parsear en webview con `pdfjs-dist` (npm): segunda candidata evaluada;
  descartada por veredicto literal del humano (frontend React limpio,
  ligero y con rendimiento nativo) y porque violaría REQ-12-08. Queda como
  contraste documental en `progress/research/pdf-evaluacion-pdfjs-dist.md`.
- `tauri-plugin-dialog` / `tauri-plugin-fs` para la subida: dependencias
  nuevas sin aprobación humana; se usa el input file nativo + base64 por
  IPC.
- Crate `regex` para las heurísticas: dependencia nueva con aprobación
  aparte; innecesaria para los patrones objetivo.

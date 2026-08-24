# Informe de implementación — Feature 12 `diagnostico-pdf`

- **Fecha**: 2026-08-22 · **Agente**: implementer · **Estado final**:
  `in_progress` (a la espera del reviewer; NO marcada done).
- **Gate previo**: el humano materializó su aprobación con veredicto
  literal: «Usa el crate pdf-extract en Rust invocado mediante un comando
  Tauri (#[tauri::command]). Mantendrás el frontend en React limpio,
  ligero y con un rendimiento nativo.»

## 1. Gate de dependencia (REQ-12-01/02/03)

1. `docs/dependencies.md`: nueva entrada `### pdf-extract` — version
   `=0.12`, scope `dependencies`, approved `2026-08-22`, motivo con costo
   (0), licencia MIT y cobertura frente a lopdf/pdfjs-dist según
   `progress/research/pdf-evaluacion-crates-rust.md`, incluida la cita
   textual del veredicto humano como aprobación explícita.
2. `src-tauri/Cargo.toml`: `pdf-extract = "=0.12"` (misma versión que la
   registrada; el validador compara las cadenas literalmente).
3. `feature_list.json`: feature 12 `blocked` → `in_progress`.
4. Verificación ANTES de escribir código: `node scripts/check-format.mjs`
   (que integra validate-dependencies) → `FORMATO ✔ … docs/dependencies.md
   correctos`.

## 2. Ciclo rojo/verde (TDD)

### ROJO (tests escritos antes que el código; stubs devolvían valores vacíos/errores "sin implementar")

Salida de `cargo test --manifest-path src-tauri/Cargo.toml` tras escribir
los 36 tests nuevos de la feature (extracto):

```
test application::tests::diagnostico_confirmar_tests::confirmar_crea_el_registro_del_mes_y_persiste_el_snapshot ... FAILED
test application::tests::diagnostico_lote_tests::panico_simulado_queda_aislado_como_fallido_y_el_resto_procesa ... FAILED
test application::tests::diagnostico_parser_importes_tests::importe_espanol_basico_con_millares_y_decimales ... FAILED
test application::tests::diagnostico_parser_lote_tests::golden_rule_cuadra_saldo_inicial_abonos_cargos_y_saldo_final ... FAILED
test application::tests::diagnostico_journey_tests::journey_completo_subir_analizar_verificar_y_actualizar ... FAILED
test infrastructure::base64_min_tests::decodifica_cadenas_base64_basicas ... FAILED
thread 'infrastructure::comprobantes_fs_tests::round_trip_guardar_listar_y_leer_en_directorio_temporal' panicked:
    guardar: ComprobantesStoreError { motivo: "sin implementar" }
test result: FAILED. 198 passed; 31 failed; ...
```

Frontend (`pnpm test`) en rojo: los tests importaban funciones aún no
implementadas de `src/domain/use-cases/diagnostico-tabla*.ts` (fallos de
aserción/módulo contra stubs). Los tests preexistentes permanecieron
verdes durante todo el ciclo.

### VERDE (tras implementar)

```
cargo test:  test result: ok. 229 passed; 0 failed; ...   (36 tests nuevos)
pnpm test:   # tests 294 / # pass 294 / # fail 0          (14 tests nuevos)
node scripts/audit-design-tokens.mjs → AUDIT ✔
pnpm build   → ✓ built in ~1.7s
./init.sh    → ✔ El entorno está perfecto. Podemos empezar a trabajar.
cargo check  → Finished `dev` profile (sin warnings)
```

## 3. Arquitectura backend (extracción íntegra en Rust)

| Archivo (≤100 líneas salvo tests) | Contenido |
|---|---|
| `domain/pdf_error.rs` | `PdfError { Corrupto, Ilegible, PanicoCapturado }` con archivo+motivo y Display en español citando el archivo. |
| `domain/comprobante_pdf.rs` | Entidades puras: `MovimientoDetectado`, `EstadoArchivo`, `Coherencia`, `ResultadoArchivoPdf`, `ResultadoLote` (serde para IPC). |
| `domain/puertos_pdf.rs` | Puertos `ComprobantesStore` (guardar/listar/leer) y `PdfMovimientosExtractor` + `ComprobantesStoreError`. Sin tauri ni pdf_extract. |
| `application/diagnostico/{tipos,analisis,informe,confirmacion}.rs` | `DiagnosticoError{MesInvalido,Almacen,Snapshot}` con `codigo()`; `subir_comprobantes`; `analizar_lote` con `catch_unwind(AssertUnwindSafe)` POR ARCHIVO; informes por archivo; `confirmar_movimientos` reconstruye el MonthlyRecord inmutablemente y persiste vía puerto SnapshotRepository. |
| `application/diagnostico/parser_{extracto,lineas,importe,fecha,coherencia}.rs` | Heurísticas puras sin regex: filas por fecha+importe, continuación multilínea, blacklist («Estimado…», «Saldo…», «Total…», «Página…»), golden rule Verificada/Discrepancia/NoVerificable (tolerancia 0,005), importes españoles a céntimos exactos (millares ANTES de coma, NBSP, trailing minus, paréntesis, guion=no aplica), fechas dd/mm/yyyy·dd/mm/yy·ISO→YYYY-MM-DD. |
| `infrastructure/pdf_extractor.rs` | ÚNICO sitio con `pdf_extract`: `extract_text_from_mem_by_pages` + umbral de ilegibilidad `UMBRAL_ILEGIBILIDAD_CHARS_POR_PAGINA = 60` caracteres/página. Los pánicos del crate los contiene el catch_unwind de `analizar_lote`. |
| `infrastructure/comprobantes_fs.rs` | Adapter fs: `<base>/<YYYY-MM>/<nombre original>`; sanea traversal (`file_name`); listar ordenado solo .pdf; base inyectada desde lib.rs. |
| `infrastructure/base64_min.rs` | Decodificador base64 stdlib (transporte IPC, design.md F12). |
| `commands/diagnostico_commands.rs` + `error_diagnostico.rs` | Commands FINOS `subir_comprobantes_cmd`, `diagnosticar_comprobantes_cmd`, `confirmar_diagnostico_cmd`; solo decodifican base64 (transporte) y delegan en application/. |
| `lib.rs` | AppState ampliado (`comprobantes: Mutex<ComprobantesFsRepository>`, `extractor: ExtractorPdfExtract`) y `generate_handler!` con los tres commands nuevos. |

## 4. Arquitectura frontend (solo presentación)

| Archivo | Contenido |
|---|---|
| `src/domain/entities/diagnostico.ts` | Tipos espejo del cable serde (variantes Rust literales). |
| `src/domain/ports/diagnostico-port.ts` | Puerto `DiagnosticoPort` (subirComprobantes/diagnosticar/confirmar). |
| `src/domain/errors/diagnostico-errors.ts` | `DiagnosticoIpcError` con código nombrado del backend. |
| `src/domain/use-cases/diagnostico-tabla.ts` + `-acciones.ts` + `-informe-resumen.ts` | Tabla revisable pura: crearFilas, validarCambios (fecha AAAA-MM-DD, importe finito, concepto no vacío), editarFila, confirmarFila (exige categoría del catálogo cerrado), descartar/reabrir, resumenFilas, aceptadosDeFilas, resumenLote. |
| `src/adapters/diagnostico-ipc-adapter.ts` | ÚNICO sitio con invoke() de la feature; mapea rechazos a errores nombrados. |
| `src/lib/base64.ts` | File→base64 por chunks (transporte; leer bytes NO es parsear — veredicto humano). |
| `components/diagnostico-section/`: `use-diagnostico.ts`, `DiagnosticoSection.tsx`, `DiagnosticoSubida.tsx`, `DiagnosticoTabla.tsx`, `DiagnosticoFila.tsx`, `DiagnosticoInforme.tsx` | Selector de mes (MonthSelector existente), subida múltiple con input nativo, botón Analizar deshabilitado mientras analiza/prepara, informe por archivo con badges de estado y coherencia informativa, tabla editable fila a fila con select de categoría y Confirmación masiva que aplica el snapshot devuelto vía `aplicarSnapshot`. Estados vacíos/carga con clases comunes `estado-vacio`/`estado-carga` (patrón F18). |
| `src/styles/diagnostico-{section,subida,tabla,informe}.css` | Solo tokens dual (`--color-*`, `--space-*`, `--radius-md`, `--shadow-card`, `--anillo-foco`, transiciones); hover/focus-visible/disabled con tokens. |

## 5. Cobertura de pruebas ↔ acceptance

| Criterio (feature_list.json) | Evidencia |
|---|---|
| Entrada pdf-extract en dependencies.md | check-format verde; entrada con pin/licencia/costo/cobertura + veredicto. |
| Subida múltiple a Documents/mfinance/comprobantes/&lt;YYYY-MM&gt;/ conservando nombre | `comprobantes_fs_tests` (round-trip temp dir, aislamiento por mes, saneamiento) + journey paso 1. La real se resuelve con `document_dir()` en lib.rs (sin rutas hardcodeadas). |
| Analizar procesa el mes extrayendo fecha/comercio/importe con tabla revisable confirmar/editar/descartar | `parser_*_tests`, `lote_tests`, `diagnostico-tabla*` node:test. |
| Confirmar incorpora al MonthlyRecord persistiendo snapshot | `diagnostico_confirmar_tests` (crea/acumula/persiste/falla nombrado) + journey paso 4. |
| PDF corrupto/ilegible informa el archivo sin abortar el lote | `pdf_corrupto_nombra_el_archivo_sin_abortar_el_lote`, `pdf_ilegible_nombra_el_archivo_y_el_lote_continua`, `un_pdf_con_capa_de_texto_escasa_se_clasifica_ilegible` (umbral 60), `bytes_que_no_son_un_pdf_producen_error_corrupto`. |
| Journey end-to-end automatizado | `application/tests/diagnostico_journey_tests.rs`: almacén fs REAL en temp dir + extractor REAL (pdf-extract sobre fixtures sintéticos generados como bytes válidos dentro del propio test, sin crates de generación) + parser REAL + MemoryRepository: subir(3)→analizar(Ilegible/Analizado/Corrupto)→verificar(fechas, importes céntimos exactos, multilínea, Verificada)→confirmar(gastos del mes persistidos e idénticos al recargar). |
| REQ-12-14 catch_unwind | `panico_simulado_queda_aislado_como_fallido_y_el_resto_procesa` (extractor falso entra en pánico; el lote continúa y el archivo queda Fallido citando su nombre). |
| REQ-12-16/17 golden rule informativa | Tres tests de coherencia (Verificada/Discrepancia/No verificable) + badge informativo en DiagnosticoInforme que nunca bloquea. |
| REQ-12-18/19/20 importes/fechas/multilínea | `diagnostico_parser_importes_tests` (16 casos trampa) y `diagnostico_parser_lote_tests`. |
| REQ-12-07/09 commands finos e invoke solo bajo adapters | Tests hexágono (frontend-hexagono + diagnostico-puerto): grep 0 fuera de src/adapters; commands delegan sin fs directo. |
| Tokens dual / sin CSS embebido | audit-design-tokens OK; ui.test exige hoja por .tsx; hojas nuevas solo custom properties. |

## 6. Decisiones documentadas

1. **catch_unwind en dos niveles**: el caso de uso `analizar_lote` envuelve
   cada extracción (REQ-12-14, «el servicio de análisis») y el adapter real
   delega en pdf-extract; así un pánico del crate o de cualquier
   implementación del puerto queda contenido sin duplicar estados.
2. **Confirmación suma |importe| como gasto** de la categoría elegida
   (negativo=cargo en extracto); el usuario puede editar el signo/importe
   en la tabla antes de confirmar.
3. **Reconstrucción inmutable del MonthlyRecord** desde sus mapas
   (principio de inmutabilidad) en lugar de añadir setters al dominio:
   cero cambios en archivos de dominio existentes.
4. **Base64 como transporte**: decodificador stdlib en infrastructure/
   (backend) y codificador chunked en src/lib/base64.ts (frontend);
   design.md F12 lo define explícitamente como transporte, no parseo
   (REQ-12-08 intacto: ningún parseo de PDF en TS).
5. **Split de módulos** diagnostico/ y parser_* motivado por la regla de
   100 líneas (design.md ya anticipaba el reparto modular).
6. *(Retirado en ronda 2 — ver §8: los cinco archivos de test que excedían
   100 líneas fueron divididos en suites cohesivas ≤100, misma solución
   aceptada en las features 17 y 18; ya no queda ninguna excepción.)*

## 7. Cómo reproducir la verificación

```bash
cargo test --manifest-path src-tauri/Cargo.toml   # 229 passed
pnpm test                                          # 294 pass / 0 fail
node scripts/audit-design-tokens.mjs               # AUDIT ✔
pnpm build                                         # ✓ built
./init.sh                                          # todo verde
```

Journey manual (app de escritorio): Diagnóstico → elegir mes → subir 1..n
PDFs → Analizar → revisar informe/coherencia → asignar categoría y
confirmar/editar/descartar filas → Confirmar selección → verificar el mes
en Registro/P&G.

## 8. Ronda 2 — cambios requeridos aplicados (CHANGES_REQUESTED ronda 1)

Único punto duro del review: cinco archivos NUEVOS de test superaban las
100 líneas sin discusión previa (C5). Se aplicó el mismo criterio que en
review_17/review_18 ronda 1: **split en suites cohesivas ≤100**, con
cobertura EXACTA (mismos tests, mismos nombres salvo reubicación) y cifras
intactas.

### wc -l reales tras el reparto (verificado en disco)

| Archivo resultante | Líneas | Contenido |
|---|---|---|
| `application/tests/diagnostico_doubles.rs` | 74 | Doble del puerto ComprobantesStore (AlmacenFalso + fábrica `almacen_con_tres`). |
| `application/tests/diagnostico_extractor_doble.rs` | 56 | Doble del puerto PdfMovimientosExtractor (ModoExtractor/ExtractorFalso/paginas_extracto_ok). |
| `application/tests/diagnostico_lote_tests.rs` | 39 | Flujo normal del lote + journey con dobles (2 tests). |
| `application/tests/diagnostico_fallos_lote_tests.rs` | 83 | Corrupto/ilegible/pánico aislados con ExtractorSelectivo parametrizado (3 tests). |
| `application/tests/diagnostico_fixtures.rs` | 63 | LINEAS_EXTRACTO + aceptar/aceptado/registro_de/mensaje_cita (patrón cierre_fixtures/pyg_proyeccion_fixtures). |
| `application/tests/diagnostico_confirmar_tests.rs` | 44 | Creación del mes desde cero + mes inválido (2 tests). |
| `application/tests/diagnostico_confirmar_acumulacion_tests.rs` | 52 | Acumulación sobre mes existente + fallo de guardado inyectado (2 tests). |
| `application/tests/diagnostico_journey_tests.rs` | 87 | Journey e2e REQ-12-21 usando diagnostico_fixtures (1 test). |
| `tests/frontend-shell/diagnostico-puerto.test.mjs` | 71 | Contrato del puerto fake: subir/diagnosticar/confirmar (1 test). |
| `tests/frontend-shell/diagnostico-hexagono.test.mjs` | 53 | Hexágono + mapeo de errores nombrados DiagnosticoIpcError y commands (2 tests). |

Máximo de los archivos nuevos/resultantes de la feature: **93 líneas**
(`diagnostico-tabla-acciones.test.mjs`, preexistente de ronda 1); entre los
archivos creados o divididos en esta ronda, el máximo es **87**
(diagnostico_journey_tests.rs). En PRODUCCIÓN sigue todo ≤100
(máx.: DiagnosticoFila.tsx exactamente 100).

### Cobertura preservada (sin añadir ni quitar tests)

- Rust: los 26 tests de diagnóstico se reparten igual que en ronda 1 —
  lote normal 2 (antes 1 flujo + 1 journey con dobles), fallos del lote 3,
  confirmar creación 2, confirmar acumulación/persistencia-error 2,
  journey real 1, parser importes/fechas 10, parser lote/golden rule 6 →
  **cargo test: 229 passed / 0 failed**, idéntico a ronda 1.
- Node: los 3 tests de diagnostico-puerto.test.mjs se reparten en puerto
  (1) + hexágono (2) → **pnpm test: 294 pass / 0 fail**, idéntico.
- `node scripts/audit-design-tokens.mjs` → AUDIT ✔.
- `./init.sh` completo → «El entorno está perfecto. Podemos empezar a
  trabajar.»

### Corrección de trazabilidad (ronda 2, revisión del reviewer)

Dos cifras wc -l de la tabla anterior se declararon con un desfase de una
línea respecto a disco: `diagnostico_lote_tests.rs` decía 38 (real **39**)
y `diagnostico_confirmar_acumulacion_tests.rs` decía 51 (real **52**).
Corregidas ambas tras reverificar con `wc -l`; el resto de cifras de la
tabla coincide exactamente y ningún archivo supera las 100 líneas. No se
tocó código: la suite permanece idéntica (cargo 229 / node 294).

## CIERRE

**2026-08-22 — Feature 12 `diagnostico-pdf` cerrada como `done`**: veredicto
final del reviewer en progress/review_12.md (ronda 3): «**APPROVED.** La
feature 12 `diagnostico-pdf` cumple los 21 REQ EARS de su spec, el gate de
dependencia quedó materializado con el veredicto literal del humano, las
tres rondas de cambios requeridos están aplicadas y toda la suite está en
verde reproducida por el reviewer.» Backlog 18/18 `done`.


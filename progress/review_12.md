# Review — feature 12 `diagnostico-pdf`

**Veredicto:** CHANGES_REQUESTED

2026-08-22 (reviewer). Ronda 1. El trabajo funcional está muy bien
ejecutado: gate de dependencia impecable (entrada literal del humano,
pin idéntico en Cargo.toml/Cargo.lock, validador verde), extracción íntegra
en Rust tras el puerto `PdfMovimientosExtractor`, catch_unwind por archivo,
commands finos registrados en lib.rs, frontend solo presentación con invoke
exclusivo bajo src/adapters, tokens dual sin CSS embebido, rojo→verde
documentado y TODAS las cifras del informe coinciden con disco. Falla UN
punto duro con precedente directo de cambio requerido (review_17 ronda 1:
213→split; review_18 ronda 1: 228→split): **cinco archivos NUEVOS de la
feature superan las 100 líneas**, todos de test, con justificación posterior
en impl_12.md §6.6 pero sin la discusión previa con estado `blocked` que
 exigen AGENTS.md §7 / CHECKPOINTS.md. Los precedentes citados por el
informe (review_9) son anteriores al endurecimiento aplicado en 17/18.

## Comprobaciones ejecutadas (comando + resultado)

| # | Comando | Resultado |
|---|---------|-----------|
| 1 | `grep -n "pdf-extract" src-tauri/Cargo.toml` | `pdf-extract = "=0.12"` (línea 25) — cadena IDÉNTICA a docs/dependencies.md (`version: =0.12`); Cargo.lock resuelve 0.12.0 |
| 2 | `node scripts/validate-dependencies.mjs` | exit=0; entrada pdf-extract con scope dependencies, fecha 2026-08-22, costo 0, licencia MIT, cobertura vs lopdf/pdfjs-dist y veredicto LITERAL del humano citado |
| 3 | `cargo test --manifest-path src-tauri/Cargo.toml` | **229 passed / 0 failed** (coincide con impl_12.md §2 VERDE) |
| 4 | `cargo test ... journey` | `journey_completo_subir_analizar_verificar_y_actualizar ... ok` (+ `journey_subir_analizar_verificar_actualizar_en_una_sola_linea_de_flujo ok`) |
| 5 | `pnpm test` | **294 pass / 0 fail** (coincide con impl_12.md) |
| 6 | `./init.sh` completo | Verde total: entorno + formato (integra validate-dependencies) + tests 100% + build («El entorno está perfecto») |
| 7 | `grep -rin tauri src-tauri/src/domain src-tauri/src/application` | Solo comentarios `//!` que DECLARAN la ausencia; `use tauri\|tauri::` = 0 coincidencias. Dominio puro |
| 8 | `grep -rn "pdf_extract::" src-tauri/src` | ÚNICO uso del crate: `infrastructure/pdf_extractor.rs:8` (`extract_text_from_mem_by_pages`). Referencias en lib.rs/commands/mod.rs son solo del tipo adapter para DI (composition root) |
| 9 | `grep -rln invoke src --include=*.ts,*.tsx` excl. src/adapters | VACÍO. Dominio TS sin react/@tauri-apps/api (0). Adapter `diagnostico-ipc-adapter.ts` implementa `DiagnosticoPort` y mapea rechazos a `DiagnosticoIpcError` nombrado |
| 10 | Commands | `diagnostico_commands.rs` (80 l.): tres handlers finos que solo decodifican base64 (transporte) y delegan en application/; cero fs directo; `lib.rs:86-88` registra los tres en generate_handler! junto a los existentes |
| 11 | Almacenamiento | `comprobantes_fs.rs`: `<base>/<YYYY-MM>/<nombre original>` con saneamiento traversal (`file_name`); `lib.rs:47,55-59` resuelve `document_dir()` del SO (sin crate dirs ni ruta hardcodeada); tests round-trip en temp dir (`comprobantes_fs_tests` ok) sin tocar Documents real |
| 12 | Corrupto/ilegible/pánico | `analisis.rs:66-72`: `catch_unwind(AssertUnwindSafe)` POR ARCHIVO dentro de `analizar_lote`; errores nombrados `PdfError{Corrupto,Ilegible,PanicoCapturado}`; journey sube escaneado.pdf+roto.pdf+extracto y verifica estados Ilegible/Corrupto/Analizado con mensajes citando cada nombre y lote continúa |
| 13 | Confirmar→MonthlyRecord | `confirmar_movimientos` reconstruye el registro y persiste vía SnapshotRepository; journey paso 4 comprueba gastos 45,30/23,75/800,00 por categoría y `repo.load()==snapshot` |
| 14 | `node scripts/audit-design-tokens.mjs` | «AUDIT ✔» (exit 0); 0 hex/rgb en diagnostico-*.css; 0 `style={{` en .tsx; hojas nuevas solo custom properties dual |
| 15 | `wc -l` producción nueva backend+frontend | 18 archivos: máx 100 (`DiagnosticoFila.tsx` justo en límite); resto 14–99. TODO ≤100 ✔ |
| 16 | Coherencia cifras informe ↔ disco | diagnostico_lote_tests.rs 147 ✔ · deuda_tests.rs 194 ✔ · inversiones_proyeccion_tests.rs 123 ✔ · snapshot-ipc-adapter.ts 148 ✔ · inversiones_proyeccion.rs 118 ✔ · cargo 229 ✔ · pnpm 294 ✔ — SIN desviaciones |
| 17 | Evidencia TDD rojo→verde | impl_12.md §2: ROJO primero (31 FAILED con nombres de test contra stubs) → VERDE reproducido por el reviewer (229/294) |
| 18 | depends_on | `[4, 5]` ambas `done` en feature_list.json ✔; la 12 queda `in_progress` (correcto: pendiente de review) |

## Checkpoints

- C1 Tests escritos antes del código, rojo documentado y suite verde al
      final: [x]
      Evidencia en impl_12.md §2; verde reproducido (229 Rust / 294 node).
- C2 `./init.sh` verde completo: [x]
- C3 Arquitectura hexagonal (dominio puro, crate solo en infrastructure,
      commands finos en lib.rs, invoke solo adapters, tokens sin CSS
      embebido, frontend no parsea): [x]
- C4 Gate de dependencia pdf-extract (aprobación humana literal, pin
      idéntico, validador verde, feature desbloqueada solo después): [x]
- C5 Máx. 100 líneas por archivo tocado: [ ] FALLA — CINCO archivos NUEVOS
      de esta feature superan 100: `application/tests/diagnostico_lote_tests.rs`
      (**147**), `diagnostico_confirmar_tests.rs` (**118**),
      `tests/frontend-shell/diagnostico-puerto.test.mjs` (**111**),
      `diagnostico_journey_tests.rs` (**109**) y `diagnostico_doubles.rs`
      (**109**). Justificación en impl_12.md §6.6 es POSTERIOR y cita
      precedentes (review_9) anteriores al endurecimiento review_17/18;
      no hubo discusión previa con estado `blocked`.
- C6 Coherencia informe ↔ repo (toda cifra verificada coincide): [x]

## Cambios requeridos

1. **Dividir los cinco archivos de test >100 líneas en suites cohesivas
   ≤100 líneas cada uno**, manteniendo EXACTA la cobertura actual y la
   suite en verde (misma solución aplicada y aceptada en features 17 y
   18). Propuesta accionable:
   - `diagnostico_lote_tests.rs` (147): separar los casos de
     corrupto/ilegible/pánico-aislado (p. ej. `diagnostico_fallos_lote_tests.rs`)
     de los de flujo normal del lote; declarar ambos en
     `application/tests/mod.rs`.
   - `diagnostico_confirmar_tests.rs` (118): separar creación del mes vs
     acumulación sobre mes existente + persistencia/error nombrado.
   - `diagnostico_journey_tests.rs` (109): extraer `LINEAS_EXTRACTO` y el
     helper `aceptar()` a un módulo compartido (p. ej. `diagnostico_fixtures.rs`,
     junto a los ya existentes `cierre_fixtures.rs`/`pyg_proyeccion_fixtures.rs`),
     dejando el journey ≤100.
   - `diagnostico_doubles.rs` (109): separar dobles del almacén
     (`ComprobantesStore`) de los del extractor/repositorio.
   - `tests/frontend-shell/diagnostico-puerto.test.mjs` (111): separar el
     contrato del puerto (subir/diagnosticar/confirmar) del mapeo de
     errores nombrados.
2. **Actualizar impl_12.md §6.6**: retirar la excepción documentada y
   dejar constancia del reparto final con sus wc -l reales ≤100 (el
   precedente invocado quedó superado por review_17 ronda 1 y review_18
   ronda 1).
3. Tras el split: re-ejecutar `cargo test` (229 esperados), `pnpm test`
   (294 esperados) y `./init.sh` completo en verde, y dejarlo reflejado en
   el informe.

No se requiere ningún otro cambio: funcionalidad, spec EARS (21 REQ),
gate de dependencia y arquitectura están conformes.

---

# Ronda 2 — revisión de los cambios aplicados

**Veredicto de ronda 2:** CHANGES_REQUESTED (resto mínimo: dos cifras del
informe §8 no coinciden con disco; todo lo demás queda resuelto y verde).

## Comprobaciones ejecutadas (comando + resultado)

| # | Comando | Resultado |
|---|---------|-----------|
| 1 | `wc -l` de los 10 archivos resultantes del split | TODOS ≤100: doubles 74 · extractor_doble 56 · lote_tests **39** · fallos_lote 83 · fixtures 63 · confirmar_tests 44 · confirmar_acumulacion **52** · journey_tests 87 · diagnostico-puerto.test.mjs 71 · diagnostico-hexagono.test.mjs 53. Los cinco originales dejaron de superar el límite; máximo de la ronda: 87 |
| 2 | Cobertura equivalente | Todos los nombres de caso de ronda 1 siguen presentes, reubicados: confirmar crea/rechaza (confirmar_tests 44) + acumula/propaga_fallo (acumulacion 52); corrupto/ilegible/pánico (fallos_lote 83); flujo normal ×2 (lote_tests); journey_completo (87) con LINEAS_EXTRACTO+aceptar extraídos a fixtures (63); dobles repartidos en doubles 74 + extractor_doble 56; node: contrato puerto fake (71) + reglas hexágono y mapeo DiagnosticoIpcError (53). `tests/mod.rs` declara los módulos nuevos (líneas 16–25) |
| 3 | Conteo exacto de tests | `cargo test` = **229 passed / 0 failed** e `pnpm test` = **294 pass / 0 fail**: IDÉNTICOS a ronda 1 → ni un test añadido ni eliminado por el split |
| 4 | Gate dependencia | validate-dependencies exit=0; `Cargo.toml:25` pdf-extract =0.12 (= registro); Cargo.lock 0.12.0 |
| 5 | Hexágono Rust | grep `use tauri\|tauri::` en domain/application = 0; `pdf_extract::` solo en infrastructure/pdf_extractor.rs |
| 6 | Hexágono frontend | invoke() fuera de src/adapters = 0; sin pdfjs/pdf-lib/getDocument bajo src/ (grep exit=1); dominio TS limpio |
| 7 | Tokens | audit-design-tokens AUDIT ✔ |
| 8 | `./init.sh` completo | Verde total («El entorno está perfecto») |
| 9 | impl_12.md §6.6 retirado correctamente | Sí — nota de retiro en su lugar, remite a §8 |
| 10 | impl_12.md §8 tabla wc -l ↔ disco | **8 de 10 cifras exactas; DOS DESCUADRES**: declara `diagnostico_lote_tests.rs` = 38 (real **39**, verificado con wc -l, awk NR=39 y byte final 0a) y `diagnostico_confirmar_acumulacion_tests.rs` = 51 (real **52**). Cifras globales correctas (máx 93/87/100 ✓) |

## Checkpoints ronda 2

- C1 Rojo→verde + suite verde final: [x] (229/294 reproducidos)
- C2 `./init.sh` verde completo: [x]
- C3 Arquitectura hexagonal intacta tras el split: [x]
- C4 Gate dependencias: [x]
- C5 Máx. 100 líneas por archivo tocado: [x] RESUELTO ronda 2
      (147→39+83 · 118→44+52 · 109→87+63 · 109→74+56 · 111→71+53)
- C6 Coherencia informe ↔ disco: [ ] FALLA — las dos cifras de la tabla
      §8 indicadas arriba (38≠39 y 51≠52). Precedente aplicado tal cual:
      review_17 ronda 1 (C6 falló por 92 vs 93).

## Cambios requeridos

1. **`progress/impl_12.md` §8 (tabla «wc -l reales tras el reparto»)**:
   corregir las dos cifras que no coinciden con disco:
   - `diagnostico_lote_tests.rs`: 38 → **39**.
   - `diagnostico_confirmar_acumulacion_tests.rs`: 51 → **52**.
   No hay ningún otro cambio: código, cobertura, gate y suites ya están
   conformes y verificados en esta ronda.

---

# Ronda 3 — revisión de la corrección de cifras

**Veredicto de ronda 3:** APPROVED

## Comprobaciones ejecutadas (comando + resultado)

| # | Comando | Resultado |
|---|---------|-----------|
| 1 | `grep -n` sobre impl_12.md §8 + `wc -l` real | `diagnostico_lote_tests.rs` declara **39** = wc -l 39 ✔; `diagnostico_confirmar_acumulacion_tests.rs` declara **52** = wc -l 52 ✔ (líneas 154 y 158 del informe). Las diez cifras de la tabla §8 coinciden ahora TODAS con disco |
| 2 | Trazabilidad | impl_12.md §«Corrección de trazabilidad» documenta el desfase original (38→39, 51→52), la reverificación y que no se tocó código |
| 3 | `cargo test --manifest-path src-tauri/Cargo.toml` | **229 passed / 0 failed** — idéntico a rondas 1 y 2 |
| 4 | `pnpm test` | **294 tests / 294 pass / 0 fail** — idéntico a rondas 1 y 2 |
| 5 | `./init.sh` completo | Verde total: entorno + formato + tests 100% + build («El entorno está perfecto») |

## Checkpoints finales

- C1 Rojo→verde documentado + suite verde al final: [x] (229/294)
- C2 `./init.sh` verde completo: [x]
- C3 Arquitectura hexagonal (dominio puro, crate solo en infrastructure,
      commands finos, invoke solo adapters, tokens sin CSS embebido): [x]
- C4 Gate dependencias pdf-extract (aprobación humana literal, pin
      idéntico, validador verde): [x]
- C5 Máx. 100 líneas por archivo tocado: [x]
      RESUELTO ronda 2; sin regresiones en ronda 3
- C6 Coherencia informe ↔ disco: [x] RESUELTO ronda 3 (39/52 corregidas;
      todas las cifras verificadas coinciden)

## Veredicto

**APPROVED.** La feature 12 `diagnostico-pdf` cumple los 21 REQ EARS de su
spec, el gate de dependencia quedó materializado con el veredicto literal
del humano, las tres rondas de cambios requeridos están aplicadas y toda
la suite está en verde reproducida por el reviewer. El líder puede marcar
la feature como `done` siguiendo el flujo habitual.

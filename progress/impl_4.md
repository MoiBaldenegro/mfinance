# Informe de implementación — Feature 4: persistencia-json

> Fecha: 2026-08-21 · Estado al cierre de la sesión: `in_progress`
> (pendiente de review; el `done` lo marca el flujo del líder tras
> `progress/review_4.md` con veredicto APPROVED).

## 1. Alcance ejecutado

Adapter JSON que materializa el puerto `SnapshotRepository` en
`Documents/mfinance/`, casos de uso en `application/`, commands finos
`load_state/save_state/export_json/import_json`, composition root con
inyección y seed realista de 12 meses. Sin dependencias nuevas
(`Cargo.toml` intacto), sin tocar `src/` (frontend), `scripts/`,
`specs/` ni `docs/`. El dominio (`src-tauri/src/domain/`) **no se tocó**
(cero cambios, ni mínimos).

## 2. Árbol nuevo (líneas por archivo)

```
src-tauri/src/
├── lib.rs                                  48  (modificado: composition root)
├── application/
│   ├── mod.rs                              14  (índice + cfg(test))
│   ├── load_state.rs                       13
│   ├── save_state.rs                       14
│   ├── export_json.rs                      31  (export_json + export_current)
│   ├── import_json.rs                      27  (importa → valida → persiste)
│   ├── ensure_seed.rs                      19  (REQ-04-02)
│   ├── import_validation.rs                33  (orquestador revalidación)
│   ├── record_validation.rs                46  (meses YYYY-MM revalidados)
│   ├── entity_validation.rs                56  (no negatividad activos/pasivos/inversiones)
│   └── tests/
│       ├── mod.rs                           7
│       ├── memory_repository.rs            53  (doble del puerto)
│       ├── state_tests.rs                  61  (6 tests seed/load/save)
│       ├── export_import_tests.rs          47  (4 tests export/import feliz)
│       └── import_validation_tests.rs      62  (2 tests esquema roto/invariantes)
├── infrastructure/
│   ├── mod.rs                              12  (índice + cfg(test))
│   ├── json_file.rs                        48  (lectura + escritura atómica tmp+rename)
│   ├── json_repository.rs                  83  (adapter del puerto, ruta inyectable)
│   ├── test_support.rs                     22  (temp dirs únicos)
│   ├── json_repository_tests.rs            80  (3 tests round-trip/atomicidad/load)
│   └── transfer_tests.rs                  100  (5 tests export/import fs real temporal)
├── commands/
│   ├── mod.rs                              16  (AppState con Mutex<adapter>)
│   ├── error.rs                            50  (CommandError serializable nombrado)
│   └── snapshot_commands.rs                63  (4 handlers finos)
└── seed/
    ├── mod.rs                              30  (example_snapshot determinista)
    ├── monthly.rs                          48  (12 meses coherentes)
    ├── patrimony.rs                        71  (activos/pasivos/inversiones/estados)
    ├── monthly_tests.rs                    56  (3 tests coherencia mensual)
    └── patrimony_tests.rs                  75  (4 tests coherencia patrimonio)

Máximo en producción: 83 líneas (json_repository.rs). Máximo absoluto:
100 líneas (transfer_tests.rs). Todo ≤ 100 (verificado con wc -l).
Total: 61 tests cargo test (34 dominio previos + 27 nuevos).
```

## 3. Evidencia ROJO → VERDE

### 3.1 ROJO (tests escritos ANTES que el código de producción)

Tests escritos primero contra la spec; el código de producción no existía.
`cargo test --manifest-path src-tauri/Cargo.toml`:

```
error[E0583]: file not found for module `ensure_seed`
error[E0583]: file not found for module `export_json`
error[E0583]: file not found for module `import_json`
error[E0583]: file not found for module `load_state`
error[E0583]: file not found for module `save_state`
error[E0583]: file not found for module `json_repository`
error[E0425]: cannot find function `example_snapshot` in module `seed`
...
error: could not compile `mfinance` (lib) due to 6 previous errors
error: could not compile `mfinance` (lib test) due to 34 previous errors
EXIT=101
```

Resumen: 34 errores de compilación (6× E0583 módulos de producción
inexistentes + 28× E0425 `seed::example_snapshot` inexistente). Mismo
patrón de ROJO que la feature 3 (módulos/tests referenciados antes de
existir su implementación).

### 3.2 VERDE (tras implementar solo lo necesario)

```
test result: ok. 61 passed; 0 failed; 0 ignored; 0 measured; ...
TEST_EXIT=0        (cargo test --manifest-path src-tauri/Cargo.toml)
```

Desglose: domain 34 · infrastructure 8 · application 12 · seed 7.

## 4. Verificación completa

| Comprobación | Resultado |
|---|---|
| `cargo test --manifest-path src-tauri/Cargo.toml` | 61 passed / 0 failed |
| `cargo check --manifest-path src-tauri/Cargo.toml` | Finished sin warnings |
| `node --test` | pass 21 / fail 0 |
| `./init.sh` | ✔ El entorno está perfecto — INIT_EXIT=0 |
| `wc -l` sobre archivos nuevos | máximo 100, ninguno >100 |
| `grep dirs src-tauri/Cargo.toml` | sin coincidencias (sin deps nuevas) |
| Tests de adapter | solo `std::env::temp_dir()`; Documents real jamás tocado |

## 5. Decisiones documentadas

1. **Inyección de ruta (REQ-04-01):** `JsonSnapshotRepository::new(base_dir:
   PathBuf)` recibe la ruta base desde fuera; los tests pasan directorios
   temporales. La crate `dirs` NO está aprobada: el composition root
   resuelve Documentos con `app.path().document_dir()` (tauri::path, ya
   presente como dependencia) y le pasa `Documents/mfinance/` al adapter.
   Nada hardcodeado.
2. **Ruta elegida por el usuario para export/import (REQ-04-04/05/06):**
   el port definido en F3 declara `export(snapshot)` / `import()` sin
   parámetro de ruta; para no alterar dominio ni sus tests, el adapter
   expone una ranura de transferencia configurable
   (`set_transfer_path`). Los commands aceptan la ruta como parámetro
   `String` (el frontend F5 la obtendrá con su API de diálogos o un
   input), la fijan en el adapter y delegan. Sin crates nuevas.
3. **Atomicidad (REQ-04-03):** `json_file::write_atomic` serializa
   completo en memoria, escribe a `<archivo>.tmp` hermano y publica con
   `fs::rename` (en Windows sustituye el destino). Si algo falla antes
   del rename, el JSON vigente anterior queda intacto: siempre hay JSON
   válido en disco. Test dedicado verifica JSON válido tras doble
   guardado y ausencia de `.tmp` residuales.
4. **Validación al importar (REQ-04-06):** serde deriva sin constructores,
   así que un JSON "bien tipado" podría colar invariantes rotas (activo
   negativo, mes 2026-13). `application/import_validation.rs` +
   `record_validation.rs` + `entity_validation.rs` reconstruyen cada
   entidad vía sus constructores validados del dominio antes de
   persistir; ante rechazo, los datos vigentes quedan intactos (testeado
   por nombre de error y estado preservado).
5. **Errores hacia IPC:** `commands/error.rs::CommandError { codigo,
   mensaje }` serializable conserva el NOMBRE del error de dominio
   ("SnapshotLoadError", …) cruzando el puente (REQ-04-06) más un motivo
   legible en español.
6. **Firma de commands (REQ-04-08):** handlers finos: bloquean el estado
   gestionado, fijan ruta de transferencia si aplica y delegan en
   application/. Sin lógica de negocio ni fs directo. `export_json`
   devuelve la ruta escrita (String); `import_json` devuelve el snapshot
   importado; `load_state`/`save_state` el snapshot / unidad.
7. **Seed y arranque (REQ-04-02):** `seed/example_snapshot()` es
   determinista (sin reloj ni azar): 12 meses (2025-09..2026-08),
   ingresos con salario creciente + freelance irregular + arriendos de
   650 EUR ligados al piso en finca raíz; gastos con vivienda, comida,
   transporte, ocio y cuotas_deuda decrecientes (364→309 EUR) coherentes
   con préstamo coche (8400 @6.5%) + personal (2300 @9.8%) e hipoteca
   (142000 @3.2%, su cuota vive en vivienda); 3 activos; inversiones en
   las 3 familias; 2 estados de cuenta conciliados (diferencia 0) para
   indicadores limpios. En `run()`: se llama a `ensure_seed` SOLO si
   `state_exists()` es false — un archivo corrupto existente nunca se
   pisa silenciosamente (el error nombrado subirá por `load_state`).
8. **Doble local en tests de application:** `domain::tests` es privado
   del árbol de dominio; en lugar de ensanchar su visibilidad (toque
   evitable en feature done), `application/tests/memory_repository.rs`
   define su propio doble mínimo (~50 líneas).
9. **`export_current`:** REQ-04-04 dice "copia del JSON vigente"; el caso
   de uso lee el vigente vía puerto y lo exporta (el fallo de lectura se
   envuelve en `SnapshotExportError` para mantener una variante nombrada
   por operación).

## 6. Ciclo TDD observado

1. Tests escritos (infrastructure/application/seed) contra specs/04 y el
   puerto existente → `cargo test` ROJO (34 errores, EXIT=101).
2. Implementación mínima hasta verde: adapter, use cases, validación,
   seed, commands y composition root.
3. Correcciones del ciclo: mapeo String→&str en errores nombrados del
   adapter (cierres en `map_err`), imports no usados eliminados,
   división de archivos de test que superaban 100 líneas
   (export_import/import_validation; json_repository_tests/transfer;
   monthly_tests/patrimony_tests).
4. VERDE final: cargo test 61/0 · cargo check limpio · node --test 21/21
   · ./init.sh verde total (INIT_EXIT=0).

Feature dejada en `in_progress`; informe entregado para revisión del
reviewer según protocolo (el `done` se marca solo con review_4.md
APPROVED verificado en disco).

# Review — feature 4 persistencia-json

**Fecha:** 2026-08-21 · **Revisor:** reviewer (nivel 1)
**Base:** specs/04_persistencia-json/requirements.md (REQ-04-01..09),
docs/architecture.md, docs/conventions.md, CHECKPOINTS.md,
feature_list.json, progress/impl_4.md.

**Veredicto:** APPROVED

## Evidencia verificada en disco (punto por punto)

1. **Trazabilidad acceptance↔REQ↔implementación** — Los 9 REQ de
   requirements.md tienen implementación y test asociados: REQ-04-01→
   `infrastructure/json_repository.rs`, REQ-04-02→`lib.rs:31-33` +
   `seed/*` (+ tests de coherencia), REQ-04-03→`json_file.rs:21-39`,
   REQ-04-04/05→`application/export_json.rs`, `import_json.rs` +
   `snapshot_commands.rs`, REQ-04-06→`import_validation.rs` +
   tests, REQ-04-07→`lib.rs`, REQ-04-08→`commands/snapshot_commands.rs`,
   REQ-04-09→tests con `temp_dir`. Sin huecos.
2. **REQ-04-01** — `impl SnapshotRepository for JsonSnapshotRepository`
   (`json_repository.rs:49`). Archivo único: `STATE_FILE = "mfinance.json"`
   bajo la base inyectada; el composition root pasa
   `app.path().document_dir()?.join("mfinance")` (`lib.rs:28-30`) sin ruta
   hardcodeada ni crate `dirs`.
3. **REQ-04-02** — Seed solo al arrancar sin datos: guard
   `if !repositorio.state_exists()` en `lib.rs:31`; un archivo corrupto
   nunca se pisa. Coherencia comprobada leyendo el código: 12 meses
   consecutivos 2025-09..2026-08 (`monthly.rs:9-12`); ingresos plausibles
   (salario 2450+25i, freelance irregular, arriendos 650 ligados al piso
   FincaRaiz de 118000); gastos con vivienda 980 y cuotas_deuda decrecientes
   364→309 coherentes con coche 8400@6.5% + personal 2300@9.8%; 3 activos,
   3 pasivos con tasas distintas, inversiones en las 3 familias y 2 estados
   conciliados (aritmética verificada: 3920.75+2641.81=6562.56;
   5500+400−350=5550). Tests: `monthly_tests.rs` (3) y `patrimony_tests.rs` (4).
4. **REQ-04-03** — Verificado el código (no solo el informe):
   `write_atomic` serializa TODO en memoria antes de tocar disco, escribe
   `<nombre>.tmp` hermano y publica con `fs::rename` (`json_file.rs:21-39`);
   si falla algo antes del rename queda el JSON vigente anterior intacto.
   Test dedicado: `save_is_atomic_and_always_leaves_valid_json`
   (`json_repository_tests.rs:47-70`, doble guardado + sin `.tmp` residuales).
5. **REQ-04-04/05/06** — Export devuelve la ruta escrita
   (`snapshot_commands.rs:44-52`) y copia el vigente vía puerto
   (`export_current`). Import valida y persiste
   (`import_json.rs:15-18`); tests lo demuestran: reemplazo+persistencia
   (`export_import_tests.rs:37-46`) y rechazo inválido SIN alterar vigente
   tanto a nivel adapter (`transfer_tests.rs:65-83` JSON roto y
   `:86-100` esquema ajeno) como de aplicación con invariantes rotas vía
   serde crudo (`import_validation_tests.rs`: activo −50 y mes 2026-13).
   Errores nombrados preservados cruzando IPC: `CommandError.codigo`
   conserva "SnapshotImportError" etc. (`commands/error.rs:45-50`).
6. **REQ-04-07** — `lib.rs` construye el adapter, lo inyecta en
   `AppState` gestionado (`app.manage`), registra
   `load_state/save_state/export_json/import_json`; `greet` intacto
   (líneas 13-16) y `pub mod domain;` intacto (línea 4). Ruta Documentos
   resuelta con `tauri::path` (`document_dir`), cero crates nuevas.
7. **REQ-04-08** — `grep -rn "std::fs|fs::" src-tauri/src/commands/` → 0
   coincidencias. Handlers finos: lock del estado, fijación de ruta de
   transferencia y delegación; sin lógica de negocio.
8. **REQ-04-09** — Todos los tests del adapter usan
   `temp_dir()` sobre `std::env::temp_dir()` con nombres únicos
   (`test_support.rs`); `grep "Documents"` solo aparece en comentarios;
   ningún test toca Documents real ni rutas absolutas del usuario.
9. **Pureza hexagonal** — `src-tauri/src/domain/` SIN cambios: timestamps
   ≤ 13:41 (sesión F3) frente a archivos F4 creados 14:06–14:15; impl_4.md
   lo declara y coincide con disco. `grep -ri tauri` en domain/,
   application/, infrastructure/ y seed/ → 0. Solo commands/ y lib.rs
   tocan tauri (permitido).
10. **Dependencias/líneas/naming** — Cargo.toml intacto (mtime 10:59,
    anterior a F4) y sus 5 crates coinciden 1:1 con docs/dependencies.md;
    crate `dirs` NO añadida. Máximo de líneas: 100 exactas
    (`transfer_tests.rs`), resto ≤ 83; lib.rs 48. Errores nombrados por
    operación y mensajes en español ("no se pudo leer…", "esquema
    inválido…"); naming snake_case/PascalCase correcto.
11. **Suites reproducidas ahora mismo** — `cargo test`: **61 passed /
    0 failed**, EXIT=0 · `node --test`: **pass 21 / fail 0** ·
    `./init.sh`: todo verde, **INIT_EXIT=0**.
12. **Ciclo rojo/verde** — Evidenciado en impl_4.md §3 con salida concreta
    (34 errores: 6×E0583 módulos de producción inexistentes + 28×E0425,
    EXIT=101) antes del código, y VERDE 61/0 tras implementar. Patrón
    creíble y consistente con el árbol actual de tests.

## Checkpoints

- C1 arquitectura respetada: [x] — dependencias hacia el dominio; adapter
  implementa puerto; application sin tauri/fs; composition root en lib.rs.
- C2 convenciones respetadas: [x] — naming, errores nombrados, español,
  ≤100 líneas, sin deps nuevas.
- C3 evidencia rojo/verde documentada: [x] — impl_4.md §3 con salidas
  ROJO (EXIT=101) y VERDE (61/0).
- C4 dependencias de la feature en done: [x] — depends_on=[3],
  feature 3 en `done` (feature_list.json:55).
- C5 ./init.sh verde: [x] — INIT_EXIT=0 reproducido en esta revisión.

## Cambios requeridos

Ninguno.

## Nota no bloqueante (para el líder / futuras features)

- La escritura atómica deja un `.tmp` residual únicamente si `fs::rename`
  falla (disco lleno, permisos); el JSON vigente sigue siendo válido, que
  es lo que exige REQ-04-03. Si en el futuro se quiere pulir, bastaría
  borrar el temporal en el camino de error de `write_atomic`.
- `export_json`/`import_json` reciben la ruta como `String` del frontend
  (decisión documentada en impl_4.md §5.2, pendiente de la API de diálogos
  de F5): contrato razonable y sin crates nuevas.

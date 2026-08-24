# Informe de implementación — F21 perfiles-modelo-almacenamiento

> Implementer, 2026-08-23. Feature 21 (status: `in_progress`, el cambio a
> `done` lo decide el líder tras el APPROVED del reviewer). Spec:
> `specs/21_perfiles-modelo-almacenamiento/requirements.md`. Decisiones de
> layout: `progress/research/config-monedas-perfiles.md` §5. Sin UI (eso es
> la F22) y sin dependencias nuevas (`Cargo.toml` intacto).

## 1. Ciclo TDD rojo → verde (evidencia)

### ROJO (antes de escribir código de producción)

Los tests se escribieron PRIMERO contra la spec y se registraron en los
`mod.rs` de tests. `cargo test --manifest-path src-tauri/Cargo.toml` falló
al compilar porque los módulos de producción no existían aún
(evidencia completa guardada en la sesión; extractos):

```
error[E0583]: file not found for module `perfil_registry`
error[E0583]: file not found for module `rutas_mfinance`
error[E0432]: unresolved import `crate::application::arranque_perfiles`
error[E0432]: unresolved import `crate::domain::perfil_errors`
error[E0432]: unresolved import `crate::domain::perfil`
error[E0432]: unresolved import `crate::domain::perfil_repository`
error[E0432]: unresolved import `crate::application::perfiles`

error: could not compile `mfinance` (lib test) due to 19 previous errors
```

### VERDE (tras implementar)

```
cargo test --manifest-path src-tauri/Cargo.toml
test result: ok. 261 passed; 0 failed; 0 ignored   (+0 doc-tests)
cargo check --manifest-path src-tauri/Cargo.toml   → Finished, sin warnings
pnpm test                                          → # tests 333 / pass 333 / fail 0
./init.sh                                          → ✔ El entorno está perfecto.
```

Nota de transparencia: al verificar el conteo de tests detecté que
`perfil_registry_tests.rs` estaba escrito pero NO registrado en
`infrastructure/mod.rs` (no corría). Lo registré, corregí su import y un
`mut` sobrante; sus 3 tests pasan (261 total). Además dividí cuatro archivos
de test que superaban 100 líneas tras crecer (ver §5).

## 2. Qué se implementó

### Dominio puro (sin tauri, grep 0)

| Archivo | Contenido |
|---|---|
| `domain/perfil.rs` (46) | Entidad `Perfil { id, nombre, creado_en }` + `nuevo_id()` stdlib |
| `domain/registro_perfiles.rs` (16) | `RegistroPerfiles { activa, perfiles }` = profiles.json |
| `domain/perfil_errors.rs` (61) | Enum `PerfilError` con variantes nombradas + `codigo()` |
| `domain/perfil_repository.rs` (29) | Puerto `PerfilRepository` |
| `domain/tiempo.rs` (42) | `ahora_iso()`/`iso_de_epoch()` ISO-8601 UTC sin crates |

### Infrastructure (adapters)

| Archivo | Contenido |
|---|---|
| `json_repository.rs` (97, reescrito) | `JsonSnapshotRepository` resuelve SU ruta según el perfil activo: `<base>/perfiles/<id>/mfinance.json` (REQ-21-02/03); load/save/export/import conservan firma IPC |
| `perfil_registry.rs` (91, nuevo) | `impl PerfilRepository`: cargar/guardar registro atómico, `legacy_pendiente()`, `adoptar_legacy()` (copiar→renombrar backup); guardar fija el activo EN MEMORIA del adapter |
| `rutas_mfinance.rs` (26, nuevo) | Rutas canónicas únicas: profiles.json, mfinance.json legado, backup `mfinance.pre-perfiles.json`, perfiles/<id>/mfinance.json |
| `comprobantes_fs.rs` (99) | `set_perfil()`: ruta pasa a `<base>/<perfilId>/<YYYY-MM>/` (REQ-21-07); error nombrado si no hay perfil fijado |
| `pdf_nombre.rs` (29, nuevo) | `nombre_seguro()` extraído para mantener ≤100 líneas |
| `json_file.rs` (50) | `write_atomic<T: Serialize>` generalizado (lo usan snapshot y registro) |

### Application (casos de uso)

| Archivo | Contenido |
|---|---|
| `perfiles.rs` (57, nuevo) | `listar/crear/seleccionar` sobre el puerto; vacío/duplicado → error nombrado SIN alterar datos (REQ-21-06/08) |
| `arranque_perfiles.rs` (43, nuevo) | `preparar_arranque<S: PerfilRepository + SnapshotRepository>`: registro previo → NO repite (Ok(false)); legado → adopta al primer perfil "Personal"; si no → registra y reutiliza `ensure_seed` con su MISMO guard `load().is_ok()` (REQ-21-04/05) |

### Commands + composition root

- `commands/perfiles_commands.rs` (70, nuevo): handlers FINOS
  `listar_perfiles`, `crear_perfil(nombre)`, `seleccionar_perfil(id)` —
  delegan en application sin fs directo; seleccionar sincroniza el perfil
  del almacén de comprobantes (mismo cable de sesión que
  `set_transfer_path` en export_json).
- `commands/error.rs` (98): `From<PerfilError> for CommandError` vía
  `codigo()` (precedente `ErrorSimulacion`). Códigos:
  `PerfilNombreVacioError`, `PerfilNombreDuplicadoError`,
  `PerfilRegistroCorruptoError`, `PerfilInexistenteError`,
  `PerfilPersistenciaError`.
- `lib.rs` (100): composition root llama `preparar_arranque` (sustituye al
  guard `state_exists`), fija el perfil activo en comprobantes y registra
  los 3 commands nuevos. `AppState.repo: Mutex<JsonSnapshotRepository>`
  conserva nombre de campo (cambio mínimo en 9 command files).

## 3. Verificación criterio por criterio (feature_list F21)

| # | Criterio | Evidencia | ✔ |
|---|---|---|---|
| C1 | TDD rojo→verde: dos perfiles, alternar activo, snapshot aislado sin cruzar datos (temp dir) | `infrastructure::aislamiento_perfiles_tests::dos_perfiles_alternan_el_activo_y_recuperan_su_snapshot` (crea Ana/Beto vía `crear`, guarda 111.0 vs 222.0, alterna y cada `load` devuelve el de SU titular; ambos archivos verificados en `perfiles/<id>/`) | ✔ |
| C2 | Migración única con temp dirs: legado → perfiles/<id>/mfinance.json + backup renombrada; segundo arranque no repite | `arranque_migracion_tests::migra_el_legado_una_vez_con_backup_renombrado_y_no_repite` (legado íntegro en el perfil, original retirado, `mfinance.pre-perfiles.json` presente, 2º arranque `Ok(false)` sin perfiles extra ni tocar backup) | ✔ |
| C3 | Sin ningún perfil → inicial sembrado con seed vigente igual que guard ensure_seed | `arranque_guarda_tests::sin_ningun_perfil_siembra_el_inicial_con_el_seed_vigente` + `application::arranque_tests::*`; `preparar_arranque` LLAMA a `ensure_seed` (mismo guard) | ✔ |
| C4 | Nombre vacío/duplicado y profiles.json corrupto → errores nombrados sin alterar datos; ids únicos | `perfiles_casos_tests` (7 tests), `perfil_registry_tests::profiles_json_corrupto_produce_error_nombrado_sin_alterar_datos`, `arranque_guarda_tests::registro_corrupto_bloquea_el_arranque_sin_alterar_datos`, `perfil_tests::ids_generados_en_rafaga_son_todos_unicos` (1000 ids) | ✔ |
| C5 | Ruta de comprobantes incluye id del perfil activo (temp dir) | `comprobantes_perfil_tests` (3 tests: ruta `comprobantes/p_abc/2026-06/…`, aislamiento entre p_1/p_2, error sin perfil) | ✔ |
| C6 | cargo test verde; grep -ri tauri domain = 0; lib.rs registra los 3 commands finos; ./init.sh verde | cargo test 261/261; grep tauri domain **y** application = 0; handlers sin fs directo; ./init.sh completo en verde | ✔ |

## 4. Verificación global

- `cargo test` → 261 passed / 0 failed / 0 warnings (eran 233 antes: +28).
- `cargo check` → limpio. `pnpm test` → 333/333 (front intocado, mismo total
  que al cierre de F20). `pnpm build` → OK dentro de `./init.sh`.
- `grep -rin tauri src-tauri/src/domain src-tauri/src/application` → **0**.
- NINGÚN test toca Documents/mfinance real: todos usan `test_support::temp_dir`
  (bajo `%TEMP%`); grep de rutas de usuario en tests → 0 coincidencias.

## 5. Archivos (wc -l, TODOS ≤100)

Nuevos producción: tiempo 42, perfil 46, registro_perfiles 16,
perfil_errors 61, perfil_repository 29, rutas_mfinance 26, perfil_registry
91, pdf_nombre 29, application/perfiles 57, arranque_perfiles 43,
perfiles_commands 70. Modificados producción: json_repository 97,
comprobantes_fs 99, json_file 50, error 98, commands/mod 34, lib 100,
domain/mod 30, application/mod 33, ensure_seed 20. Tests: 13 archivos
nuevos + 7 modificados, todos ≤100 (los que superaron 100 se dividieron:
`arranque_migracion` 65 + `arranque_guarda` 63; `memory_perfil_repository`
53 + `memory_store_perfiles` 70; helper común movido a `test_support` 100;
`perfiles_casos` compactado a 99).

## 6. Decisiones

1. **El adapter evoluciona, no se sustituye**: `JsonSnapshotRepository`
   mantiene su nombre y ahora resuelve la ruta según el perfil activo,
   exactamente como propone el análisis §5.1 («JsonSnapshotRepository pasa
   a resolver la ruta del estado según el perfil activo»). El activo queda
   EN MEMORIA al guardar/cargar el registro: cero lecturas extra y sin
   deadlocks (un solo mutex en AppState, campo `repo` sin renombrar).
2. **Política en application, mecánica en infrastructure**: el puerto gana
   `legacy_pendiente()/adoptar_legacy()` para que `preparar_arranque`
   (política REQ-21-04/05) viva en application como función genérica
   `<S: PerfilRepository + SnapshotRepository>` — un solo borrow del store,
   probada además contra dobles en memoria.
3. **Reutilización literal de ensure_seed**: en arranque frío sin legado se
   invoca el caso de uso existente; su guard `load().is_ok()` garantiza que
   jamás se pisa un snapshot legible (criterio C3 «igual que el guard actual»).
4. **Orden de migración copiar→respaldar→registrar**: si algo falla a medio
   camino, el archivo original permanece intacto (el corrupto jamás se pisa).
5. **Ids stdlib**: `p_<nanos-hex><contador-hex>`; contador atómico por
   proceso cubre la granularidad gruesa del reloj de Windows (test de ráfaga
   de 1000 ids), nanos aportan unicidad entre procesos. Sin crate uuid.
6. **creado_en ISO-8601 UTC determinista**: algoritmo civil (Hinnant) en
   `tiempo.rs`, testeado contra instantes conocidos (época, bisiesto 2000,
   1e9 y 2e9). Sin crates de fechas.
7. **Comprobantes por sesión**: `set_perfil` es método inherente del adapter
   concreto llamado desde lib.rs (bootstrap) y `seleccionar_perfil`
   (cambio), siguiendo el precedente `set_transfer_path`; si no se fijó,
   toda operación falla con error nombrado — nunca escribe en una carpeta
   compartida silenciosamente.
8. **Grep C6 sobre application**: 8 comentarios PREEXISTENTES decían
   «sin fs ni tauri»; reescritos a «sin fs ni framework de escritorio»
   (mismo tipo de arreglo que F19 hizo en comprobante_pdf.rs). Sin cambios
   de comportamiento.
9. **Export/import**: siguen operando sobre el PERFIL ACTIVO (la ranura de
   transferencia externa se mantiene) sin cambiar su firma IPC (REQ-21-03).

## 7. Estado

F21 queda `in_progress` en feature_list.json (sin tocar por mí): pendiente
del review externo que lanza el líder. Suite completa en verde; repo sin
archivos temporales ni debug.

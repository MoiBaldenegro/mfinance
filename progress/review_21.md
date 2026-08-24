# Review — feature 21 (perfiles-modelo-almacenamiento)

**Reviewer**, 2026-08-23. Alcance declarado: backend SIN UI — entidad Perfil,
profiles.json con activo, snapshot por perfil en `perfiles/<id>/mfinance.json`,
comprobantes bajo `comprobantes/<id>/`, commands listar/crear/seleccionar,
load/save/export/import sobre el activo sin cambiar firma, migración ÚNICA del
legado con backup y no-repetición, seed inicial, ids stdlib sin uuid, errores
nombrados. Spec: `specs/21_perfiles-modelo-almacenamiento/requirements.md`.
Análisis: `progress/research/config-monedas-perfiles.md` §5.

**VEREDICTO: APPROVED**

## Suites ejecutadas HOY por el reviewer (contra disco)

| Suite | Resultado |
|---|---|
| `cargo test --manifest-path src-tauri/Cargo.toml` | **261 passed / 0 failed** (incluye los 28 tests nuevos de F21) |
| `pnpm test` | **333 pass / 0 fail** (front intocado, mismo total que cierre de F20) |
| `./init.sh` | **Verde completo**: herramientas, archivos del arnés, formato (validadores), tests 100%, build |

## Checklist criterio por criterio (feature_list F21)

### C1 — TDD rojo→verde: dos perfiles, alternar activo, snapshot aislado sin cruzar datos (temp dir): ✅

- ROJO documentado ANTES del código en `progress/impl_21.md` §1: errores
  E0583/E0432 (`file not found for module perfil_registry/rutas_mfinance`,
  `unresolved import …arranque_perfiles/perfil_errors/perfil/…`) = los tests
  existían primero y no compilaban por ausencia de módulos de producción.
- Test: `src-tauri/src/infrastructure/aislamiento_perfiles_tests.rs:15`
  `dos_perfiles_alternan_el_activo_y_recuperan_su_snapshot`. Crea Ana/Beto vía
  caso de uso `crear`, guarda `extra_monthly_payment` 111.0/222.0, alterna con
  `seleccionar` y cada `load()` devuelve el snapshot de SU titular (líneas
  44–47). Además verifica en disco ambos archivos en
  `perfiles/<id>/mfinance.json` (líneas 32–41) y el campo concreto dentro de
  cada JSON (líneas 56–57). Directorio temporal (`temp_dir("aislamiento")`),
  nunca Documents real. Pasa en mi ejecución.

### C2 — Migración única con directorios temporales (REQ-21-04): ✅

- Test: `src-tauri/src/infrastructure/arranque_migracion_tests.rs:23`
  `migra_el_legado_una_vez_con_backup_renombrado_y_no_repite`. Legado
  distinguible (777.0), 1er `preparar_arranque` → true, UN único perfil
  «Personal» activo, contenido ÍNTEGRO del legado en
  `perfiles/<id>/mfinance.json` (líneas 40–44), original retirado (línea 47),
  backup renombrado `mfinance.pre-perfiles.json` presente (líneas 48–49),
  `load()` devuelve los datos migrados (50–54), 2º arranque → `Ok(false)` sin
  perfiles extra ni tocar el backup (57–63).
- Implementación: `infrastructure/perfil_registry.rs:66` `adoptar_legado`
  copia→renombra (orden seguro: si falla a medio camino el original queda
  intacto); rutas canónicas únicas en `rutas_mfinance.rs`. La política de
  no-repetición vive en `application/arranque_perfiles.rs:24`
  (`cargar_registro()?.is_some() → Ok(false)`), testeada también contra
  dobles en memoria (`application/tests/arranque_tests.rs:30`). Pasa.

### C3 — Sin ningún perfil → inicial sembrado con el seed vigente igual que el guard de ensure_seed (REQ-21-05): ✅

- Tests: `infrastructure/arranque_guarda_tests.rs:18`
  (sembrado == `seed::example_snapshot()`, ruta del perfil, guard no pisa en
  arranques posteriores) y `application/tests/arranque_tests.rs:11` y `:30`
  (dobles en memoria: un único «Personal», activo, seed vigente, sin re-siembra).
- `preparar_arranque` REUTILIZA literalmente el caso de uso existente
  (`arranque_perfiles.rs:39` llama `ensure_seed::ensure_seed(store)`), cuyo
  guard es `load().is_ok()` (`application/ensure_seed.rs:15`): jamás pisa un
  snapshot legible. Cumple «igual que el guard actual». Pasa.

### C4 — Nombre vacío/duplicado, registro corrupto → errores nombrados sin alterar datos; ids únicos (REQ-21-06): ✅

- `application/tests/perfiles_casos_tests.rs` (7 tests): vacío/blanco →
  `NombreVacio` sin persistir (l.20); duplicado → `NombreDuplicado` con el
  registro intacto (l.36); id desconocido → `PerfilInexistente` sin cambios
  (l.61); corrupto propaga `RegistroCorrupto` en listar/crear/seleccionar sin
  escribir jamás (l.83).
- Adapter real: `infrastructure/perfil_registry_tests.rs:40`
  `profiles_json_corrupto_produce_error_nombrado_sin_alterar_datos` (el archivo
  corrupto queda tal cual) y `arranque_guarda_tests.rs:44`
  `registro_corrupto_bloquea_el_arranque_sin_alterar_datos` (legado byte a
  byte intacto, ni `perfiles/` ni backup creados).
- Errores nombrados: `domain/perfil_errors.rs` enum `PerfilError` con
  `codigo()` estable (`PerfilNombreVacioError`, `PerfilNombreDuplicadoError`,
  `PerfilRegistroCorruptoError`, `PerfilInexistenteError`,
  `PerfilPersistenciaError`) y mensajes en español; puente IPC vía
  `From<PerfilError> for CommandError` (`commands/error.rs:62`) conservando el
  código (precedente `ErrorSimulacion`).
- Ids únicos stdlib: `domain/tests/perfil_tests.rs:9` ráfaga de 1000 ids todos
  distintos; esquema `p_<hex>` (contador atómico por proceso + nanos de
  reloj). SIN crate uuid. Pasa.

### C5 — Ruta de comprobantes incluye id del perfil activo (temp dir) (REQ-21-07): ✅

- Tests: `infrastructure/comprobantes_perfil_tests.rs` (3 tests): archivo en
  `comprobantes/p_abc/2026-06/extracto.pdf` verificado en disco; aislamiento
  p_1/p_2 alternando `set_perfil`; sin perfil → fallo nombrado que menciona
  «perfil» (nunca carpeta compartida silenciosa). Adapter
  `comprobantes_fs.rs:32-40` compone `<base>/<perfilId>/<YYYY-MM>/`. Cable de
  sesión en bootstrap (`lib.rs:47-49`) y en `seleccionar_perfil`
  (`commands/perfiles_commands.rs:52`), mismo patrón que `set_transfer_path`.
  Pasa.

### C6 — cargo test verde; grep tauri domain = 0; lib.rs registra los 3 commands finos sin fs directo; ./init.sh verde (REQ-21-08): ✅

- `cargo test` 261/261 y `./init.sh` verde: EJECUTADOS POR MÍ hoy.
- `grep -rin tauri src-tauri/src/domain src-tauri/src/application` → **0
  coincidencias** (verificado por mí; el informe además documenta reescritura
  de 8 comentarios preexistentes que contenían la palabra, sin cambio de
  comportamiento).
- `lib.rs:75-77` registra `listar_perfiles`, `crear_perfil`,
  `seleccionar_perfil`. Handlers en `commands/perfiles_commands.rs`: FINOS,
  delegan en `application/perfiles`, importan cero `std::fs` (todo fs vive en
  infrastructure). Composition root limpio: `estado_inicial`
  (`lib.rs:41-55`) construye adapter, ejecuta `preparar_arranque` (sustituye
  al guard anterior) y sincroniza comprobantes.
- load/save/export/import conservan firma IPC
  (`snapshot_commands.rs` sin cambios de signatura) y operan sobre el PERFIL
  ACTIVO: `json_repository.rs:43-56` resuelve `perfiles/<id>/mfinance.json`;
  export usa `repository.load()` del activo (`application/export_json.rs:28`).

## Peligro crítico verificado expresamente: NINGÚN test/código toca Documents/mfinance real ✅

- `grep -rinE "documents|document_dir|C:\Users"` sobre `src-tauri/src`: las
  únicas coincidencias en tests SON comentarios que prohíben tocarlo
  («nunca/NUNCA Documents real» en aislamiento/comprobantes/json_repository/
  diagnostico journey). Cero rutas de usuario hardcodeadas.
- Todo test de fs construye su base con `std::env::temp_dir()` vía
  `test_support::temp_dir` (`%TEMP%/mfinance_f4_<pid>_<seq>_<tag>`, único por
  prueba, con `cleanup`). Inventario verificado con grep `-l temp_dir`: los 10
  ficheros de tests fs lo usan.
- `document_dir` aparece SOLO en `lib.rs:65` (composition root, resolución en
  runtime con `tauri::path`, exigido por REQ-04-01): comportamiento de
  producción correcto, jamás invocado desde tests.

## Hexagonal, convenciones, dependencias y límites

- **Dependencias hacia el dominio**: puerto `PerfilRepository` definido en
  `domain/perfil_repository.rs`, implementado por el adapter
  (`infrastructure/perfil_registry.rs:17`); casos de uso genéricos sobre el
  puerto (`arranque_perfiles.rs:20` `S: PerfilRepository + SnapshotRepository`);
  commands solo conocen `AppState`. Dominio puro: `grep -ri tauri domain
  application` = 0.
- **Locks**: `seleccionar_perfil` encadena repo→comprobantes; ningún otro
  command mantiene `comprobantes` mientras pide `repo` (revisado command a
  command en `diagnostico_commands.rs` y resto): sin inversión de orden, sin
  deadlock posible. Un solo mutex para el snapshot (sin dobles lecturas).
- **wc -l de los archivos de F21, TODOS ≤100**: perfil 46, registro_perfiles
  16, perfil_errors 61, perfil_repository 29, tiempo 42, json_repository 97,
  perfil_registry 91, rutas_mfinance 26, comprobantes_fs 99, pdf_nombre 29,
  json_file 50, application/perfiles 57, arranque_perfiles 43,
  perfiles_commands 70, error 98, lib.rs 100 exacto, test_support 100 exacto,
  tests nuevos 38/59/65/63/67/69/99/53/70. Verificado por mí con wc.
- **Sin dependencias nuevas**: `Cargo.toml` contiene solo tauri,
  tauri-plugin-opener, tauri-build, serde, serde_json y pdf-extract (aprobado
  por el humano en F12, 2026-08-22); NADA añadido en F21 (uuid NO está;
  ids con stdlib). `docs/dependencies.md` íntegro y coherente con Cargo.toml;
  validador de formato en verde dentro de ./init.sh.
- **Convenciones**: snake_case módulos/funciones, PascalCase tipos, sufijo
  Error + nombres en español, mensajes UI/error en español, kebab-case docs,
  un módulo por archivo, mod.rs completos (dominio, application,
  infrastructure, commands, carpetas de tests).
- **Restos de sesión**: 0 `dbg!/println!/eprintln!/todo!/unimplemented!` en
  producción; los únicos «TODO» grepeados son la palabra española en
  comentarios de tests. Sin archivos temporales.

## Dependencias de la feature (protocolo)

F21 `depends_on: [19]` → F19 `done` en `feature_list.json`. No se saltó
ninguna dependencia. Estado de F21 sigue `in_progress` (correcto: el paso a
`done` lo decide el líder tras este APPROVED).

## Checkpoints (CHECKPOINTS.md)

- C1: [x] Dependencias hacia el dominio en ambos lados (domain/application sin tauri, grep 0).
- C2: [x] Puertos definidos por el núcleo e implementados por adapters; invoke/UI intocados en esta feature.
- C3: [x] Sin lógica de negocio en UI ni commands (handlers finos verificados).
- C4: [x] Tokens/CSS: no aplica (sin UI en F21); nada hardcodeado añadido.
- C5: [x] Ningún archivo TOCADO por F21 supera 100 líneas (lib.rs y test_support exactamente 100).
- C6: [x] Sin dependencias externas nuevas (Cargo.toml y dependencies.md intactos para F21).
- C7: [x] `./init.sh` verde completo; `cargo check/test` limpios.
- C8: [x] Sin temporales ni debug; artefactos permanentes en su sitio (impl_21.md).
- Harness: `[ ]` «tarea en done» NO aplica aún — es exactamente lo que este
  APPROVED habilita; el líder marca `done`. El resto de checkpoints de harness
  en orden.

## Incidencias observadas (NINGUNA bloqueante para F21)

1. **Preexistente, fuera del alcance de F21**: hay archivos >100 líneas NO
   tocados por esta feature heredados de ciclos anteriores:
   `src-tauri/src/application/inversiones_proyeccion.rs` (118),
   `application/tests/inversiones_proyeccion_tests.rs` (123),
   `application/tests/balance_tests.rs` (103). No forman parte del diff de F21
   (su informe no los lista y pertenecen a features ya cerradas). Se deja
   constancia para que el líder decida si abre una feature de saneamiento;
   NO penaliza esta revisión.
2. Observación menor sin acción requerida: `crear_perfil` no activa al nuevo
   perfil (comportamiento correcto y TESTEADO en
   `perfiles_casos_tests.rs:16`); la UX de activación llega con F22 según
   spec.

## Conclusión

Los 6 criterios de aceptación de F21 están cumplidos y VERIFICADOS CONTRA
DISCO hoy por el reviewer (no de oídas): suites verdes (261 cargo + 333 node),
aislamiento real entre perfiles, migración única con backup y no-repetición,
seed con el guard vigente, errores nombrados sin alterar datos, comprobantes
por id, commands finos registrados, dominio puro, cero riesgo sobre el
Documents real del usuario, sin dependencias nuevas y TDD rojo→verde
documentado. 

**VEREDICTO: APPROVED**

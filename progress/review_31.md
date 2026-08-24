# Review — feature 31 fix-onboarding-status-perfilid

**Veredicto:** APPROVED

> Revisión del 2026-08-24. Verificación EN DISCO de cada criterio (no se
> confió en el informe del implementador). Análisis de causa raíz:
> `progress/research/fix-onboarding-status-perfilid.md`. Spec:
> `specs/31_fix-onboarding-status-perfilid/requirements.md` (REQ-31-01..06).

## Checkpoints (CHECKPOINTS.md)

- C1: [x] Dependencias hacia el dominio: el adapter solo importa de
      `src/domain/` (líneas 9-13 de onboarding-adapter.ts); `grep -rn "invoke(" src/components src/domain src/hooks src/lib` → exit 1 (0 coincidencias): invoke sigue solo en `src/adapters/`.
- C2: [x] Sin CSS en .tsx / estilos vía tokens: N/A, no se tocó ningún
      .tsx ni .css (0 archivos de UI en el cambio).
- C3: [x] ≤100 líneas: `wc -l` → adapter 86, contrato 99, estructura 86,
      current.md 23.
- C4: [x] Sin dependencias nuevas: el test de contrato usa solo stdlib
      (node:fs, node:path, node:test, node:assert/strict); docs/dependencies.md sin cambios de esta feature.
- C5: [x] `./init.sh` termina verde completo (formato + tests 100% + build).
- C6: [x] `cargo test` 318/318 (backend sin cambios; los warnings de
      imports sin uso son preexistentes de features 23/28/30, no de esta).
- C7: [x] Arranque/UI: la feature no toca archivos de UI; la garantía
      automatizada del arranque es el test de contrato (node:test no puede
      invocar IPC real, research §9.3).
- C8: [ ] feature en `done` en feature_list.json: aún `in_progress`,
      correcto en este punto del flujo (el líder la marca done tras este
      APPROVED).
- C9: [x] `progress/current.md` documenta la sesión y el plan rojo→verde.
- C10: [x] Sin restos de debug ni temporales en los archivos tocados.

## Criterios de aceptación (feature_list.json)

### AC1 — TDD rojo→verde sobre el test de estructura ✔
- El test `tests/onboarding-wizard/estructura-integracion-27.test.mjs:30-46`
  («el adapter envía perfilId/metaId camelCase a los commands de onboarding
  y metas (REQ-31-01/02)») exige con regex `perfilId` en los seis invokes y
  `assert.doesNotMatch(c, /perfil_id/)` y `/meta_id/` sobre el adapter.
- Evidencia de rojo documentada en `progress/impl_31.md` §«ROJO»: el test
  falló contra el adapter aún en snake_case («The input did not match the
  regular expression /obtener_onboarding_status',\s*\{\s*perfilId/»), y
  verde tras el fix. Hoy pasa en la suite: `ok 2 - Cableado del wizard
  pasos 4-5 (REQ-27-01/06)` dentro de pnpm test 588/588.

### AC2 — Test de contrato nuevo escrito antes del arreglo ✔
- Existe `tests/contrato-ipc-adapters/contrato-invoke-commands.test.mjs`
  (99 líneas): parsea los `#[tauri::command]` de `src-tauri/src/commands/`
  y las llamadas `llamar/invoke` de `src/adapters/`, y exige coincidencia
  exacta de claves con la convención camelCase por defecto (respeta un
  `rename_all = "snake_case"` explícito si existiera).
- Cubre los SEIS commands: `COMMANDS_ONBOARDING` (línea 72) lista
  obtener_onboarding_status, actualizar_perfil_onboarding,
  completar_onboarding, agregar_meta, actualizar_meta, eliminar_meta; el
  subtest 1 verifica que existen en el backend y el subtest 4 exige
  perfilId en los seis y metaId en actualizar_meta/eliminar_meta.
- Allowlist feature 32 (asset_upsert/asset_eliminar/liability_upsert/
  liability_eliminar) con subtest que falla si aparecen en el backend sin
  quitarlos de ella: coherente con la feature 32 ya dada de alta en
  feature_list.json.
- Salida real de pnpm test (ejecutado por el reviewer):
  `ok 1 - los seis commands de onboarding y metas existen en el backend`,
  `ok 2 - cada invoke envía exactamente las claves que espera su command`,
  `ok 3 - la allowlist de la feature 32 aún no existe en el backend`,
  `ok 4 - onboarding y metas envían perfilId y metaId camelCase
  (REQ-31-01/02)`, suite `ok 1 - Contrato IPC adapters ↔ #[tauri::command]`.
- Evidencia de rojo previa al fix documentada en impl_31.md («obtener_
  onboarding_status envía [perfil_id] pero espera [perfilId]»).

### AC3 — grep de claves snake_case en src/adapters = 0, serde intacto ✔
- `grep -rnE "perfil_id|meta_id" src/adapters/` → exit 1 (0 coincidencias),
  ejecutado por el reviewer. En el resto de src/ solo quedan menciones en
  COMENTARIOS (use-onboarding.ts:2, onboarding-port.ts:4,
  onboarding-paso5.ts:2), ninguna como clave de payload ni en adapters.
- Payloads serde intactos verificados contra el backend:
  `actualizar_perfil_onboarding` sigue enviando `datos` (OnboardingData,
  struct serde con campos snake_case) — adapter línea 49 vs
  perfiles_onboarding_commands.rs:25-29; `agregar_meta`/`actualizar_meta`
  envían `titulo`, `descripcion`, `tags` — adapter líneas 59-64 y 73-76 vs
  goals_commands.rs:25-45. Ningún struct de datos cambió.

### AC4 — Verificación del arranque (REQ-31-03/04) ✔ (vía contrato)
- node:test no puede invocar IPC de Tauri (limitación documentada en
  research §9.3); la garantía automatizada es que el contrato verifica que
  `obtener_onboarding_status` envía EXACTAMENTE `[perfilId]` — la clave
  cuyo rechazo («missing required key perfilId») bloqueaba la app — y que
  los seis invokes (carga de estado, guardado parcial, completar, saltar y
  CRUD de metas) pasan por el adapter con claves idénticas a las firmas
  Rust (`perfil_id`/`meta_id` como parámetros en
  perfiles_onboarding_commands.rs:64-66 y goals_commands.rs:39-41/56-58,
  expuestos por Tauri 2 como perfilId/metaId sin `rename_all` explícito).
- El resto del comportamiento del adapter es idéntico: firmas, resolución
  del perfil activo y manejo de errores sin cambios (diff limitado a claves
  de payload, nombre de variable local y comentarios).

### AC5 — Suites verdes ✔ (ejecutadas por el reviewer)
- `pnpm test` → `# tests 588 # suites 167 # pass 588 # fail 0` (incluye el
  contrato nuevo y el test de estructura actualizado; sin tests
  funcionales rotos).
- `cargo test --manifest-path src-tauri/Cargo.toml` →
  `test result: ok. 318 passed; 0 failed` (backend sin cambios).
- `node scripts/check-format.mjs` → «FORMATO ✔ … correctos», exit 0.
- `./init.sh` → «✔ formato … ✔ tests al 100% (node:test) … ✔ build de
  producción (pnpm build) … ✔ El entorno está perfecto.», exit 0.

## Arquitectura y convenciones (docs/)

- docs/architecture.md: el cambio vive en `src/adapters/` (única capa con
  invoke), importa solo entidades/puertos/errores de `src/domain/`; no hay
  lógica de negocio añadida (solo renombrado de claves). ✔
- docs/conventions.md: comentario en español, errores nombrados intactos
  (`errorOnboardingDesdeRechazo`), sin scripts nuevos fuera de `tests/`. ✔
- Dependencias de la feature: la entrada 31 en feature_list.json no declara
  `depends_on`; no se saltó ninguna dependencia pendiente. ✔
- Evidencia rojo/verde en `progress/impl_31.md`: tests escritos antes del
  código, rojo documentado (3 fallos exactos) y suite verde al final. ✔

## Cambios requeridos

Ninguno.

Nota informativa (no bloqueante, fuera de alcance documentado en
impl_31.md): el doble prefijo cosmético del mensaje de error y el archivo
basura untracked de nombre corrupto en la raíz (previo a esta sesión) no
corresponden a la feature 31 y no afectan a ./init.sh ni a check-format.

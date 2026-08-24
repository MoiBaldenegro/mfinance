# Análisis: error fatal al arrancar «missing required key perfilId» en obtener_onboarding_status

> Informe de la sesión spec_author del 2026-08-24. Complementa (no duplica)
> `progress/research/onboarding-first-install.md`, que diseñó el gate de
> arranque (feature 29) y el seed diferido (feature 30). Este informe cubre
> el bug que ese gate revela en la primera instalación real.

## 1. Problema en propias palabras

Al arrancar la app, el humano ve el mensaje
«Error: no se pudo cargar el estado del onboarding: no se pudo cargar el
estado del onboarding: invalid args `perfilId` for command
`obtener_onboarding_status`: command obtener_onboarding_status missing
required key perfilId» y la app se queda ahí, inutilizable.

Traducción técnica: el frontend está invocando el command Tauri
`obtener_onboarding_status` con un objeto de argumentos cuyas CLAVES no
coinciden con lo que espera el macro `#[tauri::command]`. El mensaje de
Tauri lo dice explícitamente: falta la clave requerida `perfilId`
(camelCase). No es que el id del perfil activo sea `undefined` ni que falte
un command alternativo: el id se resuelve correctamente, pero viaja bajo la
clave equivocada.

## 2. Causa raíz exacta (archivo y línea)

**Tauri 2, por defecto, aplica `rename_all = "camelCase"` a los argumentos
de `#[tauri::command]`**: un parámetro Rust `perfil_id: String` se expone al
lado JS como clave `perfilId` (documentación oficial de Tauri, sección
«Calling Rust from JavaScript»: `invoke_message` en Rust ⇐ `invokeMessage`
en JS). Solo un atributo explícito `rename_all = "snake_case"` cambia esto;
grep en `src-tauri/` confirma que NINGÚN command lo usa (los únicos
`rename_all` son de enums/structs serde, no de commands).

- **Firma real del command** — `src-tauri/src/commands/perfiles_onboarding_commands.rs:63-71`:
  `pub fn obtener_onboarding_status(perfil_id: String, state: State<AppState>)`.
  Sin `rename_all` ⇒ JS DEBE pasar `{ perfilId }`.
- **Invocación frontend** — `src/adapters/onboarding-adapter.ts:44`:
  `llamar<OnboardingStatus>('obtener_onboarding_status', { perfil_id })` ⇒
  pasa la clave snake_case `perfil_id`. Tauri no la reconoce, echa en falta
  `perfilId` y rechaza la llamada ANTES de entrar al handler.
- El rechazo IPC es un Error sin `.codigo`; `llamar` (línea 26) lo convierte
  en `OnboardingStatusError` (src/domain/errors/onboarding-errors.ts:65 →
  prefijo en línea 7) y el wizard lo pinta vía `WizardErrorCarga`
  (src/components/onboarding/OnboardingWizard.tsx:64-65). «Ahí se queda»:
  el botón Reintentar relanza la misma llamada con la misma clave equivocada.

**El doble prefijo del mensaje** («no se pudo cargar el estado del
onboarding:» ×2): el adapter ya envuelve el rechazo en `OnboardingStatusError`
(onboarding-adapter.ts:26) y el caso de uso lo re-envuelve otra vez
(gestionar-onboarding.ts:24-26, `motivoDeRechazoOnboarding` extrae el
`.message` ya prefijado). Es el mismo patrón cosmético que la feature 28
documentó para snapshot-errors y dejó FUERA de alcance; aquí también queda
fuera (candidato a feature propia si el humano lo pide).

## 3. Cadena de arranque que dispara el error (por qué ahora)

1. Feature 30: arranque frío crea perfil «Personal» con
   `onboarding_status = NotStarted` y SIN snapshot sembrado.
2. Feature 29: `SnapshotProvider` (src/components/shell/SnapshotProvider.tsx:52-69)
   llama `obtener_perfil_activo_con_onboarding` — command SIN argumentos ⇒
   funciona — y con `NotStarted` pasa a estado `onboarding`.
3. `App.tsx:26-28` renderiza `OnboardingWizard` a pantalla completa.
4. Al montar el wizard, `useOnboarding` (src/hooks/use-onboarding.ts:51-59)
   lanza `cargarEstado` ⇒ `cargarEstadoOnboarding`
   (src/domain/use-cases/onboarding/onboarding-estado.ts:29) ⇒
   `gestionarOnboarding.obtenerEstado` ⇒ `OnboardingAdapter.obtenerEstado(undefined)`.
5. El adapter resuelve el id del perfil activo vía `perfil_activo`
   (onboarding-adapter.ts:31-38; command sin argumentos ⇒ funciona, el id
   SÍ se obtiene) e invoca `obtener_onboarding_status` con `{ perfil_id }`
   ⇒ rechazo «missing required key perfilId» ⇒ pantalla de error permanente.

Antes de las features 29/30 el wizard solo se abría desde Ajustes; el bug ya
existía entonces, pero el arranque nunca tocaba ese camino.

## 4. Alcance real: 6 commands rotos, no solo uno

Todas las invocaciones del adapter con claves multi-palabra en snake_case
fallan igual (mismo `rename_all` por defecto en cada handler):

| Adapter (línea) | Command | Claves enviadas | Claves esperadas |
|---|---|---|---|
| onboarding-adapter.ts:44 | obtener_onboarding_status | `perfil_id` | `perfilId` |
| onboarding-adapter.ts:49 | actualizar_perfil_onboarding | `perfil_id`, `datos` | `perfilId`, `datos` |
| onboarding-adapter.ts:54 | completar_onboarding | `perfil_id` | `perfilId` |
| onboarding-adapter.ts:59-64 | agregar_meta | `perfil_id`, `titulo`… | `perfilId`, `titulo`… |
| onboarding-adapter.ts:73-76 | actualizar_meta | `perfil_id`, `meta_id` | `perfilId`, `metaId` |
| onboarding-adapter.ts:81 | eliminar_meta | `perfil_id`, `meta_id` | `perfilId`, `metaId` |

Handlers afectados: perfiles_onboarding_commands.rs:24-71 y
goals_commands.rs:24-64. Consecuencia: el wizard completo está roto (cargar
estado, guardado parcial, Finalizar, Saltar) y el CRUD de metas (paso 4 y
Ajustes→Mis metas) también. Los demás commands invocados desde el frontend
tienen argumentos de una sola palabra (`mes`, `cuenta`, `supuestos`,
`nombre`, `id`, `peticion`…) donde snake_case == camelCase, y por eso
funcionan; los payloads internos (p. ej. `OnboardingData`, `supuestos`)
viajan como struct serde con campos snake_case, que es correcto y no cambia.

## 5. Por qué no se detectó antes (gap de tests)

- Los cargo tests ejercitan las funciones de `application/` directamente
  (p. ej. commands/perfiles_onboarding_commands_tests.rs:53) — nunca la
  deserialización de argumentos del macro IPC.
- Los node:test del wizard usan puertos falsos
  (tests/onboarding-wizard/dobles.mjs) — nunca las claves reales del invoke.
- El test de estructura CODIFICÓ la clave equivocada como correcta:
  tests/onboarding-wizard/estructura-integracion-27.test.mjs:30-35 afirma
  «el adapter envía perfil_id a los commands» ⇒ hay que actualizarlo (TDD:
  primero a rojo con `perfilId`, luego arreglar el adapter).
- El único camino que sí se ejercitó de punta a punta en las features 29/30
  (`obtener_perfil_activo_con_onboarding`) no tiene argumentos.

## 6. Opciones de arreglo evaluadas

- **A. Corregir el adapter frontend a claves camelCase (`perfilId`,
  `metaId`) — ELEGIDA.** Un solo archivo de producción
  (src/adapters/onboarding-adapter.ts) + actualización del test de
  estructura. Sigue la convención por defecto de Tauri 2 (la documentación
  oficial usa exactamente este patrón), no toca backend, no arriesga los 309
  cargo tests, y deja el resto del repo como está.
- **B. `#[tauri::command(rename_all = "snake_case")]` en los 6 handlers —
  DESCARTADA.** Funciona, pero crea una excepción a la convención por
  defecto del framework en 2 archivos backend, diverge del ejemplo oficial
  de Tauri y deja viva la trampa para commands futuros (cualquier comando
  nuevo con argumento multi-palabra volvería a caer si el frontend usa la
  convención general).
- **C. Command sin argumento tipo `obtener_perfil_activo_con_onboarding`
  para el estado — DESCARTADA.** Solo curaría `obtener_onboarding_status`;
  los otros 5 commands (guardado, completar, metas) seguirían rotos.

Decisión: **opción A**, más un test de contrato frontend↔backend (ver
specs/31) que detecte esta clase de descuido en CI local (`pnpm test`).

## 7. Hallazgo secundario (feature aparte): commands de Balance inexistentes

Durante la investigación se comprobó que `snapshot-ipc-adapter.ts:83-113`
invoca `asset_upsert`, `asset_eliminar`, `liability_upsert` y
`liability_eliminar` (REQ-08-01/02, consumidos por
src/components/balance-section/use-balance.ts:51-71), pero esos commands NO
existen en el backend Tauri: `src-tauri/src/commands/snapshot_commands.rs`
solo registra load/save/export/import y `lib.rs` no los lista en
`generate_handler!`. Los artefactos históricos (progress/impl_8.md:23,
review_8.md:22-27) confirman que existían en el proyecto Astro y se
perdieron en la migración (commit 3b1da16). Consecuencia: cualquier
alta/edición/borrado de activo o pasivo en la sección Balance fallará con
«command not found» en cuanto el usuario llegue a esa sección (hoy
enmascarado porque la app muere antes, en el gate de onboarding). Es un
problema DISTINTO del reportado ⇒ feature 32 separada.

## 8. Archivos implicados en la corrección (feature 31)

| Archivo | Rol |
|---|---|
| src/adapters/onboarding-adapter.ts | Cambia claves de payload a camelCase (único archivo de producción a tocar). |
| tests/onboarding-wizard/estructura-integracion-27.test.mjs | El test que hoy fija `perfil_id` pasa a exigir `perfilId`/`metaId` (rojo primero). |
| tests/ (nuevo) y/o scripts/ | Test de contrato: las claves de cada invoke de src/adapters coinciden con los parámetros de los `#[tauri::command]` de src-tauri convertidos a camelCase. |

Sin cambios en backend, dominio, UI ni estilos.

## 9. Riesgos y trabas

1. **Actualización del test de estructura**: si se arregla el adapter sin
   actualizar el test, la suite queda roja (el test exige `perfil_id`). El
   orden TDD correcto es actualizar el test primero (rojo), luego adapter
   (verde).
2. **Falsos positivos del grep**: el identificador local `perfil_id` dentro
   del adapter puede permanecer como nombre de variable; lo que debe cambiar
   es la CLAVE del objeto enviado a invoke (`{ perfilId: ... }`). El test de
   contrato debe fijarse en las claves del payload, no en identificadores
   internos.
3. **Verificación real IPC**: node:test no puede invocar IPC de Tauri; la
   garantía de punta a punta la da el test de contrato (parseo de las firmas
   Rust + claves TS) más la verificación manual de `./init.sh` y arranque.
4. **Cosmético pendiente**: doble prefijo del mensaje de error (§2). No
   bloquea; se documenta para futura feature si el humano lo solicita.

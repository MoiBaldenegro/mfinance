# Implementación — Feature 31 fix-onboarding-status-perfilid

> Sesión del implementador del 2026-08-24. Corrección del bug fatal de
> arranque «missing required key perfilId» (análisis completo en
> `progress/research/fix-onboarding-status-perfilid.md`, spec en
> `specs/31_fix-onboarding-status-perfilid/requirements.md`).

## Resumen

El adapter de onboarding enviaba las claves de argumento en snake_case
(`perfil_id`, `meta_id`) pero `#[tauri::command]` de Tauri 2 aplica
`rename_all = "camelCase"` por defecto, así que los seis commands
(onboarding y metas) rechazaban la llamada antes de entrar al handler y la
app quedaba bloqueada en `WizardErrorCarga` en la primera instalación
(gate de arranque de la feature 29).

Corrección elegida (opción A del informe): cambiar a camelCase las claves
del payload en el adapter (único archivo de producción), actualizar PRIMERO
el test de estructura (TDD rojo) y añadir un test de contrato
frontend↔backend que detecta esta clase de descuido en `pnpm test`.

## Archivos tocados

| Archivo | Cambio | Líneas (wc -l) |
|---|---|---|
| tests/onboarding-wizard/estructura-integracion-27.test.mjs | El test que fijaba `perfil_id` como clave correcta pasa a exigir `perfilId`/`metaId` en los seis payloads y prohíbe el snake_case (REQ-31-01/02). | 86 |
| tests/contrato-ipc-adapters/contrato-invoke-commands.test.mjs | NUEVO. Contrato genérico: parsea los `#[tauri::command]` de src-tauri/src/commands y las llamadas `llamar/invoke` de src/adapters y exige coincidencia exacta de claves según la convención camelCase (REQ-31-05/06). Allowlist explícita para asset_upsert/asset_eliminar/liability_upsert/liability_eliminar (commands inexistentes que restaura la feature 32; un subtest falla si aparecen en el backend sin quitarlos de la allowlist). | 99 |
| src/adapters/onboarding-adapter.ts | Claves de payload a camelCase en los seis invokes: `{ perfilId: id }` (obtener_onboarding_status, actualizar_perfil_onboarding, completar_onboarding, agregar_meta), `{ perfilId: id, metaId }` (actualizar_meta, eliminar_meta). Variable local `perfil_id` renombrada a `id` y comentarios actualizados. NADA más cambia: firmas, resolución de perfil activo, manejo de errores y structs serde intactos. | 86 |
| progress/current.md | Documentación de la sesión. | — |

Sin cambios en backend (0 archivos .rs tocados), dominio TS, componentes,
estilos ni dependencias.

## Evidencia del ciclo rojo→verde

### ROJO (tests escritos antes del fix, contra el adapter vigente)

Suite completa con los tests nuevos y el adapter aún en snake_case:

```text
not ok 1 - Contrato IPC adapters ↔ #[tauri::command] (REQ-31-05/06)
not ok 108 - Cableado del wizard pasos 4-5 (REQ-27-01/06)
# tests 588
# pass 585
# fail 3          ← solo los 3 tests de la feature 31
```

Fallos concretos (misma salida con el archivo de test definitivo):

```text
✘ cada invoke envía exactamente las claves que espera su command
  onboarding-adapter.ts: obtener_onboarding_status envía [perfil_id] pero espera [perfilId]
    + actual - expected
      [ + 'perfil_id' - 'perfilId' ]

✘ onboarding y metas envían perfilId y metaId camelCase (REQ-31-01/02)
  obtener_onboarding_status no envía perfilId

✘ el adapter envía perfilId/metaId camelCase a los commands de onboarding y metas (REQ-31-01/02)
  The input did not match the regular expression /obtener_onboarding_status',\s*\{\s*perfilId/
```

Nota de proceso: la primera versión del test de contrato medía 113 líneas
(>100, regla del repo); se comprimió a la versión definitiva (99) y el rojo
se re-verificó contra ella revirtiendo temporalmente las claves del adapter
a snake_case y volviéndolas a corregir (mismos fallos).

### VERDE (tras el fix)

```text
node --test tests/contrato-ipc-adapters/... tests/onboarding-wizard/estructura-integracion-27.test.mjs
ok 1 - Contrato IPC adapters ↔ #[tauri::command] (REQ-31-05/06)
ok 2 - Cableado del wizard pasos 4-5 (REQ-27-01/06)
ok 3 - Integración Ajustes y post-onboarding (REQ-27-07..10)
# tests 13  # pass 13  # fail 0

pnpm test (suite completa)
# tests 588  # suites 167  # pass 588  # fail 0

cargo test --manifest-path src-tauri/Cargo.toml
test result: ok. 318 passed; 0 failed; 0 ignored   (backend sin cambios)

./init.sh
✔ formato de feature_list.json y progress/current.md
✔ tests al 100% (node:test)
✔ build de producción (pnpm build)      ← tsc + vite: tipos TS del adapter OK
✔ El entorno está perfecto.
```

## Verificación de los criterios de aceptación

1. **TDD rojo→verde sobre el test de estructura** — el test de
   estructura-integracion-27 se actualizó PRIMERO para exigir `perfilId`/
   `metaId`; falló en rojo contra el adapter vigente y pasó a verde tras el
   arreglo. Evidencia arriba. ✔ (REQ-31-01/02)
2. **Test de contrato nuevo escrito antes del arreglo** —
   tests/contrato-ipc-adapters/contrato-invoke-commands.test.mjs verifica
   las claves de cada invoke de src/adapters contra los parámetros
   camelCase de los `#[tauri::command]`; falló en rojo antes del fix y
   cubre los seis commands de onboarding y metas (más el resto de commands
   registrados: load/save/export/import, perfiles, conciliación, PyG,
   proyecciones, cierre, diagnóstico y simulador). ✔ (REQ-31-05/06)
3. **Grep de claves snake_case como payload** —
   `grep -rnE "(perfil_id|meta_id)\s*[:,}]" src/adapters/` devuelve 0
   coincidencias (exit 1); tampoco queda `perfil_id`/`meta_id` como
   identificador en el adapter. Los payloads de structs serde permanecen
   intactos: `datos` (OnboardingData con campos snake_case), `titulo`,
   `descripcion`, `tags`, `snapshot`, `movimiento`, `peticion`,
   `supuestos`… ningún struct de datos cambió. ✔ (REQ-31-01/02)
4. **Verificación del arranque** — node:test no puede invocar IPC real
   (informe §9.3); la garantía automatizada es el test de contrato:
   `obtener_onboarding_status` ahora envía EXACTAMENTE `[perfilId]`, la
   clave que el rechazo de Tauri exigía, y los seis invokes (carga de
   estado, guardado parcial, completar, saltar y CRUD de metas) pasan por
   el adapter corregido con claves verificadas contra las firmas Rust. El
   resto del comportamiento del wizard es idéntico: solo cambiaron nombres
   de claves en el payload. ✔ (REQ-31-03/04)
5. **Suites verdes** — pnpm test 588/588 sin tests funcionales rotos,
   cargo test 318/318 sin cambios en backend y ./init.sh verde completo. ✔

## Restricciones del repo

- Máx. 100 líneas: adapter 86, test de contrato 99, estructura 86. ✔
- invoke() solo bajo src/adapters (el test de contrato y los
  frontend-hexagono lo confirman). ✔
- Dominio TS sin react ni @tauri-apps/api: sin cambios en src/domain. ✔
- Sin dependencias nuevas (solo node:fs/node:path/node:test stdlib). ✔
- Estilos: no se tocó UI ni CSS. ✔

## Fuera de alcance (documentado)

- Doble prefijo cosmético del mensaje de error («no se pudo cargar el
  estado del onboarding:» ×2): igual que en la feature 28, queda fuera y es
  candidato a feature propia (informe §2).
- Commands de Balance inexistentes (asset_upsert, asset_eliminar,
  liability_upsert, liability_eliminar): hallazgo del informe §7, ya dado
  de alta como feature 32. El test de contrato los lleva en allowlist y
  fallará si alguien los registra en el backend sin quitarlos de ella; al
  implementar la feature 32 sus claves deberán cumplir el mismo contrato
  camelCase.
- Observación: existe un archivo basura en la raíz del repo con nombre
  corrupto («C…progresshistory.md», untracked, previo a esta sesión); no se
  tocó por no corresponder a esta feature.

Estado: feature 31 implementada, a la espera del reviewer externo.

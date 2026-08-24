# Informe de implementación — Feature 27: onboarding-paso-metas-completar

> Sesión del 2026-08-23. Implementador: agente implementador (sin subagentes).
> Estado al cierre de sesión: implementada, suite completa en verde, **pendiente
> de revisión** (`progress/review_27_onboarding-paso-metas-completar.md`).

## 1. Resumen

Se implementaron el **Paso 4 (Umbrales de indicadores + Metas/Journal)** y el
**Paso 5 (Resumen, Finalizar)** del wizard de onboarding, junto con la
**integración completa post-onboarding**:

- **Paso 4** — `OnboardingPasoMetas.tsx` compone:
  - `IndicadoresUmbralesSection`: 4 indicadores (Endeudamiento, Tasa de ahorro,
    Fondo de emergencia, Ingreso pasivo) con campos verde/rojo editables,
    validación cruzada y botón «Restaurar valores por defecto». Los umbrales se
    persisten en `onboarding_data.paso4.umbrales`.
  - `MetasJournalSection` (+ `FormularioMeta`): CRUD completo del journal con
    validación cliente COINCIDENTE con el backend (REQ-23-11: título req ≤100,
    descripción ≤5000, tags ≤5×≤20, trim idéntico). Persiste en
    `goals_journal` del perfil vía IPC (no en onboarding_data, según design.md §9).
- **Paso 5** — `OnboardingPasoResumen.tsx`: 8 secciones con checks y totales
  (personales, fuentes, categorías, balance con patrimonio y aportes, deuda,
  proyección, indicadores, metas). El botón «Finalizar onboarding» llama
  `completarOnboarding`.
- **Consolidación backend**: nuevo caso de uso Rust
  `completar_onboarding_con_snapshot`: activa el perfil → consolida
  `financial_profile` + status Completed (lógica F23) → **consolida el snapshot**
  (`StrategySettings.currency/debt_strategy/extra_monthly_payment`,
  `Investment.tasa_esperada` por familia). Antes de esta feature el comando
  `completar_onboarding` NO consolidaba StrategySettings ni Investments.
- **Integración Ajustes / post-onboarding**:
  - Badge «Onboarding en progreso» por perfil (REQ-27-09) + «Reanudar» carga
    paso guardado, `onboarding_data` y `goals_journal`.
  - Sub-sección **«Mis metas»** en Ajustes reutiliza la MISMA
    `MetasJournalSection`/puerto/caso de uso/adapter (REQ-27-10).
  - Al completar o saltar: cierra wizard, **navega a Registro** y muestra toast
    «Onboarding completado. ¡Bienvenido, \<nombre\>!» o «Perfil creado. Puedes
    completar tu onboarding después en Ajustes» (bus de eventos `src/lib/bus-ui.ts`
    + `ToastAviso` en la shell, auto-cierre 4 s).

## 2. Correcciones de integración detectadas («verifica» del alcance)

1. **El adapter nunca enviaba `perfil_id`**, exigido por TODOS los commands de
   onboarding del backend (`actualizar_perfil_onboarding`,
   `completar_onboarding`, `obtener_onboarding_status`). La persistencia
   parcial/saltar/completar fallaba en runtime (error tragado en consola).
   Fix: los métodos del puerto aceptan `perfilId?`; el adapter resuelve el
   perfil ACTIVO vía `perfil_activo` cuando falta; `GestionPerfiles` pasa el id
   del perfil que está completando el wizard.
2. **Forma de `Paso4Data` incompatible front/back**: el frontend enviaba
   `umbrales` como ARRAY + campo `metas`; el backend espera
   `{ umbrales: UmbralesIndicadores }` con 8 campos `Option<f64>` y SIN metas.
   La deserialización serde de `paso4` habría fallado siempre. Se remodeló la
   entidad TS como espejo exacto del backend; las metas viven en `goals_journal`.
3. **Commands de journal inexistentes**: la capa application de goals existía
   desde F23 pero no había handlers IPC. Se añadieron `agregar_meta`,
   `actualizar_meta`, `eliminar_meta` (finos, delegan en
   `application/perfiles_onboarding::goals`) registrados en `lib.rs`.

## 3. Archivos tocados (wc -l)

### Creados — frontend

| Líneas | Archivo |
|-------:|---------|
| 40 | src/components/onboarding/OnboardingPasoMetas.tsx |
| 85 | src/components/onboarding/IndicadoresUmbralesSection.tsx |
| 75 | src/components/onboarding/MetasJournalSection.tsx |
| 86 | src/components/onboarding/FormularioMeta.tsx |
| 44 | src/components/onboarding/OnboardingPasoResumen.tsx |
| 81 | src/components/onboarding/WizardContenido.tsx |
| 17 | src/components/shell/ToastAviso.tsx |
| 43 | src/components/ajustes-section/PerfilFila.tsx |
| 23 | src/components/ajustes-section/MisMetas.tsx |
| 70 | src/hooks/use-metas.ts |
| 30 | src/hooks/usar-bus-ui.ts |
| 37 | src/lib/bus-ui.ts |
| 80 | src/domain/entities/goal-entry.ts |
| 77 | src/domain/use-cases/onboarding/gestionar-metas.ts |
| 100 | src/domain/use-cases/onboarding/onboarding-resumen.ts |
| 30 | src/styles/onboarding-paso-metas.css |
| 89 | src/styles/indicadores-umbrales.css |
| 72 | src/styles/metas-journal.css |
| 70 | src/styles/meta-formulario.css |
| 69 | src/styles/onboarding-paso-resumen.css |
| 32 | src/styles/toast-aviso.css |
| 11 | src/styles/perfil-fila.css |
| 12 | src/styles/mis-metas.css |

### Creados — backend Rust

| Líneas | Archivo |
|-------:|---------|
| 99 | src-tauri/src/application/perfiles_onboarding/consolidar_snapshot.rs |
| 64 | src-tauri/src/commands/goals_commands.rs |
| 100 | src-tauri/src/application/tests/perfiles_onboarding_consolidar_tests.rs |
| 61 | src-tauri/src/application/tests/perfiles_onboarding_consolidar_defectos_tests.rs |

### Modificados

| Líneas | Archivo | Cambio |
|-------:|---------|--------|
| 99 | src/components/onboarding/OnboardingWizard.tsx | pasos 4-5 reales, perfilId/metas, «Finalizar onboarding» |
| 98 | src/components/ajustes-section/GestionPerfiles.tsx | badge/reanudar con metas, perfilId, toasts+navegación (era 160, ahora ≤100) |
| 55 | src/components/ajustes-section/AjustesSection.tsx | monta `<MisMetas />` |
| 98 | src/components/shell/AppShell.tsx | suscripción bus-ui + ToastAviso global |
| 100 | src/hooks/use-onboarding.ts | perfilId, paso4Actual/actualizarPaso4, devuelve nombre |
| 82 | src/domain/entities/onboarding/onboarding-pasos.ts | Paso4Data espejo backend (+UmbralesIndicadores) |
| 22 | src/domain/entities/perfil.ts | añade `goals_journal?` |
| 27 | src/domain/ports/onboarding-port.ts | perfilId opcional + agregarMeta/actualizarMeta/eliminarMeta |
| 86 | src/adapters/onboarding-adapter.ts | envía perfil_id; resuelve activo; commands de metas |
| 80 | src/domain/use-cases/onboarding/onboarding-paso4.ts | reescrito: defaults+validación cruzada+restauración |
| 62 | src/domain/use-cases/onboarding/onboarding-paso5.ts | perfilId, avisos con motivo |
| 75 | src/domain/use-cases/onboarding/gestionar-onboarding.ts | propaga perfilId |
| 33 | src/domain/use-cases/onboarding/onboarding-estado.ts | propaga perfilId |
| 9 | src/domain/use-cases/onboarding/index.ts | barrel actualizado |
| 18 | src/domain/entities/onboarding/index.ts | barrel actualizado |
| 13 | src-tauri/src/application/perfiles_onboarding/mod.rs | exporta consolidación |
| 38 | src-tauri/src/commands/mod.rs | declara goals_commands |
| 100 | src-tauri/src/lib.rs | registra agregar/actualizar/eliminar_meta |
| 62 | src-tauri/src/application/tests/mod.rs | registra tests de consolidación |

### Tests nuevos (node:test)

75 `paso4-umbrales.test.mjs` · 43 `paso4-edicion.test.mjs` ·
59 `metas-validacion.test.mjs` · 92 `gestionar-metas-crud.test.mjs` ·
84 `paso5-resumen.test.mjs` · 72 `completar-saltar-perfilid.test.mjs` ·
47 `bus-ui-navegacion-toast.test.mjs` · 63 `estructura-pasos-45.test.mjs` ·
75 `estructura-integracion-27.test.mjs` — todos ≤100 líneas.

### Tests preexistentes actualizados (evolución estructural documentada)

- `tests/onboarding-wizard/onboarding-integracion-estilos-hexagonal.test.mjs`
  (97): la aserción del botón «Reanudar onboarding» apunta ahora a
  `PerfilFila.tsx` (componente extraído); el resto intacto.
- `tests/onboarding-wizard/onboarding-paso3-usecase.test.mjs` (368, tamaño
  preexistente de F26): las 3 aserciones de contenido del paso 3 apuntan a
  `WizardContenido.tsx`; la de validez (`currentStep === 3` / `return true`)
  sigue leyendo OnboardingWizard.tsx, donde esa lógica permanece inline.

## 4. Evidencia TDD rojo → verde

### ROJO (tests escritos ANTES que el código)

Suite node:test tras escribir solo los tests (los módulos no existían):

```
not ok 59 - tests\\onboarding-wizard\\bus-ui-navegacion-toast.test.mjs
not ok 65 - tests\\onboarding-wizard\\metas-journal.test.mjs
not ok 73 - tests\\onboarding-wizard\\paso4-umbrales.test.mjs
not ok 74 - tests\\onboarding-wizard\\paso5-resumen-completar.test.mjs
not ok 133 - Paso 4 — OnboardingPasoMetas y secciones (REQ-27-01/02/03)
not ok 134 - Paso 5 — OnboardingPasoResumen (REQ-27-05)
not ok 135 - Cableado del wizard pasos 4-5 (REQ-27-01/06)
not ok 136 - Integración Ajustes y post-onboarding (REQ-27-07..10)
# tests 536  # pass 519  # fail 17
```

Cargo test en rojo (la función de consolidación no existía):

```
error[E0432]: unresolved import `crate::application::perfiles_onboarding::completar_onboarding_con_snapshot`
error: could not compile `mfinance` (lib test) due to 1 previous error
```

### VERDE (tras implementar)

```
$ pnpm test
# tests 567  # pass 567  # fail 0

$ cargo test --manifest-path src-tauri/Cargo.toml
test result: ok. 292 passed; 0 failed; 0 ignored; 0 measured; 288 filtered out

incluye:
  perfiles_onboarding_consolidar_tests::finalizar_consolida_snapshot_estrategia_e_inversiones ... ok
  perfiles_onboarding_consolidar_defectos_tests::finalizar_sin_pasos_opcionales_deja_defectos_y_completa ... ok
  perfiles_onboarding_consolidar_defectos_tests::estrategia_desconocida_no_rompe_la_consolidacion ... ok
  perfiles_onboarding_consolidar_defectos_tests::strategy_settings_default_sigue_siendo_mxn_avalancha ... ok

$ ./init.sh
✔ formato de feature_list.json y progress/current.md
✔ tests al 100% (node:test)
✔ build de producción (pnpm build)
✔ El entorno está perfecto. Podemos empezar a trabajar.

$ node scripts/audit-design-tokens.mjs
AUDIT ✔ ningún color fuera de tokens.css en src/styles
```

## 5. Decisiones tomadas

1. **Sentido de la validación cruzada de umbrales.** `requirements.md` REQ-27-02
   dice literalmente «verde>rojo (endeudamiento/fondo), verde<rojo (ahorro/
   ingreso_pasivo)», pero aplicado literal invalidaría los PROPIOS defaults
   (endeudamiento 15<30, ahorro 15>5, ingreso pasivo 100>25). Manda la coherencia
   del layout de design.md (§2: «Verde si ≤15 / Rojo si ≥30», etc.): endeudamiento
   exige verde<rojo; ahorro/fondo/ingreso_pasivo exigen verde>rojo. Documentado
   en cabecera de `onboarding-paso4.ts` y en los propios tests.
2. **Metas fuera de `Paso4Data`.** El backend define `Paso4Data { umbrales }`
   sin metas; design.md §9 indica que el journal vive en el perfil. El frontend
   se alineó: CRUD del journal vía commands dedicados sobre `goals_journal`.
3. **Activación previa a consolidar.** La ruta del snapshot depende del perfil
   activo; `completar_onboarding_con_snapshot` ejecuta seleccionar→completar→
   consolidar para que Finalizar/Saltar dejen el perfil terminado COMO ACTIVO y
   su snapshot con moneda/estrategia/tasas correctos.
4. **Bus de eventos UI (`src/lib/bus-ui.ts`)** para navegar a Registro y toasts:
   módulo puro sin frameworks (mismo patrón que estado-tema), la shell se
   suscribe con `usarBusUi` y renderiza `ToastAviso`. Evita acoplar GestionPerfiles
   a la navegación interna de AppShell.
5. **Extracciones para respetar ≤100 líneas**: `WizardContenido` (contenido del
   wizard), `PerfilFila` (fila + badge), `FormularioMeta` (formulario journal),
   hojas CSS divididas (`metas-journal`/`meta-formulario`) y `perfil-fila.css`
   para no tocar `gestion-perfiles.css` (120 líneas preexistentes, fuera de scope).
6. **Tests preexistentes F24/F26** cuyo sujeto fue extraído se re-apuntaron al
   archivo nuevo manteniendo su intención (detalle en §3).

## 6. Estado final de suites

| Suite | Resultado |
|-------|-----------|
| `pnpm test` (node:test) | **567/567 pass, 0 fail** |
| `cargo test --manifest-path src-tauri/Cargo.toml` | **292/292 pass, 0 fail** (4 nuevos de consolidación) |
| `pnpm build` | ✔ (warning de chunk >500 kB preexistente) |
| `cargo check --manifest-path src-tauri/Cargo.toml` | ✔ compila (warnings de imports unused preexistentes en goals.rs/commands tests) |
| `./init.sh` | ✔ verde completo |
| `scripts/audit-design-tokens.mjs` | ✔ OK |

Reglas duras verificadas: invoke() solo bajo src/adapters (grep limpio);
src/domain sin react/@tauri-apps/api; componentes sin IPC directo; estilos solo
tokens; mensajes UI en español; sin dependencias nuevas (npm ni crates);
feature_list.json con feature 27 `in_progress` esperando revisión.

---

## Ronda 2 — fix crítico ruta IPC (REQ-27-06)

> Responde al «Cambio requerido #1» de progress/review_27_onboarding-paso-metas-completar.md
> (CHANGES_REQUESTED ronda 1). Solo se tocó ese punto: nada de lo ya aprobado
> (C2-C6) fue reescrito; los tests preexistentes NO se modificaron.

### 1. Qué se arregló

El command `completar_onboarding` (src-tauri/src/commands/perfiles_
onboarding_commands.rs) invocaba el caso de uso ANTIGUO de F23
`perfiles_onboarding::completar_onboarding`, que solo consolida
financial_profile/status en el registro: jamás toca el snapshot. El caso
de uso nuevo `completar_onboarding_con_snapshot` era código muerto (0
referencias desde commands/). Consecuencia runtime: al Finalizar/Saltar,
moneda/estrategia/pago extra/tasas nunca llegaban al snapshot y el perfil
quedaba sin activar (la cabecera seguía mostrando al titular anterior).

**Fix**: el command delega ahora (vía un núcleo testeable sin tipos de
Tauri, `completar_onboarding_core`) en el nuevo caso de uso fachada
`completar_onboarding_en_adaptador`
(src-tauri/src/application/perfiles_onboarding/finalizar.rs), que encadena
seleccionar → completar → consolidar sobre el ÚNICO adapter
(`JsonSnapshotRepository` implanta PerfilRepository Y SnapshotRepository;
sobre un solo objeto no caben dos `&mut` vivos simultáneos, por eso la
fachada genérica `<R: PerfilRepository + SnapshotRepository>` usa préstamos
secuenciales y reutiliza `aplicar_onboarding_a_snapshot` intacta).

### 2. TDD rojo → verde (test de la RUTA DEL COMMAND)

Test NUEVO `src-tauri/src/commands/perfiles_onboarding_ruta_tests.rs`
(2 tests): ejercita `completar_onboarding_core` —el núcleo exacto del
handler #[tauri::command]— contra el adapter JSON REAL en directorio
temporal (`infrastructure::test_support::{temp_dir, cleanup}`, nunca
Documents), con titular previo + perfil nuevo del wizard.

ROJO fase A — el seam no existía aún:

```
error[E0432]: unresolved import `crate::commands::perfiles_onboarding_commands::completar_onboarding_core`
error: could not compile `mfinance` (lib test) due to 1 previous error
```

ROJO fase B — seam creado con el cableado ANTIGUO (refactor mecánico puro,
cero cambio de conducta) y versión FINAL del test ejecutada:

```
test commands::perfiles_onboarding_ruta_tests::ruta_del_command_sin_snapshot_previo_consolida_sobre_vacio ... FAILED
thread '...sin_snapshot_previo...' panicked at src\commands\perfiles_onboarding_ruta_tests.rs:91:32:
snapshot vacío + datos del wizard: SnapshotLoadError { reason: "sin perfil activo: no hay snapshot que operar" }
test commands::perfiles_onboarding_ruta_tests::ruta_del_command_activa_el_perfil_y_consolida_su_snapshot ... FAILED
assertion `left == right` failed
  left: Some("p_18ce9b4e6b2d43f8000001")   <- sigue activo el titular PREVIO
 right: Some("p_18ce9b4e6c0a81dc000002")   <- Beto debió quedar activo
test result: FAILED. 0 passed; 2 failed; ...
```

VERDE — aplicado el fix (core → `completar_onboarding_en_adaptador`):

```
test commands::perfiles_onboarding_ruta_tests::ruta_del_command_sin_snapshot_previo_consolida_sobre_vacio ... ok
test commands::perfiles_onboarding_ruta_tests::ruta_del_command_activa_el_perfil_y_consolida_su_snapshot ... ok
test result: ok. 2 passed; 0 failed; ...; 292 filtered out
```

Efecto completo verificado por los tests de ruta: tras Finalizar/Saltar el
perfil queda ACTIVO (recarga posterior muestra al nuevo titular), Completed,
y SU snapshot consolidado (currency, debt_strategy, extra_monthly_payment e
Investment.tasa_esperada fusionada por familia: renta_fija 3.5→7.5 del seed).

### 3. Archivos tocados (wc -l)

| Líneas | Archivo | Cambio |
|-------:|---------|--------|
| 42 | src-tauri/src/application/perfiles_onboarding/finalizar.rs | NUEVO: fachada REQ-27-06 sobre adapter único |
| 15 | src-tauri/src/application/perfiles_onboarding/mod.rs | declara/exporta finalizar |
| 85 | src-tauri/src/commands/perfiles_onboarding_commands.rs | command → core → caso de uso nuevo |
| 98 | src-tauri/src/commands/perfiles_onboarding_ruta_tests.rs | NUEVO: tests de la ruta del command |
| 40 | src-tauri/src/commands/mod.rs | registra módulo de tests |

Todos ≤100 líneas. Sin dependencias nuevas. Tests funcionales preexistentes:
NINGUNO modificado (los 3 de perfiles_onboarding_commands_tests.rs prueban
casos de uso aislados y siguen en verde tal cual).

### 4. Decisión documentada

En la fachada, si el titular recién activado aún no tiene archivo de
snapshot (perfil creado por el wizard, caso Finalizar/Saltar normal), se
consolida sobre `FinanceSnapshot::default()` (vacío + datos capturados)
en lugar de fallar: `load().unwrap_or_default()`. Es el mismo espíritu del
guard de ensure_seed (load falla → se siembra); se siembra VACÍO, no el
snapshot de ejemplo, para no inyectar datos ficticios a un usuario real.
La variante de dos puertos `completar_onboarding_con_snapshot` queda
intacta con su semántica estricta y sus tests.

### 5. Suites finales (esta ronda)

| Suite | Resultado |
|-------|-----------|
| `cargo test --manifest-path src-tauri/Cargo.toml` | **294/294 pass, 0 fail** (292 previos + 2 de ruta) |
| `pnpm test` (node:test) | **567/567 pass, 0 fail** |
| `./init.sh` | ✔ completo (formato + tests + build) |

Estado: feature 27 sigue `in_progress`; pendiente de nueva revisión del
reviewer (NO marcada done).

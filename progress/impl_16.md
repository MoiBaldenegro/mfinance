# Informe de implementación — Feature 16: cierre-mensual-assessment

> Wizard de ~10 min con evolución de flujo/patrimonio, presupuesto del mes
> siguiente por promedio móvil, assessment basado en reglas del semáforo,
> consejos continuos y cierre/reapertura con bloqueo real (REQ-16-01..08).

## 1. Ciclo rojo/verde (TEST-FIRST)

### ROJO (antes de implementar)

Tests escritos PRIMERO contra `specs/16_cierre-mensual-assessment/`:

- **cargo**: 3 suites nuevas (`domain/tests/monthly_assessment_tests.rs`,
  `application/tests/cierre_promedio_tests.rs`,
  `cierre_reglas_tests.rs`, `cierre_fachada_tests.rs`) registradas en sus
  `mod.rs`.
- **node --test**: 5 suites nuevas (`cierre-wizard`,
  `presupuesto-siguiente`, `consejos-logic`, `cierre-historico`,
  `cierre-bloqueo`).

Salida observada (recortes literales):

```text
error[E0432]: unresolved import `crate::domain::monthly_assessment`
error[E0433]: failed to resolve: could not find `cierre` in `application`
error[E0599]: no method named `historico_cierres` found for reference
              `&FinanceSnapshot` in the current scope
error[E0599]: no method named `mes_cerrado` found ...
→ error: could not compile `mfinance` (lib test) due to 14 previous errors
```

```text
not ok 10 - tests\frontend-shell\cierre-bloqueo.test.mjs      ERR_MODULE_NOT_FOUND ...mes-cerrado.ts
not ok 11 - tests\frontend-shell\cierre-historico.test.mjs    ERR_MODULE_NOT_FOUND ...cierre-historico.ts
not ok 12 - tests\frontend-shell\cierre-wizard.test.mjs       ERR_MODULE_NOT_FOUND ...wizard-cierre.ts
not ok 27 - tests\frontend-shell\presupuesto-siguiente.test.mjs
# pass 199 / fail 5
```

### VERDE (tras implementar)

```text
cargo test → test result: ok. 191 passed; 0 failed   (20 tests nuevos)
pnpm test  → # tests 218 / # pass 218 / # fail 0     (19 tests nuevos)
```

Correcciones sobre los PROPIOS tests durante el ciclo (sin tocar código de
producción para «colar» un verde): import del trait `SnapshotRepository`
en el test de guardado, shadowing de `registro`, ancla de fecha corregida
por cálculo exacto (2026-08-05 = día 20670), y dos aserciones JS escritas
por error con sintaxis Rust (`assert!`) sustituidas por `assert.ok`.

## 2. Arquitectura (hexagonal, reutilizando lo existente)

Backend (`src-tauri/src/`), dependencias hacia el dominio:

| Pieza | Dónde | Nota |
|---|---|---|
| Entidad `MonthlyAssessment` (+`IndicadorCerrado`) | `domain/monthly_assessment.rs` | fecha ISO + indicadores congelados + presupuesto decidido; serde round-trip testeado |
| `assessments` en `FinanceSnapshot` + `mes_cerrado`/`assessment_de`/`historico_cierres` | `domain/snapshot.rs` | `#[serde(default)]`: los JSON previos siguen cargando |
| Módulo-directorio `application/cierre/` | `tipos/peticion/errores/fecha/promedio_movil/reglas/reglas_textos/fachada/cierre_ops` | mismo patrón que `simulador_creditos` y `pyg_proyeccion` |
| Promedio móvil 3 meses | `cierre/promedio_movil.rs` | ventana fija `VENTANA_MESES=3`; divisor = meses disponibles |
| Reglas del assessment | `cierre/reglas.rs` + tabla pura `reglas_textos.rs` | orden Rojo→Amarillo→Verde estable; textos accionables en español |
| Guard REAL de mes cerrado | `application/save_state.rs` | rechaza cambios en registros de meses cerrados Y alteraciones de la lista de cierres vía save completo |
| Commands finos | `commands/cierre_commands.rs` (+ `error_cierre.rs`) | `cierre_resumen_cmd` `cierre_confirmar_cmd` `cierre_reabrir_cmd` `consejos_cmd`; cero lógica |
| Composition root | `lib.rs` | 4 commands nuevos registrados |

Frontend (`src/`), invoke() SOLO bajo adapters:

- **entities** `cierre.ts` (espejos IPC) + `finance-snapshot.ts` con
  `assessments`; **port** `cierre-port.ts`; **adapter**
  `cierre-ipc-adapter.ts`.
- **use-cases puros**: `wizard-cierre` (pasos/progreso/navegación),
  `presupuesto-siguiente` (pre-relleno, total vivo, validación campo a
  campo reutilizando `validacion-importes`), `consejos-logic` (máx. 5
  visibles según design.md), `cierre-historico`, `mes-cerrado`.
- **UI** `components/cierre-section/`: wizard 4 pasos (Repaso →
  Presupuesto → Assessment → Confirmación) con barra de progreso nativa
  `<progress>` (sin estilos inline), navegación Atrás/Continuar,
  PanelMesCerrado, ConsejosPanel e HistoricoCierres.
- **Registro**: `BloqueoCierre` + fieldset deshabilitado + botón
  «Reabrir mes» (el bloqueo cosmético secundario; el real vive en backend).
- **Estilos**: `wizard-cierre.css`, `pasos-wizard.css`, `consejo-item.css`,
  `consejos-panel.css` — solo custom properties de tokens.css
  (`audit-design-tokens` ✔); sin CSS embebido ni `style={{}}`.

## 3. Decisiones tomadas

1. **«Mes cerrado» = existe su `MonthlyAssessment`** en el snapshot (única
   fuente de verdad). Reabrir = eliminar ese assessment explícitamente
   (command dedicado). Consultable gratis vía `snapshot.assessments`.
2. **Bloqueo REAL en `save_state`**, no cosmético: si el snapshot entrante
   altera el registro de un mes cerrado o toca la lista de cierres, se
   rechaza con `SnapshotSaveError` nombrado y no se persiste. La UI además
   deshabilita edición. El guard es laxo solo cuando el estado vigente no
   puede cargarse (primer guardado del ciclo; sin nada que proteger).
3. **Consejos como panel independiente DENTRO de Cierre**: el array
   `SECCIONES` está congelado a exactamente 10 secciones por el test de la
   feature 5 (done); añadir una sección rompería esa feature cerrada.
   Cumple REQ-16-05 igualmente: se recalcula al cambiar el snapshot
   cargado (efecto depende de `estado` del provider).
4. **Fecha del cierre sin crates nuevas**: conversión días-época → ISO
   (algoritmo civil) en `cierre/fecha.rs`, testeada contra anclas
   conocidas incluido bisiesto. Sin dependencias npm/crates nuevas.
5. **El resumen del wizard no incluye recomendaciones**: el paso
   Assessment y el panel Consejos consumen el MISMO motor vía
   `consejos_vigentes()`/`consejos_cmd`, evitando duplicar evaluación.
6. `import_json` queda como restauración explícita de copia completa
   (feature 4 done): fuera del alcance del guard de edición.

## 4. Archivos creados/modificados (wc -l real, valor a valor)

Nuevos backend:
monthly_assessment 67 · tests/monthly_assessment_tests 66 ·
cierre/{mod 21, tipos 67, peticion 32, errores 39, fecha 27,
promedio_movil 42, reglas 57, reglas_textos 52, fachada 70,
cierre_ops 78} · tests/{cierre_fixtures 49, cierre_fachada_tests 69,
cierre_guarda_tests 43, cierre_promedio_tests 69, cierre_reglas_tests 90} ·
commands/{cierre_commands 57, error_cierre 18}

Modificados backend: domain/snapshot 77 · domain/mod 21 ·
domain/tests/mod 13 · application/mod 30 · application/tests/mod 40 ·
save_state 51 · import_validation 34 · commands/mod 26 · lib.rs 76 ·
seed/mod 31 · fixtures indicadores_* editados (+1 línea cada uno;
máximo resultante 95)

Nuevos frontend: entities/cierre 63 · ports/cierre-port 16 ·
adapters/cierre-ipc-adapter 47 · use-cases {wizard-cierre 45,
presupuesto-siguiente 71, consejos-logic 41, cierre-historico 42,
mes-cerrado 28} · cierre-section/{CierreSection 40, WizardCierre 74,
BarraProgreso 38, PasoRepaso 47, PasoPresupuesto 54, PasoAssessment 37,
PasoConfirmacion 51, PanelMesCerrado 48, ConsejosPanel 61,
HistoricoCierres 44, use-cierre-wizard 94, use-reapertura 31} ·
registro-section/BloqueoCierre 37 · styles {wizard-cierre 69,
pasos-wizard 89, consejo-item 37, consejos-panel 58}

Modificados frontend: finance-snapshot 32 · RegistroSection 84 ·
registro-section.css 98 · suites node {cierre-wizard 56,
presupuesto-siguiente 54, consejos-logic 52, cierre-historico 51,
cierre-bloqueo 38}

**Ningún archivo nuevo o modificado supera las 100 líneas** (máximos
reales: use-cierre-wizard 94; indicadores_engine_ingreso_pasivo_
clasificacion_tests 95; registro-section.css 98).

## 5. Verificación final (salida literal)

```text
$ cargo check --manifest-path src-tauri/Cargo.toml --all-targets
→ 0 warnings, 0 errors

$ cargo test --manifest-path src-tauri/Cargo.toml
→ test result: ok. 191 passed; 0 failed; 0 ignored

$ pnpm test
→ # tests 218 / # pass 218 / # fail 0

$ node scripts/audit-design-tokens.mjs
→ AUDIT ✔ ningún color fuera de tokens.css en src/styles

$ pnpm build
→ ✓ built in 2.65s

$ ./init.sh
✔ formato de feature_list.json y progress/current.md
✔ tests al 100% (node:test)
✔ build de producción (pnpm build)
✔ El entorno está perfecto. Podemos empezar a trabajar.
```

Sin TODO/FIXME/dbg!/println!/console.log en el código de la feature
(verificado con grep). Sin dependencias npm/crates nuevas.

## 6. Cobertura de aceptación

1. Wizard repaso→presupuesto→assessment→confirmación con barra y
   navegación atrás/continuar: `WizardCierre`+`BarraProgreso` +
   suite `cierre-wizard.test.mjs`. ✔
2. Presupuesto pre-relleno con promedio móvil de 3 meses editable por
   categoría: `promedio_movil_3` (tests cargo) + `textosDesdeSugerido` /
   inputs editables (tests node). ✔
3. Completar marca el mes cerrado y persiste assessment (fecha +
   indicadores + decisiones) consultable: `cerrar_mes` +
   `HistoricoCierres` + tests de fachada y `cierre-historico.test.mjs`. ✔
4. Reglas en backend con recomendaciones accionables en español
   encabezadas por riesgos rojos prioritarios: `evaluar_recomendaciones`
   (5 tests de orden/texto/sin-datos/todo-verde). ✔
5. Consejos vigentes recalculados al cambiar los datos cargados:
   `ConsejosPanel` con efecto sobre el estado del provider +
   `consejos-logic.test.mjs`. ✔
6. WHILE cerrado, MonthlyRecord solo lectura hasta reapertura explícita:
   guard en `save_state` (3 tests) + UI bloqueada + `reabrir_mes`. ✔

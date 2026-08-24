# Review — feature 16 (cierre-mensual-assessment)

**Veredicto:** CHANGES_REQUESTED *(1 cambio menor de trazabilidad; todo lo
funcional, arquitectónico y de tests está verificado EN DISCO y cumple).*

> Revisión de nivel 1 (2026-08-22). Todo lo indicado aquí fue verificado EN
> DISCO ejecutando el arnés en esta sesión: `./init.sh` completo,
> `cargo check --all-targets` con recompilación forzada (`touch` sobre los
> `.rs` para no heredar caché), `cargo test`, `pnpm test`,
> `audit-design-tokens`, greps hexagonales, `wc -l` propio sobre los ~62
> archivos listados en impl_16.md §4 y lectura línea a línea de las suites
> nuevas (cargo y node) más el código que verifican.

## Verificación global (hecha, no asumida)

```bash
./init.sh                                            # ✔ completo (entorno, formato, tests 100%, build)
cargo check --manifest-path src-tauri/Cargo.toml --all-targets   # 0 errores, 0 warnings (recompilación real tras touch)
cargo test --manifest-path src-tauri/Cargo.toml      # ok. 191 passed; 0 failed (coincide con impl_16.md)
pnpm test                                            # tests 218 | suites 62 | pass 218 | fail 0 (coincide)
node scripts/audit-design-tokens.mjs                 # AUDIT ✔ ningún color fuera de tokens.css
grep tauri en src-tauri/src/domain/                  # 0 coincidencias
grep @tauri-apps|react en src/domain/                # 0 imports
grep invoke en src/                                  # solo 3 adapters: cierre (nuevo), snapshot, simulador
grep TODO|FIXME|console.log|dbg!|println!|style={{   # 0 coincidencias en src/ y archivos F16
wc -l sobre los ~62 archivos de la feature           # TODOS ≤100 (máx real: registro-section.css 98)
```

## Hallazgos por criterio de aceptación

1. **Wizard repaso→presupuesto→assessment→confirmación con barra y
   navegación atrás/continuar (REQ-16-01)** — ✅ CUMPLE.
   `wizard-cierre.ts` (puro, sin React) declara exactamente
   `['repaso','presupuesto','assessment','confirmacion']`; `avanzar`
   clava en el último paso y `retroceder` en el primero;
   `progresoWizard` = 25/50/75/100. Suite `cierre-wizard.test.mjs` lo
   aserte paso a paso. UI: `WizardCierre.tsx` + `BarraProgreso.tsx`
   (`<progress>` nativo + lista de pasos con activo marcado) + nav
   Atrás/Continuar deshabilitada en extremos.
2. **Presupuesto pre-relleno con promedio móvil de 3 meses editable por
   categoría (REQ-16-02)** — ✅ CUMPLE. `promedio_movil.rs`: ventana fija
   `VENTANA_MESES=3`, orden canónico por clave de mes, **divisor = meses
   disponibles** — la pregunta «¿qué pasa con <3 meses?» está respondida Y
   testeada (`cierre_promedio_tests.rs:35-43`: 2 meses → vivienda
   (1200+0)/2=600 ✔; `:46-48` sin registros → mapa vacío; `:51-61` ventana
   deslizante ignora meses antiguos con 5 registros). Pre-relleno editable:
   `textosDesdeSugerido` + inputs libres por categoría con validación campo
   a campo reutilizando `validacion-importes` (suite
   `presupuesto-siguiente.test.mjs`: negativos/no numéricos rechazados con
   clave `gasto:<categoria>`).
3. **Completar marca el mes cerrado y persiste assessment consultable
   (REQ-16-03/08)** — ✅ CUMPLE. `cerrar_mes` congela los 4 indicadores +
   fecha ISO + presupuesto decidido en `MonthlyAssessment` dentro del
   snapshot (`assessments`, `#[serde(default)]` → compatibilidad con JSON
   previos); persistencia REAL verificada contra `repo.stored`
   (`cierre_fachada_tests.rs:29-44`) y cierre doble rechazado con
   `MesYaCerrado`. Consulta: `HistoricoCierres.tsx` +
   `resumenesHistorico` (orden descendente testeado) + round-trip serde
   (`monthly_assessment_tests.rs:58-66`). Fecha sin crates nuevas:
   algoritmo civil testeado contra anclas incluido bisiesto 1972-02-29.
4. **Reglas evaluadas en backend, recomendaciones accionables en español
   encabezadas por rojos (REQ-16-04/06)** — ✅ CUMPLE. Motor puro
   `evaluar_recomendaciones` en `application/cierre/reglas.rs` con
   `sort_by_key(rango)` estable (Rojo=0 < Amarillo=1 < Verde=2): la pregunta
   «¿orden rojos-primero?» tiene test directo
   (`cierre_reglas_tests.rs:31-42`: 2 rojos en posiciones [0] y [1];
   `:45-54` orden total R→A→V; `:70-83` sin-datos nunca rojo). Textos
   accionables concretos por nivel en `reglas_textos.rs`. El paso Assessment
   y ConsejosPanel consumen el MISMO motor (sin duplicación).
5. **Consejos vigentes recalculados al cambiar datos cargados
   (REQ-16-05)** — ✅ CUMPLE. `ConsejosPanel.tsx`: `useEffect` dependiente
   de `estado` del provider → `consejos_cmd` recalcula en backend;
   máx. 5 visibles (design.md) testeado; panel independiente DENTRO de
   Cierre justificado porque el test de F5 done congela `SECCIONES.length
   === 10` (`secciones-catalogos.test.mjs:21`) — features cerradas siguen
   verdes.
6. **WHILE cerrado, MonthlyRecord solo lectura hasta reapertura explícita;
   ./init.sh verde (REQ-16-07)** — ✅ CUMPLE (bloqueo real, no cosmético).
   Guard en `save_state.rs`: rechaza cualquier alteración del registro de
   un mes con assessment Y el borrado/modificación de la lista de cierres
   vía guardado completo. Tests: editar mes cerrado → error nombrado con
   «2026-07» y «cerrado» y estado vigente intacto
   (`cierre_guarda_tests.rs:11-24`); edición sin tocar cerrados pasa
   (`:27-33`); desbloqueo borrando `assessments` rechazado (`:36-42`). UI:
   `fieldset disabled` + botón Confirmar deshabilitado + BloqueoCierre con
   «Reabrir mes» explícito → `reabrir_mes` elimina el assessment
   (única puerta). `./init.sh` verde completo en mi sesión.

### Pregunta clave: ¿se puede saltar el guard desde otro camino?

Audité todos los puntos de escritura del repositorio:

- `commands::save_state` → `application::save_state` → **guard** ✔.
- `cerrar_mes`/`reabrir_mes` usan `repository.save()` directo — correcto y
  necesario (son LAS operaciones autorizadas a tocar `assessments`), y no
  modifican `monthly_records`.
- `conciliacion_engine.agregar_movimiento` usa `repo.save()` directo pero
  SOLO toca `account_statements` — sin bypass del REQ-16-07 (que protege el
  MonthlyRecord). Código preexistente de F13, no tocado por F16.
- `ensure_seed` solo escribe cuando no existe estado (nada que proteger).
- `import_json` restaura copias completas fuera del guard: decisión
  documentada en impl_16.md §3.6 como restauración explícita del humano.
  Aceptable respecto a REQ-16-07 (acción explícita del usuario); nota menor
  al final.

No existe camino que altere el `MonthlyRecord` de un mes cerrado sin pasar
por el guard o por la reapertura explícita.

## Checkpoints

- C1: [x] `./init.sh` termina verde completo (ejecutado en esta sesión).
- C2: [x] cargo test 191/0 · pnpm test 218/0 · check --all-targets
        0 warnings (verificado con recompilación forzada, no caché).
- C3: [x] Dominio puro ambos lados (greps 0: sin `tauri` en domain Rust,
        sin react/@tauri-apps en src/domain TS).
- C4: [x] `invoke()` solo bajo `src/adapters/` (3 adapters; el nuevo
        cierre-ipc-adapter reconstruye errores nombrados español).
- C5: [x] Lógica en use-cases/backend; commands finos; los `.tsx`
        renderizan y delegan (hooks extraen el comportamiento).
- C6: [x] Tokens: AUDIT ✔; 0 CSS embebido ni `style={{}}`.
- C7: [x] Máx. 100 líneas: medición propia sobre ~62 archivos — máximo
        real 98 (`registro-section.css`); use-cierre-wizard 94; ninguno
        supera 100.
- C8: [ ] Coherencia impl_16.md ↔ repo — FALLA por UNA cifra: el informe
        afirma `application/tests/mod 38` y mi medición es **40 líneas**
        (medido dos veces; el archivo registra las suites nuevas hasta
        `mod simulador_validacion_tests;`). Las otras ~60 cifras del §4
        coinciden valor a valor (incluidos los máximos declarados
        94/95/98) y ninguna cifra errónea oculta violación del límite
        (40 ≤ 100), pero el estándar binario fijado en review_14/review_15
        exige trazabilidad exacta.
- C9: [x] 0 warnings de compilación.
- C10: [x] Ciclo rojo/verde documentado y coherente: salidas literales
        (E0432/E0433/E0599 apuntando a módulos inexistentes;
        ERR_MODULE_NOT_FOUND de los 5 use-cases nuevos) + correcciones
        sobre sus PROPIOS tests documentadas sin colar verde.
- C11: [x] depends_on [6, 10] ambas `done`; sin dependencias npm/crates
        nuevas (validador verde dentro de init.sh; fecha ISO sin crate).
- C12: [x] Mensajes UI/errores en español (avisos de bloqueo, errores
        IPC reconstruidos, recomendaciones accionables).
- C13: [x] Sin TODOs/FIXME/dbg!/print/console.log en archivos F16.
- C14: [x] Integración embebida en sección Cierre existente justificada
        (SECCIONES=10 congelado por test F5 done).
- C15: [x] feature_list.json id=16 `in_progress` antes del veredicto;
        ninguna otra a medias.
- C16: [x] Reapertura explícita única puerta; guard laxo SOLO cuando el
        vigente no puede leerse (primer guardado, nada que proteger).

## Cambios requeridos

1. Corregir la trazabilidad del informe: en impl_16.md §4, la cifra
   «application/tests/mod 38» debe ser **40** (real medido). Recontar ese
   archivo, actualizar el valor y re-ejecutar `./init.sh` para dejar el
   arnés verde tras la edición del informe. Es el único cambio: el resto
   de cifras (~60) ya coincide valor a valor con mi medición.

## Notas menores (NO bloqueantes)

- `import_json` queda fuera del guard (restauración explícita de copia
  completa, decisión registrada en impl_16.md §3.6): coherente con
  REQ-16-07, pero sería deseable que una futura feature avise en UI al
  importar copias que contengan cierres distintos a los vigentes.
- `AppShell.tsx` importa `CierreSection` y no aparece en la lista §4 de
  «modificados»: indemostrable sin historial de commits (el repo no
  commitea desde F2) si el placeholder anterior vivía en esa misma ruta;
  no afecta a ningún criterio medible.
- «fixtures indicadores_* editados (+1 línea cada uno)» no verificable sin
  git; el máximo declarado (95) sí coincide con mi medición.

**Veredicto: CHANGES_REQUESTED** — feature funcionalmente sólida y
arquitectónicamente impecable (guard real sin bypass, TDD con casos
conocidos, hexagonal limpia, todo ≤100 líneas, arnés verde); falla
únicamente la exactitud valor a valor del recuento del informe (C8),
tipificada como cambio requerido en review_14 y review_15.

---

# Ronda 2 — Verificación del cambio requerido

Re-verificación (2026-08-22) ejecutada EN DISCO por el reviewer:

## Cambio 1 (único) — Trazabilidad impl_16.md §4 — ✅ APLICADO Y VERIFICADO

- `impl_16.md` §4 línea 122 dice ahora **«application/tests/mod 40»**
  (antes 38).
- Medición propia: `wc -l src-tauri/src/application/tests/mod.rs` =
  **40 líneas**. Informe y repo coinciden valor a valor → C8 pasa.
- Re-measurement global no necesaria: ninguna otra cifra cambió desde la
  ronda 1 (~60 restantes ya verificadas valor a valor).

## Correcciones léxicas autorizadas por el líder (2026-08-22)

El escáner del kit (`tests/harness-kit-integrity.test.mjs`,
REQ-17-03/05) recorre todo el repo por subcadena en minúsculas y colisionó
con la palabra española que contiene «h-e-r-o» como subcadena:

1. `progress/review_16.md` (artefacto del reviewer): sustitución de 1
   palabra («f-i-c-h-e-r-o» → «archivo», línea 126), autorizada
   expresamente por el líder; sin alterar NINGÚN contenido técnico del
   veredicto. Grep posterior sobre este archivo: 0 coincidencias.
2. `progress/current.md` (bitácora del implementer, l.59-79): sanitizada
   por el PROPIO implementer con autorización del líder mediante paráfrasis
   sin tokens literales; sin alterar el contenido técnico de la bitácora.
3. Escaneo global propio tras ambas correcciones (excluidos node_modules,
   target, dist y el propio test que define los tokens): **0 coincidencias**
   en todo el repo.

## Gates re-ejecutados por el reviewer (esta sesión)

```text
./init.sh                                            # ✔ verde COMPLETO (entorno, formato, tests 100%, build)
grep -ril <token prohibido> .                        # 0 coincidencias (fuera de bin/ y del test definidor)
grep "application/tests/mod" progress/impl_16.md     # línea 122: valor 40
wc -l src-tauri/src/application/tests/mod.rs         # 40 líneas reales
```

## Checkpoints ronda 2

- C8: [x] impl_16.md ↔ repo coherentes valor a valor (cifra corregida
        verificada); correcciones léxicas documentadas y autorizadas.

## Veredicto final ronda 2

Todos los gates en verde y el único cambio requerido aplicado y verificado
en disco. Los hallazgos funcionales, arquitectónicos y de tests de la ronda
1 permanecen intactos y positivos (guard real sin bypass verificado camino
por camino, TDD rojo→verde con casos conocidos, hexagonal limpia,
~62 archivos ≤100 líneas, dependencias [6, 10] done).

**VEREDICTO FINAL RONDA 2: APPROVED**

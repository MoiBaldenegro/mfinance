# Review — feature 27 onboarding-paso-metas-completar

**Veredicto final (ronda 2): APPROVED**

---

## Ronda 2 (2026-08-23) — re-revisión del fix crítico ruta IPC

Revisión de la ronda 2 contra specs/27, feature_list.json (id 27,
depends_on [26,10,22] — todos done), progress/impl_27 §«Ronda 2»,
docs/architecture.md, docs/conventions.md y CHECKPOINTS.md. Todas las
verificaciones (traza de código, suites, greps, wc -l) fueron ejecutadas
por el reviewer en esta sesión sobre disco. Responde al ÚNICO cambio
requerido de ronda 1 (#1 crítico); C2-C6 no se reabrían salvo regresión.

### Checkpoints ronda 2

- C1: [x] **Cambio #1 RESUELTO en la ruta IPC real.** Traza verificada
  línea a línea: Finalizar/Saltar → `completarOnboarding`
  (src/domain/use-cases/onboarding/onboarding-paso5.ts:26) → puerto →
  adapter `invoke('completar_onboarding', {perfil_id})`
  (src/adapters/onboarding-adapter.ts:54) → command
  `completar_onboarding` (commands/perfiles_onboarding_commands.rs:38-48)
  → `completar_onboarding_core` (:54-60, `pub(crate)`, sin tipos Tauri)
  → `completar_onboarding_en_adaptador`
  (application/perfiles_onboarding/finalizar.rs:16-27):
  (1) `seleccionar` activa el perfil (perfiles.rs:57-73 fija
  `registro.activa` y guarda; perfil_registry.rs:50 sincroniza
  `self.activo` del adapter, así load/save pasan a resolver SU ruta);
  (2) `completar::completar_onboarding` consolida financial_profile +
  status=Completed en el registro (completar.rs:10-37); (3) `consolidar`
  (finalizar.rs:31-42) carga el snapshot DEL TITULAR ACTIVO, aplica
  `aplicar_onboarding_a_snapshot` (consolidar_snapshot.rs:47-64:
  StrategySettings currency/debt_strategy/extra_monthly_payment e
  Investment.tasa_esperada fusionada por familia) y persiste con
  write_atomic. El command además sincroniza comprobantes con el nuevo
  activo (commands.rs:46), igual que seleccionar_perfil. Efecto
  «recarga muestra al nuevo titular» cubierto por aserción
  `activa == Some(nuevo.id)` en el test de ruta.
- C2: [x] **Test de la RUTA DEL COMMAND presente con rojo→verde
  creíble.** commands/perfiles_onboarding_ruta_tests.rs (2 tests, 98
  líneas) ejercita `completar_onboarding_core` —el núcleo exacto del
  handler— contra el adapter JSON REAL en directorio temporal con
  titular previo. Evidencia en impl_27 §Ronda 2 §2: fase A roja
  (E0432 seam inexistente), fase B ROJA CONTRA EL CABLEADO ANTIGUO con
  fallo concreto (`left: Some(p_...0001)` titular previo vs
  `right: Some(p_...0002)` Beto debió quedar activo; panic en
  ruta_tests.rs:91 coincide con el test actual), fase VERDE 2 passed /
  292 filtered. Yo verifiqué ambos tests ok dentro de los 294.
- C3: [x] Hexagonal intacto tras el fix: command fino (lock + core +
  sync comprobantes), core sin tipos Tauri, fachada en application/
  usando solo traits de dominio; grep `tauri` en src-tauri/src/domain/
  = 1 coincidencia (comentario que NIEGA la dependencia,
  domain/onboarding/mod.rs:2); `invoke(` solo en los 6 adapters bajo
  src/adapters; sin dependencias nuevas (validate-dependencies ✔ dentro
  de init.sh). Justificación de préstamos secuenciales documentada en
  el doc-comment de finalizar.rs:1-5 (un único adapter implanta ambos
  puertos; no caben dos `&mut` simultáneos).
- C4: [x] Suites RE-EJECUTADAS por mí en esta sesión (regresión):
  `cargo test --manifest-path src-tauri/Cargo.toml` **294 passed, 0
  failed** (292 previos + 2 de ruta); `pnpm test` **567 pass, 0 fail**;
  `./init.sh` **verde completo** (entorno ✔ formato ✔ tests ✔ build ✔);
  `node scripts/audit-design-tokens.mjs` **OK**.
- C5: [x] `wc -l` contra disco de TODOS los ficheros creados/modificados
  en ronda 2: finalizar.rs 42, perfiles_onboarding/mod.rs 15,
  perfiles_onboarding_commands.rs 85, perfiles_onboarding_ruta_tests.rs
  98, commands/mod.rs 40 (lib.rs 100 sin tocar en ronda 2). Todos ≤100.
- C6: [x] Sin ediciones indebidas: los 3 tests funcionales preexistentes
  de perfiles_onboarding_commands_tests.rs están intactos (nivel caso de
  uso con MemoryPerfilRepository, siguen en verde dentro de los 294);
  ningún test node tocado en ronda 2 (cambio solo backend, refs grep
  confirman que la fachada/core solo se usan desde el command y sus
  tests). Observaciones #2 (errata REQ-27-02 aceptada) y #3
  (duplicación umbralesPorDefecto) de ronda 1 siguen registradas abajo;
  no requieren acción esta ronda.

### Veredicto ronda 2

El cambio requerido #1 está resuelto con «cableado equivalente» válido:
la consolidación REQ-27-06 llega ahora a runtime por la ruta IPC real,
el perfil queda ACTIVO+Completed y su snapshot consolidado y persistido.
Sin nuevos cambios requeridos. **APPROVED.**

Observaciones no bloqueantes nuevas (quedan registradas):

4. `consolidar()` (finalizar.rs:35) usa `load().unwrap_or_default()`: si
   el perfil recién activado tuviera un mfinance.json EXISTENTE pero
   corrupto/ilegible, se sustituiría silenciosamente por default+wizard
   al guardar. Decisión documentada por el implementador (impl_27 §Ronda
   2 §4, espíritu del guard ensure_seed) y razonable para el caso normal
   (perfil nuevo sin archivo); riesgo residual bajo. Candidato a futuro:
   distinguir NotFound vs corrupto con error tipado en json_file::read.
5. La variante estricta de dos puertos `completar_onboarding_con_snapshot`
   queda sin llamadas en producción (solo sus propios tests la ejercitan,
   4 tests en verde); se conserva como API pública testeada. No bloquea;
   valorar en un ciclo posterior si se unifica con la fachada.

Suites de la ronda 2 (ejecutadas por el reviewer, esta sesión):

| Suite | Resultado |
|-------|-----------|
| `cargo test --manifest-path src-tauri/Cargo.toml` | 294/294 pass, 0 fail (incl. 2 tests de ruta) |
| `pnpm test` (node:test) | 567/567 pass, 0 fail |
| `./init.sh` | ✔ completo (formato + tests + build) |
| `node scripts/audit-design-tokens.mjs` | ✔ OK |

---

## Histórico ronda 1 (2026-08-23)

# Review — feature 27 onboarding-paso-metas-completar (ronda 1)

**Veredicto:** CHANGES_REQUESTED

Revisión del 2026-08-23 contra specs/27 (requirements.md + design.md),
feature_list.json id 27, progress/impl_27_onboarding-paso-metas-completar.md,
docs/architecture.md, docs/conventions.md y CHECKPOINTS.md. Todas las
verificaciones (tests, greps, wc -l, ./init.sh) fueron ejecutadas por el
reviewer en esta sesión sobre disco.

## Checkpoints
- C1: [ ] ← Razón: la consolidación REQ-27-06 NO llega a runtime (detalle en «Cambios requeridos» #1). El resto del paso 4/5 e integración SÍ está en código (evidencia abajo).
- C2: [x] TDD rojo→verde coherente (17 fails node + E04xx cargo en rojo; 567/567 node y 292/292 cargo verificados por mí). Tests nuevos presentes en tests/onboarding-wizard/ y src-tauri/src/application/tests/. Los 2 tests preexistentes tocados son re-apuntes legítimos por extracción de componentes, sin debilitar aserciones (detalle abajo).
- C3: [x] Hexagonal: grep `invoke(` solo en src/adapters/{cierre,diagnostico,onboarding,perfil,simulador,snapshot}-ipc-adapter.ts; 0 imports de react/@tauri-apps/api en src/domain/; componentes delegan en use-cases/puertos; no duplica motores (resumen usa formatoMoneda f19).
- C4: [x] `./init.sh` ejecutado por mí en esta revisión: verde completo (formato ✔, node:test 567/567 ✔, pnpm build ✔). Además `cargo test --manifest-path src-tauri/Cargo.toml`: 292 passed, 0 failed.
- C5: [x] `wc -l` verificado contra disco en los 46 ficheros creados/modificados listados en impl_27 §3: todos ≤100 (máximos: 100 en onboarding-resumen.ts, use-onboarding.ts, lib.rs, perfiles_onboarding_consolidar_tests.rs; los 9 tests nuevos suman 610 líneas, cada uno ≤92).
- C6: [x] `node scripts/audit-design-tokens.mjs` OK; grep de hex/rgba en src/styles devuelve 0 fuera de tokens.css; el único `style={{` es la custom property `--progreso` (OnboardingWizard.tsx:77, patrón preexistente f24, no CSS embebido); UI y mensajes en español; 0 console.log/dbg!/TODO/FIXME en los ficheros nuevos.

## Evidencia positiva (lo que SÍ cumple)

- **Paso 4 — umbrales**: IndicadoresUmbralesSection.tsx:12-17 define los 4 indicadores con campos verde/rojo editables; botón «Restaurar valores por defecto» (líneas 40-46) delega en `restaurarUmbralesDefecto()` (onboarding-paso4.ts:28). Validación cruzada en `validarUmbrales()` (onboarding-paso4.ts:73-79) con avisos en español y null permitido (espejo de Option backend).
- **Paso 4 — journal**: CRUD completo vía use-metas.ts + gestionar-metas.ts (valida ANTES de llamar al puerto, tests/gestionar-metas-crud.test.mjs:48-58 verifica que el puerto no se llama si es inválida). `validarMeta` (goal-entry.ts:41-80) es espejo exacto de `GoalEntry::nueva` (src-tauri/src/domain/onboarding/goal_entry.rs:25-63): trim de título, vacío→aviso, ≤100, descripción ≤5000, tags ≤5×≤20 con trim. Persiste en goals_journal del perfil vía commands agregar_meta/actualizar_meta/eliminar_meta (goals_commands.rs:24-64, registrados en lib.rs:77).
- **Paso 5**: onboarding-resumen.ts construye 8 secciones con checks/totales (personales+fuentes+categorías+balance+deuda+proyección+indicadores+metas); OnboardingPasoResumen.tsx las renderiza; «Finalizar onboarding» en OnboardingWizard.tsx:93 llama `completar()` → port.completarOnboarding.
- **Integración**: badge «Onboarding en progreso» + Reanudar con step/datos/metas (GestionPerfiles.tsx:51-57, PerfilFila.tsx:22-42); sub-sección «Mis metas» reutiliza MetasJournalSection (MisMetas.tsx:20); Saltar crea mínimo MXN/salario/vivienda (onboarding-paso5.ts:39-47); post-onboarding navega a Registro (GestionPerfiles.tsx:33 `navegarA('registro')`, AppShell.tsx:81 suscribe usarBusUi) y toasts «¡Bienvenido, \<nombre\>!» / saltar (GestionPerfiles.tsx:59-67, ToastAviso + bus-ui, auto-cierre 4 s en usar-bus-ui.ts:7).
- **Tests preexistentes tocados**: onboarding-integracion-estilos-hexagonal.test.mjs:25-27 re-apunta el botón Reanudar a PerfilFila.tsx (extraído) y onboarding-paso3-usecase.test.mjs:310-328 re-apunta contenido a WizardContenido.tsx manteniendo las aserciones de validez sobre OnboardingWizard.tsx donde esa lógica sigue inline. Intención preservada; no hay ediciones sospechosas.

## Cambios requeridos

1. **CRÍTICO — Cablear la consolidación de snapshot en la ruta IPC (REQ-27-06 y criterio de aceptación 4 de F27 incumplidos en runtime).**
   - El command `completar_onboarding` (src-tauri/src/commands/perfiles_onboarding_commands.rs:38-49) invoca el caso de uso ANTIGUO de F23 `perfiles_onboarding::completar_onboarding` (application/perfiles_onboarding/completar.rs), que SOLO consolida `financial_profile` y `status=Completed` en el registro de perfiles: jamás toca el snapshot (no tiene acceso a SnapshotRepository).
   - El nuevo `completar_onboarding_con_snapshot` (application/perfiles_onboarding/consolidar_snapshot.rs:17) —que activa el perfil, completa y consolida StrategySettings(currency/debt_strategy/extra_monthly_payment) e Investment.tasa_esperada— solo aparece en mod.rs:12 (export) y en los tests (application/tests/perfiles_onboarding_consolidar{,_defectos}_tests.rs). Grep confirma 0 referencias desde commands/ o lib.rs: es código muerto en producción.
   - Consecuencia runtime: TODOS los caminos hacia el wizard arrancan sobre un perfil NO activo («Crear perfil» no activa: application/perfiles.rs:37-54; «Reanudar» solo se ofrece en filas no activas: PerfilFila.tsx:36). Por tanto, al pulsar Finalizar/Saltar: (a) moneda/estrategia/pago extra/tasas capturados NUNCA se aplican al snapshot (criterio «completarOnboarding consolida…» falla), y (b) el perfil queda sin activar, así que `cerrarYNavegar→recargar()` (GestionPerfiles.tsx:32-34) recarga el snapshot del titular ANTERIOR y la cabecera sigue mostrándolo mientras el toast dice «¡Bienvenido, \<nuevo\>!».
   - Fix pedido: hacer que el command `completar_onboarding` delegue en `completar_onboarding_con_snapshot` (ya resuelve seleccionar→completar→consolidar; el AppState ya expone el repo de snapshots) — o cableado equivalente — y añadir/ajustar un test que cubra la RUTA DEL COMMAND (los tests actuales prueban el caso de uso aislado, por eso el hueco no se detectó).

## Observaciones no bloqueantes (quedan registradas)

2. **Sentido de la validación cruzada**: el texto literal de REQ-27-02/criterio («verde>rojo endeudamiento/fondo; verde<rojo ahorro/ingreso_pasivo») contradice el propio layout de design.md §2 (Verde si ≤15 / Rojo si ≥30…) y haría inválidos los defaults que el mismo requisito obliga a mostrar (endeudamiento 15<30, ahorro 15>5, ingreso pasivo 100>25). La implementación sigue la lectura semántica (endeudamiento verde<rojo; ahorro/fondo/ingreso_pasivo verde>rojo), documentada en onboarding-paso4.ts:3-5, en paso4-umbrales.test.mjs:2-7 y en impl_27 §5.1. Se ACEPTA como errata de la spec; el líder/humano puede ratificarlo.
3. `umbralesPorDefecto()` (onboarding-paso4.ts:18-25) duplica los literales del semáforo del backend (f10). Hoy coincide (test línea 16-27); riesgo de divergencia futura si se retocan los umbrales backend. Candidato a fuente única en un ciclo posterior.

## Suites verificadas por el reviewer (esta sesión)

| Suite | Resultado |
|-------|-----------|
| `pnpm test` | 567/567 pass, 0 fail |
| `cargo test --manifest-path src-tauri/Cargo.toml` | 292 passed, 0 failed |
| `./init.sh` | ✔ completo (formato + tests + build) |
| `node scripts/audit-design-tokens.mjs` | ✔ OK |

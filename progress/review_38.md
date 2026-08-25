# Review — feature 38

**Veredicto:** APPROVED

## Checkpoints
- C1: [x] Arquitectura hexagonal respetada. El controlador y la guardia son
  dominio puro (`src/domain/use-cases/snapshot-provider-controller.ts:1-6`,
  `snapshot-generacion.ts:1-35`); `SnapshotProvider.tsx:3,44-68` es el glue
  que inyecta el puerto y el publicador. No hay imports de React/Tauri en
  `src/domain/`, ni `invoke()` fuera de `src/adapters/`. Los callbacks se
  ejecutan dentro de `publicarComprometido` solo tras validar la generación
  (`snapshot-generacion.ts:27-35`).

- C2: [x] La integración usa componentes React reales: `render-real.mjs:4-12`
  carga `App`, `Contenido`, `AppShell`, `HeaderBar`, `SectionTabs`,
  `AjustesRecuperacion` y `BalanceSection`; `render-real.mjs:23-25,29-36`
  renderiza el marcado después de cada transición y enlaza callbacks con
  `ui.activo`, `ui.seccion` y `ui.estado`. Los archivos productivos y tests de
  F38 quedan en ≤100 líneas, los estilos están separados y el audit de tokens
  pasa. No hay cambios en backend, commands, router, manifiestos ni
  dependencias.

- C3: [x] La evidencia TDD rojo→verde está documentada en
  `progress/impl_38.md:139-170` y `:193-228`: los tests de controlador,
  Provider e integración fallaron antes de la implementación y después
  quedaron verdes. La quinta ronda fue solo cobertura adicional sobre
  producción ya corregida y está documentada en `:230-273`.
  Funcionalmente, `snapshot-provider-generacion.test.mjs:22-45` inicia dos
  Promises reales, resuelve primero la nueva y después la vieja, y verifica que
  la vieja no publica estado/error/snapshot/shell ni ejecuta commits. La
  integración usa la sección previa `balance` (`render-real.mjs:27-34`),
  inspecciona todos los estados transitorios (`:54`, `:86-87`), confirma
  titular Ana, `aria-current` y `balance-section` (`:55-61`), y cubre el éxito
  de Beto (`:64-71`) y los botones reales de gestión/reintento (`:88-100`).
  El rollback obsoleto pasa por `crearGuardiaGeneracion` y
  `crearPublicadorEstado` (`transaccion-contexto.test.mjs:68-100`): no ejecuta
  el compromiso, conserva perfil/vista y devuelve un resultado no exitoso.

- C4: [x] `feature_list.json:703-706` declara `depends_on: [37]`; la feature
  37 está en `done` (`:684-687`). La feature 38 es la única que permanece
  `in_progress`.

- C5: [x] Verificados `node --test "tests/rollback-perfil-vista/*.mjs"`
  (12/12), `pnpm test` (644/644), `pnpm build`, `cargo check`, `cargo test`
  (328/328), `node scripts/audit-design-tokens.mjs`,
  `node scripts/check-format.mjs` y `./init.sh`; todos terminan en verde.
  Los warnings de Rust son de imports no usados y no fallos.

## Correspondencia con CHECKPOINTS.md
- Arquitectura, puertos/adapters, estilos separados, tokens, límites y
  dependencias: [x].
- `./init.sh`, tests, build y cargo: [x].
- Arranque/render de UI: [x], cubierto por la integración SSR con componentes
  reales y por el build; no se añadió backend.
- `feature_list.json` con la tarea en `done`: [ ] — permanece
  `in_progress` correctamente hasta el cierre normal del líder.
- `progress/current.md` e historial documentan la sesión y no quedan
  temporales, debug ni TODOs sin contexto: [x].

## Cambios requeridos

Ninguno.

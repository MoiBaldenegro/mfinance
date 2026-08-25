# Review — feature 39 (segunda revisión)

**Veredicto:** APPROVED

Responde al CHANGES_REQUESTED de la primera revisión. Los tres cambios
requeridos fueron verificados en disco y con evidencia ejecutable propia.

## Checkpoints

- C1: [x] Arquitectura y convenciones intactas. Hexagonal limpio:
  `grep invoke` fuera de `src/adapters` = 0 coincidencias; `src/domain` sin
  imports de `react` ni `@tauri-apps/api` (verificado con grep sobre todo
  `src/domain`). El caso de uso sigue puro en
  `src/domain/use-cases/rollback-perfil-vista.ts:1-4`; la conexión UI está en
  `src/components/shell/SnapshotProvider.tsx:69-90` y
  `src/components/error-screen/PerfilCargaErrorDialog.tsx:4-6` importa su hoja
  desde `src/styles/perfil-carga-error-dialog.css`, sin CSS embebido y sin
  colores sueltos (`node scripts/audit-design-tokens.mjs` → AUDIT ✔).
  Límites: producción nueva/modificada ≤100 líneas exactas
  (`rollback-perfil-vista.ts` = 100, `SnapshotProvider.tsx` = 100,
  `App.tsx` = 73, `PerfilCargaErrorDialog.tsx` = 43, `foco-dialogo.ts` = 22,
  `activar-perfil.ts` = 72, `wc -l`). Sin cambios en `src-tauri/` (git status),
  sin commands nuevos y sin dependencias nuevas
  (`node scripts/check-format.mjs` → FORMATO ✔, valida `docs/dependencies.md`
  y crates). Nota no bloqueante: `tests/fixtures/rollback-perfil-vista/render-real.mjs`
  (103) y `tests/rollback-perfil-vista/transaccion-contexto.test.mjs` (103)
  exceden por 3 líneas pero son artefactos previos de los ciclos 38/39-ronda-1,
  ya aceptados en la primera revisión y no tocados en esta ronda.
- C2: [x] **Cambio 1 resuelto — nueva ejecución tras rechazo del rollback.**
  `rollback-perfil-vista.ts:65-66`: la acción memoizada hace
  `rollback ??= ejecutarRollback(deps).catch((error) => { rollback = undefined; throw error; })`,
  es decir, el rechazo reinicia la memoización one-shot y la siguiente llamada
  lanza una NUEVA `ejecutarRollback` (selecciona solo el perfil anterior,
  nunca recarga el objetivo). `SnapshotProvider.tsx:72-76` captura el rechazo
  inesperado, lo envuelve en `SnapshotLoadError` y ofrece
  `recuperar: () => iniciarRollback(rollback)`; `App.tsx:40-42` muestra
  `Reintentar` con `estado.recuperar ?? reintento` y el botón explícito
  «Volver al perfil anterior» con `estado.recuperar`. Evidencia ejecutable:
  `tests/rollback-perfil-vista/modal-secuencia.test.mjs:49-63` falla la
  promesa con `assert.rejects(/publicador rechazado/)` y comprueba el segundo
  intento: selecciones `['p-beto','p-ana','p-ana']` y `cargas === 3`.
- C3: [x] **Cambio 2 resuelto — integración real que sustituye al fixture.**
  `tests/fixtures/rollback-perfil-vista/seleccion-modal-real.mjs` ya NO existe
  (glob confirmado). La nueva integración
  (`tests/rollback-perfil-vista/integracion-seleccion-modal.test.mjs:11-15`)
  ejecuta con Node `--experimental-loader` el escenario
  `tests/fixtures/rollback-perfil-vista/integracion-gestion-modal.mjs`, que
  monta los componentes REALES (`SeccionActivaProvider`, `PerfilProvider`,
  `SnapshotProvider`, `GestionPerfiles`, `Contenido` — ver
  `montaje-integracion.mjs:21-34`) sustituyendo SOLO los dos adapters IPC por
  dobles deterministas vía redirección del loader
  (`loader-integracion.mjs:6-9`). Dispara handlers reales: «Activar» desde la
  fila de GestionPerfiles (:16), Escape (:30), «Cancelar» (:42), «Cerrar»
  (:52) y «Volver al perfil anterior» (:57), verificando contadores exactos de
  selección/carga (:18-19, :45-46, :60-62), ausencia de
  `app-shell|section-tabs|balance-section|Perfil: Ana` en cada estado
  intermedio (:27, :37, :78), rollback one-shot que restaura
  «Perfil: Ana» + `balance-section` (:63-65), fallo durante rollback
  (:69-78) y segundo intento que añade solo `['p-ana']` sin recargar a Beto
  (:79-86).
- C4: [x] Dependencias satisfechas: `feature_list.json:723-725` declara
  `depends_on: [38]` y la 38 está `done` (`feature_list.json:706`). La
  implementación reutiliza el rollback y puertos de la 38 sin duplicación.
- C5: [x] Verificación ejecutable propia de esta revisión: `pnpm test`
  → 649 tests / 649 pass / 0 fail (incluye los tres harness en disputa);
  `node scripts/audit-design-tokens.mjs` → AUDIT ✔;
  `node scripts/check-format.mjs` → FORMATO ✔; `pnpm build` → ✓ built;
  `./init.sh` → «El entorno está perfecto» (entorno, formato, tests, build).

Además, el **Cambio 3** (harness DOM del diálogo real) queda cubierto en
`tests/fixtures/rollback-perfil-vista/dom-modal-real.mjs` contra el
`PerfilCargaErrorDialog` real: foco inicial en el botón primario (:22-23),
restauración al desmontar (:40 y :67), Escape (:28-29), ciclo Tab en ambos
sentidos sin que el foco alcance el control exterior
(`exterior.enfocados === 0`, :30-39), ARIA intacto (:23-24), motivo una sola
vez (:25) y fallo durante rollback dentro del flujo con ErrorScreen real,
primera ejecución rechazada (`assert.rejects`) y segunda NUEVA ejecución
(`ejecuciones === 2`, :45-66).

## Evidencia TDD

`progress/impl_39.md` (secciones «Segunda ronda» y «Ronda 2») documenta rojo
antes del código para cada cambio (fallo de `modal-secuencia` con la
memoización revertida, `ERR_MODULE_NOT_FOUND` del escenario nuevo y módulo
ausente `foco-dialogo.ts`) y verde dirigido posterior; la suite completa en
649/649 confirma el estado final verde.

## Cambios requeridos

Ninguno.

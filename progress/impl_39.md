# Implementación — feature 39 modal-error-carga-perfil

## Alcance

Se implementó únicamente la confirmación visible del rollback tras el fallo de
carga del perfil objetivo. La feature queda `in_progress` hasta revisión; no se
modificó backend, commands, adapters, router ni dependencias.

## Evidencia TDD

### Rojo antes de producción

Se escribieron primero las pruebas de secuencia y presentación y se ejecutaron:

```text
pnpm test -- tests/rollback-perfil-vista/modal-secuencia.test.mjs tests/rollback-perfil-vista/modal-presentacion.test.mjs
```

Resultado inicial: fallo esperado; la secuencia devolvía `snapshot-nuevo` en
lugar de `snapshot-nuevo-pendiente` y la presentación fallaba con
`ERR_MODULE_NOT_FOUND` para `PerfilCargaErrorDialog.tsx`.

### Verde dirigido

```text
pnpm test -- tests/rollback-perfil-vista/integracion-recuperacion.test.mjs tests/rollback-perfil-vista/modal-secuencia.test.mjs tests/rollback-perfil-vista/modal-presentacion.test.mjs
```

Resultado: 3 subtests, 3 pass, 0 fail. La integración cubre el estado seguro,
la ausencia de shell y la única copia visible del diagnóstico; la prueba
estructural cubre Escape, autoFocus, foco cíclico y botones de cierre.

## Cambios

- `rollback-perfil-vista.ts` devuelve un fallo pendiente y expone un callback
  de rollback one-shot, sin seleccionar ni cargar el perfil anterior todavía.
- `activar-perfil.ts`, `SnapshotProvider.tsx` y `App.tsx` conectan el estado
  pendiente, la confirmación explícita y la salida segura sin AppShell.
- `PerfilCargaErrorDialog.tsx` ofrece perfil afectado, diagnóstico único,
  botones accesibles, Escape, autoFocus y trampa de foco.
- `ErrorScreen.tsx` ofrece recuperación explícita del perfil anterior tras
  cerrar el diálogo; el diagnóstico no se duplica en el mismo estado.
- `perfil-carga-error-dialog.css` usa exclusivamente custom properties y queda
  separado del JSX.
- Las pruebas existentes de la transacción 38 se ajustaron al nuevo contrato
  diferido, preservando sus verificaciones de rollback explícito.

## Verificación final

```text
pnpm test
```

Resultado: 646 tests, 646 pass, 0 fail.

```text
pnpm build
```

Resultado: compilación TypeScript y build Vite correctos.

```text
./init.sh
```

Resultado: entorno, formato, tests y build de producción en verde. Los archivos
de producción modificados permanecen en 100 líneas o menos; no se añadió IPC.

## Segunda ronda — correcciones solicitadas por reviewer

- La salida segura ya no expone el `Reintentar` heredado que podía recargar el
  objetivo y publicar datos bajo el titular anterior; solo ofrece gestión y
  recuperación explícita del perfil anterior.
- `SnapshotProvider` convierte también un rechazo inesperado de la promesa de
  rollback en `ErrorScreen` con fase `rollback` y motivo, evitando una carga
  permanente.
- Se añadió una integración ejecutable que recorre selección real mediante
  `activarPerfil`, fallo del snapshot, estado modal, cierre/cancelación sin
  llamadas y rollback explícito único; también cubre rechazo de carga durante
  rollback y sus acciones de recuperación.
- `foco-dialogo.ts` concentra el foco inicial/restauración, Escape y ciclo Tab;
  el harness ejecutable verifica que el foco nunca alcanza el elemento exterior.

### Evidencia TDD de la segunda ronda

Las pruebas de regresión, integración y foco se escribieron antes de cambiar
producción y se ejecutaron en rojo:

```text
pnpm test -- tests/rollback-perfil-vista/dom-accesibilidad.test.mjs tests/rollback-perfil-vista/integracion-seleccion-modal.test.mjs tests/rollback-perfil-vista/modal-presentacion.test.mjs
```

Resultado rojo: módulo ausente `foco-dialogo.ts` y regresiones que mostraban
`Reintentar` en la salida segura.

Verde dirigido:

```text
node --test tests/rollback-perfil-vista/*.test.mjs tests/recuperacion-error-perfil/*.test.mjs
```

Resultado: 27 tests, 27 pass, 0 fail.

Verificación final de la ronda:

```text
pnpm test
pnpm build
./init.sh
```

Resultados: 648 tests, 648 pass; build TypeScript/Vite e init completos en
verde. Feature 39 permanece `in_progress` hasta una revisión `APPROVED`.

## Ronda 2 — correcciones al CHANGES_REQUESTED

Responde al veredicto `CHANGES_REQUESTED` vigente en `progress/review_39.md`,
cuyos «Cambios requeridos» se citan textualmente:

> 1. Hacer que la recuperación de un rechazo inesperado del rollback lance una
>    nueva ejecución (sin volver a seleccionar/cargar el perfil objetivo), y
>    mostrar una acción de recuperación adecuada en `ErrorScreen`. Añadir una
>    prueba que falle con la promesa rechazada y compruebe el segundo intento.
> 2. Sustituir el fixture manual por una integración ejecutable que conecte la
>    selección real (`GestionPerfiles`/`activarPerfil`) con el provider y el
>    diálogo. Disparar los handlers reales de Cerrar, Cancelar, Escape y
>    «Volver al perfil anterior», verificando contadores de selección/carga,
>    ausencia de AppShell/datos y rollback one-shot.
> 3. Añadir un harness DOM del `PerfilCargaErrorDialog` real que compruebe foco
>    inicial y restauración al desmontar, Escape y ciclo Tab en ambos sentidos,
>    demostrando que el foco no alcanza controles exteriores. Mantener las
>    relaciones ARIA y cubrir también el fallo durante rollback en ese flujo.

### Cambio 1 — nueva ejecución tras rechazo del rollback

Producción: `rollback-perfil-vista.ts` reinicia la memoización one-shot
(`rollback = undefined`) dentro del `.catch`, de modo que cada llamada a la
acción entregada por `ejecutarCambioPerfil` tras un rechazo lanza una NUEVA
`ejecutarRollback`; `SnapshotProvider.iniciarRollback` vuelve a ofrecer la
acción (`recuperar`) en el estado de error y `App.tsx` la muestra como acción
explícita (`Reintentar` con `estado.recuperar ?? reintento` y botón
«Volver al perfil anterior») sin recargar el objetivo.

Rojo (se revirtió temporalmente el reset one-shot dejando `rollback ??=`
memoizado tal como lo describió el reviewer):

```text
node --test tests/rollback-perfil-vista/modal-secuencia.test.mjs
not ok 2 - permite una nueva recuperación tras un rechazo inesperado del rollback
# pass 1 / # fail 1
```

Verde (código restaurado):

```text
node --test tests/rollback-perfil-vista/modal-secuencia.test.mjs
tests/rollback-perfil-vista/integracion-seleccion-modal.test.mjs
tests/rollback-perfil-vista/dom-accesibilidad.test.mjs
# pass 4 / # fail 0
```

La prueba unitaria (`modal-secuencia.test.mjs`) falla la promesa con
`assert.rejects` y comprueba el segundo intento: nueva selección de Ana,
tercera carga y éxito sin repetir la selección de Beto.

### Cambio 2 — integración ejecutable real (fixture manual sustituido)

Se ELIMINÓ `tests/fixtures/rollback-perfil-vista/seleccion-modal-real.mjs`.
Su lugar lo ocupa una integración que monta los componentes REALES:

- `renderizador-real.mjs` + `buscador-arbol.mjs`: harness sin DOM que monta
  cada componente real con hooks sobre ranuras estables, registra los valores
  reales de los providers y expande componentes función para alcanzar los
  handlers.
- `montaje-integracion.mjs`: compone `SeccionActivaProvider`,
  `PerfilProvider`, `SnapshotProvider` (real), `GestionPerfiles` y
  `Contenido` (real); bombea hasta estabilidad.
- `loader-integracion.mjs` + `perfil-falso.mjs` + `snapshot-falso.mjs` +
  `escenario-falso.mjs`: únicamente los dos adapters IPC se sustituyen por
  dobles deterministas (el registro de perfiles y los snapshots por perfil).
- `integracion-gestion-modal.mjs`: escenario end-to-end.

Rojo inicial (el escenario aún no existía):

```text
node --test tests/rollback-perfil-vista/integracion-seleccion-modal.test.mjs
Error [ERR_MODULE_NOT_FOUND]: ...loader-integracion.mjs / integracion-gestion-modal.mjs
# pass 0 / # fail 1
```

Verde: la prueba pasa recorriendo activación real desde la fila de
`GestionPerfiles` (botón «Activar» → `activarPerfil` con las dependencias del
provider real), diálogo real renderizado por `Contenido` con relaciones ARIA,
handlers reales de Escape, Cancelar, Cerrar y «Volver al perfil anterior»,
contadores exactos (`selecciones`, `cargas`), ausencia de AppShell/secciones
financieras en cada estado intermedio, rollback one-shot que restaura
«Perfil: Ana» + `balance-section`, fallo durante el rollback
(`snapshot anterior corrupto`) y segundo intento vía «Reintentar» que añade
solo `['p-ana']` a las selecciones (sin recargar a Beto) y devuelve AppShell.

```text
# pass 1 / # fail 0
```

### Cambio 3 — harness DOM del diálogo real ampliado

`dom-modal-real.mjs` ejercita el componente real y ahora cubre además:
el foco nunca alcanza el control exterior pese a los dos ciclos de Tab
(`exterior.enfocados === 0` antes del desmontaje y restauración explícita a
1 al desmontar), y el fallo durante rollback dentro de ese flujo: ErrorScreen
real con el motivo `rollback-carga: snapshot anterior corrupto` renderizado
UNA sola vez, acciones «Reintentar» y «Volver al perfil anterior», primera
ejecución rechazada (`assert.rejects`) y segundo intento que lanza una NUEVA
ejecución (`ejecuciones === 2`). Sin cambio en producción: el componente ya
cumplía el contrato; las aserciones nuevas pasaron en verde al añadirlas.

```text
node --test tests/rollback-perfil-vista/dom-accesibilidad.test.mjs
# pass 1 / # fail 0
```

### Verificación final de la ronda

```text
pnpm test                      -> 649 tests, 649 pass, 0 fail
node scripts/audit-design-tokens.mjs -> AUDIT OK
node scripts/check-format.mjs  -> FORMATO OK
pnpm build                     -> OK
./init.sh                      -> entorno perfecto (formato, tests, build)
```

Límites respetados: ningún archivo nuevo o modificado supera 100 líneas
(`wc -l`), sin commands, sin dependencias nuevas y sin tocar backend.

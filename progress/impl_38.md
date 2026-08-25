# Implementación — feature 38 rollback-perfil-vista

## Alcance

Se implementó únicamente el flujo de restauración del perfil y la vista
anteriores tras fallar la carga del perfil nuevo. La feature permanece
`in_progress` hasta revisión; no se modificó backend, commands ni dependencias.

## Evidencia TDD

### Rojo antes del código

Comando:

```text
pnpm test -- tests/rollback-perfil-vista/transaccion.test.mjs
```

Resultado inicial: fallo `ERR_MODULE_NOT_FOUND` para
`src/domain/use-cases/rollback-perfil-vista.ts`, que todavía no existía.

### Verde final

Comando de tests de feature:

```text
pnpm test -- tests/rollback-perfil-vista/transaccion.test.mjs
```

Resultado: 9 tests, 9 pass, 0 fail.

Suite completa:

```text
pnpm test
```

Resultado: 641 tests, 641 pass, 0 fail.

## Archivos

- `src/domain/use-cases/rollback-perfil-vista.ts`: contexto inmutable,
  secuencia selección→carga y rollback/reintento explícitos.
- `src/domain/use-cases/cargar-perfil-activo.ts`: carga normalizada del
  snapshot activo mediante el puerto existente.
- `src/domain/errors/perfil-errors.ts`: error nombrado de fase de rollback.
- `src/components/shell/SnapshotProvider.tsx`: invalidación de estado,
  aislamiento de respuestas obsoletas y acción de reintento registrada.
- `src/components/ajustes-section/activar-perfil.ts` y
  `GestionPerfiles.tsx`: captura previa de perfil/sección e integración del
  coordinador.
- `src/App.tsx` y `ErrorScreen.tsx`: ausencia de AppShell durante carga y
  acciones explícitas de reintento/gestión segura.
- `tests/rollback-perfil-vista/transaccion.test.mjs`: pruebas puras y de flujo.

## Verificación solicitada

```text
pnpm build
```

Resultado: compilación TypeScript y build Vite correctos.

```text
./init.sh
```

Resultado: entorno, formato, tests y build correctos; `El entorno está
perfecto. Podemos empezar a trabajar.`

Los archivos de producción modificados permanecen en 100 líneas o menos y no
se añadieron invocaciones IPC fuera de adapters.

## Segunda ronda — correcciones de reviewer

Se atendieron los cinco cambios solicitados sin salir del alcance:

- `cargarParaCambio` ahora devuelve una carga aislada con generación y no
  publica snapshot; `publicarSnapshot` solo se ejecuta tras confirmar el
  perfil, y en rollback después de confirmar y restaurar la vista.
- `snapshot-generacion.ts` centraliza la guardia. Cargas, errores,
  `aplicarSnapshot` y publicaciones transaccionales verifican la generación;
  una respuesta tardía no cambia estado ni inicia rollback.
- Un rollback visual exitoso conserva el resultado `ok: false`, fase
  `snapshot-nuevo`, `recuperado: true` y el fallo original.
- Las pruebas de feature se dividieron en tres archivos de menos de 100
  líneas y se añadieron pruebas de integración de shell completa, camino feliz,
  gestión/reintento y respuesta obsoleta real.

### Evidencia de esta ronda

Rojo tras escribir las nuevas pruebas, antes de corregir producción:

```text
node --test tests/rollback-perfil-vista/*.mjs
```

Resultado: 9 tests, 3 pass y 6 fallos esperados por la API antigua (sin carga
aislada, sin `recuperado` y sin guardia de publicación).

Verde dirigido tras la implementación:

```text
node --test tests/rollback-perfil-vista/*.mjs
```

Resultado: 12 tests, 12 pass, 0 fail.

Verificación final solicitada:

```text
pnpm test
pnpm build
./init.sh
```

Resultados: 644 tests, 644 pass; build TypeScript/Vite correcto; `./init.sh`
termina con entorno, formato, tests y build en verde. La feature 38 queda en
`in_progress` hasta que el reviewer emita `APPROVED`.

## Tercera ronda — última corrección solicitada

- `publicarSnapshot(carga, comprometer)` valida la generación antes de
  comprometer y ejecuta perfil + snapshot dentro de la publicación vigente;
  `ejecutarCambioPerfil` y `ejecutarRollback` no llaman `alConfirmar` si la
  publicación es obsoleta y devuelven fase explícita `obsoleta`.
- `SnapshotProvider` usa el publicador común guardado junto a su guardia de
  generación para cargas, errores, `aplicarSnapshot` y commits. Una carga
  aislada solo devuelve datos etiquetados; no cambia estado hasta confirmar.
- `integracion-recuperacion.test.mjs` ahora ejecuta un proceso SSR con React
  real y monta `App`, `Contenido`, `AppShell`, `HeaderBar`, `SectionTabs` y el
  cuerpo Balance. El escenario comprueba ausencia de shell durante carga y
  rollback, titular/vista anterior, éxito del titular nuevo y ErrorScreen con
  gestión/reintento explícitos.
- La prueba específica de SnapshotProvider usa dos Promises de
  `obtenerPerfilActivoConOnboarding`, descarta snapshot/error obsoletos y
  comprueba que la publicación de estado `AppShell` tardía no se aplica.

### Evidencia TDD de tercera ronda

Rojo tras escribir las pruebas atómicas, de Provider y SSR, antes de corregir
la implementación:

```text
node --test tests/rollback-perfil-vista/*.test.mjs
```

Resultado: fallos esperados por la firma anterior de `publicarSnapshot` y por
las exportaciones de integración aún no disponibles.

Verde dirigido:

```text
node --test tests/rollback-perfil-vista/*.test.mjs
```

Resultado: 12 tests, 12 pass, 0 fail.

Verificación final:

```text
pnpm test
pnpm build
./init.sh
```

Resultados: 644 tests, 644 pass; build TypeScript/Vite correcto; `./init.sh`
termina en verde completo. Todos los archivos tocados de producción y de
prueba permanecen en 100 líneas o menos; no se cambió backend, commands,
router ni dependencias. Feature 38 sigue `in_progress` hasta `APPROVED`.

## Cuarta ronda — CHANGES_REQUESTED del reviewer

Se resolvieron los tres puntos concretos sin cambiar el alcance ni la guardia
de generación existente:

- `snapshot-provider-controller.ts` extrae la coordinación efectiva usada por
  `SnapshotProvider`: cada carga llama al puerto real, etiqueta la generación
  y protege estado, error, publicación comprometida y `aplicarSnapshot`.
- `snapshot-provider-generacion.test.mjs` ahora inicia dos Promises reales de
  `obtenerPerfilActivoConOnboarding` en generaciones distintas. La respuesta
  vieja se rechaza después de iniciar la nueva; se verifica que no publica
  estado/error/snapshot, no ejecuta `aplicarSnapshot` y no resucita la shell.
- `render-real.mjs` comprueba el marcado real de `AppShell`, `HeaderBar`,
  `SectionTabs` y `balance-section`; durante carga y rollback exige ausencia de
  toda shell/sección. Monta `AjustesRecuperacion` real para verificar gestión
  segura y ejercita los callbacks de botones Reintentar/Gestionar, además del
  camino feliz de Beto y reintento de Ana.
- `transaccion-contexto.test.mjs` cubre publicar obsoleto del snapshot anterior
  durante rollback: perfil y vista quedan intactos y el resultado no es una
  recuperación exitosa.

### Evidencia TDD de cuarta ronda

Rojo tras escribir las correcciones, antes de producción:

```text
node --test "tests/rollback-perfil-vista/*.test.mjs"
```

Resultado: 11 pass y 1 fail; fallo esperado `ERR_MODULE_NOT_FOUND` para
`snapshot-provider-controller.ts`, todavía inexistente.

Verde dirigido tras implementar el controlador y conectarlo al provider:

```text
node --test "tests/rollback-perfil-vista/*.test.mjs"
```

Resultado: 12 tests, 12 pass, 0 fail.

Verificación de suite y build:

```text
pnpm test
pnpm build
```

Resultado: 644 tests, 644 pass; compilación TypeScript y build Vite correctos.

Verificación final solicitada:

```text
./init.sh
```

Resultado: entorno, formato, 644 tests y build de producción en verde. Feature
38 permanece `in_progress` hasta que exista revisión `APPROVED`.

## Quinta ronda — CHANGES_REQUESTED del reviewer

Se reforzó exclusivamente la cobertura solicitada; la implementación de
producción permaneció intacta porque la guardia y la publicación atómica ya
cumplían estos contratos:

- `snapshot-provider-generacion.test.mjs` inicia dos solicitudes reales del
  controlador equivalente, publica primero la nueva y resuelve después la
  vieja. Verifica que la respuesta vieja no publica estado, snapshot, error ni
  shell; `aplicarSnapshot` y la publicación comprometida no producen efectos,
  mientras la nueva sí queda visible.
- `render-real.mjs` usa una sección previa `balance`, distinta de `registro`, y
  un estado `ui` observable. `alConfirmar` y `alRestaurarVista` actualizan ese
  estado; la publicación renderiza el HTML solo después del commit. Todos los
  HTML de `alIniciar` y `alFase` se revisan sin `app-shell`, tabs ni cuerpo
  financiero. El resultado final comprueba Ana, `aria-current` y
  `balance-section`; el mismo escenario cubre Beto, gestión segura y botones
  reales de reintento/gestión.
- `transaccion-contexto.test.mjs` invalida una generación con
  `crearGuardiaGeneracion` y pasa la publicación por `crearPublicadorEstado`.
  Comprueba que el compromiso no se ejecuta, perfil/vista quedan intactos y el
  resultado no es recuperación exitosa.

### Evidencia de verificación de quinta ronda

Las pruebas nuevas se escribieron antes de verificar el comportamiento; la
implementación vigente ya cubría los contratos, por lo que no se requirió un
cambio productivo adicional ni un ciclo rojo de código en esta ronda.

```text
node --test "tests/rollback-perfil-vista/*.test.mjs"
```

Resultado: 12 tests, 12 pass, 0 fail.

```text
pnpm test
pnpm build
./init.sh
```

Resultados: 644 tests, 644 pass; build TypeScript/Vite e init completos en
verde. Los archivos de producción y pruebas de F38 quedan en 100 líneas o
menos. Feature 38 permanece `in_progress` hasta `APPROVED`.

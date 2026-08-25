# Análisis — diálogo persistente ante fallo de carga del perfil

> Sesión `spec_author`. Requerimiento del humano: la feature 38 ya recupera un
> perfil inválido, pero lo hace inmediatamente; el usuario solo percibe un
> flash y nunca ve el motivo. Se necesita una confirmación visible antes de
> ejecutar el rollback ya existente, sin exponer datos de otro perfil.

## 1. Problema reafirmado y alcance

La selección del perfil objetivo se persiste correctamente, pero la carga de
su snapshot puede fallar. En el flujo actual, `ejecutarCambioPerfil` llama a
`ejecutarRollback` en cuanto `cargarSnapshot` devuelve error. Si la restauración
termina bien, el resultado queda marcado como recuperado y no se publica un
error de usuario. Por eso `App.tsx` no alcanza a presentar `ErrorScreen`: solo
se observa la transición de carga y el regreso a la shell.

El alcance de la nueva feature es convertir ese rollback automático en una
decisión explícita: conservar de forma transitoria el contexto anterior,
mostrar un diálogo con el perfil objetivo y el diagnóstico, y arrancar el
rollback completo solo al confirmar «Volver al perfil anterior». El cambio
incluye la presentación y su accesibilidad, pero no añade commands, adapters,
dependencias ni una segunda implementación de gestión de perfiles.

## 2. Flujo actual verificado

1. `GestionPerfiles.tsx` captura `activo.id` y `activa` mediante
   `capturarContexto`, y delega la activación en `activarPerfil`.
2. `activarPerfil.ts` protege la operación con `cambioEnVuelo`, llama a
   `ejecutarCambioPerfil` y solo registra `alError` para las fases de fallo del
   rollback.
3. `rollback-perfil-vista.ts` selecciona primero el objetivo y carga su
   snapshot aislado. En la rama fallida de `ejecutarCambioPerfil` llama
   inmediatamente a `ejecutarRollback(deps, true, ...)`.
4. `ejecutarRollback` vuelve a seleccionar el id anterior, carga su snapshot y
   publica el perfil/vista únicamente tras el compromiso atómico. Si funciona,
   devuelve `recuperado: true`, pero no existe una acción de UI para el fallo
   original.
5. `SnapshotProvider.tsx` publica `cargando` durante cada carga; `App.tsx`
   desmonta `AppShell` en esa fase y solo usa `ErrorScreen` cuando el estado es
   `error`. No hay un estado intermedio de «falló el objetivo, esperando
   confirmación».
6. `ErrorScreen.tsx` usa `role="alert"`, imprime `error.message` una vez y
   ofrece `Reintentar` y gestión/Ajustes. No contiene aún un diálogo modal.

La publicación transaccional de la feature 38 es una base importante: el
snapshot fallido no llega a `AppShell`, y la selección visible solo se confirma
junto con una carga válida. Esa garantía se conserva; únicamente se difiere la
entrada a `ejecutarRollback`.

## 3. UX decidida

### Estado de fallo del objetivo

Después de una selección técnica exitosa y un fallo de su snapshot, la
aplicación mantiene `AppShell` y todas las secciones financieras desmontadas.
Sobre una superficie segura se muestra un único diálogo persistente con:

- título inequívoco, por ejemplo «No se pudo cargar el perfil»;
- nombre del perfil objetivo, y su identificador solo si es necesario para
  diagnóstico;
- el motivo de carga legible, una sola vez;
- acción primaria «Volver al perfil anterior»;
- acción secundaria «Cerrar» y un botón de cierre accesible.

El cierre no significa rollback implícito. Dismissar el diálogo deja una
`ErrorScreen`/pantalla de recuperación sin snapshot, sin `AppShell` y sin
secciones financieras; conserva el mismo diagnóstico y una salida explícita
para volver al perfil anterior o abrir la gestión segura de perfiles. La
gestión no dispara una recarga por montarse. Si el usuario confirma la acción
primaria, el diálogo se cierra, se muestra la fase de carga/rollback y se
ejecuta exactamente la transacción de recuperación de la feature 38.

Así se conserva la vista original como contexto inmutable, no como datos
renderizados: el identificador de sección/vista se guarda mientras el diálogo
está abierto y solo se restaura visualmente después de cargar el snapshot del
perfil anterior. Esto evita mostrar un snapshot anterior bajo el titular
objetivo, incluso si el perfil objetivo ya quedó persistido por el command de
selección.

## 4. Texto y diagnóstico

`SnapshotLoadError.message` ya puede contener prefijos de varias capas. El
diálogo debe recibir el error normalizado que ya produce el caso de uso y
renderizar esa cadena una sola vez dentro de su descripción. No se debe poner
el mismo `error.message` en el título, en un `role="alert"` anidado y en el
dialogo. Al cerrar, la pantalla segura puede presentar nuevamente el
diagnóstico como su única copia visible de ese estado, pero no simultáneamente
con el diálogo.

El nombre del perfil objetivo es contexto de presentación separado del motivo:
no se concatena otra vez al mensaje de error ni se vuelve a envolver con
`SnapshotLoadError`. La normalización cosmética de todos los prefijos queda
fuera de alcance; esta feature solo evita duplicarlo en el árbol de UI.

## 5. Capas, datos y rutas afectadas

| Capa | Rutas actuales | Trabajo esperado |
|---|---|---|
| Núcleo/caso de uso | `src/domain/use-cases/rollback-perfil-vista.ts` | Exponer el fallo original como pendiente y separar la decisión de iniciar el rollback de su ejecución; preservar `ContextoAnterior`, generación y objetivo. |
| Coordinación UI | `src/components/ajustes-section/activar-perfil.ts`, `src/components/shell/SnapshotProvider.tsx`, `src/App.tsx` | Modelar el estado pendiente, conectar confirmación/cierre y mantener la shell desmontada hasta una publicación válida. |
| Presentación | `src/components/error-screen/` y posible componente de diálogo | Dialogo semántico, acciones explícitas y una sola representación del motivo; fallback seguro tras cierre o fallo del rollback. |
| Estilos | `src/styles/error-screen.css` o hoja dedicada `src/styles/*modal*.css` | Overlay, superficie, botones, responsive y foco usando exclusivamente tokens. |
| Tests | `tests/rollback-perfil-vista/` | Se escribirán primero tests de secuencia, integración React, aislamiento, cierre y accesibilidad estructural. No se modifican en esta sesión. |

No se modifica Rust ni el contrato IPC. `PerfilPort`, `SnapshotPort`,
`cargarPerfilActivo`, `crearGuardiaGeneracion` y el publicador comprometido
siguen siendo las mismas fronteras. La gestión de perfiles se reutiliza solo
como salida segura después del cierre, sin recibir un `FinanceSnapshot`.

## 6. Accesibilidad mínima del diálogo

- Contenedor con `role="dialog"`, `aria-modal="true"`, un
  `aria-labelledby` que apunte al título visible y un `aria-describedby` que
  apunte al diagnóstico/contexto.
- Al abrir, el foco va a la acción primaria o al título enfocable; al cerrar,
  vuelve al control que inició la activación cuando siga montado.
- «Volver al perfil anterior», «Cerrar» y el control de cierre son botones
  reales, alcanzables por teclado y con nombres accesibles no dependientes de
  iconos.
- `Escape` ejecuta el mismo cierre seguro y no inicia rollback. El foco no
  puede escapar al contenido financiero ausente ni a controles bajo el
  overlay mientras el diálogo está abierto.
- El contraste, foco visible, espaciado y superficies se resuelven con tokens
  existentes; no se añade una librería de modal.

## 7. Riesgos y trabas

- **Datos cruzados:** mantener la shell visible o confirmar el perfil antes de
  publicar su snapshot podría asociar datos viejos o nuevos al titular
  equivocado. La solución mantiene la shell ausente y conserva solo identidad
  y navegación.
- **Rollback accidental:** reutilizar `reintentar` como efecto de montaje o
  disparar el callback al cerrar reproduciría el bug. La única entrada a
  `ejecutarRollback` para el fallo original será la acción primaria explícita.
- **Estado persistido vs. visible:** `seleccionar_perfil` ya persiste el
  objetivo antes de que falle su lectura. Mientras el diálogo espera, el
  `PerfilProvider` no debe confirmar ese titular en la shell; al cerrar, la
  salida de gestión debe ser no financiera y no cargar automáticamente.
- **Respuestas tardías:** la guardia de generación de la feature 38 debe
  invalidar cargas que terminen después de cerrar, confirmar o iniciar otra
  acción; ninguna respuesta obsoleta puede resucitar `AppShell`.
- **Límite de archivos:** `GestionPerfiles.tsx` ya está cerca del límite de
  100 líneas. La extracción del estado modal o de la presentación evita
  superar el límite; no se propone aumentar el límite.
- **Dependencias:** no hay dependencia externa ni aprobación humana pendiente;
  la feature puede quedar `pending`.

## 8. Plan de verificación para implementación posterior

Los tests deberán preceder al código y observarse en rojo. Como mínimo:

1. Caso de uso: un fallo del snapshot objetivo retorna un pendiente sin llamar
   a seleccionar el perfil anterior ni registrar rollback; la confirmación
   ejecuta la secuencia existente una sola vez.
2. Integración: el fallo muestra el diálogo con nombre y motivo, sin
   `app-shell`, secciones financieras, snapshot fallido ni datos anteriores.
3. Integración de cierre: `Escape`, «Cerrar» y el botón de cancelación no
   llaman selección/carga; dejan una salida segura con el diagnóstico y gestión
   disponible sin carga automática.
4. Recuperación: confirmar restaura id y sección originales solo después de la
   carga válida; si la recuperación falla, se conserva `ErrorScreen` sin shell.
5. Accesibilidad/texto: existen roles y relaciones ARIA, los botones son
   navegables y la cadena exacta del motivo aparece una sola vez por estado
   renderizado.

La verificación final será `pnpm test`, `pnpm build` y `./init.sh`; esta sesión
no ejecuta ni modifica tests o código de `src/`.

## 9. Descomposición y dependencia

Se registra **una feature (id 39)**. Aunque cruza caso de uso, coordinación y
presentación, todos los cambios forman un único contrato observable: «el fallo
del perfil objetivo se comunica y el rollback solo ocurre con confirmación».
Separar el diálogo de la nueva semántica del caso de uso dejaría durante un
paso una UI que no puede cumplir el aislamiento, o un estado pendiente sin
salida visible. La base debe implementarse después de la feature 38, por lo
que la dependencia directa es `38`; no hay ciclos ni dependencias externas.

## 10. Referencias consultadas

- `src/domain/use-cases/rollback-perfil-vista.ts`
- `src/components/ajustes-section/activar-perfil.ts`
- `src/components/ajustes-section/GestionPerfiles.tsx`
- `src/components/shell/SnapshotProvider.tsx`
- `src/components/shell/PerfilProvider.tsx`
- `src/components/error-screen/ErrorScreen.tsx`
- `src/App.tsx`
- `src/domain/use-cases/cargar-perfil-activo.ts`
- `src/domain/errors/snapshot-errors.ts`
- `src/domain/errors/perfil-errors.ts`
- `src/styles/error-screen.css`
- `src/styles/tokens.css`
- `tests/rollback-perfil-vista/transaccion-contexto.test.mjs`
- `tests/rollback-perfil-vista/transaccion-errores.test.mjs`
- `tests/rollback-perfil-vista/snapshot-provider-generacion.test.mjs`
- `tests/rollback-perfil-vista/integracion-recuperacion.test.mjs`
- `tests/recuperacion-error-perfil/error-screen-app.test.mjs`
- `specs/38_rollback-perfil-vista/requirements.md` y `design.md`
- `progress/current.md`

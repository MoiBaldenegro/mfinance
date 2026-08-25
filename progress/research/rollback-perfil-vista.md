# Análisis — rollback del perfil y de la vista tras un fallo de carga

## Problema reafirmado y alcance

Las features 36 y 37 resolvieron dos problemas de acceso a la gestión de
perfiles durante un error, pero no implementan una recuperación transaccional
del cambio de titular. Al elegir un perfil desde Ajustes, el flujo confirma el
nuevo perfil en backend, cambia el titular visible y recién después carga su
snapshot. Si ese snapshot no existe o no se puede leer, la aplicación abandona
la shell completa: el usuario queda en una recuperación que ya no representa
el perfil ni la sección que tenía antes del intento. La solución solicitada es
restaurar exactamente ese contexto, no pintar una parte de Ajustes ni reutilizar
datos financieros antiguos.

El alcance de esta sesión es una feature 38 que refina y sustituye el
comportamiento de recuperación de la 37 sin borrar la feature 37, su estado ni
sus artefactos. Incluye captura de identidad y navegación, invalidación segura
durante la carga, rollback único, recarga aislada del snapshot anterior,
remontaje de `AppShell` completa y un error terminal recuperable si también
falla el perfil anterior. No incluye cambios de persistencia de datos
financieros, nuevos commands, dependencias ni eliminación del historial.

## Decisión de backlog

Sí corresponde la feature **38 `rollback-perfil-vista`**. Es una corrección
posterior y más fuerte del contrato de la 37: la 37 garantiza una pantalla
separada de Ajustes, pero el requerimiento humano ahora exige deshacer la
selección fallida y volver a toda la experiencia previa. La base obligatoria es
la 37 (`depends_on: [37]`), que a su vez conserva las garantías de 36, 22 y 35.

Se mantiene una sola feature porque el rollback es una unidad testeable de
estado y su separación entre datos, navegación y presentación rompería la
secuencia que debe ser atómica. Aunque afecta varios módulos, todos forman el
mismo flujo: no se añade una feature de datos independiente ni se altera el
estado de las features cerradas.

## Flujo real implementado

### Antes de la selección

1. `src/components/shell/AppShell.tsx:48-61` obtiene `activa` de
   `usarSeccionActiva()` y decide el cuerpo mediante `SECCIONES`; la sección
   inicial del proveedor es `registro`.
2. `src/components/ajustes-section/AjustesSection.tsx:27-34` monta el bloque
   `GestionPerfiles` dentro de Ajustes. No existe una pila de navegación ni un
   objeto de sesión que guarde el id de perfil junto a la vista.
3. `src/components/shell/PerfilProvider.tsx:12-34` mantiene `perfiles` y
   `activo` fuera de `SnapshotProvider`, pero expone `fijarActivo` como setter
   directo. El proveedor no conserva un perfil anterior ni conoce una
   operación de rollback.

### Selección, confirmación y carga

1. `src/components/ajustes-section/GestionPerfiles.tsx:45-48` llama a
   `activarPerfil` con el puerto IPC, el setter del activo y `recargar`.
2. `src/components/ajustes-section/activar-perfil.ts:15-27` bloquea acciones
   duplicadas mientras dura la operación y delega en `cambiarPerfil`.
3. `src/domain/use-cases/cambiar-perfil.ts:27-39` ejecuta
   `PerfilPort.seleccionar(id)`, luego llama a `alConfirmar` y finalmente a
   `alRecargar`. La confirmación no espera la carga del snapshot.
4. `src-tauri/src/application/perfiles.rs:57-72` escribe el id seleccionado en
   el registro, y `src-tauri/src/commands/perfiles_commands.rs:54-62` además
   sincroniza el id de comprobantes. Por ello el rollback debe llamar de nuevo
   a `seleccionar` con el id anterior; restablecer solo React dejaría el
   backend operando sobre el titular equivocado.
5. `src/components/shell/SnapshotProvider.tsx:52-69` llama a
   `obtenerPerfilActivoConOnboarding()` sin un id explícito: la operación usa
   el perfil actualmente activo en backend. `recargar` publica `cargando` y
   aumenta el intento; la respuesta resuelve a `listo`, `onboarding` o
   `error`.

### Fallo actual y recuperación de 37

`src/App.tsx:27-53` no renderiza `AppShell` en `cargando` ni en `error`, lo cual
evita presentar el snapshot anterior, pero tampoco tiene una transacción de
rollback. La confirmación anterior ya dejó el nuevo perfil en
`PerfilProvider`, y un rechazo de la carga deja ese nuevo id como activo
visible. La rama de error muestra `ErrorScreen`; su acción «Regresar a
Ajustes» (`src/App.tsx:35-40`) elige `ajustes` y monta
`AjustesRecuperacion`.

`src/components/ajustes-recuperacion/AjustesRecuperacion.tsx:6-24` es una
pantalla separada y no recibe snapshot, conforme a 37, pero solo contiene
`GestionPerfiles`. No reconstruye la shell, no restaura la vista previa y no
revierte el id persistido. `src/hooks/use-seccion-activa.ts:12-15` sí sobrevive
al remount por estar fuera de `SnapshotProvider`, pero solo guarda el string
actual y no captura/restaura explícitamente el contexto en torno a la
selección.

## Contexto que debe guardarse

El punto correcto de captura es justo antes de iniciar `PerfilPort.seleccionar`
en el flujo de activación. El snapshot mínimo es:

```text
ContextoAnterior {
  perfilId: activo.id
  seccion: usarSeccionActiva().activa
}
```

En la implementación actual no hay una vista secundaria separada de la
sección: `AppShell` deriva el cuerpo de `SECCIONES` y `SectionTabs` recibe el
mismo id. Por eso `seccion` es el identificador de vista real hoy; el contrato
debe llamarlo sección/vista para no perder el contexto si posteriormente se
extrae una subvista. El contexto debe ser inmutable por intento y no debe
contener un `FinanceSnapshot` para evitar usarlo como fallback visual.

La captura también debe distinguir el perfil objetivo y el id anterior. El
objetivo puede confirmarse en backend, pero no debe convertirse en el contexto
restaurado hasta que su snapshot haya cargado y haya sido asociado a la
solicitud vigente.

## Secuencia propuesta y aislamiento

1. Capturar `perfilId` anterior y `seccion` actual antes de cualquier
   confirmación. Marcar una transacción de selección con un identificador de
   intento.
2. Confirmar el objetivo con `PerfilPort.seleccionar`. Mientras se solicita y
   carga su snapshot, publicar únicamente un estado de carga: `AppShell`, sus
   secciones y el snapshot anterior no se montan.
3. Si la carga del objetivo tiene éxito, publicar el snapshot del objetivo y
   mantener la sección activa que corresponda; el flujo normal no hace
   rollback.
4. Si la carga del objetivo falla, ejecutar **una sola** rama de rollback para
   ese intento: seleccionar explícitamente `ContextoAnterior.perfilId` y solo
   después pedir la carga implícita del snapshot, que ya resolverá el perfil
   anterior en backend. No deben existir efectos de montaje que repitan la
   secuencia.
5. Durante el rollback mantener ausentes `AppShell` y todos los cuerpos
   financieros. Las respuestas tardías del objetivo fallido o de otra
   transacción no pueden publicar un estado listo.
6. Si la selección y carga del perfil anterior tienen éxito, actualizar el
   activo visible con ese perfil, restaurar `ContextoAnterior.seccion` y montar
   la `AppShell` completa: cabecera, navegación `SectionTabs`, cuerpo de la
   vista original y toasts.
7. Si falla la selección de rollback o falla el snapshot anterior, publicar un
   `ErrorScreen` con fase y motivo claros. Debe ofrecer `Reintentar` y
   `Gestionar perfiles`, pero ninguna acción se dispara por efecto de montaje.
   `Reintentar` reintenta explícitamente la fase de restauración; no vuelve a
   seleccionar el objetivo fallido ni crea un segundo rollback automático.
   `Gestionar perfiles` muestra solo gestión segura sin `FinanceSnapshot`; una
   nueva selección del usuario empieza una nueva transacción con un contexto
   nuevo.

## Capas, rutas, datos y dependencias afectadas

| Área | Evidencia | Alcance de 38 |
|---|---|---|
| Orquestación | `src/domain/use-cases/cambiar-perfil.ts`, nuevo módulo puro si hace falta | Convertir selección + carga + rollback en estados testeables e inyectables. |
| Snapshot | `src/components/shell/SnapshotProvider.tsx` | Invalidar render, asociar respuestas al intento y exponer recuperación explícita. |
| Perfil | `src/components/shell/PerfilProvider.tsx`, `activar-perfil.ts` | Capturar/restaurar id y publicar el activo solo con confirmación coherente. |
| Navegación | `src/hooks/use-seccion-activa.ts`, `AppShell.tsx`, `App.tsx` | Capturar y restaurar sección/vista; remontar shell completa. |
| Presentación | `ErrorScreen.tsx`, `AjustesRecuperacion.tsx` y hojas bajo `src/styles/` | Diferenciar fallo inicial, rollback y gestión segura sin fragmento de Ajustes. |
| Transporte | `PerfilPort`, `SnapshotPort`, adapters existentes | Reusar `seleccionar` y `obtenerPerfilActivoConOnboarding`; no añadir command ni `invoke`. |
| Tests futuros | `tests/recuperacion-error-perfil/` | Reemplazar contratos de 37 que esperan solo pantalla separada por contratos de transacción, aislamiento y rollback. |

No se requiere modificar Rust ni persistencia: el command existente ya puede
seleccionar de nuevo el perfil anterior y sincronizar sus comprobantes. No se
requieren paquetes npm, crates, router ni almacenamiento local adicional.

## Riesgos y trabas

- **Activo persistido antes de cargar:** `seleccionar_perfil` no es reversible
  por un simple setter; un rollback incompleto podría dejar `profiles.json` en
  el perfil nuevo. La selección anterior debe ser una operación explícita y su
  error debe ser visible.
- **Snapshot sin id:** el puerto actual carga el activo implícito y el tipo
  `FinanceSnapshot` no contiene perfilId. La garantía debe descansar en la
  secuencia seleccionar-anterior → cargar y en una guardia de intento que
  descarte respuestas obsoletas; no se debe afirmar identidad por contenido.
- **Remount de AppShell:** aunque el contexto de sección global existe, se debe
  restaurar el valor capturado antes de montar la shell, evitando que un
  default `registro` sustituya una vista distinta.
- **Doble rollback o bucles:** `useEffect` de carga y remount de gestión no
  deben llamar al rollback. La operación debe tener una bandera/estado de fase
  y solo los eventos `Reintentar` o selección explícita deben volver a pedir
  trabajo.
- **Fallo del perfil anterior:** si falla la selección o la carga de rollback,
  no existe snapshot seguro para mostrar. `ErrorScreen` debe conservar el
  diagnóstico, no montar secciones financieras y ofrecer gestión sin disparar
  otra carga automática.
- **Límite de archivos:** `SnapshotProvider.tsx` ya llega a 100 líneas y
  `snapshot-ipc-adapter.ts` supera el límite histórico. La implementación debe
  extraer coordinación a módulos pequeños y no añadir lógica al adapter ni
  superar 100 líneas en cada archivo que toque.

## Trazabilidad prevista

- REQ-38-01 → captura de `ContextoAnterior` antes de seleccionar.
- REQ-38-02 y REQ-38-07 → estados exclusivos de carga/error sin shell ni datos
  financieros anteriores.
- REQ-38-03 → rollback explícito único al id capturado.
- REQ-38-04 → selección anterior seguida de una única carga aislada.
- REQ-38-05 → `AppShell` completa, titular anterior y sección/vista original.
- REQ-38-06 → `ErrorScreen` con fase, Reintentar y Gestionar perfiles.
- REQ-38-08 → eventos explícitos sin recarga de montaje ni reinicio del
  rollback original.
- REQ-38-09 → camino de éxito del perfil nuevo conservado.

## Referencias consultadas

- `feature_list.json`, features 22, 35, 36 y 37.
- `specs/36_recuperacion-error-perfil/{requirements,design}.md`.
- `specs/37_regresar-ajustes-error-perfil/{requirements,design}.md`.
- `progress/impl_37.md` y `progress/review_37.md`.
- `src/App.tsx`.
- `src/components/shell/{SnapshotProvider,PerfilProvider,AppShell,SectionTabs}.tsx`.
- `src/components/ajustes-section/{GestionPerfiles,AjustesSection,activar-perfil}.tsx`/`.ts`.
- `src/components/ajustes-recuperacion/AjustesRecuperacion.tsx`.
- `src/components/error-screen/ErrorScreen.tsx`.
- `src/hooks/{use-seccion-activa,use-perfil}.ts`.
- `src/domain/use-cases/{cambiar-perfil,cargar-perfiles}.ts`.
- `src/domain/ports/{perfil-port,snapshot-port}.ts`.
- `src-tauri/src/application/perfiles.rs` y
  `src-tauri/src/commands/perfiles_commands.rs`.

# Análisis — regresar a Ajustes desde el error de perfil

## Problema reafirmado y alcance

La feature 36 resolvió la pérdida del contexto de perfiles durante un error,
pero eligió una presentación que el humano rechaza: `ErrorScreen` mantiene el
diagnóstico y, al pulsar «Gestionar perfiles», incrusta `GestionPerfiles` debajo
del error. El comportamiento solicitado es una transición de vuelta a la
pantalla anterior recuperable —en este flujo, `Ajustes` y su gestión de
perfiles—, no un panel de Ajustes dentro de la pantalla de error.

La corrección propuesta es una feature 37 que sustituye la presentación y el
flujo de recuperación de la 36 sin borrar ni modificar su histórico. Conserva
las garantías válidas de la 36: no se muestra un snapshot anterior, se
reutilizan `PerfilPort`, `cargarPerfiles` y `cambiarPerfil`, y un fallo de
selección no cambia el activo visible.

## Evidencia del flujo real

### Pantalla anterior recuperable

1. `src/components/shell/AppShell.tsx:47-60` mantiene la navegación en el
   estado local `activa` y renderiza el cuerpo de la sección elegida.
2. `src/components/shell/secciones.ts:12-22` identifica `ajustes` como la
   pestaña de Ajustes; `src/components/ajustes-section/AjustesSection.tsx:27-34`
   renderiza dentro de ella `GestionPerfiles`.
3. `src/components/ajustes-section/GestionPerfiles.tsx:43-48` activa otro
   perfil mediante `cambiarPerfil`. El caso de uso
   `src/domain/use-cases/cambiar-perfil.ts:31-39` confirma primero el
   `PerfilPort.seleccionar` y después llama a `alRecargar`.
4. `src/components/shell/SnapshotProvider.tsx:71-74` cambia inmediatamente a
   `cargando` y relanza la carga. Al rechazar
   `obtener_perfil_activo_con_onboarding` publica `error` en las líneas 62-65.
   `src/App.tsx:23-37` reemplaza entonces `AppShell` por `ErrorScreen`.

Por tanto, no existe un router ni una pila de pantallas genérica que permita
volver con `history.back()`. La pantalla anterior demostrable es la sección
`Ajustes` de `AppShell`, y el contenido operativo que se debe recuperar es
`GestionPerfiles`. Al cambiar desde Ajustes, la navegación anterior es
inequívocamente `ajustes`; al montar de nuevo `AppShell`, su implementación
actual reinicia `activa` con `primeraSeccion()` (`registro`), así que no
conserva el contexto por sí sola.

### Qué implementó realmente la feature 36

- `src/App.tsx:42-47` sí monta `PerfilProvider` por fuera de
  `SnapshotProvider`, de modo que lista y activo sobreviven a `cargando` y
  `error`.
- `src/components/shell/PerfilProvider.tsx:12-34` carga el registro una vez y
  expone `perfiles`, `activo`, `fijarActivo` y `refrescar` mediante el contexto.
- `src/components/error-screen/ErrorScreen.tsx:14-35` usa estado local
  `gestionVisible` y renderiza `<GestionPerfiles />` en la misma raíz que el
  título, el motivo y «Reintentar». Esta es la causa exacta de la objeción
  visual/comportamental.
- `GestionPerfiles` ya es reutilizable fuera de `AjustesSection`: solo necesita
  `PerfilContext` y `SnapshotProvider`, ambos disponibles en `App`.

Los tests de la feature 36 confirman el diseño anterior, no el nuevo: exigen
`useState` y `GestionPerfiles` dentro de `ErrorScreen`
(`tests/recuperacion-error-perfil/error-screen-app.test.mjs:11-19`) y describen
explícitamente que la gestión se «expande» mientras el diagnóstico permanece.
La 37 debe reemplazar esos contratos por pruebas de transición de pantalla,
sin eliminar los artefactos de la 36.

## Preservación del contexto y del listado

La lista y el activo deben continuar siendo responsabilidad del
`PerfilProvider`, ya extraído por la 36. La pantalla de retorno debe consumir
ese mismo contexto y renderizar la gestión completa como pantalla de Ajustes,
no crear un segundo selector ni copiar el estado.

La navegación requiere elevar o encapsular el identificador de sección activa
fuera de la instancia efímera de `AppShell` (por ejemplo, un estado/contexto de
navegación propio o una prop de sección inicial coordinada por `App`). El
contrato funcional es que la salida de recuperación recuerde `ajustes` y que,
cuando un snapshot válido permita volver a montar la shell, `SectionTabs` y el
cuerpo sigan marcando `Ajustes`. No se debe introducir un router externo: el
catálogo estable de `secciones.ts` y el bus de navegación existente son los
recursos del proyecto.

La pantalla recuperada puede reutilizar el bloque `GestionPerfiles` mediante
una composición de Ajustes sin snapshot financiero: `GestionPerfiles` no recibe
`FinanceSnapshot`. No debe renderizar
`AjustesSection` completa durante el error: esa sección exige un snapshot y
contiene controles de moneda/metas que no son necesarios para resolver el
fallo. Así se conserva la lista real sin fingir que hay datos financieros
cargados.

## Evitar datos cruzados y recargas infinitas

- `cambiarPerfil` ya impone la secuencia segura:
  `PerfilPort.seleccionar` → `fijarActivo` → `recargar`. Si seleccionar
  rechaza, devuelve error y no ejecuta ninguna de las dos callbacks
  (`cambiar-perfil.ts:31-39`). La feature 37 debe conservar esa secuencia.
- `SnapshotProvider` invalida el estado a `cargando` antes de cada intento y
  solo publica `listo` después de recibir el snapshot (`SnapshotProvider.tsx:52-69,
  71-78`). `App.tsx` solo entrega snapshots a `AppShell` en la rama `listo`.
  Nunca se debe usar el snapshot previo como fallback ni montar secciones
  financieras en la pantalla de retorno.
- La recuperación no debe reaccionar automáticamente a cambios de la lista
  ni a un remount del bloque con otra llamada a `recargar`. Una activación
  confirmada debe producir una sola solicitud de carga; los reintentos deben
  ser explícitos mediante «Reintentar». Mientras esa carga está en vuelo, la
  UI debe evitar dobles activaciones o, equivalentemente, el caso de uso debe
  serializar la operación, para que dos respuestas no crucen titulares.
- `PerfilProvider` tiene un único `useEffect` sin dependencia del estado del
  snapshot (`PerfilProvider.tsx:17-29`), por lo que mantenerlo fuera de la
  pantalla de error no causa un bucle. La 37 no debe añadir un efecto que
  llame a `recargar` al entrar en Ajustes o al actualizar la lista.

## Capas, rutas y dependencias afectadas

| Área | Evidencia | Alcance de la feature 37 |
|---|---|---|
| Estado de carga | `src/components/shell/SnapshotProvider.tsx` | Mantener estados excluyentes y carga explícita; sin fallback financiero. |
| Composición | `src/App.tsx` | Coordinar la pantalla anterior y la pantalla de error sin anidar gestión dentro de `ErrorScreen`. |
| Navegación | `AppShell.tsx`, `SectionTabs.tsx`, `secciones.ts`, `lib/bus-ui.ts` | Preservar `ajustes` al desmontar/remontar la shell; sin dependencia externa. |
| Perfiles | `PerfilProvider.tsx`, `GestionPerfiles.tsx`, `PerfilFila.tsx` | Reutilizar lista, activo y acciones existentes. |
| Dominio/adapter | `cambiar-perfil.ts`, `PerfilPort`, `perfil-ipc-adapter.ts` | No cambiar commands ni `invoke()`; conservar confirmación y errores. |
| Presentación | `ErrorScreen.tsx`, `styles/error-screen.css` y hoja de la pantalla recuperada | Acción «Regresar» y una pantalla de Ajustes separada, solo con tokens. |
| Tests | `tests/recuperacion-error-perfil/` | Sustituir contratos F36 sobre expansión por contratos de transición y no mezcla. |

No se necesita crate, paquete npm, command Tauri ni cambio de persistencia. La
feature depende directamente de la 36 porque refina su implementación ya
cerrada; las dependencias 22 y 35 son transitivas y ya están satisfechas por la
36.

## Riesgos y decisiones

- **Pantalla sin snapshot:** no se debe intentar regresar a `AjustesSection`
  completa; la recuperación debe ser una pantalla de Ajustes acotada a la
  gestión de perfiles hasta que exista un snapshot válido.
- **Contexto reiniciado:** el estado local actual de `AppShell` vuelve a
  Registro al remount. La 37 exige un mecanismo de navegación compartido o una
  sección inicial explícita para retener `ajustes`.
- **Error oculto:** «Regresar» puede sustituir visualmente a `ErrorScreen`,
  pero el motivo no debe convertirse en datos ni provocar un nuevo intento
  automático. «Reintentar» sigue siendo la acción explícita desde el error y
  otro fallo vuelve a la recuperación.
- **Datos cruzados:** el activo visible se actualiza solo después de la
  confirmación de `seleccionar`; la shell solo se muestra con el snapshot de la
  carga vigente.
- **Bucle de carga:** la transición Regresar → gestión no carga snapshots. La
  única carga posterior es la originada por una selección confirmada o por un
  clic explícito en «Reintentar».
- **Límite de archivos:** los componentes y hojas tocados siguen sujetos a
  100 líneas, estilos separados y tokens. Si la coordinación no cabe, debe
  dividirse en módulos pequeños, no duplicar estado en componentes.

## Descomposición

Se crea una sola feature 37: es un único cambio de UX y de transición de
estado, testeable end-to-end. No se separa una feature de datos porque el
puerto, los commands, la lista y la persistencia ya son correctos en las
features 21/22/36. La base de implementación es la 36 y por eso se declara
`depends_on: [36]`.

## Referencias consultadas

- `feature_list.json`, features 22, 35 y 36.
- `progress/impl_36.md` y `progress/review_36.md`.
- `specs/36_recuperacion-error-perfil/requirements.md` y `design.md`.
- `src/App.tsx`.
- `src/components/shell/{SnapshotProvider,PerfilProvider,AppShell,SectionTabs,secciones}.tsx`/`.ts`.
- `src/components/error-screen/ErrorScreen.tsx`.
- `src/components/ajustes-section/{AjustesSection,GestionPerfiles,PerfilFila}.tsx`.
- `src/domain/use-cases/{cambiar-perfil,cargar-perfiles}.ts`.
- `src/domain/ports/perfil-port.ts` y `src/adapters/perfil-ipc-adapter.ts`.
- `tests/recuperacion-error-perfil/*.test.mjs`.

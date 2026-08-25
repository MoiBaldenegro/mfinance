# Análisis — recuperación desde el error de carga de perfil

> Sesión `spec_author`. Requerimiento bruto: cuando falla la carga de un
> perfil, `ErrorScreen` ocupa toda la aplicación y solo ofrece reintentar. El
> usuario necesita volver a seleccionar o gestionar perfiles sin perder la
> referencia del perfil activo y sin perder el diagnóstico visible.

## 1. Problema reafirmado y alcance

El fallo aparece después de que el flujo de perfiles ya ha elegido un titular
pero no puede leer su snapshot. La aplicación desmonta la shell completa para
evitar mostrar datos viejos, pero esa misma decisión deja fuera la única zona
que hoy permite activar otro perfil: `Ajustes > Perfiles`. El usuario queda
reducido a `Reintentar`, que vuelve a pedir el mismo archivo y no cambia la
situación.

El alcance mínimo es añadir una salida de recuperación en la pantalla de
error y hacer accesible desde ella la gestión existente de perfiles. La
solución no debe inventar un command nuevo ni usar un snapshot anterior como
fallback. La selección seguirá siendo explícita, el error seguirá visible y
la shell solo volverá a aparecer tras una carga exitosa del perfil elegido.

Queda fuera de esta feature corregir el texto cosmético de los prefijos
repetidos del error (`SnapshotLoadError` y los envoltorios Rust/TS). Ese texto
se conserva y se muestra; ocultarlo o reemplazarlo por un mensaje genérico
haría más difícil diagnosticar el archivo ausente.

## 2. Flujo real verificado

### 2.1 Arranque y carga del snapshot

1. `src-tauri/src/lib.rs` construye `JsonSnapshotRepository`, prepara el
   arranque y registra `obtener_perfil_activo_con_onboarding`, además de los
   commands de perfiles `listar_perfiles`, `perfil_activo`, `crear_perfil` y
   `seleccionar_perfil`.
2. `src/components/shell/SnapshotProvider.tsx` llama a
   `snapshotPort.obtenerPerfilActivoConOnboarding()`. Mientras espera publica
   `cargando`; si el command rechaza, publica `error` con un
   `SnapshotLoadError`.
3. `src/App.tsx` conmuta a `ErrorScreen` para el estado `error`. Esa rama no
   monta `AppShell` y, por tanto, no monta su `PerfilContext`.
4. `ErrorScreen.tsx` solo imprime el título, `error.message` y el botón
   `Reintentar`. No existe acción de salida ni carga del registro de perfiles.

En el backend, `application/obtener_perfil_activo_con_onboarding.rs` obtiene
el perfil activo y después intenta `repo.load()`. Un snapshot ausente o
ilegible se transforma en un `PerfilError::Persistencia` con el nombre/ruta y
sube por el command como `CommandError`. El adapter de snapshot conserva ese
motivo al reconstruir `SnapshotLoadError`; los envoltorios existentes explican
los mensajes anidados del reporte, incluido `mfinance.json` y `os error 3`.

### 2.2 Cambio de perfil y punto exacto del dead-end

1. `AppShell.tsx` mantiene localmente `perfiles`, `activo` y `avisoCarga`, y
   publica esos valores mediante `PerfilContext`.
2. `GestionPerfiles.tsx`, que es el bloque de Ajustes, usa `usarPerfiles()`.
   `PerfilFila.tsx` muestra el activo y ofrece `Activar` para los demás; el
   mismo bloque permite crear un perfil y reanudar onboarding.
3. La acción llama a `cambiarPerfil.ts`. El caso de uso invoca el puerto
   `PerfilPort.seleccionar`, luego fija el titular y dispara la recarga del
   snapshot. Si la selección IPC falla, no fija titular ni recarga.
4. En Rust, `seleccionar_perfil` delega en `application::perfiles::seleccionar`.
   El caso de uso persiste `profiles.json` con `activa = id` antes de devolver
   el perfil. Por ello, si la selección termina bien pero falta
   `perfiles/<id>/mfinance.json`, el perfil activo del backend ya es el nuevo
   titular cuando falla la carga.
5. La recarga de `SnapshotProvider` publica primero `cargando`, desmonta la
   shell y finalmente publica `error` si el archivo no se puede leer. Como la
   lista de perfiles vive dentro de `AppShell`, desaparecen simultáneamente
   la cabecera, el indicador del activo y la gestión que permitiría recuperar
   la sesión.

La aplicación no mezcla el snapshot viejo: al desmontar `AppShell` deja de
renderizar sus secciones. El defecto es de navegabilidad/recuperación, no una
razón para reutilizar esos datos viejos.

## 3. Capas, datos, repositorios, rutas y dependencias

| Capa | Evidencia | Implicación |
|---|---|---|
| Backend dominio/application | `domain/perfil_repository.rs`, `application/perfiles.rs` | Ya existe el puerto y la semántica de selección; no se añade filesystem a la UI. |
| Backend commands | `commands/perfiles_commands.rs`, `lib.rs` | Los cuatro commands necesarios están registrados y no requieren cambio. |
| Adapter frontend | `src/adapters/perfil-ipc-adapter.ts` | `invoke()` ya está aislado; la recuperación debe reutilizar `PerfilPort`. |
| Núcleo frontend | `cargar-perfiles.ts`, `cambiar-perfil.ts` | Ya existen carga de lista/activo, activación, errores nombrados y recarga. |
| Estado frontend | `AppShell.tsx`, `use-perfil.ts` | El contexto está demasiado abajo: solo se publica cuando el snapshot ya está listo. |
| Presentación | `App.tsx`, `ErrorScreen.tsx`, `GestionPerfiles.tsx` | Hay que conservar el error y exponer la gestión fuera de la shell. |
| Estilos | `error-screen.css`, `gestion-perfiles.css` | La acción nueva usa tokens y una hoja existente; no requiere dependencia. |

La información de activo sigue siendo la de `perfil_activo`/`profiles.json` y
la selección sigue escribiendo `profiles.json`. No se debe derivar el activo
de un snapshot ni limpiar `activa` cuando falle la lectura del archivo.

## 4. Solución mínima y segura propuesta

### 4.1 Estado compartido de perfiles fuera de la shell

Extraer el estado que hoy vive en `AppShell` a un proveedor de perfiles común
montado por `App` junto al `SnapshotProvider`. El proveedor reutiliza
`cargarPerfiles(perfilPort)` y publica la misma interfaz `ValorPerfiles`; la
shell deja de ser propietaria exclusiva del contexto. Así, la transición
`listo → cargando → error` no borra la lista ni el activo que ya se cargaron.

El traslado no cambia los commands ni la semántica de `cambiarPerfil`:

- `fijarActivo` solo se ejecuta después de que `seleccionar_perfil` confirme
  la selección.
- `recargar` sigue siendo la única forma de pedir el snapshot nuevo.
- Mientras la carga está pendiente no se renderiza ninguna sección con un
  snapshot anterior.
- Si la lectura falla, el proveedor de perfiles conserva el activo que
  devuelve el registro y sus avisos de perfiles.

### 4.2 Acción en `ErrorScreen` y reutilización de gestión

Añadir una acción visible `Gestionar perfiles` en `ErrorScreen`. Al pulsarla,
la misma pantalla mantiene el título y el `error.message` y muestra el bloque
existente `GestionPerfiles`, no una segunda implementación de selector. La
lista marca el perfil activo con los datos del registro y conserva las
operaciones existentes de activar, crear y reanudar onboarding.

La acción no significa «descartar error»: es una expansión de recuperación.
`Reintentar` permanece disponible. Si el usuario activa un perfil y su carga
falla, la nueva instancia de `ErrorScreen` vuelve a mostrar el motivo de esa
carga y mantiene la acción de gestión; si carga correctamente, `App.tsx`
vuelve a `AppShell` con el snapshot nuevo.

### 4.3 Por qué no se modifica el backend

Los commands requeridos ya existen, están registrados y sus adapters ya
implementan el puerto. Añadir otro command para «volver» no resolvería el
dead-end: el problema está en que la pantalla de error no tiene acceso al
contexto de perfiles. Reubicar ese contexto y reutilizar los casos de uso
reduce superficie y mantiene el aislamiento hexagonal.

## 5. Criterios de prueba para evitar el bloqueo

Los tests de implementación deberán escribirse primero y observarse en rojo:

1. Un contrato de `ErrorScreen`/`App` deberá comprobar que el error nombrado y
   una acción visible de gestión coexisten; al activar la acción el mensaje
   original seguirá renderizado.
2. Un test de proveedor deberá comprobar que lista y activo se cargan mediante
   `PerfilPort`, que el activo queda marcado y que la lista permanece durante
   una carga de snapshot fallida.
3. Un test de integración del flujo deberá comprobar
   `seleccionar_perfil → recargar snapshot`; con un snapshot válido se llega a
   `AppShell` con el perfil elegido, y con un snapshot ausente se queda en
   `ErrorScreen` con la acción de gestión disponible y sin datos del perfil
   anterior.
4. Un test del caso de uso deberá conservar la garantía existente: un rechazo
   de `seleccionar_perfil` produce error nombrado, no fija el titular y no
   dispara recarga.
5. Un contrato estructural deberá confirmar que la recuperación usa el
   `PerfilPort`/adapter existente, que ningún componente invoca `invoke()` y
   que no aparecen commands backend nuevos.

La verificación final será `pnpm test`, `pnpm build` y `./init.sh`; la prueba
manual de Tauri deberá reproducir un perfil activo sin `mfinance.json`, pulsar
`Gestionar perfiles`, activar otro perfil con snapshot válido y comprobar que
la shell vuelve sin mostrar datos cruzados. También se deberá comprobar el
caso en que el segundo perfil falla: el diagnóstico sigue visible.

## 6. Riesgos, trabas y decisiones

- **Riesgo de datos cruzados:** usar el snapshot anterior como fallback haría
  parecer que pertenece al nuevo titular. Se prohíbe; solo se muestra el
  registro de perfiles mientras hay error.
- **Riesgo de perder el activo:** borrar o resetear el contexto al entrar en
  `ErrorScreen` ocultaría qué perfil está seleccionado. El proveedor común
  queda montado durante las transiciones y no modifica `profiles.json` por
  una lectura fallida.
- **Riesgo de duplicar lógica:** un selector nuevo paralelo podría divergir de
  Ajustes. Se reutilizan `GestionPerfiles`, `cargarPerfiles` y `cambiarPerfil`.
- **Límite de archivo:** `SnapshotProvider.tsx` ya tiene 96 líneas y
  `AppShell.tsx` 98/100 según el árbol actual. La extracción del proveedor de
  perfiles debe mantener cada archivo en 100 líneas o menos; si una edición no
  cabe, se divide el glue en módulos pequeños sin aumentar el alcance.
- **Error anidado:** se conserva para no mezclar dos problemas; una feature
  posterior puede normalizar prefijos sin afectar esta salida de recuperación.
- **Dependencias:** no se necesita paquete npm, crate ni cambio en
  `docs/dependencies.md`; la feature puede permanecer `pending`.

## 7. Descomposición decidida

Se propone **una feature (id 36)**. Aunque toca varios componentes, es un único
entregable testeable: hacer recuperable la pantalla de error mediante el
contexto y la gestión de perfiles ya existentes. Separar un proveedor de
estado y una pantalla nueva introduciría una fase intermedia sin valor de
usuario y podría dejar al primer implementable sin una salida funcional.

Dependencias directas: la feature 22, que define `PerfilPort`, selector,
`GestionPerfiles` y `cambiarPerfil`; y la feature 35, que deja estable el flujo
actual de `SnapshotProvider` y su contrato de carga. No se requiere depender
de un command nuevo ni de otra dependencia externa.

## 8. Referencias consultadas

- `src/App.tsx`
- `src/components/shell/SnapshotProvider.tsx`
- `src/components/error-screen/ErrorScreen.tsx`
- `src/components/shell/AppShell.tsx`
- `src/components/ajustes-section/GestionPerfiles.tsx`
- `src/components/ajustes-section/PerfilFila.tsx`
- `src/domain/use-cases/{cargar-perfiles,cambiar-perfil,crear-perfil}.ts`
- `src/domain/ports/perfil-port.ts`
- `src/adapters/perfil-ipc-adapter.ts`
- `src-tauri/src/application/{perfiles,obtener_perfil_activo_con_onboarding}.rs`
- `src-tauri/src/commands/perfiles_commands.rs`
- `src-tauri/src/lib.rs`
- `specs/22_perfiles-ui-selector/requirements.md` y `design.md`
- `progress/impl_22.md`, `progress/research/fix-arranque-perfil-activo.md`

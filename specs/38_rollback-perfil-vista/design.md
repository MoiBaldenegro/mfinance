# Diseño — rollback-perfil-vista (feature 38)

## Contexto visual

- **Estado actual:** `GestionPerfiles` confirma `seleccionar_perfil`, fija de
  inmediato el nuevo activo y llama a `SnapshotProvider.recargar`. El proveedor
  oculta `AppShell` durante la carga, pero si el snapshot nuevo falla conserva
  el nuevo titular en `PerfilProvider` y `App.tsx` muestra `ErrorScreen` o la
  pantalla parcial de recuperación de la feature 37. El hook de navegación
  conserva una sección global, aunque no se captura junto al perfil ni se
  restituye como una transacción.
- **Estado deseado:** antes de seleccionar se guarda un contexto inmutable con
  el id del activo y la sección/vista actual. La carga del perfil nuevo ocurre
  sin ninguna sección financiera visible. Si falla, una única operación
  explícita vuelve a seleccionar el perfil anterior y carga su snapshot; al
  terminar, se remonta la `AppShell` completa con el titular y la navegación
  que existían antes del intento. Si esa recuperación falla, solo se muestra
  un `ErrorScreen` claro con reintento y gestión segura de perfiles.

## Tokens usados (solo de los tokens del diseño del proyecto)

| Token | Uso |
|---|---|
| `--color-negative` | Diagnóstico del fallo nuevo y del fallo de rollback. |
| `--color-error-bg` | Superficie del aviso de error cuando la hoja existente la requiera. |
| `--color-primary` / `--color-primary-contrast` | Acciones Reintentar y Gestionar perfiles. |
| `--color-surface` / `--color-border` | Superficies de ErrorScreen y gestión segura. |
| `--color-text` / `--color-muted` | Títulos, diagnóstico y contexto del perfil. |
| `--space-2..6` / `--radius-md` / `--shadow-card` | Ritmo, controles y contenedores. |
| `--anillo-foco` / `--transicion-rapida` | Foco visible y transición de acciones. |

## Decisiones y constraints

- Decisión 1: la selección se trata como una transacción de sesión en un
  coordinador reutilizable o caso de uso. El snapshot anterior no se conserva
  para renderizarlo mientras se prueba el nuevo; solo se conserva su identidad
  y la navegación necesaria para restaurar el contexto.
- Decisión 2: el rollback reusa `PerfilPort.seleccionar` y el flujo de carga
  existente. Como el command de selección persiste el activo en
  `profiles.json`, no basta con cambiar una variable React: hay que volver a
  seleccionar el id anterior antes de solicitar su snapshot.
- Decisión 3: cada intento fallido del perfil nuevo tiene una sola rama de
  rollback. `Reintentar` en un fallo de rollback es una acción explícita de
  recuperación de esa fase y no vuelve a iniciar la selección fallida ni crea
  un efecto que recargue al montar una pantalla.
- Decisión 4: una respuesta de carga solo puede publicar el estado asociado a
  la transacción y al id que la originó. Las respuestas tardías o de un intento
  anterior se descartan para impedir que un snapshot cruce titulares.
- Decisión 5: mientras la transacción o el rollback estén en vuelo no se monta
  `AppShell`, `AjustesSection` ni ninguna sección financiera. La gestión segura
  de perfiles no recibe `FinanceSnapshot` y no dispara cargas al montarse.
- Restricciones: no añadir router, command, paquete ni crate; `invoke()` queda
  en adapters; los componentes delegan en puertos y casos de uso; los estilos
  quedan fuera de `.tsx` y usan tokens; cada archivo nuevo o modificado queda
  en 100 líneas o menos.

## Alternativa descartada

- Alternativa considerada: conservar el perfil nuevo como activo y mostrar
  `AjustesRecuperacion` tras el fallo, o renderizar `AppShell` con el snapshot
  anterior en memoria.
- Motivo del descarte: la primera opción abandona el titular y la vista que el
  usuario tenía antes del intento; la segunda puede mostrar datos del titular
  anterior bajo un activo nuevo. La restauración debe confirmar primero el
  perfil anterior y cargar de nuevo sus datos antes de rem montar la shell.

# Diseño — regresar-ajustes-error-perfil (feature 37)

## Contexto visual

- **Estado actual:** tras seleccionar desde `Ajustes > Gestión de perfiles` un
  perfil cuyo snapshot falta, `SnapshotProvider` desmonta `AppShell` y
  `ErrorScreen` muestra el diagnóstico. La feature 36 añade un botón
  «Gestionar perfiles» que expande `GestionPerfiles` dentro de ese mismo error.
- **Estado deseado:** `ErrorScreen` ofrece «Regresar a Ajustes». Al activarlo,
  el error deja de ser la pantalla visible y aparece una pantalla de Ajustes de
  recuperación con la gestión de perfiles como contenido principal. La lista y
  el activo proceden del `PerfilProvider` común. Tras una selección válida y
  una carga exitosa, vuelve `AppShell` con la pestaña `Ajustes` activa.

## Tokens usados

| Token | Uso |
|---|---|
| `--color-negative` | Estado y motivo del error. |
| `--color-primary` / `--color-primary-contrast` | Acciones «Regresar», «Reintentar» y activación. |
| `--color-surface` / `--color-border` | Superficie de la pantalla de gestión y filas. |
| `--color-text` / `--color-muted` | Jerarquía del título, perfil activo y metadatos. |
| `--space-2..6` | Ritmo entre título, lista y acciones. |
| `--radius-md` / `--radius-full` | Controles y filas existentes. |
| `--anillo-foco` / `--transicion-rapida` | Accesibilidad e interacción. |

## Decisiones y constraints

- Decisión 1: «Regresar a Ajustes» es una transición de pantalla, no un estado
  `gestionVisible` dentro de `ErrorScreen`; así el diagnóstico no comparte
  layout con el panel de gestión.
- Decisión 2: la pantalla anterior se modela con la navegación existente y con
  el identificador estable `ajustes`; no se añade router ni historial externo.
  La sección activa debe sobrevivir al remount de `AppShell`.
- Decisión 3: la pantalla de recuperación reutiliza `GestionPerfiles`,
  `PerfilProvider`, `cargarPerfiles` y `cambiarPerfil`. No recibe ni muestra
  un `FinanceSnapshot` anterior.
- Decisión 4: entrar en la pantalla de recuperación no ejecuta `recargar`.
  La carga solo nace de una selección confirmada o de «Reintentar»; la UI evita
  solicitudes duplicadas mientras una operación está en vuelo.
- Restricciones: sin dependencias nuevas ni commands; `invoke()` permanece
  únicamente en adapters; lógica fuera de `.tsx`; estilos en `src/styles/` y
  solo tokens; archivos tocados de 100 líneas o menos; textos en español.

## Alternativa descartada

- Alternativa considerada: conservar el botón «Gestionar perfiles» y mostrar
  `GestionPerfiles` debajo del título y motivo de `ErrorScreen`.
- Motivo del descarte: es exactamente la presentación implementada por la
  feature 36 y produce el panel incrustado que el humano considera incorrecto;
  además no representa una vuelta a la navegación anterior.

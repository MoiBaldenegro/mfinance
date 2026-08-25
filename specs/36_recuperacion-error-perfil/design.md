# Diseño — recuperacion-error-perfil (feature 36)

## Contexto visual

- **Estado actual:** `App.tsx` reemplaza `AppShell` por `ErrorScreen` cuando
  `SnapshotProvider` no puede cargar el snapshot. `ErrorScreen` solo ofrece
  `Reintentar`; la gestión de perfiles está dentro de `AppShell`, en Ajustes,
  y no existe durante el error.
- **Estado deseado:** el error y su motivo permanecen visibles. Una acción
  `Gestionar perfiles` revela el bloque de gestión existente, con la lista y
  la marca del perfil activo, para activar otro perfil o continuar la gestión.
  La shell no se muestra hasta que el nuevo snapshot carga correctamente.

## Tokens usados (solo de los tokens del diseño del proyecto)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-negative` | token vigente | Motivo del error y avisos de recuperación. |
| `--color-error-bg` | token vigente | Superficie de aviso cuando la hoja existente lo requiera. |
| `--color-primary` / `--color-primary-contrast` | tokens vigentes | Acción visible de gestión y reintento. |
| `--color-surface` / `--color-border` | tokens vigentes | Contenedor de la gestión de perfiles. |
| `--color-text` / `--color-muted` | tokens vigentes | Texto del error, titulares y metadatos. |
| `--space-2..6` / `--radius-md` / `--shadow-card` | tokens vigentes | Separación, controles y elevación de la vista de recuperación. |
| `--anillo-foco` / `--transicion-rapida` | tokens vigentes | Foco visible y transición de la acción. |

## Decisiones y constraints

- Decisión 1: extraer el estado `PerfilContext` que hoy pertenece a
  `AppShell` a un proveedor común montado por `App`. Así `ErrorScreen` puede
  reutilizar `GestionPerfiles` sin duplicar selector, creación, validaciones
  ni cable IPC.
- Decisión 2: `Gestionar perfiles` expande la gestión debajo del error en vez
  de navegar a una pantalla que oculte el diagnóstico. `Reintentar` conserva
  su comportamiento actual.
- Decisión 3: la recuperación usa `cargarPerfiles`, `cambiarPerfil`,
  `PerfilPort` y los commands existentes. No añade commands ni modifica
  `profiles.json` cuando solo falla la lectura del snapshot.
- Decisión 4: durante `cargando` o `error` no se reutiliza el snapshot anterior.
  Un perfil solo llega a `AppShell` después de una carga exitosa, para impedir
  datos cruzados entre titulares.
- Restricciones: sin dependencias nuevas; `invoke()` solo en
  `src/adapters/`; lógica fuera de `.tsx`; estilos en `src/styles/` y solo con
  tokens; cada archivo tocado debe quedar en 100 líneas o menos; textos de la
  interfaz en español.

## Alternativa descartada

- Alternativa considerada: dejar únicamente `Reintentar`, o renderizar
  `AppShell` con el snapshot anterior para que el usuario llegue a Ajustes.
- Motivo del descarte: la primera opción conserva el dead-end y la segunda
  puede presentar datos de un titular bajo el nombre de otro. Mostrar la
  gestión sin secciones financieras mantiene el error y evita mezclar datos.

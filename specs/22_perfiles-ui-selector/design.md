# Diseño — perfiles-ui-selector (feature 22)

## Contexto visual

- **Cabecera** (`src/components/shell/HeaderBar.tsx`): se añade un indicador
  permanente "Perfil: <nombre>" para saber en todo momento de quién son los
  datos visualizados (requerimiento literal del humano).
- **Sección Ajustes**: nuevo bloque "Perfiles" con la lista de perfiles
  (marcando el activo), formulario de creación por nombre y acción de
  activar cada perfil.
- Estado deseado: al activar otro perfil, el snapshot se recarga y TODAS las
  secciones refrescan con sus datos; la moneda mostrada es la del perfil
  activo (mecanismo de f19/f20 sin cambios).

## Tokens usados (solo tokens del proyecto)

| Token | Uso en esta feature |
|-------|---------------------|
| `--color-primary-bg` / `--color-primary` | Fila del perfil activo y su marca visible. |
| `--color-surface` / `--color-border` / `--shadow-card` | Contenedor del bloque Perfiles y filas. |
| `--color-text` / `--color-muted` | Nombre del titular y metadatos (fecha de creación). |
| `--color-negative` / `--color-error-bg` | Mensajes de error junto al campo de nombre. |
| `--anillo-foco` | Anillo de foco accesible en botones y campo. |
| `--space-2..5`, `--radio-md`, `--transicion-rapida` | Ritmo forma y estados hover de lista y formulario. |

## Decisiones y constraints

- Decisión 1: indicador del titular en la CABECERA (visible siempre) y no
  solo en Ajustes: el requerimiento es identificar de quién son los datos en
  cualquier pantalla; Ajustes queda como zona de gestión.
- Decisión 2: la creación pide SOLO el nombre (id y fecha los genera el
  backend); sin borrado de perfiles en este ciclo (futuro según el catálogo
  del informe de análisis).
- Decisión 3: puerto `PerfilPort` + hook propio siguiendo el patrón
  `TemaPort`/`use-tema`; el cambio de perfil reutiliza el flujo existente de
  carga del snapshot (`load-snapshot`) para refrescar toda la app.
- Restricción aplicable: hojas nuevas o ampliadas bajo `src/styles/`
  (`header-bar.css`, `ajustes-section.css`); nada de CSS inline; ≤100 líneas
  por archivo tocado; invoke() únicamente en `src/adapters/`; textos en
  español.

## Alternativa descartada

- Alternativa considerada: selector de perfil dentro de cada sección y
  pantalla intermedia de "elegir perfil" al arrancar.
- Motivo del descarte: multiplica puntos de gestión y fricciona el arranque;
  el indicador global + gestión centralizada en Ajustes cumple "saber de
  quién es la información" con menos superficie UI.

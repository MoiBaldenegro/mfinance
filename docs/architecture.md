# Arquitectura — Qué significa "hacer un buen trabajo"

> Este documento define el estándar de calidad. Los agentes revisores
> evalúan código contra este archivo. Si no está aquí, no es un requisito.

## Principios

1. **Capas claras.** El proyecto tiene y debe tener siempre la siguiente estructura de carpetas:

   | Carpeta | Rol |
   |---------|-----|
   | `public/` | Archivos que se sirven tal cual en la raíz (SVG, favicons, logos). Ej: `tomateLogo.svg`. Nunca procesados ni hasheados por el build. |
   | `scripts/` | Scripts del arnés: validación, generación y orquestación (`check-format.mjs`). Se ejecutan con Node y nunca se importan desde `src/`. |
   | `src/assets/` | Imágenes y recursos importados desde el código. Astro los optimiza y hashea en build (`astro:assets`). Lo que se sirve tal cual va en `public/`, no aquí. |
   | `src/components/` | Componentes `.astro` de interfaz de usuario que no son layouts ni vistas de ruta (`LatestArticles`, `HtbStadistics`…). Cada uno importa su propia hoja de estilos de `src/styles/`. |
   | `src/domain/entities/` | Entidades del dominio: modelos tipados que mapean el contenido estructurado (ej: `Card`, `Feature`, `Plan`). |
   | `src/domain/repositories/` | Repositorios: única vía de acceso a los datos. Entregan entidades leyendo desde archivos JSON. |
   | `src/data/` | Archivos JSON: única fuente de contenido estructurado (cards, features, etc.). Los componentes jamás leen JSON directamente. |
   | `src/layouts/` | Componentes de página (`Layout.astro`). Todo el chrome compartido vive aquí. |
   | `src/pages/` | Rutas. Un archivo por URL (`index.astro` → `/`). |
   | `src/styles/` | CSS. `tokens.css` con el sistema de tokens del diseño + un archivo por componente (`layout.css`, `profile-card.css`, `latest-articles.css`…). |

2. **Sin dependencias externas.** Si una feature requiere una dependencia, primero se discute (estado `blocked`): ningún agente aprueba dependencias; la aprobación es decisión exclusiva del humano tras discusión y se materializa en `docs/dependencies.md`, validado por `scripts/validate-dependencies.mjs` (integrado en `scripts/check-format.mjs`).

3. **Errores explícitos.** Las funciones que pueden fallar (un JSON malformado, un id que no existe, un recurso ausente) lanzan errores nombrados, no devuelven valores falsy silenciosos. Un fallo silencioso es un bug disfrazado.

4. **Inmutabilidad por defecto.** `const` por defecto, tipos `readonly` para props y estructuras de datos. Las entidades son inmutables. Modificar = crear una nueva instancia. Nunca mutar props ni estado compartido.

5. **Atomicidad en disco.** `dist/` es un artefacto generado por `astro build`: nunca se edita, ni se crea contenido en él a mano, ni se repara a medias. El build siempre regenera el directorio completo.

6. **Tokens, no valores sueltos.** Colores, espaciados, radios, sombras y tipografías solo desde las custom properties de `global.css` (definidas en `DESIGN.md`). Queda prohibido hardcodear valores en componentes o estilos.

7. **Estilos separados de la UI.** Nunca combinar estilos y HTML/UI en el mismo archivo. Un `.astro` solo contiene marcado; sus estilos viven en un archivo `.css` dentro de `src/styles/` que el componente importa. Tampoco CSS global para lo que pertenece a un componente.

8. **Lógica separada de la UI.** JavaScript o lógica jamás en el mismo archivo que HTML/UI o estilos. El frontmatter de un `.astro` se limita a imports y paso de datos. Cualquier lógica (parseo, transformación, validación, acceso a datos) se extrae a módulos `.ts` en `src/domain/` o módulos utilitarios.

9. **Estático por defecto.** Cero JavaScript de runtime salvo justificación. El sitio es HTML generado en build. No añadir frameworks ni scripts para interacción trivial.

10. **Rutas explícitas.** Una página por archivo en `src/pages/`, una URL por página. Sin lógica de routing manual.

11. **Un solo layout.** El chrome compartido (head, fuentes, estructura base) vive solo en `src/layouts/Layout.astro`. No crear layouts nuevos para variaciones menores; reutilizar el existente.

12. **Modularización estricta.** Todo se modulariza muy bien. Ningún archivo supera las 100 líneas de código. Si es extremadamente necesario superarlas, se discute primero (estado `blocked`).

13. **Scripts del arnés.** Los scripts de `scripts/` son herramientas de validación, generación y orquestación que se ejecutan con Node (`node scripts/<slug>.mjs`) y **nunca se importan desde `src/`**: no forman parte del build ni del runtime. Usan únicamente la librería estándar de Node (`node:*` o rutas relativas), sin dependencias externas. Objetivo ≤100 líneas, con excepciones documentadas como la de `validate-feature-list.mjs` (139 líneas, detector de ciclos de `depends_on` aprobado en la feature 19).

## Flujo de datos

```
JSON (src/data/*.json)
      │
      ▼
repositorio (src/domain/repositories)  →  entidades tipadas (src/domain/entities)
      │
      ▼
componentes (LatestArticles, HtbStadistics)
      │   └─ importan estilos de src/styles/*.css
      ▼
src/pages → Layout.astro → HTML estático
```

```
astro build
   ├─ src/ → HTML estático + CSS + assets hasheados
   └─ public/ → copiado tal cual
      ↓
   dist/
```

## Qué NO hacer

- No hardcodear colores, radios, espaciados ni fuentes — siempre tokens.
- No poner `<style>` dentro de un `.astro` — los estilos van en `src/styles/`.
- No meter lógica JS en un archivo de UI — va en módulos `.ts` separados.
- No superar las 100 líneas por archivo sin discusión previa.
- No hacer que los componentes lean JSON directamente — siempre vía repositorio.
- No editar `dist/` a mano ni con scripts de terceros.
- No añadir frameworks o JS de runtime para interacción trivial.
- No CSS global para estilos que pertenecen a un componente.
- No crear layouts nuevos para variaciones menores — reutilizar `Layout.astro`.
- No devolver fallos silenciosos: si algo puede fallar, que falle con un error nombrado.

# Convenciones — Reglas de estilo, nombres y estructura

> Complementa `docs/architecture.md`. Aquí viven las decisiones concretas de
> estilo y nombres. Si algo contradice a `architecture.md`, manda la arquitectura.

## Nombres

| Qué | Convención | Ejemplo |
|-----|-----------|---------|
| Carpetas | kebab-case, plural | `src/components/`, `src/styles/` |
| Archivos `.astro` | PascalCase | `Cards.astro`, `Layout.astro` |
| Archivos `.css` | kebab-case, nombre del componente | `card-glow.css`, `navbar.css` |
| Archivos `.ts` | PascalCase para clases/entidades, camelCase para utilidades | `Card.ts`, `CardsRepository.ts` |
| Archivos de `scripts/` | kebab-case, prefijo de verbo, ruta `scripts/<slug>.mjs` | `scripts/check-format.mjs`, `scripts/audit-design-tokens.mjs` |
| Tipos e interfaces | PascalCase | `Card`, `CardColor` |
| Funciones | camelCase, verbo primero | `getCards()`, `parseCard()` |
| Errores | Clase PascalCase + sufijo `Error`, nombre en español | `CardDataError` |
| Custom properties | `--grupo-nombre`, kebab-case | `--color-tomate`, `--shadow-card` |
| Clases CSS | BEM ligero: bloque, `--` para variantes | `.card`, `.card-icon--red` |
| Mensajes de error/UI | Español | `cards.json: la card "x" tiene un color inválido` |

## Estructura

- **Un componente = un archivo `.astro` + una o más hojas en `src/styles/`**.
- **Una entidad = un archivo** en `src/domain/entities/`.
- **Un repositorio = un archivo** en `src/domain/repositories/`, una única
  responsabilidad (una fuente de datos).
- **Un dato = una entrada** en `src/data/*.json`, tipada por su entidad.
- **Un script = un archivo** en `scripts/`, nombrado `scripts/<slug>.mjs` (kebab-case con
  prefijo de verbo). Verbos admitidos (lista cerrada): `check-`, `validate-`, `generate-`,
  `build-`, `deploy-`, `audit-`. Un verbo nuevo se añade a esta lista y a la auditoría de
  la convención como extensión de contrato, nunca en silencio. Todo script nuevo se
  declara en la spec de la feature con su ruta completa y acceptance (nunca ad-hoc en
  implementación).
- **Una spec por feature** en `specs/<NN>_<name>/`: `requirements.md`
  (SIEMPRE, EARS estricto: una línea = un requerimiento = exactamente un
  `SHALL`, IDs `REQ-<NN>-<xx>`, sin verbos vagos) y `design.md` (solo si la
  feature toca UI/presentación). `<NN>` = id con padding a 2 dígitos,
  `<name>` = slug kebab-case del `name` de la feature. Las plantillas viven
  en `specs/_template/`.

## Dependencias

- **Ningún agente aprueba dependencias**: la aprobación es decisión exclusiva del humano,
  tras discusión, y queda materializada en el registro. Si una feature necesita una
  dependencia nueva, el agente marca la feature `blocked` y espera la decisión.
- La aprobación se materializa en `docs/dependencies.md` con formato de
  bloques: `### <package>` seguido de líneas `- clave: valor` con `version`,
  `scope`, `approved` y `motivo`.
- El validador `scripts/validate-dependencies.mjs` (integrado en
  `scripts/check-format.mjs`) falla si una dependencia de package.json no
  tiene su entrada aprobada en el registro.

## Orden dentro de un archivo `.astro`

1. Frontmatter: imports de estilos, imports de dominio, `const` de datos.
2. Marcado semántico (nav, section, article, footer).
3. Sin `<style>`, sin lógica, sin scripts.

## Estilos

- Todo valor de color, espaciado, radio, sombra o fuente sale de
  `src/styles/tokens.css`.
- Media queries y estados (hover/active) al final del archivo CSS.
- Responsive: breakpoint móvil en 768px, en orden móvil-primero.

## Commits

- Mensajes en inglés, verbos imperativos, concisos: `add cards section`,
  `fix ultra wide screen`.
- Un commit por feature o fix; sin cambios no relacionados mezclados.

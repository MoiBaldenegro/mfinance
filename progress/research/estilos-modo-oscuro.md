# Análisis — Sesión de estilos con modo oscuro prioritario

> Fecha: 2026-08-22 · Autor: spec_author · Petición humana literal:
> «Todo excelente mientras se discute la opción bloqueada sobre la librería
> de los PDF, haz una sesión de estilos, para hacer mucho más atractiva la
> aplicación priorizando modo oscuro».

## 1. Problema

Mientras la feature 12 `diagnostico-pdf` permanece `blocked` a la espera de
la aprobación humana de una dependencia PDF (NO se toca ni se referencia
como dependencia), el humano pide una **sesión de estilos** con dos objetivos
entrelazados:

1. Un sistema visual **mucho más atractivo** para toda la app.
2. **Modo oscuro priorizado**: el oscuro como tema por defecto/referencia.

### Estado real del frontend (inspeccionado en disco)

- `src/styles/tokens.css` (91 líneas): paleta única y clara definida solo en
  `:root`. Nombres estables (`--color-*`, `--space-*`, `--radio-*`,
  `--sombra-*`, `--fuente-*`, `--chart-color-*`). Sin bloques por tema.
- ~75 hojas CSS bajo `src/styles/` consumen exclusivamente `var()`; el
  script `scripts/audit-design-tokens.mjs` falla ante cualquier `#hex` o
  `rgb(`/`rgba(` fuera de `tokens.css` (solo exime ese archivo).
- `tests/frontend-hexagono/ui.test.mjs` custodia: nombres mínimos de token,
  que cada `.tsx` importe su hoja de `src/styles/` y que no haya CSS
  embebido (`style={{` / `<style`).
- Secciones activas: Registro, PyG, Balance, Deuda, Inversiones,
  Indicadores, Conciliación, Cierre, Diagnóstico (placeholder bloqueado) y
  Ajustes (hoy un placeholder de solo lectura — sitio natural para el
  conmutador de tema).
- Settings hoy = `StrategySettings` persistido DENTRO del snapshot vía IPC
  (`src/domain/entities/strategy-settings.ts`, espejo de `snapshot.rs`
  Rust). Añadir ahí un campo de tema exigiría cambiar el esquema Rust +
  serde + contract IPC: riesgo innecesario para una preferencia de
  presentación y contradice «sin romper el snapshot existente».
- Gráficas Chart.js: `src/lib/chart-colores.ts` lee tokens resueltos con
  `getComputedStyle` (correcto para temas), PERO
  `src/components/inversiones-section/GraficaProyeccion.tsx` pasa literales
  `'var(--chart-color-N)'` como colores de dataset — el canvas de Chart.js
  NO resuelve `var()`: hallazgo a corregir dentro del ciclo de tema.

## 2. Opciones de descomposición consideradas

| Opción | Descripción | Veredicto |
|--------|-------------|-----------|
| A. Una feature monolítica | Tokens duales + conmutación + persistencia + refino completo de 10 secciones | Descartada: mezcla mecanismo y cosmética; no es cerrable en una sesión ni testeable por partes (viola el espíritu de `one_feature_at_a_time`) |
| B. Tres features | 17 tokens duales / 18 conmutación+persistence / 19 refino visual | Descartada: la primera queda sin demostración end-to-end («existe el tema pero no se puede cambiar») y la frontera 17/18 es artificial |
| C. Dos features (ELEGIDA) | 17 mecanismo completo de tema oscuro por defecto (tokens duales + data-theme + toggle en Ajustes + persistencia + gráficas adaptativas); 18 pasada de refinamiento visual sobre todas las secciones usando ese sistema | Elegida: cada una es independiente, cerrable y con tests propios; 18 depende de 17 |

## 3. Decisión justificada

**Opción C — dos features (ids 17 y 18).**

- **F17 `tema-oscuro-tokens`**: reestructura `tokens.css` en DOS paletas con
  los MISMOS nombres de token (oscura como valores por defecto en `:root`;
  clara bajo `:root[data-theme='claro']`), aplica `data-theme` en `<html>`
  antes del primer render (sin destello claro), conmutador en la sección
  Ajustes, y persistencia vía puerto propio + adapter `localStorage`.
- **F18 `refino-visual-secciones`** (depends_on [17]): elevación, ritmo de
  espaciado, jerarquía tipográfica, estados hover/focus-visible/active,
  patrón común de estados vacíos y redibujo coherente de gráficas, todo
  consumiendo los tokens del sistema dual. Cero cambios funcionales.

Decisiones clave:

1. **Dark-first sin romper nada**: conservar todos los nombres de token
   existentes evita editar las ~75 hojas; el modo oscuro se logra cambiando
   VALORES, no nombres. Los tests `frontend-hexagono` siguen verdes.
2. **Persistencia fuera del snapshot**: la preferencia de tema NO entra en
   `StrategySettings`/snapshot Rust. Se define puerto `TemaPort` en
   `src/domain/ports/` e adapter bajo `src/adapters/` sobre
   `window.localStorage` (funciona y persiste en el WebView de Tauri 2 /
   WebView2). Componentes jamás tocan `localStorage` directamente
   (hexagonal). La lógica de resolución vive en un caso de uso puro
   (`resolver-tema`) testeable con node:test igual que los use-cases
   existentes (Node 22 ya importa `.ts` en la suite).
3. **Sin dependencias nuevas**: solo CSS custom properties y código propio;
   nada que pasar por `docs/dependencies.md`.

## 4. Riesgos y trabas

| Riesgo | Mitigación |
|--------|------------|
| **Regla de 100 líneas**: `tokens.css` ya tiene 91 y duplicar paleta lo desborda | Formato compacto (declaraciones múltiples por línea, comentarios mínimos): ambas paletas caben ≤100 líneas. Prohibido mover tokens a otra hoja: `audit-design-tokens.mjs` SOLO exime `tokens.css`, y docs exigen que todos los tokens vivan ahí. Acceptance lo verifica con `wc -l` |
| **Auditoría de tokens**: cualquier color nuevo fuera de `tokens.css` rompe `audit-design-tokens.mjs` | Toda paleta nueva va SOLO en `tokens.css`; hojas nuevas/editadas usan solo `var()`. Acceptance exige el audit en OK |
| **Chart.js y colores de gráficas**: el canvas no resuelve `var()` y los charts montados no se repintan solos al cambiar el tema | F17 corrige `GraficaProyeccion.tsx` (colores resueltos vía `src/lib/chart-colores.ts`) y exige redibujo al cambiar de tema (re-render/redibujar leyendo tokens resueltos). Tokens de ejes/rejilla (`--chart-grid`, `--chart-ticks`) por tema |
| **Destello de tema claro al arrancar** | Aplicar `data-theme` desde el punto de entrada (`main.tsx`) ANTES de `render()`, leyendo la preferencia almacenada (por defecto `oscuro`) |
| **Preferencia corrupta en storage** | El caso de uso puro devuelve `oscuro` ante `null` o valor inválido (test unitario) |
| **Subjetividad del "más atractivo"** | Operacionalizado en criterios objetivos verificables: consistencia de tokens, estados interactivos presentes, patrón de estados vacíos, ≤100 líneas, suite verde |

## 5. Qué puede verificar la suite node:test

Los `.css` no se testean directamente, pero sí:

1. **Lógica pura**: caso de uso `resolver-tema(preferencia)` →
   `'oscuro'` por defecto, respeta `'claro'`/`'oscuro'`, tolera basura
   (patrón idéntico a los use-cases ya testeados en `tests/frontend-shell/`).
2. **Estructura de `tokens.css`**: test tipo `frontend-hexagono` que lee el
   archivo y comprueba (a) ambos bloques de tema presentes, (b) mismo
   conjunto de nombres de token en ambos, (c) `wc -l` lógico ≤100.
3. **Audit de tokens**: `node scripts/audit-design-tokens.mjs` en OK
   (ejecutable desde test con `child_process` o como acceptance de comando).
4. **Hexágono intacto**: `tests/frontend-hexagono/` sigue verde (nombres de
   token, hojas por componente, sin CSS embebido) y grep objetivo de que
   ningún componente usa `window.localStorage` ni pasa literales
   `'var(--chart-'` a Chart.js.

## 6. Features dadas de alta (resumen)

| id | name | título | depende de |
|----|------|--------|------------|
| 17 | `tema-oscuro-tokens` | Sistema de tokens dual con modo oscuro por defecto, conmutación y persistencia | — |
| 18 | `refino-visual-secciones` | Pasada de refinamiento visual de las secciones sobre el sistema de tema | [17] |

Specs: `specs/17_tema-oscuro-tokens/requirements.md` (+`design.md`),
`specs/18_refino-visual-secciones/requirements.md` (+`design.md`).
Ambas quedan `pending`; ninguna toca la feature 12.

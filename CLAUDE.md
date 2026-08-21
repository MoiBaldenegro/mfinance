# AGENTS.md — Mapa de navegación para agentes de IA

> Este archivo es el **punto de entrada** para cualquier agente que trabaje en este
> repositorio. NO es una biblia de reglas: es un **mapa**. Lee solo lo que
> necesites cuando lo necesites (divulgación progresiva).

---

## 1. Antes de empezar (obligatorio)

1. Ejecuta `./init.sh` y verifica que termina sin errores (entorno perfecto). Si
   falla, **para** y resuelve lo que reporta antes de tocar código.
2. Lee `progress/current.md` para entender en qué estado quedó la última sesión.
3. Lee `feature_list.json` y elige **una** tarea con estado `pending`. No
   trabajes en más de una a la vez.

### Si falta `feature_list.json`

El backlog es el punto de entrada del arnés: `init.sh` lo comprueba con
`test -f feature_list.json` y **detecta** la ausencia; `./init.sh` señala el
fallo y no se debe continuar. Ante la falta, la **única recuperación** es
**crear un nuevo** `feature_list.json` **desde cero** con el **esqueleto**
mínimo del backlog según el formato del validador (`project`, `description`,
`rules`, `features`). El array `features` se rellena **solo con las features
nuevas** del ciclo (pendientes o en trabajo): la regeneración es **limpia** y
**no re-crea el histórico** de features ya cerradas. El historial de features
done vive únicamente en `progress/history.md` y en los artefactos permanentes
(`specs/<NN>_*`, `progress/impl_*.md`, `progress/review_*.md`,
`progress/research/`). La numeración de ids **arranca en 1** para las
features nuevas del ciclo regenerado, y la selección del arnés usa la
feature `pending` de **menor id** del backlog actual. Las features nuevas
se dan de alta vía `spec_author`. El archivo nunca se recupera desde git: se
crea uno nuevo en cualquier caso. El array de `features` solo puede quedar
vacío (`features: []`) por esa regeneración limpia tras la **ausencia** del
archivo o por la **limpieza manual explícita** del humano («limpia el
historial»), que vacía las features done tras dejar el historial en
`progress/history.md`; en el estado normal el backlog **conserva** las
features `done` en el array.

Procedimiento completo en `docs/verification.md`.

## 2. Mapa del repositorio

| Archivo / carpeta            | Qué contiene                                              | Cuándo leerlo |
|------------------------------|-----------------------------------------------------------|---------------|
| `KICKOFF.md`                 | Prompt inicial para arrancar la secuencia de trabajo con el líder | Cuando inicies una sesión de trabajo |
| `feature_list.json`          | Lista de tareas con estado (pending / in_progress / done / blocked) y criterios de aceptación | Siempre, al empezar |
| `progress/current.md`        | Estado de la sesión actual                                | Siempre, al empezar |
| `progress/history.md`        | Bitácora append-only de sesiones anteriores               | Si necesitas contexto histórico |
| `docs/architecture.md`       | Qué significa "hacer un buen trabajo" en este proyecto    | Antes de implementar |
| `docs/conventions.md`        | Reglas de estilo, nombres, estructura                     | Antes de escribir código |
| `docs/verification.md`       | Cómo verificar que tu trabajo funciona                    | Antes de declarar una tarea como `done` |
| `docs/dependencies.md`       | Registro de dependencias aprobadas por el humano (aprobación decisión exclusiva del humano) | Antes de necesitar una dependencia |
| `CHECKPOINTS.md`             | Criterios objetivos de "estado final correcto"            | Para auto-evaluarte |
| `.opencode/agents/` y `.claude/agents/` | Definiciones de subagentes (spec_author, leader, implementer, reviewer, explorer) en formato opencode y Claude Code | Si orquestas trabajo |
| `scripts/check-format.mjs`   | Valida el formato de `feature_list.json` y `progress/`    | Invocado por `init.sh` |
| `specs/`                     | Spec de requisitos por feature: `specs/<NN>_<name>/requirements.md` (EARS estricto) y `design.md` (solo si toca UI) | Antes de implementar y al revisar |
| `src/`                       | Código de la aplicación (Astro)                           | Para implementar |
| `tests/`                     | Tests automáticos (node:test, sin dependencias)           | Para verificar |

## 3. Reglas duras (no negociables)

- **Una sola feature a la vez.** No mezcles cambios de varias tareas en la misma sesión.
- **Tests antes que el código (test-first/TDD).** Ningún código se escribe
  antes que su test: el cambio empieza escribiendo el test contra la spec
  (`design.md` si existe), observándolo en rojo antes de implementar el
  código, y deja la suite en verde al terminar.
- **No declares una tarea `done` sin pruebas verdes.** Ejecuta `./init.sh` y
  asegúrate de que el bloque de tests pasa al 100%.
- **Documenta lo que haces** en `progress/current.md` mientras trabajas, no al final.
- **Deja el repositorio limpio** antes de cerrar la sesión (ver §5).
- **Si no sabes algo, busca en `docs/`** antes de inventarlo.

## 4. Cómo elegir una tarea

```
1. Abre feature_list.json
2. Filtra por status == "pending"
3. Coge la de menor "id" cuyas dependencias ("depends_on") estén todas en "done"
4. Si la de menor id tiene dependencias pendientes ("pending", "in_progress" o "blocked"), sáltala y sigue con la siguiente de menor id
5. Si ninguna feature pending tiene sus dependencias todas en "done", reporta que no hay feature implementable
6. Cambia su status a "in_progress" y guarda
7. Anota en progress/current.md: feature, hora de inicio, plan breve
```

## 5. Cierre de sesión (lifecycle)

Antes de terminar:

1. Ejecuta `./init.sh` — todo verde.
2. Si la tarea está acabada: marca `status: "done"` en `feature_list.json` y
   **conserva** la feature en el array de `features`: la feature cerrada nunca
   se elimina del array. Ningún agente vacía el array por su cuenta.
3. Mueve el resumen de `progress/current.md` al final de `progress/history.md`.
4. Vacía `progress/current.md` dejando solo la plantilla.
5. No dejes archivos temporales, ni `print()` de debug, ni TODOs sin contexto.
6. Los artefactos de sesión (`progress/impl_<feature>.md`,
   `progress/review_<feature>.md`, `progress/research/`) son **permanentes**:
   se quedan en el repo como bitácora. No se borran al cerrar.

El array de `features` solo puede quedar vacío en dos casos: (a) la
**regeneración limpia** tras la ausencia de `feature_list.json` (ver §1), o
(b) la **limpieza manual explícita** del humano («limpia el historial»), que
vacía las features `done` tras dejar el historial en `progress/history.md`.
La limpieza de features done es **decisión exclusiva del humano**: ningún
agente la dispara por su cuenta.

## 6. Si te bloqueas

- Relee la sección relevante de `docs/`.
- Si la herramienta no hace lo que esperas, **no inventes un workaround**:
  documenta el bloqueo en `progress/current.md` y para la sesión.

## 7. Convenciones del proyecto (resumen de docs/architecture.md)

- **Estilos separados de la UI.** Nunca `<style>` dentro de un `.astro`; el CSS
  va en `src/styles/*.css` y el componente lo importa.
- **Lógica separada de la UI.** El frontmatter de un `.astro` solo hace imports y
  paso de datos. La lógica va en módulos `.ts` (`src/domain/`, utilidades).
- **Tokens, no valores sueltos.** Colores, espaciados, radios y sombras solo desde
  las custom properties de `src/styles/tokens.css`. Prohibido hardcodear.
- **Datos vía repositorio.** Los componentes jamás leen JSON directamente: siempre
  `src/domain/repositories` (que entregan entidades desde `src/data/*.json`).
- **Máx. 100 líneas por archivo.** Si es extremadamente necesario superarlas, se
  discute primero (estado `blocked`).
- **Sin dependencias externas.** Si una feature requiere una dependencia, primero
  se discute (estado `blocked`): ningún agente aprueba dependencias; la aprobación
  es decisión exclusiva del humano tras discusión y se materializa en
  `docs/dependencies.md` (validado por `scripts/validate-dependencies.mjs` vía
  `scripts/check-format.mjs`).
- **Estático por defecto.** Cero JavaScript de runtime salvo justificación.
- **Un solo layout.** El chrome compartido vive solo en `src/layouts/Layout.astro`.
- **Rutas explícitas.** Una página por archivo en `src/pages/`, una URL por página.
- **Scripts del arnés en `scripts/`.** Se crean dentro de una feature con ruta `scripts/<slug>.mjs`, prefijo de verbo y Node stdlib; nunca se importan desde `src/`. Reglas en `docs/architecture.md` y `docs/conventions.md`.

## 8. Development (Astro)

Cuando arranques el dev server, usa el modo background:

```
astro dev --background
```

Gestiona el servidor con `astro dev stop`, `astro dev status` y `astro dev logs`.

Comandos del proyecto (`pnpm`):

| Comando | Acción |
|---------|--------|
| `./init.sh` | Verifica entorno, formato y tests. Ejecutar SIEMPRE |
| `pnpm dev` | Dev server en `localhost:4321` (usar `--background`) |
| `pnpm build` | Build de producción en `./dist/` |
| `pnpm preview` | Preview del build |
| `pnpm test` | Tests automáticos (node:test) |

Documentación del framework: https://docs.astro.build

Consulta estas guías antes de tareas relacionadas:

- [Añadir páginas, rutas dinámicas o middleware](https://docs.astro.build/en/guides/routing/)
- [Componentes Astro](https://docs.astro.build/en/basics/astro-components/)
- [Componentes de frameworks (React, Vue, Svelte…)](https://docs.astro.build/en/guides/framework-components/)
- [Añadir o gestionar contenido](https://docs.astro.build/en/guides/content-collections/)
- [Añadir estilos o usar Tailwind](https://docs.astro.build/en/guides/styling/)
- [Soporte multi-idioma](https://docs.astro.build/en/guides/internationalization/)
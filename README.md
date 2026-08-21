# Harness Kit

Kit reutilizable del arnés de trabajo (harness engineering) para arrancar
proyectos nuevos: proceso, documentación, definiciones de agentes, scripts de
validación, `init.sh`, plantillas de specs y de backlog, y un test de
integridad propio.

Este README es la **guía de migración**: qué archivos llevarse al proyecto
destino, en qué orden copiarlos y qué personalizar una vez allí.

---

## 1. Propósito del kit

El kit concentra la esencia neutral del arnés para que cualquier proyecto nuevo
arranque con el mismo proceso de trabajo: una sola feature a la vez, tests antes
que el código (TDD rojo/verde), prueba de humo vía `./init.sh` y formatos
validados por scripts de Node (backlog, progreso, specs EARS y registro de
dependencias aprobadas). Es **aditivo**: se copia al destino, nunca lo modifica
el repositorio de origen.

El kit es un **esqueleto**: no contiene código de ninguna aplicación concreta
(no hay `src/`, `public/` ni `dist/`). Eso se crea en el proyecto destino. El
kit sí se **autoverifica**: incluye su propio test de integridad
(`tests/harness-kit-integrity.test.mjs`) que comprueba que la estructura del
arnés está completa y sin fugas de código de app.

## 2. Qué se copia SIEMPRE al destino (capas)

Capa **0 — proceso y documentación** (se copian tal cual):

```
AGENTS.md            Punto de entrada y reglas de proceso para los agentes
CLAUDE.md            Espejo de AGENTS.md para Claude Code (mismo contenido)
KICKOFF.md           Prompt inicial para arrancar la secuencia de trabajo con el líder
CHECKPOINTS.md       Criterios objetivos de "estado final correcto"
docs/architecture.md Qué significa "hacer un buen trabajo" en cada proyecto
docs/conventions.md  Reglas de estilo, nombres y estructura
docs/verification.md Cómo verificar que el trabajo funciona
docs/dependencies.md Registro de dependencias aprobadas por el humano (validado contra package.json)
```

Capa **1 — definiciones de agentes** (5 roles, en los dos formatos):

```
.opencode/agents/{spec_author,leader,implementer,reviewer,explorer}.md
.claude/agents/{spec_author,leader,implementer,reviewer,explorer}.md
```

> Los archivos que opencode genera solo en `.opencode/` (`package.json`,
> `package-lock.json`, `node_modules/`) no forman parte del kit: están
> gitignored y se regeneran en el destino (ver §6).

Capa **2 — scripts y `init.sh`**:

```
init.sh                  Verifica entorno, formato, tests y build (orquesta todo)
scripts/check-format.mjs          Orquesta las 4 validaciones de formato del arnés
scripts/validate-feature-list.mjs Valida el backlog (incluye detección de ciclos de depends_on)
scripts/validate-progress.mjs     Valida progress/
scripts/validate-specs.mjs        Valida las specs de feature_list.json (EARS estricto)
scripts/validate-dependencies.mjs Valida docs/dependencies.md contra package.json
scripts/audit-design-tokens.mjs   Guardián de tokens: rechaza colores fuera de tokens.css en src/styles
```

Capa **3 — plantillas de specs**:

```
specs/_template/requirements.md  Plantilla EARS estricto por feature
specs/_template/design.md        Plantilla de diseño (solo si la feature toca UI)
```

Capa **4 — tests del arnés** (el kit no trae tests de app, pero sí su candado):

```
tests/harness-kit-integrity.test.mjs  Test de integridad del kit (node:test, sin dependencias):
                                      verifica archivos obligatorios, ausencia de fugas de
                                      tokens de app y la integridad de templates/feature_list.json
```

Capa **5 — plantillas de backlog y progreso**:

```
templates/feature_list.json  Backlog con 1 feature de ejemplo (feature-ejemplo, status pending)
templates/current.md         Plantilla de progress/current.md
templates/history.md         Plantilla de progress/history.md (append-only)
```

## 3. Orden de copia

Copia las capas **en orden**, de la 0 a la 5:

1. **Proceso** → `AGENTS.md`, `CLAUDE.md`, `KICKOFF.md`, `CHECKPOINTS.md` y `docs/`.
2. **Agentes** → `.opencode/agents/` y `.claude/agents/`.
3. **Scripts e `init.sh`** → `scripts/*.mjs` y `init.sh` en la raíz.
4. **Plantillas de specs** → `specs/_template/`.
5. **Tests del arnés** → `tests/`.
6. **Plantillas de backlog** → `templates/` como punto de partida del destino.

> Copiar en este orden evita que falte algo que una capa posterior asume
> (p. ej. `init.sh` espera `scripts/check-format.mjs` y `AGENTS.md`, y
> `pnpm test` espera `tests/`).

## 4. Personalizaciones obligatorias en el destino

Después de copiar, adapta obligatoriamente:

- **Nombre de proyecto.** En `templates/feature_list.json`, sustituye `project:
  "<proyecto>"` y `description` por el nombre real del proyecto.
- **Stack y gestor de paquetes en `package.json`.** Crea el `package.json` del
  destino con el stack elegido (p. ej. Astro, Next, Vite…). El `init.sh` detecta
  el gestor por lockfile (`pnpm-lock.yaml` → `pnpm`, `package-lock.json` → `npm`,
  `yarn.lock` → `yarn`); si usas otro, ajusta la línea de detección o fija `PM`
  directamente.
- **Registro de dependencias en `docs/dependencies.md`.** Adapta el registro al
  `package.json` del destino: toda dependencia (`dependencies` +
  `devDependencies`) necesita su entrada aprobada (`version`, `scope`,
  `approved`, `motivo`). El validador `scripts/validate-dependencies.mjs`
  (integrado en `check-format.mjs`) falla si falta una entrada o no coincide.
  La aprobación de dependencias es decisión exclusiva del humano.
- **Adaptar `docs/architecture.md` al stack.** La tabla de carpetas del kit es
  una recomendación neutral para stack Astro/Node. Sustituye las carpetas de la
  app por las del stack real del destino (p. ej. componentes, estilos, dominio y
  repositorios de datos según corresponda), y documenta las excepciones reales.

## 5. Prueba de humo

En el **destino**, tras copiar y personalizar, ejecuta la prueba de humo:

```
node scripts/check-format.mjs   # formato del backlog, progress/, specs/ y dependencias correctos
pnpm test                       # tests del destino al 100% (incluye el test de integridad del kit)
./init.sh                       # verifica entorno, formato, tests y build
```

> **En Windows**, `init.sh` es un script bash: ejecútalo con **Git Bash**, no
> con cmd ni PowerShell. Si `./init.sh` falla tras estas comprobaciones, resuelve
> lo que reporta antes de tocar código.

`./init.sh` debe terminar con `✔ El entorno está perfecto.` y salida 0. Si una
comprobación falla, **no** continúes hasta resolverla.

## 6. Qué NO se copia

Estos artefactos de la app o de este repositorio **no se copian** al destino:

- `src/` — código de la aplicación origen (propio de cada proyecto).
- `public/` — activos públicos/estáticos de la app origen.
- `dist/` — build de producción (se genera en el destino, no se versiona en el kit).
- Los **tests de la app** — no existen en el kit: el esqueleto no trae código de
  app. El test del propio kit (`tests/harness-kit-integrity.test.mjs`) **sí se
  copia**: es el candado de la estructura del arnés.
- Los **artefactos autogenerados por opencode** — `.opencode/package.json`,
  `package-lock.json` y `node_modules/`: los crea la herramienta sola al usar
  el kit y están gitignored.
- El **backlog completo** de este repositorio (`features` reales como SEO,
  harness-comms, TDD, etc.). El destino parte de `templates/feature_list.json`,
  que contiene **una sola feature de ejemplo** (`feature-ejemplo`, status
  `pending`) pensada como placeholder: `spec_author` la sustituye por las
  features reales del backlog del destino (ver §7).

## 7. Crear el backlog del destino (spec_author)

El backlog real del destino no se copia: **se crea** con el agente `spec_author`
(ver `.opencode/agents/spec_author.md`). Dile al agente el objetivo del proyecto
y él explica cada problema y da de alta las features en `feature_list.json`,
adaptadas al arnés y a los formatos validados. La feature de ejemplo de la
plantilla se sustituye por las features reales del backlog.

> El backlog del destino no hereda las features concretas del repositorio
> origen: son específicas de ese proyecto y no tienen sentido en uno nuevo.
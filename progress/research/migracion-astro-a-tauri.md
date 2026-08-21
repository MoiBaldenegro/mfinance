# Análisis — Migración del arnés de Astro a Tauri 2

> Sesión: spec_author · Fecha: 2026-08-21 · Petición del líder sobre contexto
> verificado en disco. Este informe precede al alta de features en
> `feature_list.json` (regla anti-silencio).

## 1. Problema reafirmado

El arnés de agentes (documentación, validadores, `init.sh`, specs, progreso)
fue diseñado para un proyecto **Astro** estático y fue traído tal cual a un
proyecto **Tauri 2** real. Hoy la documentación del arnés describe un stack que
ya no existe (`.astro`, `src/pages/`, `astro dev --background`,
`localhost:4321`, deps Cloudflare) y la herramienta ejecutable está rota o es
ciega al stack nuevo. El humano pide: **adaptar TODOS los archivos del arnés**
al proyecto Tauri, **documentando arquitectura HEXAGONAL** en backend y
frontend, **sin implementar funcionalidad de producto** todavía.

Alcance: solo documentación del arnés + tooling del arnés. Fuera de alcance:
cualquier código de producto en `src/` o `src-tauri/src/`.

## 2. Estado verificado en disco

- Frontend: React 19 + TypeScript + Vite (`src/App.tsx`, `src/main.tsx`,
  `vite.config.ts`, puerto 1420).
- Backend: Rust en `src-tauri/` — scaffold oficial Tauri con comando `greet`
  de ejemplo; crates: `tauri 2`, `tauri-plugin-opener 2`, `serde 1 + derive`,
  `serde_json 1`; `[build-dependencies]`: `tauri-build 2`; lib
  `mfinance_lib` con `crate-type = ["staticlib", "cdylib", "rlib"]`.
- Bootstrap del líder hecho: `pnpm install` OK, `progress/current.md` y
  `progress/history.md` desde templates/, `feature_list.json` regenerado
  limpio (`"features": []`, ids arrancan en 1).

## 3. Inventario de referencias Astro a eliminar/adaptar (53)

`grep -ri astro` sobre *.md/*.mjs/*.json:

| Archivo | Qué contiene |
|---------|--------------|
| `AGENTS.md` y `CLAUDE.md` (idénticos entre sí) | Mapa §2 (`.astro`, `src/pages/`), convenciones §7 (estilos/lógica/rutas Astro), Development §8 con `astro dev --background`, `pnpm dev` en :4321 |
| `docs/architecture.md` | Tabla de carpetas `.astro` (`src/components/`, `src/layouts/`, `src/pages/`, `src/assets/` con `astro:assets`), flujo de datos con `Layout.astro` → HTML estático, principios 7-11 ligados a Astro, `dist/` como artefacto de `astro build` |
| `docs/conventions.md` | Naming de componentes `.astro` |
| `docs/verification.md` | `astro dev logs`, `localhost:4321` |
| `docs/dependencies.md` | Registro VIEJO: `astro ^7.2.0`, `@astrojs/cloudflare ^14.2.1`, `wrangler ^4.121.0`, `@cloudflare/workers-types ^5.20260812.1` — **ninguna existe hoy en package.json** |
| `CHECKPOINTS.md` | Criterios de estado final basados en `.astro` |
| `README.md` | 2 menciones neutras a Astro |
| `.opencode/agents/spec_author.md` y `.claude/agents/spec_author.md` | 1 línea cada uno mencionando componentes `.astro` |

## 4. Roturas funcionales detectadas

1. **(a)** `package.json` NO tiene script `test` → `pnpm test` falla dentro de
   `./init.sh`. El arnés exige suite node:test en verde para cerrar features.
2. **(b)** `scripts/validate-dependencies.mjs` solo valida `package.json`
   (dependencies + devDependencies) → el registro debe cubrir también los
   crates de `src-tauri/Cargo.toml` ([dependencies] +
   [build-dependencies] + [dev-dependencies]); si no, cualquier crate nuevo
   entraría sin control del humano.
3. **(c)** `./init.sh` no comprueba la toolchain Rust (`rustc`/`cargo`),
   necesaria para compilar Tauri; un entorno sin Rust pasaría init.sh y
   fallaría después de forma confusa.

## 5. Decisiones de descomposición

Complejidad **media-alta**: toca muchos archivos pero en dos frentes nítidos
que se pueden verificar por separado. Se crean **exactamente 2 features**
(según instrucción del líder):

- **Feature 1 — `harness-tauri-hexagonal-docs` (id 1, pending).** Frente
  documental: reescritura de AGENTS.md/CLAUDE.md/README/CHECKPOINTS/docs/* y
  definiciones de agentes; definición de la arquitectura hexagonal de ambos
  lados. Es la base: la feature 2 edita `docs/dependencies.md` y validadores
  cuyo contrato describe la feature 1, y los criterios de verificación que
  usará la feature 2 se escriben aquí. Testeable sola: grep en 0 +
  contenido mínimo exigido de architecture.md.
- **Feature 2 — `harness-tooling-tauri` (id 2, pending, depends_on: [1]).**
  Frente ejecutable: script `test` en package.json, checks rustc/cargo en
  init.sh, validador extendido a Cargo.toml, registro real de dependencias
  (npm + crates) con nota de procedencia (scaffold oficial Tauri traído por
  el humano, sujeto a su veto). Criterio final: `./init.sh` verde completo.

Orden de implementación: id más bajo primero (regla `one_feature_at_a_time`);
`depends_on: [1]` lo garantiza además formalmente.

### Contenido mínimo que la feature 1 fija para docs/architecture.md (hexagonal)

Backend Rust (`src-tauri/src/`):
- `domain/`: entidades y reglas de negocio puras; **sin dependencias de
  framework ni de tauri**.
- `application/`: casos de uso; orquestan dominio vía puertos.
- `infrastructure/`: adapters que implementan puertos (persistencia, IO).
- `commands/`: capa de entrada Tauri (`#[tauri::command]`); delgada: recibe,
  delega en casos de uso, devuelve.
- `lib.rs`: composition root — construye adapters concretos e **inyecta** las
  dependencias hacia dentro.

Frontend TS (`src/`):
- `src/domain/entities/`, `src/domain/ports/` (interfaces que el núcleo
  define), `src/domain/use-cases/`.
- `src/adapters/`: implementaciones de puertos, incluido el **adapter Tauri
  IPC** que usa `invoke` de `@tauri-apps/api`.
- `src/components/`: solo UI (React `.tsx`).
- Estilos desde `src/styles/tokens.css` (tokens, no valores sueltos).

Regla transversal: **la UI nunca llama `invoke()` directamente**; siempre vía
puertos/casos de uso. Las dependencias apuntan hacia el dominio.

## 6. Riesgos y trabas

- `CLAUDE.md` y `AGENTS.md` son idénticos: editarlos en espejo o divergen.
- El validador de specs (`scripts/validate-specs.mjs`) exige EARS estricto;
  las specs de este ciclo ya están escritas conforme (una línea = un SHALL,
  sin comas en el sujeto, sin verbos vagos).
- `docs/dependencies.md` viejo hace que `check-format.mjs` falle HOY contra
  package.json real (deps registradas inexistentes): la feature 2 lo resuelve;
  hasta entonces `./init.sh` seguirá roto en ese punto — esperado.
- Sin dependencias externas nuevas en ninguna de las dos features (todo es
  Node stdlib + edición de docs); no hay motivo de `blocked`.
- Máx. 100 líneas por archivo: los docs reescritos deben respetarlo o
  discutir excepción.

## 7. Criterios de veredicto (resumen)

- Feature 1: `grep -ri astro` = 0 en los archivos listados; architecture.md
  contiene el contenido hexagonal mínimo de §5; AGENTS≡CLAUDE con comandos
  reales; conventions/verification/CHECKPOINTS adaptados.
- Feature 2: `pnpm test` verde; init.sh chequea rustc/cargo; validador cubre
  Cargo.toml; registro de dependencias real y validado; `./init.sh` verde
  completo.

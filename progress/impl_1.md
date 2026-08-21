# Informe de implementación — Feature 1: harness-tauri-hexagonal-docs

Fecha: 2026-08-21 · Implementer · Spec: `specs/01_harness-tauri-hexagonal-docs/requirements.md`

## Archivos tocados (alcance exclusivo de la feature)

| Archivo | Cambio |
|---------|--------|
| `tests/harness-tauri-docs.test.mjs` | **NUEVO** (80 líneas): 9 tests que codifican REQ-01-01..12 |
| `docs/architecture.md` | Reescritura completa: hexagonal backend Rust (`src-tauri/src/domain|application|infrastructure|commands` + composition root en `lib.rs`) y frontend TS (`src/domain/entities|ports|use-cases`, `src/adapters`, `src/components`, `src/styles/tokens.css`), reglas hexagonales normativas, diagramas de flujo back/front; conserva principios vigentes (errores nombrados, inmutabilidad, tokens, ≤100 líneas, scripts aislados, dependencias con aprobación humana) |
| `docs/conventions.md` | Naming `.tsx` PascalCase / `.ts` (PascalCase clases, camelCase utils) / `.rs` (snake_case módulos-fns, PascalCase tipos-traits) / `.css` kebab-case; estructura hexagonal de carpetas front y back; orden dentro de un `.tsx`; commits |
| `docs/verification.md` | §2 sustituida por verificación Tauri real (`pnpm dev` :1420, `pnpm tauri dev`, `cargo check/test --manifest-path src-tauri/Cargo.toml`); §3 adaptada a `.tsx`; §1 (políticas de estado del backlog y recuperación) **íntegra** |
| `AGENTS.md` + `CLAUDE.md` | Reescritura sincronizada byte a byte (`cmp` OK): mapa §2 (src/ frontend React+TS, src-tauri/ backend Rust), §7 convenciones hexagonales resumidas, §8 comandos reales (`pnpm dev` :1420, `pnpm tauri dev/build`, `pnpm test`, `cargo check/test`) y enlaces tauri.app/react.dev/vite.dev/rust-lang.org |
| `CHECKPOINTS.md` | Criterios Tauri/hexagonales (dependencias hacia dominio, invoke solo en adapter IPC, cargo check/test cuando toca backend, app arranca) |
| `README.md` | 2 menciones neutrales adaptadas (~línea 111 stack elegido, ~línea 122 recomendación neutral) sin alterar lo que documenta el kit |
| `.opencode/agents/spec_author.md` + `.claude/agents/spec_author.md` | Línea 78: «componentes `.tsx`, estilos, layout/responsive, tipografía visible»; ambos sincronizados |
| `templates/feature_list.json` | Wording del ejemplo: «app de escritorio de muestra» (invariante intacto: exactamente 1 feature, test REQ-17-04 verde) |
| `tests/harness-kit-integrity.test.mjs` | Corrección mínima del escáner (ver Decisiones, D2) |

**No tocado** (prohibido / fuera de alcance): `package.json`, `init.sh`, `scripts/*`, `docs/dependencies.md`, `src/`, `src-tauri/`.

## Ciclo rojo/verde (TDD)

### ROJO (antes de implementar, tras escribir el test)

`node --test` con el test nuevo y los docs aún sin adaptar:

```
ok 1 - REQ-17-01/02 ...
not ok 2 - REQ-17-03/05: los tokens de la app no aparecen en los archivos del kit
not ok 4 - REQ-01-01/12: sin referencias al stack anterior en los docs del arnés
not ok 5 - REQ-01-02: architecture.md describe el backend hexagonal Rust
  error: 'docs/architecture.md: falta "src-tauri/src/domain/"'
not ok 6 - REQ-01-03/04: ... adapter Tauri IPC
not ok 7 - REQ-01-05/06/07: reglas hexagonales explícitas
ok 8 - REQ-01-08: AGENTS.md y CLAUDE.md sincronizados   ← trivialmente verde (eran copias idénticas)
not ok 9 - REQ-01-08: AGENTS.md documenta los comandos reales
not ok 10 - REQ-01-09: conventions.md naming
not ok 11 - REQ-01-10: verification.md
not ok 12 - REQ-01-11: CHECKPOINTS.md
# tests 12 / # pass 3 / # fail 9
```

Nota de línea base: el fallo del test 2 era **preexistente** a esta feature (el
escáner del kit entraba en `.opencode/node_modules/effect` y detectaba un token
de app en una dependencia de terceros).

### VERDE (tras implementar)

```
ok 1..12 (todos) — # tests 12 / # pass 12 / # fail 0
```

Incluye `harness-kit-integrity` 3/3 y `harness-tauri-docs` 9/9.

## Verificación

- **Suite**: `node --test` → 12/12 pass, 0 fail. El alias `pnpm test` no existe
  todavía: su alta en `package.json` es acceptance explícita de la feature 2.
- **check-format**: `node scripts/check-format.mjs` falla SOLO en
  `docs/dependencies.md` (10 entradas del registro antiguo no coinciden con el
  package.json del scaffold Tauri). Ese archivo está PROHIBIDO en esta feature y
  su reescritura es acceptance explícita de la feature 2. Los validadores del
  alcance de la feature 1 pasan individualmente: `validate-feature-list` OK,
  `validate-progress` OK, `validate-specs` OK.
- **grep anti-token legado**: `grep -rin <token> AGENTS.md CLAUDE.md README.md
  CHECKPOINTS.md KICKOFF.md docs/architecture.md docs/conventions.md
  docs/verification.md templates/* .opencode/agents/spec_author.md
  .claude/agents/spec_author.md` → **0 coincidencias** (exit 1). La única
  ocurrencia en todo el repo del alcance es la constante `TOKEN_LEGADO` dentro
  del propio test (auto-referencia inevitable, excluida del escaneo).
- **Sincronización**: `cmp AGENTS.md CLAUDE.md` → idénticos byte a byte.
- **`./init.sh` completo**: 2 fallos, ambos preexistentes y de la feature 2
  («formato» por dependencies.md y «tests» por ausencia del script `pnpm test`);
  build de producción ✔. Estado intermedio esperado de la migración.

## Decisiones tomadas

- **D1 — Exclusión documentada de `docs/dependencies.md`** en el escaneo
  anti-token del test: contiene referencias al stack anterior pero su
  reescritura es acceptance de la feature 2 (`harness-tooling-tauri`) y su
  edición está prohibida aquí. La exclusión consta en comentario en el propio
  test para que el reviewer la vea.
- **D2 — Corrección mínima de `tests/harness-kit-integrity.test.mjs`**: el
  escáner de tokens saltaba por artefactos generados ajenos al kit
  (`.opencode/node_modules` primero; tras eso, binarios de `src-tauri/target/`
  con bytes aleatorios). Se añade el salto de directorios `node_modules`,
  `target` y `dist`, fiel al README §6 («no forman parte del kit», «build
  generado, no versionado»). Sin esto, ninguna sesión podría dejar la suite en
  verde. El test estaba en rojo ANTES de esta feature (evidencia arriba).
- **D3 — Rutas completas en architecture.md**: la tabla backend usa rutas
  íntegras (`src-tauri/src/application/`, etc.) para trazabilidad directa con
  los REQ y el test.
- **D4 — Plantillas**: solo `templates/feature_list.json` necesitaba pulido de
  wording; `templates/current.md` y `templates/history.md` ya eran neutrales.
  Invariante REQ-17-04 (exactamente 1 feature) verificado en verde.

## Hallazgo para la feature 2 (fuera de mi alcance)

En este entorno (Windows + Git Bash, Node 22), `node --test tests/` falla por
resolución de módulos («Cannot find module ...\tests»), con o sin barra final;
el descubrimiento automático `node --test` funciona y es lo usado aquí. La
acceptance de la feature 2 declara `"test": "node --test tests/"`: conviene
validar ese literal en el entorno objetivo o ajustarlo (p. ej. patrón glob).

# Review — Feature 2: harness-tooling-tauri

**Fecha:** 2026-08-21 · **Reviewer** · **Spec:** `specs/02_harness-tooling-tauri/requirements.md` (REQ-02-01..10, REQ-02-01/A1 enmendados a `node --test` bare por el líder — verificado también en review de feature 1, nota 1)
**Informe del implementer:** `progress/impl_2.md`

## Veredicto: APPROVED

---

## Checklist de validación (evidencia objetiva)

### 1. Trazabilidad acceptance ↔ REQ ↔ implementación — OK

| Acceptance (feature_list.json) | REQ | Evidencia verificada en disco |
|---|---|---|
| A1: `"test": "node --test"` exacto + `pnpm test` verde | REQ-02-01, REQ-02-02 | `package.json` L10 `"test": "node --test"` (literal corregido del AMEND); reproducido: `pnpm test` → `# tests 21 # pass 21 # fail 0` |
| A2: init.sh comprueba rustc/cargo antes del build | REQ-02-03, REQ-02-04 | `init.sh` L36–47: checks tras pnpm y ANTES del bloque Build (L76); fallo nombrado «instala la toolchain Rust vía https://rustup.rs» |
| A3: validate-dependencies.mjs valida crates (3 secciones TOML) sin deps externas | REQ-02-05, REQ-02-10 | `scripts/validate-dependencies.mjs`: `parseCargoManifest()` (L38–53, solo `node:fs`+`node:url`), secciones {dependencies, build-dependencies, dev-dependencies} (L14); errores nombran dependencia/version/scope (`checkEntry` L55–67) |
| A4: registro real 10 npm + 5 crates, cadenas literales, nota scaffold/veto | REQ-02-06, REQ-02-07, REQ-02-08 | `docs/dependencies.md`: react/react-dom `^19.1.0`, @tauri-apps/api y plugin-opener `^2`, @types/react `^19.1.8`, @types/react-dom `^19.1.6`, @vitejs/plugin-react `^4.6.0`, typescript `~5.8.3`, vite `^7.0.4`, @tauri-apps/cli `^2`; crates tauri `2`, tauri-plugin-opener `2`, tauri-build `2` (**build-dependencies**, L115), serde `1`, serde_json `1` — idénticos a `src-tauri/Cargo.toml`; nota de procedencia (L13–17: scaffold oficial Tauri, humano, veto en cualquier momento) |
| A5: ./init.sh verde completo | REQ-02-09 | Ejecutado por el reviewer: todas las comprobaciones ✔, `EXIT=0` |

Los 10 REQ quedan cubiertos sin huecos ni huérfanos.

### 2. package.json sin cambios colaterales — OK

`git diff package.json` contra el único commit (scaffold): la única línea añadida en todo el archivo es `+    "test": "node --test",`. `dependencies` y `devDependencies` byte a byte intactos (react, react-dom, @tauri-apps/api, @tauri-apps/plugin-opener / @types/react, @types/react-dom, @vitejs/plugin-react, typescript, vite, @tauri-apps/cli).

### 3. init.sh quirúrgico — OK

`git diff init.sh`: el único cambio es el bloque de 12 líneas rustc/cargo insertado entre el check de pnpm y el de node_modules (por tanto antes de Formato/Tests/Build), con mensajes que remiten a https://rustup.rs. Resto intacto: checks node/pnpm/node_modules, archivos del harness, formato, tests, build, lógica FAILURES/exit.

### 4. Validador extendido correcto — OK

- Valida npm (`dependencies` + `devDependencies`, L81–85) Y crates vía `parseCargoManifest` (L87–89) cubriendo las tres secciones TOML y ambos formatos (`crate = "x"` y `{ version = "x", features = [...] }`).
- Parser TOML por líneas con una sola regex alternativa, stdlib Node exclusivamente; cero dependencias nuevas en package.json (punto 2) ni Cargo.toml (intacto según timestamps).
- Fallos NOMBRAN la dependencia ausente o divergente: fixtures de `tests/harness-tooling-tauri-validator.test.mjs` (L66–85) comprueban `"react"`, `"tauri-build"`, versión divergente `~5.9.0` y scope divergente — todos pasan.
- `validateDependencies()` sin argumentos: defaults en L71 y llamada sin args en `scripts/check-format.mjs` L10; el paso de Formato de `./init.sh` lo ejercita sobre los manifiestos reales → ✔.
- Tamaño: exactamente **100 líneas** (`wc -l`) → dentro del límite, sin excepción en `docs/architecture.md` (que permanece intacto).

### 5. docs/dependencies.md reescrito, cero residuos — OK

- `grep -ric astro docs/dependencies.md` → 0; `wrangler` → 0; `cloudflare` → 0.
- Nota de procedencia explícita como blockquote junto a la política (L13–17): scaffold oficial Tauri traído por el humano, registrado por decisión humana al solicitar la migración, sujeto a veto.
- Scopes correctos incluido `tauri-build` → `build-dependencies`.

### 6. Suite completa en VERDE (reproducido por el reviewer) — OK

- `node --test` (bare) → `# tests 21 # pass 21 # fail 0` (kit-integrity 3 + harness-tauri-docs 9 + harness-tooling-tauri 4 + harness-tooling-tauri-validator 5).
- `pnpm test` (ahora script real) → `# tests 21 # pass 21 # fail 0`.
- El literal bare funciona en Node v22.22.2 de este entorno (el literal con directorio `node --test tests/` fue descartado por el AMEND; no se valida contra él).

### 7. Ciclo rojo/verde evidenciado en impl_2.md — OK

- ROJO (impl_2.md L30–38): salida concreta `# pass 14 # fail 7` listando los 7 tests aún no implementados (incluido el rojo natural de cobertura real contra el registro viejo Astro). Justificación de los 2 tests que pasaban prematuramente (15/16) documentada (L43–46).
- Línea base de `./init.sh` con 2 fallos esperados documentada también en `progress/current.md` L16.
- VERDE: 21/21 + init.sh exit 0 + verificación negativa manual de REQ-02-04 (PATH sin `.cargo/bin` → mensajes rustup.rs y exit≠0, impl_2.md L79–87).

### 8. Límite de alcance respetado — OK

Git tiene un único commit, así que el alcance se verificó por (a) diff acumulada y (b) timestamps `-newermt "2026-08-21 11:45"` (inicio feature 2 ≈ 11:57):

- Tocados en ventana: `init.sh` 12:04, `package.json` 12:04, `feature_list.json` 12:02 (estado), `docs/dependencies.md`, `scripts/validate-dependencies.mjs`, `tests/harness-tooling-tauri*.test.mjs` 12:08, `progress/`. Exactamente el alcance declarado en impl_2.md.
- `find src-tauri -newermt …` → vacío. `src/`, `specs/`, `AGENTS.md`, `CLAUDE.md`, `CHECKPOINTS.md`, `README.md`, `docs/architecture.md`, `docs/conventions.md`, `docs/verification.md`, `templates/`, agentes spec_author: sin modificaciones tras 11:45.
- Sin excepción de 100 líneas necesaria: validador 100, tests 45+97 (divididos para no crear uno de 175).

### 9. Coherencia global del arnés — OK con observación no bloqueante

- `CHECKPOINTS.md`: «./init.sh termina en verde (entorno, formato, tests al 100%, build)» — coincide con el flujo ejecutado.
- `docs/verification.md`: describe el mismo pipeline en orden (herramientas → archivos → formato con registro de dependencias → tests `pnpm test` → build) y los mismos mensajes de resultado.
- **Observación (no contradicción):** verification.md enumera herramientas «(node, pnpm)» (L14) y describe el registro validado «contra package.json» (L20): descripciones no exhaustivas heredadas de feature 1 (ese doc está prohibido para feature 2). No afirman nada falso; se sugiere sincronizarlas en una futura feature de docs.

## Checkpoints del protocolo

- C1 (respeta architecture.md): [x] — script en `scripts/<slug>.mjs`, Node stdlib, nunca importado desde `src/`
- C2 (respeta conventions.md): [x] — kebab-case con prefijo de verbo (`validate-dependencies.mjs`)
- C3 (evidencia rojo/verde en impl_2.md): [x]
- C4 (suite/init.sh verde al final): [x] — `node --test` 21/21, `pnpm test` 21/21, `./init.sh` exit 0 completo
- C5 (depends_on todas done): [x] — `depends_on: [1]`, feature 1 en `done`

## Notas para el líder

1. Al marcar `done` la feature 2, `./init.sh` queda establecido como puerta verde permanente (incluye toolchain Rust).
2. Sincronizar en próxima feature de docs las enumeraciones de `docs/verification.md` L14/L20 (rustc/cargo; Cargo.toml) — opcional, no bloquea.

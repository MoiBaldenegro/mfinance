# Informe de implementación — Feature 2: harness-tooling-tauri

Fecha: 2026-08-21. Spec: `specs/02_harness-tooling-tauri/requirements.md`
(REQ-02-01..10, con REQ-02-01 enmendado a `node --test` bare). Sin
subagentes; el reviewer lo lanza el líder.

## Archivos tocados (alcance exclusivo)

| Archivo | Cambio |
|---------|--------|
| `package.json` | Añadido `"test": "node --test"` al bloque `scripts`. Nada más. |
| `init.sh` | Checks de `rustc` y `cargo` en la sección de herramientas, ANTES del bloque Build, con fallo nombrado que remite a https://rustup.rs. Lo demás intacto. |
| `scripts/validate-dependencies.mjs` | Extendido: valida también los crates de `src-tauri/Cargo.toml` ([dependencies], [build-dependencies], [dev-dependencies]). Parser TOML mínimo por líneas con regex stdlib. Compatibilidad preservada: `validateDependencies()` sin args sigue funcionando para `check-format.mjs`. |
| `docs/dependencies.md` | Registro reescrito con las dependencias reales (10 npm + 5 crates), cadenas exactas de los manifiestos, `approved: 2026-08-21`, motivo real por entrada, nota de procedencia del scaffold oficial Tauri arriba del registro. |
| `tests/harness-tooling-tauri.test.mjs` | NUEVO (45 líneas): REQ-02-01, REQ-02-03/04, REQ-02-06/07, REQ-02-08 contra los archivos reales. |
| `tests/harness-tooling-tauri-validator.test.mjs` | NUEVO (97 líneas): REQ-02-05 y REQ-02-10 contra fixtures de registro+manifiestos en tmpdir. |
| `feature_list.json` / `progress/current.md` | Estado e bitácora según protocolo. |

PROHIBIDOS no tocados: `src/`, `src-tauri/**`, `specs/`, `AGENTS.md`,
`CLAUDE.md`, `docs/architecture.md`, `docs/conventions.md`,
`docs/verification.md`, `CHECKPOINTS.md`, `README.md`, `templates/`.

## Ciclo rojo → verde

### ROJO (antes de implementar)

`node --test` con solo los tests nuevos escritos (suite completa: 21 tests,
14 pass / **7 fail** — los 7 que exigen lo aún no implementado):

```
not ok 13 - REQ-02-01: package.json declara exactamente "test": "node --test"
not ok 14 - REQ-02-03/04: init.sh comprueba rustc y cargo antes del bloque Build, ...
not ok 17 - REQ-02-10: crate sin entrada aprobada falla nombrándolo
not ok 18 - REQ-02-05: versión o scope divergentes entre registro y manifiestos fallan
not ok 19 - REQ-02-05: parseCargoManifest cubre las tres secciones TOML y ambos formatos
not ok 20 - REQ-02-06/07: los manifiestos reales quedan totalmente cubiertos por docs/dependencies.md
not ok 21 - REQ-02-08: docs/dependencies.md incluye nota de procedencia (scaffold Tauri, humano, veto)
# pass 14  # fail 7
```

El test 20 (cobertura real) fallaba porque el registro vigente era el viejo
del proyecto Astro (`react`, `vite`, etc. sin entrada) — el rojo→verde
natural previsto. Los tests 15/16 (fixture feliz y npm sin entrada) pasaban
en rojo porque el validador antiguo ignoraba crates; tras implementar,
validan por la razón correcta (verificado: el fixture feliz incluye crates y
el caso divergente ejercita scope de crate).

Línea base adicional observada: `./init.sh` arrancaba con 2 fallos esperados:
formato ✘ (registro viejo sin cubrir las deps Tauri) y tests ✘ (`pnpm test`
no existía aún).

### VERDE (después de implementar)

1. `pnpm test` (REQ-02-01/02): exit 0 —

```
# tests 21
# pass 21
# fail 0
```

   Suite completa: harness-kit-integrity 3 + harness-tauri-docs 9 +
   harness-tooling-tauri 4 + harness-tooling-tauri-validator 5 = 21.

2. `./init.sh` completo (REQ-02-09): exit 0, verde TOTAL —

```
✔ node instalado          ✔ pnpm instalado
✔ rustc instalado         ✔ cargo instalado        ← nuevos (REQ-02-03)
✔ dependencias instaladas (node_modules)
✔ AGENTS.md existe        ✔ feature_list.json existe
✔ progress/current.md existe
✔ formato de feature_list.json y progress/current.md   ← registro nuevo OK
✔ tests al 100% (node:test)
✔ build de producción (pnpm build)
✔ El entorno está perfecto. Podemos empezar a trabajar.
```

3. Verificación negativa de REQ-02-04 (manual, fuera de la suite): con un
   PATH sin `.cargo/bin`, `./init.sh` imprime:

```
✘ rustc no instalado: instala la toolchain Rust vía https://rustup.rs
✘ cargo no instalado: instala la toolchain Rust vía https://rustup.rs
```

   y termina exit≠0 antes del bloque Build.

## Decisiones

- **Parser TOML mínimo**: por líneas, con una sola regex alternativa
  `^([A-Za-z0-9_-]+)\s*=\s*(?:"([^"]+)"|\{\s*version\s*=\s*"([^"]+)")` que
  cubre ambos formatos presentes (`crate = "versión"` y
  `crate = { version = "versión", features = [...] }`). Solo se extraen
  entradas bajo secciones cuyo nombre esté en
  {dependencies, build-dependencies, dev-dependencies}; `[package]`, `[lib]`,
  comentarios y líneas en blanco se ignoran. Sin dependencias externas
  (REQ-02-10 cumple fallos nombrando la dependencia ausente).
- **Scopes de crates**: nombres literales de las secciones TOML
  (`build-dependencies`, `dev-dependencies`) tanto en el validador como en
  `docs/dependencies.md`; la comparación de scope es de igualdad literal.
- **Compatibilidad**: `validateDependencies(packagePath, registryPath,
  cargoPath)` añade el tercer parámetro con default
  `src-tauri/Cargo.toml`; `check-format.mjs` sigue llamándola sin argumentos.
- **Regla de 100 líneas SIN excepción**: `scripts/validate-dependencies.mjs`
  quedó exactamente en 100 líneas (se compactó el parser a una regex única),
  así que NO hizo falta tocar `docs/architecture.md`. Los tests se dividieron
  en dos archivos (45 + 97 líneas) en lugar de uno de 175, respetando la regla
  dura sin excepciones documentadas.
- **Registro**: cadenas de versión copiadas literalmente de `package.json`
  (`^19.1.0`, `~5.8.3`, `^2`, …) y de `Cargo.toml` (`2`, `1`) porque el
  validador compara igualdad literal. Nota de procedencia (REQ-02-08) como
  blockquote junto a la política: scaffold oficial Tauri traído por el
  humano, registrado por decisión del humano al solicitar la migración del
  arnés, sujeto a su veto en cualquier momento.

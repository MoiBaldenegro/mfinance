# Arquitectura — Qué significa "hacer un buen trabajo"

> Este documento define el estándar de calidad. Los agentes revisores
> evalúan código contra este archivo. Si no está aquí, no es un requisito.

mfinance es una **app de escritorio construida con Tauri 2**: frontend
**React 19 + TypeScript + Vite** en `src/` (dev server en el puerto `1420`) y
backend **Rust** en `src-tauri/`. Ambos lados siguen **arquitectura hexagonal**
(puertos y adapters): el dominio en el centro y las dependencias apuntando
siempre hacia él.

## Principios

1. **Hexagonal en ambos lados.** Las dependencias apuntan siempre hacia el
   dominio: nada del dominio importa del exterior; el exterior (UI, commands,
   persistencia, IPC) depende del dominio, nunca al revés.
2. **Dominio puro.** El dominio no conoce el framework: ni Tauri ni React ni
   Vite. En Rust, `src-tauri/src/domain/` no declara dependencia de `tauri` y
   se verifica aislado con `cargo test`; en TS, `src/domain/` no importa de
   `@tauri-apps/api` ni de `react`.
3. **Puertos y adapters.** Los puertos los define el núcleo (traits en Rust,
   interfaces en TS) y los implementan los adapters. El núcleo nunca conoce
   implementaciones concretas: recibe puertos inyectados.
4. **Errores explícitos.** Las operaciones que pueden fallar devuelven errores
   nombrados (`Result<T, E>` en Rust, clases `*Error` en TS), nunca valores
   falsy silenciosos. Un fallo silencioso es un bug disfrazado.
5. **Inmutabilidad por defecto.** `const`/`readonly` por defecto; entidades
   inmutables: modificar = crear una nueva instancia.
6. **Tokens, no valores sueltos.** Colores, espaciados, radios, sombras y
   tipografías solo desde las custom properties de `src/styles/tokens.css`.
   Prohibido hardcodear valores.
7. **Estilos separados de la UI.** Un componente `.tsx` no contiene CSS: cada
   uno importa su hoja desde `src/styles/`.
8. **Lógica separada de la UI.** Los componentes `.tsx` renderizan y delegan:
   la lógica vive en casos de uso (`src/domain/use-cases/`) y módulos TS.
9. **Sin dependencias externas sin aprobar.** Paquetes npm y crates nuevos se
   marcan `blocked` y esperan la aprobación del humano, materializada en
   `docs/dependencies.md` (validada por `scripts/validate-dependencies.mjs`).
10. **Modularización estricta.** Ningún archivo supera las 100 líneas; si es
    imprescindible, se discute antes (estado `blocked`).
11. **Scripts del arnés aislados.** Los scripts de `scripts/` se ejecutan con
    Node y jamás se importan desde `src/`: no son build ni runtime.
12. **Artefactos generados.** `dist/` (Vite) y `src-tauri/target/` (cargo) se
    regeneran siempre completos: nunca se editan a mano.

## Estructura de carpetas

| Carpeta | Rol |
|---------|-----|
| `src/` | Frontend React + TS (ver desglose hexagonal abajo). |
| `src-tauri/` | Backend Rust: `src/` (código), `Cargo.toml`, `tauri.conf.json`. |
| `public/` | Activos estáticos servidos tal cual (favicons, SVG). |
| `scripts/` | Scripts del arnés (Node stdlib), nunca importados desde `src/`. |
| `tests/` | Tests automáticos con `node:test` (sin dependencias). |

### Backend hexagonal (`src-tauri/src/`)

| Capa | Rol |
|------|-----|
| `src-tauri/src/domain/` | Entidades y traits-puerto en Rust puro, sin dependencia de `tauri`; testeable aislado con `cargo test`. |
| `src-tauri/src/application/` | Casos de uso que orquestan el dominio a través de los puertos. |
| `src-tauri/src/infrastructure/` | Adapters de salida que implementan los puertos (persistencia, fs, servicios externos). |
| `src-tauri/src/commands/` | Capa de entrada: handlers `#[tauri::command]` finos, sin lógica de negocio, que delegan en `application/`. |
| `src-tauri/src/lib.rs` | Composition root: construye los adapters e inyecta las dependencias; registra commands y plugins. |

```
#[tauri::command] (commands/)      ← capa de entrada, fina
        │ delega
        ▼
caso de uso (application/)         ← orquesta vía puertos
        │ usa                                ▲ implementa
        ▼                                    │
puerto (trait en domain/) ◄── adapter (infrastructure/)
        │
        ▼
entidades (domain/)
```

### Frontend hexagonal (`src/`)

| Capa | Rol |
|------|-----|
| `src/domain/entities/` | Tipos TS puros del dominio (sin imports de framework). |
| `src/domain/ports/` | Interfaces de repositorios/gateways que el núcleo necesita. |
| `src/domain/use-cases/` | Casos de uso de aplicación: orquestan entidades vía puertos. |
| `src/adapters/` | Implementaciones de puertos. El adapter Tauri IPC es el único sitio que usa `invoke()` de `@tauri-apps/api`. |
| `src/components/` | UI React (`.tsx`): consume casos de uso/puertos; jamás invocan invoke directamente. |
| `src/styles/` | `tokens.css` + una hoja por componente. |

```
componente .tsx (src/components/)
        │ llama
        ▼
caso de uso (src/domain/use-cases/)
        │ usa                        ▲ implementa
        ▼                            │
puerto (src/domain/ports/) ◄── adapter Tauri IPC (src/adapters/)
                                     │ invoke()
                                     ▼
                          command de src-tauri (backend)
```

## Reglas hexagonales (resumen normativo)

- Las dependencias apuntan siempre hacia el dominio, en ambos lados.
- El dominio no conoce el framework: sin `tauri` en `domain/` de Rust, sin
  `react` ni `@tauri-apps/api` en `src/domain/`.
- Los puertos los define el núcleo y los implementan los adapters; el núcleo
  los recibe inyectados (composition root en `lib.rs` en el backend).
- La UI y los commands son detalles enchufables: se pueden reemplazar sin
  tocar dominio ni casos de uso.
- Los componentes de UI jamás invocan invoke directamente: pasan por puertos
  y casos de uso. El adapter Tauri IPC es el único sitio que usa invoke.

## Qué NO hacer

- No hardcodear colores, radios, espaciados ni fuentes — siempre tokens.
- No poner CSS dentro de un `.tsx` — los estilos van en `src/styles/`.
- No meter lógica de negocio en un componente — va en use-cases/dominio.
- No llamar a `invoke()` fuera de `src/adapters/`.
- No importar `tauri` desde `src-tauri/src/domain/` ni `react` desde `src/domain/`.
- No superar las 100 líneas por archivo sin discusión previa.
- No leer/escribir persistencia directamente desde application o commands:
  siempre vía puertos e infrastructure.
- No añadir dependencias (npm o crates) sin aprobación humana registrada.
- No editar `dist/` ni `src-tauri/target/` a mano.
- No devolver fallos silenciosos: si algo puede fallar, error nombrado.

# Registro de dependencias aprobadas

> **Política de aprobación**: NINGÚN agente aprueba dependencias. La
> aprobación es decisión exclusiva del humano tras discusión, materializada en
> este registro. Si una feature necesita una dependencia nueva, el agente
> marca la feature `blocked` (docs/architecture.md regla 2) y espera la
> decisión humana. El validador `scripts/validate-dependencies.mjs` (integrado
> en `scripts/check-format.mjs`, ejecutado por `./init.sh`) falla si una
> dependencia de package.json (dependencies + devDependencies) no tiene su
> entrada aprobada aquí.

Formato: una entrada por dependencia aprobada. `### <package>` seguido de
líneas `- clave: valor` con `version`, `scope` (dependencies |
devDependencies), `approved` (fecha de aprobación) y `motivo`.

### astro

- version: ^7.2.0
- scope: dependencies
- approved: 2026-08-13
- motivo: framework del proyecto (sitio Astro)

### @astrojs/cloudflare

- version: ^14.2.1
- scope: dependencies
- approved: 2026-08-13
- motivo: adapter de despliegue en Cloudflare Workers

### wrangler

- version: ^4.121.0
- scope: dependencies
- approved: 2026-08-13
- motivo: CLI de despliegue y generación de tipos del runtime Cloudflare Workers

### @cloudflare/workers-types

- version: ^5.20260812.1
- scope: devDependencies
- approved: 2026-08-13
- motivo: tipos del runtime Cloudflare Workers para TypeScript
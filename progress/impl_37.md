# Implementación — feature 37

## Alcance

Se reemplazó la gestión incrustada de la feature 36 por una pantalla separada
de Ajustes para recuperar perfiles, manteniendo el estado de carga sin snapshot
anterior y la sección `ajustes` al remontar `AppShell`.

## Evidencia TDD

### Rojo, antes del código de producción

Comando:

```text
node --test tests/recuperacion-error-perfil/*.test.mjs
```

Resultado contra el código inicial: `11 tests`, `5 passed`, `6 failed`.
Fallaron los contratos de «Regresar a Ajustes», pantalla separada y
persistencia de sección porque aún existía la expansión `GestionPerfiles` dentro
de `ErrorScreen`.

### Verde

Comandos:

```text
node --test tests/recuperacion-error-perfil/*.test.mjs
```

Resultado: `11 tests`, `11 passed`, `0 failed`.

```text
pnpm test
```

Resultado: `632 tests`, `632 passed`, `0 failed`.

```text
pnpm build
```

Resultado: TypeScript y Vite completados correctamente.

```text
./init.sh
```

Resultado: herramientas, formato, tests al 100% y build de producción en
verde.

## Cambios

- `src/App.tsx`: coordina la transición ErrorScreen → AjustesRecuperacion y
  mantiene el proveedor de sección fuera de SnapshotProvider.
- `src/components/error-screen/ErrorScreen.tsx`: ofrece «Regresar a Ajustes»,
  conserva motivo y «Reintentar», sin importar GestionPerfiles.
- `src/components/ajustes-recuperacion/AjustesRecuperacion.tsx` y
  `src/styles/ajustes-recuperacion.css`: pantalla independiente, centrada en
  gestión de perfiles, sin snapshot financiero ni recarga de entrada.
- `src/hooks/use-seccion-activa.ts`: contexto de navegación estable sin router;
  `AppShell` consume el estado para conservar `ajustes` en SectionTabs y cuerpo.
- `src/components/ajustes-section/activar-perfil.ts`, `GestionPerfiles.tsx` y
  `PerfilFila.tsx`: preservan la secuencia de selección y bloquean duplicados
  durante una selección confirmada en vuelo.
- `tests/recuperacion-error-perfil/*.test.mjs`: contratos actualizados para
  transición, pantalla separada, aislamiento, navegación y recargas explícitas.

No se modificaron backend, commands, puertos IPC ni dependencias. `invoke()`
continúa restringido a adapters. La feature permanece `in_progress`; no se
marca `done` sin `progress/review_37.md` con veredicto `APPROVED`.

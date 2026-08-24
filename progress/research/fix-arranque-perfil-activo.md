# Análisis — fix-arranque-perfil-activo

> Sesión spec_author. Problema del humano: la app de escritorio SIEMPRE
> arranca con ErrorScreen fatal «No se pudieron cargar tus datos — no se pudo
> cargar el snapshot: ×3 …sin perfil activo: no hay snapshot que operar».
> Diagnóstico previo del líder verificado leyendo el código; nada se da por
> cierto sin evidencia.

## 1. Problema reafirmado

Tras la feature 21 (perfiles con aislamiento), cualquier reinicio de la app
deja el repositorio de snapshots sin perfil activo en memoria, por lo que la
carga inicial (`load_state`) falla y la shell muestra la pantalla de error
fatal sin ruta de recuperación. El usuario no puede usar la app desde el
primer instante, aunque sus datos en disco estén perfectos. Alcance: backend
de arranque (adapter + caso de uso de arranque) y su cable en el composition
root. No es un problema de datos ni de frontend de carga (ese solo refleja el
error que recibe).

## 2. Verificación del diagnóstico del líder (punto por punto)

| # | Afirmación | Veredicto | Evidencia |
|---|------------|-----------|-----------|
| 1 | `cargar_registro()` nunca restaura `self.activo` | **CONFIRMADO** | `infrastructure/perfil_registry.rs` L18-39: lee profiles.json y devuelve `Some(registro)` sin tocar `self.activo`; solo `guardar_registro()` lo fija (L50). |
| 2 | `preparar_arranque()` early-return `Ok(false)` con registro existente, sin fijar activo | **CONFIRMADO** | `application/arranque_perfiles.rs` L24-26: `if store.cargar_registro()?.is_some() { return Ok(false); }`. |
| 3 | Tras reinicio, `JsonSnapshotRepository` nuevo queda `activo: None` → load falla → ErrorScreen | **CONFIRMADO** | `lib.rs` L36-44 construye adapter nuevo (`new()` pone `activo: None`, `json_repository.rs` L33-35); `ruta_activa()` devuelve `SIN_ACTIVO` = «sin perfil activo: no hay snapshot que operar» (`json_repository.rs` L20, L54-56) → `SnapshotLoadError` → `CommandError` IPC → `ErrorScreen.tsx`. |
| 4 | Dead-end secundario: `activa: null`, perfil huérfano o cero perfiles sin recuperación | **CONFIRMADO** | `RegistroPerfiles::default()` tiene `activa: None` (`domain/registro_perfiles.rs`); ninguna regla de arranque normaliza un registro existente inviable; `json_repository` falla igual y no existe path de autoreparación. |
| 5 | Mensaje triple-prefijado «no se pudo cargar el snapshot: » | **CONFIRMADO, fuera de alcance** | Cadena exacta en §4. Problema distinto (fontanería de errores del frontend): se documenta, NO entra en esta feature. |
| 6 | Los tests REQ-21 no pillan el reinicio | **CONFIRMADO** | Los tests de arranque usan dobles en memoria (`application/tests/memory_perfil_repository.rs`, `memory_store_perfiles.rs`) que NO modelan el campo `activo` del adapter real; los tests del adapter real (`infrastructure/perfil_registry_tests.rs`, `arranque_guarda_tests.rs`) siempre pasan por `guardar_registro` (que SÍ fija activo). Falta el test «adapter nuevo + profiles.json preexistente → load ok». |

## 3. Cadena completa del fallo (reinicio)

```
reinicio de la app
  └─ lib.rs::run() → setup() → estado_inicial(Documents/mfinance)
       └─ JsonSnapshotRepository::new(base)          // activo = None
       └─ preparar_arranque(&mut repo)
            └─ cargar_registro() → Ok(Some(reg))     // ¡no restaura activo!
            └─ registro existe → return Ok(false)    // ni alta, ni seed, NI ACTIVO
       └─ repo.activo() == None                      // comprobantes sin perfil
  └─ UI: SnapshotProvider → use-case cargarSnapshot → invoke('load_state')
       └─ command load_state → application/load_state → repo.load()
            └─ ruta_activa() → Err(SIN_ACTIVO)
                 → SnapshotLoadError «no se pudo cargar el snapshot: sin perfil activo…»
       └─ ErrorScreen fatal («Reintentar» vuelve a fallar: estado idéntico)
```

El primer arranque funciona porque pasa por `guardar_registro()` (L50 fija
`self.activo`). Solo el reinicio está roto — coincide con el reporte.

## 4. Mensaje triple-prefijado (cosmético) — QUEDA FUERA

Tres capas añaden el mismo prefijo al motivo:
1. Display Rust de `SnapshotLoadError` (`domain/repository_errors.rs` L22):
   «no se pudo cargar el snapshot: {reason}» → llega como
   `CommandError.mensaje` (1×).
2. Frontend adapter reconstruye el error nombrado con el mensaje COMPLETO ya
   prefijado: `errorDesdeCodigoIpc` → `new SnapshotLoadError(mensaje)`
   (`src/domain/errors/snapshot-errors.ts` L67-72) (2×).
3. El use-case re-envuelve otra vez: `cargarSnapshot` → `new
   SnapshotLoadError(motivoDeRechazoIpc(error))`
   (`src/domain/use-cases/load-snapshot.ts` L36) (3×).

Es un defecto independiente de fontanería de errores del frontend (los tres
archivos viven en `src/`); mezclarlo aquí violaría «una feature, un problema».
Queda documentado como candidato a feature cosmética propia (p. ej. pasar
through si `error instanceof SnapshotLoadError` y no re-prefijar cuando el
motivo ya trae el encabezado).

## 5. Solución propuesta (UNA feature, backend)

### 5.1 Arreglo raíz: restaurar el activo al leer el registro

`JsonSnapshotRepository::cargar_registro()` SHALL fijar
`self.activo = registro.activa.clone()` antes de devolver `Some(registro)`.

Traba técnica: el trait `PerfilRepository::cargar_registro(&self)` toma
`&self` (`domain/perfil_repository.rs` L13-15) y no permite mutar el adapter.
Opciones para el implementador:

- **A (recomendada):** ampliar la firma a `&mut self` en el trait y
  propagarla: impl real, doble `MemoryPerfilRepository` y casos de uso
  `perfiles::listar/activo` (`&dyn` → `&mut dyn`); commands
  `listar_perfiles`/`perfil_activo` necesitan binding `mut` sobre el
  MutexGuard. Cambio mecánico; el dominio sigue puro (grep tauri = 0).
- **B:** interior mutabilidad (`Cell<Option<String>>`) sobre el campo
  `activo` del adapter, sin tocar el trait.

Con el arreglo, `estado_inicial` (lib.rs L42-44) ya sincroniza comprobantes
con el activo restaurado SIN cambiar código — el cable existe; falta test.

### 5.2 Autorecuperación nombrada en preparar_arranque (registro existente)

Reglas deterministas, en orden, cuando `profiles.json` YA existe:

| Regla | Condición | Acción |
|-------|-----------|--------|
| R1 | `activa = Some(id)` presente en `perfiles` Y su snapshot existe | Nada (camino sano; el activo ya quedó restaurado por 5.1) |
| R2 | `activa` nula O apunta a id ausente del registro O cuyo snapshot falta | Seleccionar el PRIMER perfil del registro cuyo snapshot exista y persistir la elección vía `guardar_registro` |
| R3 | Ningún perfil registrado tiene snapshot legible | Sembrar SOLO el primero aplicando el guard vigente de `ensure_seed` (nunca pisa datos) |
| R4 | Registro sin ningún perfil | Reproducir el flujo frío vigente: adoptar legado si `legacy_pendiente()` o crear «Personal» + seed (mismo camino REQ-21-04/05) |

Invariantes: nunca borrar ni reescribir snapshots ajenos; persistir toda
elección reparada (write atómico ya garantizado por `json_file::write_atomic`);
«primero» = orden del array `perfiles` (orden de creación), sin heurísticas.

### 5.3 Tests nuevos (rojo→verde)

Ubicación siguiendo la convención vigente:
- Test de REINICIO contra el adapter REAL: directorio temporal con
  profiles.json preexistente + `perfiles/<id>/mfinance.json` → construir
  adapter nuevo → `preparar_arranque` → hoy FALLA en rojo («sin perfil
  activo»); tras el arreglo: `repo.activo() == Some(id)` y `load()` entrega
  el snapshot. Encaja en `infrastructure/` junto a
  `perfil_registry_tests.rs` / `arranque_guarda_tests.rs` (helpers
  `test_support::{temp_dir, store_con_perfil, cleanup}` ya disponibles).
- Unit: `cargar_registro` restaura activo en memoria (R1).
- Recuperaciones R2/R3/R4 con directorios temporales, verificando además que
  los snapshots de los demás perfiles quedan byte a byte intactos y la
  elección queda persistida en profiles.json.
- `estado_inicial`: comprobantes operando bajo el activo restaurado
  (posible necesidad de getter `pub(crate)` o `#[cfg(test)]` sobre
  `ComprobantesFsRepository.perfil`, hoy privado).

## 6. Descomposición decidida: UNA feature (id 28)

Criterio de complejidad: el defecto es UNO (la coreografía de arranque no
restaura estado en memoria) y su corrección vive en 2 archivos backend +
tests; las reglas de recuperación son parte del mismo contrato de arranque.
No toca UI → NO procede `design.md`. El cosmético del §4 es un problema
distinto y queda fuera. Sin dependencias nuevas; dominio Rust sigue puro;
ningún archivo debe superar 100 líneas (`perfil_registry.rs` ya va en 91:
extraer la recuperación a módulo propio de `application/` si hiciera falta).

## 7. Riesgos y trabas

- Cambio de firma del puerto (opción A) toca trait de dominio + dobles de
  test + commands: mecánico pero transversal; mantener grep tauri = 0 en
  domain/application.
- `perfiles::listar/activo` se llaman con préstamo inmutable desde
  `listar_perfiles`/`perfil_activo`: requieren `mut` en el guard.
- No romper REQ-21-04 (migración única): la recuperación SOLO actúa cuando el
  registro existe; el camino frío permanece intacto.
- Tests actuales de arranque usan dobles que no modelan `activo`: el test
  nuevo DEBE ir contra `JsonSnapshotRepository` real (así se habría pillado
  el bug).
- `perfil_registry.rs` en 91 líneas: margen mínimo; planificar extracción.
- Escenario mixto huérfano+otros-con-datos: R2 elige el primero CON datos —
  evita sembrar encima y respeta los datos existentes de otros perfiles.
- `perfil_activo` command ya lee del registro (no del campo memoria): no
  cambia su comportamiento observable.

## 8. Referencias

- `src-tauri/src/infrastructure/perfil_registry.rs` (bug raíz L18-39, fix L50)
- `src-tauri/src/application/arranque_perfiles.rs` (early return L24-26)
- `src-tauri/src/infrastructure/json_repository.rs` (SIN_ACTIVO L20/L54-56)
- `src-tauri/src/lib.rs` (estado_inicial L36-50)
- `src-tauri/src/domain/perfil_repository.rs`, `registro_perfiles.rs`,
  `repository_errors.rs`
- `src-tauri/src/application/perfiles.rs`, `ensure_seed.rs`
- `src-tauri/src/commands/{snapshot_commands,perfiles_commands,error}.rs`
- Frontend (solo lectura, fuera de alcance):
  `src/components/shell/SnapshotProvider.tsx`,
  `src/components/error-screen/ErrorScreen.tsx`,
  `src/domain/use-cases/load-snapshot.ts`,
  `src/domain/errors/snapshot-errors.ts`,
  `src/adapters/snapshot-ipc-adapter.ts`
- Specs previas: `specs/21_perfiles-modelo-almacenamiento/requirements.md`;
  tests: `application/tests/arranque_tests.rs`,
  `infrastructure/perfil_registry_tests.rs`,
  `infrastructure/arranque_guarda_tests.rs`, `test_support.rs`
